"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import { quoteItemSchema, quoteSchema, taskSchema } from "@/lib/validators/funil";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial"];

// ─── Orçamento ───────────────────────────────────────────────────────
export async function criarOrcamento(dealId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({ tenant_id: ctx.tenantId, deal_id: dealId })
    .select("id")
    .single();
  if (error || !data) redirect(`/funil/${dealId}`);
  // move o deal para o estágio de orçamento (se ainda atrás)
  await supabase
    .from("deals")
    .update({ stage: "orcamento" })
    .eq("id", dealId)
    .eq("tenant_id", ctx.tenantId)
    .in("stage", ["lead", "contato", "diagnostico"]);
  redirect(`/funil/${dealId}/orcamento/${(data as { id: string }).id}`);
}

export async function salvarDadosOrcamento(
  quoteId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update(parsed.data)
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath(`/funil`);
  return { message: "Orçamento salvo." };
}

export async function adicionarItem(
  quoteId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = quoteItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_items")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, quote_id: quoteId });
  if (error) return { error: "Não foi possível adicionar o item." };
  revalidatePath(`/funil`);
  return { message: "Item adicionado." };
}

export async function removerItem(itemId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("quote_items")
    .delete()
    .eq("id", itemId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/funil`);
}

export async function marcarEnviado(quoteId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "enviado", enviado_em: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/funil`);
}

export async function excluirOrcamento(quoteId: string, dealId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  redirect(`/funil/${dealId}`);
}

// ─── Tarefas / follow-ups ────────────────────────────────────────────
export async function criarTarefa(
  dealId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Descreva a tarefa" };
  const supabase = await createClient();
  const { error } = await supabase.from("deal_tasks").insert({
    ...parsed.data,
    tenant_id: ctx.tenantId,
    deal_id: dealId,
  });
  if (error) return { error: "Não foi possível criar a tarefa." };
  revalidatePath(`/funil/${dealId}`);
  return { message: "Tarefa criada." };
}

export async function alternarTarefa(id: string, done: boolean) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("deal_tasks")
    .update({ done })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/funil`);
}

export async function excluirTarefa(id: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("deal_tasks")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/funil`);
}
