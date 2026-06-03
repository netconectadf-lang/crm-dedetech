"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ações públicas (sem sessão) — usam o admin client e são gated pelo token
 * inadivinhável da proposta. Nunca recebem tenant_id do cliente.
 */
export async function aceitarProposta(token: string) {
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, deal_id, status")
    .eq("public_token", token)
    .maybeSingle();
  if (!quote || (quote as { status: string }).status === "aceito") return;

  const q = quote as { id: string; deal_id: string };
  await supabase
    .from("quotes")
    .update({ status: "aceito", aceito_em: new Date().toISOString() })
    .eq("id", q.id);
  await supabase.from("deals").update({ stage: "ganho" }).eq("id", q.deal_id);

  // GANCHO F4/F6: aqui o orçamento aceito deve gerar Contrato (recorrente)
  // ou OS (avulsa). Implementar quando as fases existirem.

  revalidatePath(`/proposta/${token}`);
}

export async function recusarProposta(token: string) {
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("public_token", token)
    .maybeSingle();
  if (!quote) return;

  await supabase
    .from("quotes")
    .update({ status: "recusado", recusado_em: new Date().toISOString() })
    .eq("id", (quote as { id: string }).id);

  revalidatePath(`/proposta/${token}`);
}
