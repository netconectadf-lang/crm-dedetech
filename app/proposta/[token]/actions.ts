"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Ações públicas (sem sessão) — usam o admin client e são gated pelo token
 * inadivinhável da proposta. Nunca recebem tenant_id do cliente.
 */
export async function aceitarProposta(token: string) {
  if (!(await rateLimit("proposta", { limit: 20, windowSeconds: 60 }))) return;
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, deal_id, status")
    .eq("public_token", token)
    .maybeSingle();
  if (!quote || (quote as { status: string }).status === "aceito") return;

  const q = quote as { id: string; deal_id: string | null };
  await supabase
    .from("quotes")
    .update({ status: "aceito", aceito_em: new Date().toISOString() })
    .eq("id", q.id);
  // se veio do funil, marca o negócio como ganho (orçamento avulso não tem deal)
  if (q.deal_id) {
    await supabase.from("deals").update({ stage: "ganho" }).eq("id", q.deal_id);
  }

  revalidatePath(`/proposta/${token}`);
  revalidatePath("/orcamentos", "layout");
}

export async function recusarProposta(token: string) {
  if (!(await rateLimit("proposta", { limit: 20, windowSeconds: 60 }))) return;
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
