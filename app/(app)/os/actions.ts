"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import { osSchema, fichaSchema, osProductSchema } from "@/lib/validators/os";
import type { AppRole } from "@/lib/types";
import type { OsStatus } from "@/lib/os";

const MANAGE: AppRole[] = ["owner", "operacional"];
const FIELD: AppRole[] = ["owner", "operacional", "tecnico"];

export async function criarOS(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(MANAGE);
  const parsed = osSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_orders")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível criar a OS." };
  redirect(`/os/${(data as { id: string }).id}`);
}

export async function criarOSDoOrcamento(quoteId: string) {
  const ctx = await requireRole(MANAGE);
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, deal_id, deals(client_id)")
    .eq("id", quoteId)
    .maybeSingle();
  const q = quote as unknown as {
    id: string;
    deal_id: string;
    deals: { client_id: string | null } | null;
  } | null;
  if (!q?.deals?.client_id) redirect(`/funil/${q?.deal_id ?? ""}`);

  const { data, error } = await supabase
    .from("service_orders")
    .insert({
      tenant_id: ctx.tenantId,
      client_id: q.deals.client_id,
      quote_id: q.id,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/os");
  redirect(`/os/${(data as { id: string }).id}`);
}

export async function criarOSDoContrato(contractId: string) {
  const ctx = await requireRole(MANAGE);
  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, client_id")
    .eq("id", contractId)
    .maybeSingle();
  const c = contract as { id: string; client_id: string } | null;
  if (!c) redirect("/contratos");

  const { data, error } = await supabase
    .from("service_orders")
    .insert({
      tenant_id: ctx.tenantId,
      client_id: c.client_id,
      contract_id: c.id,
    })
    .select("id")
    .single();
  if (error || !data) redirect(`/contratos/${contractId}`);
  redirect(`/os/${(data as { id: string }).id}`);
}

export async function atualizarOS(
  id: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(MANAGE);
  const parsed = osSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_orders")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath(`/os/${id}`);
  return { message: "OS atualizada." };
}

export async function mudarStatusOS(id: string, status: OsStatus) {
  const ctx = await requireRole(FIELD);
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "em_execucao") patch.chegada_em = new Date().toISOString();
  await supabase
    .from("service_orders")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/os/${id}`);
}

export async function excluirOS(id: string) {
  const ctx = await requireRole(MANAGE);
  const supabase = await createClient();
  await supabase.from("service_orders").delete().eq("id", id).eq("tenant_id", ctx.tenantId);
  redirect("/os");
}

export async function salvarFicha(
  id: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(FIELD);
  const parsed = fichaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_orders")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar a ficha." };
  revalidatePath(`/os/${id}`);
  return { message: "Ficha salva." };
}

export async function adicionarProdutoOS(
  osId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(FIELD);
  const parsed = osProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_order_products")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, os_id: osId });
  if (error) return { error: "Não foi possível adicionar o produto." };
  revalidatePath(`/os/${osId}`);
  return { message: "Produto adicionado." };
}

export async function removerProdutoOS(itemId: string, osId: string) {
  const ctx = await requireRole(FIELD);
  const supabase = await createClient();
  await supabase
    .from("service_order_products")
    .delete()
    .eq("id", itemId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/os/${osId}`);
}

/**
 * Finaliza a OS: dá baixa no estoque por FEFO (rastreável à OS), marca como
 * executada e calcula a próxima revisão de garantia. Valida o estoque ANTES
 * de qualquer escrita (tudo-ou-nada).
 */
export async function finalizarOS(
  id: string,
  _prev: SaveState,
  _formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(FIELD);
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: osData } = await supabase
    .from("service_orders")
    .select("id, status, garantia_meses")
    .eq("id", id)
    .maybeSingle();
  const os = osData as { status: OsStatus; garantia_meses: number } | null;
  if (!os) return { error: "OS não encontrada." };
  if (os.status === "executada" || os.status === "faturada") {
    return { error: "OS já finalizada." };
  }

  const { data: linhasData } = await supabase
    .from("service_order_products")
    .select("product_id, quantidade, products(nome_comercial)")
    .eq("os_id", id);
  const linhas =
    (linhasData as {
      product_id: string;
      quantidade: number;
      products: { nome_comercial: string } | null;
    }[] | null) ?? [];

  // 1) valida estoque de TODOS os produtos antes de escrever
  type Plano = { batchId: string; qty: number }[];
  const planos: Record<string, Plano> = {};
  for (const l of linhas) {
    const { data: bData } = await supabase
      .from("stock_batches")
      .select("id, qtd_atual, validade")
      .eq("product_id", l.product_id)
      .gt("qtd_atual", 0)
      .or(`validade.is.null,validade.gte.${hoje}`)
      .order("validade", { ascending: true, nullsFirst: false });
    const batches =
      (bData as { id: string; qtd_atual: number; validade: string | null }[] | null) ?? [];
    const disp = batches.reduce((s, b) => s + Number(b.qtd_atual), 0);
    if (disp < Number(l.quantidade)) {
      return {
        error: `Estoque insuficiente de ${l.products?.nome_comercial ?? "produto"} (disp.: ${disp}).`,
      };
    }
    let rest = Number(l.quantidade);
    const plano: Plano = [];
    for (const b of batches) {
      if (rest <= 0) break;
      const take = Math.min(Number(b.qtd_atual), rest);
      plano.push({ batchId: b.id, qty: take });
      rest -= take;
    }
    planos[l.product_id] = plano;
  }

  // 2) aplica as baixas (rastreável à OS)
  const movimentos = linhas.flatMap((l) =>
    planos[l.product_id].map((p) => ({
      tenant_id: ctx.tenantId,
      product_id: l.product_id,
      batch_id: p.batchId,
      tipo: "saida" as const,
      quantidade: -p.qty,
      motivo: "Consumo em OS",
      related_kind: "os",
      related_id: id,
      created_by: ctx.userId,
    })),
  );
  if (movimentos.length > 0) {
    await supabase.from("stock_movements").insert(movimentos);
  }

  // 3) marca executada + próxima revisão de garantia
  const proxima =
    os.garantia_meses > 0
      ? (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + os.garantia_meses);
          return d.toISOString().slice(0, 10);
        })()
      : null;

  await supabase
    .from("service_orders")
    .update({
      status: "executada",
      executada_em: new Date().toISOString(),
      saida_em: new Date().toISOString(),
      proxima_revisao_em: proxima,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath(`/os/${id}`);
  return { message: "OS finalizada — estoque baixado e certificado disponível." };
}
