"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import {
  contractSchema,
  contractItemSchema,
  amendmentSchema,
} from "@/lib/validators/contratos";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "financeiro"];

export async function salvarContrato(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "contracts",
    schema: contractSchema,
    formData,
    roles: ROLES,
    path: "/contratos",
    id,
  });
}

export async function excluirContrato(id: string) {
  await deleteRecord("contracts", id, ROLES, "/contratos");
}

export async function mudarStatusContrato(
  id: string,
  status: "ativo" | "suspenso" | "cancelado",
  motivo?: string,
) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("contracts")
    .update({
      status,
      motivo_cancelamento: status === "cancelado" ? (motivo ?? null) : null,
      cancelado_em: status === "cancelado" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/contratos/${id}`);
}

export async function adicionarItemContrato(
  contractId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = contractItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_items")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, contract_id: contractId });
  if (error) return { error: "Não foi possível adicionar o item." };
  revalidatePath(`/contratos/${contractId}`);
  return { message: "Item adicionado." };
}

export async function removerItemContrato(itemId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("contract_items")
    .delete()
    .eq("id", itemId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/contratos");
}

export async function adicionarAditivo(
  contractId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = amendmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_amendments")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, contract_id: contractId });
  if (error) return { error: "Não foi possível registrar o aditivo." };
  // se houver novo valor, aplica ao contrato
  if (parsed.data.valor_novo != null) {
    await supabase
      .from("contracts")
      .update({ valor: parsed.data.valor_novo })
      .eq("id", contractId)
      .eq("tenant_id", ctx.tenantId);
  }
  revalidatePath(`/contratos/${contractId}`);
  return { message: "Aditivo registrado." };
}

/**
 * Converte um orçamento aceito em contrato recorrente, copiando o cliente do
 * deal e os itens (serviços) do orçamento. (Gancho da F3.)
 */
export async function criarContratoDoOrcamento(quoteId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, deal_id, client_id, clients(razao_social), deals(client_id, nome_contato), quote_items(descricao, quantidade, preco_unit, service_id)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) redirect("/contratos");

  const q = quote as unknown as {
    id: string;
    deal_id: string | null;
    client_id: string | null;
    clients: { razao_social: string } | null;
    deals: { client_id: string | null; nome_contato: string } | null;
    quote_items: {
      descricao: string;
      quantidade: number;
      preco_unit: number;
      service_id: string | null;
    }[];
  };

  const clientId = q.client_id ?? q.deals?.client_id ?? null;
  if (!clientId) {
    redirect(q.deal_id ? `/funil/${q.deal_id}` : `/orcamentos/${q.id}`);
  }
  const nomeCliente = q.clients?.razao_social ?? q.deals?.nome_contato ?? "Cliente";

  const total = q.quote_items.reduce(
    (s, i) => s + Number(i.quantidade) * Number(i.preco_unit),
    0,
  );

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      tenant_id: ctx.tenantId,
      client_id: clientId,
      origem_quote_id: q.id,
      titulo: `Contrato — ${nomeCliente}`,
      valor: total,
    })
    .select("id")
    .single();
  if (error || !contract) redirect("/contratos");

  const contractId = (contract as { id: string }).id;
  if (q.quote_items.length > 0) {
    await supabase.from("contract_items").insert(
      q.quote_items.map((i) => ({
        tenant_id: ctx.tenantId,
        contract_id: contractId,
        service_id: i.service_id,
        descricao: i.descricao,
        quantidade: i.quantidade,
        valor: i.preco_unit,
      })),
    );
  }

  redirect(`/contratos/${contractId}`);
}
