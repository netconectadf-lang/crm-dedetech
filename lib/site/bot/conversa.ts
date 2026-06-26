import type Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/site/supabase-admin";

/**
 * Memória da conversa por (tenant, telefone), persistida em conversas_whatsapp.
 * Guardamos o array de messages no formato da API da Anthropic.
 */

export type Msg = Anthropic.MessageParam;

const MAX_HISTORICO = 20; // últimas N mensagens — segura custo e contexto

export async function carregarHistorico(
  tenantId: string,
  telefone: string,
): Promise<Msg[]> {
  const { data } = await supabaseAdmin()
    .from("conversas_whatsapp")
    .select("mensagens")
    .eq("tenant_id", tenantId)
    .eq("telefone", telefone)
    .maybeSingle();

  return (data?.mensagens as Msg[] | undefined) ?? [];
}

export async function salvarHistorico(
  tenantId: string,
  telefone: string,
  mensagens: Msg[],
): Promise<void> {
  const recortado = mensagens.slice(-MAX_HISTORICO);
  await supabaseAdmin().from("conversas_whatsapp").upsert(
    {
      tenant_id: tenantId,
      telefone,
      mensagens: recortado,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,telefone" },
  );
}
