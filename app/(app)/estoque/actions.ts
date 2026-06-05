"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import {
  entradaSchema,
  saidaSchema,
  perdaSchema,
  ajusteSchema,
  loteEditSchema,
} from "@/lib/validators/estoque";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional"];

/** Entrada: cria o lote e registra a movimentação (trigger soma o saldo). */
export async function registrarEntrada(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = entradaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { product_id, qtd_entrada, ...batch } = parsed.data;
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("stock_batches")
    .insert({
      ...batch,
      product_id,
      tenant_id: ctx.tenantId,
      qtd_entrada,
      qtd_atual: 0,
    } as never)
    .select("id")
    .single();
  if (error || !created) return { error: "Não foi possível criar o lote." };

  await supabase.from("stock_movements").insert({
    tenant_id: ctx.tenantId,
    product_id,
    batch_id: (created as { id: string }).id,
    tipo: "entrada",
    quantidade: qtd_entrada,
    created_by: ctx.userId,
  });

  revalidatePath("/estoque");
  return { message: "Entrada registrada." };
}

/** Saída por FEFO: consome lotes não vencidos, validade mais próxima primeiro. */
export async function registrarSaida(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = saidaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { product_id, quantidade, motivo } = parsed.data;
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: batchesData } = await supabase
    .from("stock_batches")
    .select("id, qtd_atual, validade")
    .eq("product_id", product_id)
    .gt("qtd_atual", 0)
    .or(`validade.is.null,validade.gte.${hoje}`)
    .order("validade", { ascending: true, nullsFirst: false });

  const batches =
    (batchesData as { id: string; qtd_atual: number; validade: string | null }[] | null) ??
    [];

  const disponivel = batches.reduce((s, b) => s + Number(b.qtd_atual), 0);
  if (disponivel < quantidade) {
    return {
      error: `Estoque insuficiente (não vencido). Disponível: ${disponivel}.`,
    };
  }

  let restante = quantidade;
  const movimentos: Record<string, unknown>[] = [];
  for (const b of batches) {
    if (restante <= 0) break;
    const tirar = Math.min(Number(b.qtd_atual), restante);
    movimentos.push({
      tenant_id: ctx.tenantId,
      product_id,
      batch_id: b.id,
      tipo: "saida",
      quantidade: -tirar,
      motivo: motivo ?? null,
      created_by: ctx.userId,
    });
    restante -= tirar;
  }
  await supabase.from("stock_movements").insert(movimentos as never);

  revalidatePath("/estoque");
  return { message: "Saída registrada (FEFO)." };
}

/** Perda em um lote específico (ex.: vencimento, quebra). */
export async function registrarPerda(
  batchId: string,
  productId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = perdaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  await supabase.from("stock_movements").insert({
    tenant_id: ctx.tenantId,
    product_id: productId,
    batch_id: batchId,
    tipo: "perda",
    quantidade: -parsed.data.quantidade,
    motivo: parsed.data.motivo,
    created_by: ctx.userId,
  });
  revalidatePath("/estoque");
  return { message: "Perda registrada." };
}

/** Ajuste de inventário: define o saldo contado (gera movimento de ajuste). */
export async function ajustarInventario(
  batchId: string,
  productId: string,
  atual: number,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = ajusteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Quantidade inválida" };

  const delta = parsed.data.contado - atual;
  if (delta === 0) return { message: "Sem divergência." };

  const supabase = await createClient();
  await supabase.from("stock_movements").insert({
    tenant_id: ctx.tenantId,
    product_id: productId,
    batch_id: batchId,
    tipo: "ajuste",
    quantidade: delta,
    motivo: parsed.data.motivo ?? "Inventário",
    created_by: ctx.userId,
  } as never);
  revalidatePath("/estoque");
  return { message: "Inventário ajustado." };
}

/** Edita os dados do lote (lote, validade, fabricante, NF, data de entrada). */
export async function editarLote(
  id: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = loteEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("stock_batches")
    .update(parsed.data as never)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar o lote." };

  revalidatePath("/estoque");
  return { message: "Lote atualizado." };
}

export async function excluirLote(id: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("stock_batches")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/estoque");
}
