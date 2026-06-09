"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { calcularComissao, type ComissaoTipo } from "@/lib/comissoes";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "financeiro"];

export type ComissaoResult = { error?: string; message?: string };

/**
 * Lança uma comissão (caso a caso) sobre uma conta a receber. Se a conta já
 * estiver quitada, já entra como "liberada" (base = recebido); senão fica
 * "provisionada" e será liberada quando o cliente pagar.
 */
export async function adicionarComissao(input: {
  arId: string;
  employeeId: string;
  tipo: ComissaoTipo;
  percentual?: number | null;
  valorFixo?: number | null;
}): Promise<ComissaoResult> {
  const ctx = await requireRole(ROLES);
  if (!input.employeeId) return { error: "Selecione o funcionário." };
  if (input.percentual == null && input.valorFixo == null) {
    return { error: "Informe um percentual ou um valor fixo." };
  }
  const supabase = await createClient();

  const { data: arData } = await supabase
    .from("accounts_receivable")
    .select("valor, valor_pago, status, os_id")
    .eq("id", input.arId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const ar = arData as { valor: number; valor_pago: number; status: string; os_id: string | null } | null;
  if (!ar) return { error: "Conta a receber não encontrada." };

  const quitado = ar.status === "quitado";
  const base = quitado ? Number(ar.valor_pago) : Number(ar.valor);
  const valor = calcularComissao(base, input.percentual, input.valorFixo);

  const { error } = await supabase.from("commissions").insert({
    tenant_id: ctx.tenantId,
    ar_id: input.arId,
    os_id: ar.os_id,
    employee_id: input.employeeId,
    tipo: input.tipo,
    percentual: input.percentual ?? null,
    valor_fixo: input.valorFixo ?? null,
    base_valor: base,
    valor,
    status: quitado ? "liberada" : "provisionada",
    liberada_em: quitado ? new Date().toISOString() : null,
  } as never);
  if (error) return { error: "Não foi possível lançar a comissão." };

  revalidatePath("/comissoes");
  revalidatePath("/financeiro/receber");
  return { message: "Comissão lançada." };
}

export async function removerComissao(id: string): Promise<void> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase.from("commissions").delete().eq("id", id).eq("tenant_id", ctx.tenantId);
  revalidatePath("/comissoes");
  revalidatePath("/financeiro/receber");
}

/** Marca comissões como pagas (quando o valor é repassado ao funcionário). */
export async function marcarComissoesPagas(ids: string[]): Promise<ComissaoResult> {
  const ctx = await requireRole(ROLES);
  if (!ids.length) return { error: "Nenhuma comissão selecionada." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("commissions")
    .update({ status: "paga", paga_em: new Date().toISOString() } as never)
    .in("id", ids)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "liberada");
  if (error) return { error: "Não foi possível baixar as comissões." };
  revalidatePath("/comissoes");
  return { message: `${ids.length} comissão(ões) marcada(s) como paga(s).` };
}
