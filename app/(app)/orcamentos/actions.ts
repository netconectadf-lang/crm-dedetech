"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "financeiro"];

/** Cria um orçamento AVULSO (direto para um cliente, sem passar pelo funil). */
export async function criarOrcamentoAvulso(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const clientId = String(formData.get("client_id") ?? "");
  if (!z.string().uuid().safeParse(clientId).success) {
    return { error: "Selecione o cliente." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({ tenant_id: ctx.tenantId, client_id: clientId })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível criar o orçamento." };
  redirect(`/orcamentos/${(data as { id: string }).id}`);
}

/** Marca o orçamento como aceito manualmente (sem o cliente clicar no link). */
export async function marcarAceito(quoteId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "aceito", aceito_em: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/orcamentos", "layout");
}

export async function excluirOrcamentoAvulso(quoteId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  redirect("/orcamentos");
}
