import "server-only";

import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { dispatch } from "@/lib/notify/dispatch";

async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

type OsRow = {
  id: string;
  numero: number;
  client_id: string;
  clients: { telefone: string | null; email: string | null } | null;
};

/**
 * Cria (se ainda não houver) a pesquisa NPS da OS e envia o link ao cliente
 * pelo melhor canal disponível (WhatsApp > e-mail). Inerte sem provider.
 *
 * - opts.auto = true  (pós-finalização): NÃO duplica e só envia se o cliente
 *   tem telefone/e-mail (evita pesquisa órfã que nunca chega).
 * - opts.auto = false (botão manual): reaproveita o token existente para
 *   reenviar, ou cria um novo; cria mesmo sem contato (gera o link).
 */
export async function enviarNpsDaOS(
  supabase: SupabaseClient,
  tenantId: string,
  osId: string,
  opts: { auto?: boolean } = {},
): Promise<void> {
  const { data: ex } = await supabase
    .from("nps_responses")
    .select("token")
    .eq("os_id", osId)
    .limit(1)
    .maybeSingle();
  const tokenExistente = (ex as { token: string } | null)?.token ?? null;

  // No automático, não reenvia se já existe pesquisa para essa OS.
  if (opts.auto && tokenExistente) return;

  const { data: osData } = await supabase
    .from("service_orders")
    .select("id, numero, client_id, clients(telefone, email)")
    .eq("id", osId)
    .maybeSingle();
  const os = osData as unknown as OsRow | null;
  if (!os) return;

  const telefone = os.clients?.telefone ?? null;
  const email = os.clients?.email ?? null;

  // No automático, sem canal de contato não há o que enviar.
  if (opts.auto && !telefone && !email) return;

  let token = tokenExistente;
  if (!token) {
    const { data: created } = await supabase
      .from("nps_responses")
      .insert({ tenant_id: tenantId, os_id: os.id, client_id: os.client_id })
      .select("token")
      .single();
    token = (created as { token: string } | null)?.token ?? null;
  }
  if (!token) return;

  const link = `${await appOrigin()}/nps/${token}`;
  const corpo = `Olá! Como foi nosso atendimento (OS #${os.numero})? Avalie em: ${link}`;

  if (telefone) {
    await dispatch({
      tenantId,
      canal: "whatsapp",
      destino: telefone,
      corpo,
      related_kind: "nps",
      related_id: os.id,
    });
  } else if (email) {
    await dispatch({
      tenantId,
      canal: "email",
      destino: email,
      assunto: "Avalie seu atendimento",
      corpo,
      related_kind: "nps",
      related_id: os.id,
    });
  }
}
