import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { dispatch } from "@/lib/notify/dispatch";
import { nomeExibicao } from "@/lib/clientes";
import { onlyDigits } from "@/lib/format";
import { reportarErro } from "@/lib/observability";

/**
 * Avisa o cliente que o técnico está A CAMINHO (o "pizza tracker" do setor).
 * Best-effort: nunca derruba a mudança de status. Dedup por `messages`
 * (related_kind=os_a_caminho) para não avisar duas vezes se o status oscilar.
 * Prefere WhatsApp; cai para e-mail se não houver telefone.
 */
export async function avisarClienteACaminho(
  db: SupabaseClient,
  tenantId: string,
  osId: string,
): Promise<void> {
  try {
    const { data: osData } = await db
      .from("service_orders")
      .select("id, clients:client_id(razao_social, nome_fantasia, telefone, email)")
      .eq("id", osId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    const os = osData as {
      clients:
        | { razao_social: string; nome_fantasia: string | null; telefone: string | null; email: string | null }
        | { razao_social: string; nome_fantasia: string | null; telefone: string | null; email: string | null }[]
        | null;
    } | null;
    if (!os) return;
    const cli = Array.isArray(os.clients) ? os.clients[0] : os.clients;
    const tel = cli?.telefone ? onlyDigits(cli.telefone) : "";
    const email = cli?.email?.trim() || "";
    if (!tel && !email) return;

    // dedup
    const { data: msg } = await db
      .from("messages")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("related_kind", "os_a_caminho")
      .eq("related_id", osId)
      .in("status", ["sent", "skipped"])
      .limit(1);
    if (((msg as { id: string }[] | null) ?? []).length > 0) return;

    const { data: tData } = await db
      .from("tenants")
      .select("razao_social, nome_fantasia")
      .eq("id", tenantId)
      .maybeSingle();
    const t = tData as { razao_social: string; nome_fantasia: string | null } | null;
    const empresa = t?.nome_fantasia?.trim() || t?.razao_social || "nossa equipe";
    const nome = nomeExibicao(cli);

    const corpo =
      `Olá, ${nome}! 🚐 Um técnico da ${empresa} está *a caminho* para o seu atendimento. ` +
      `Qualquer coisa, é só responder por aqui.`;

    const canal: "whatsapp" | "email" = tel ? "whatsapp" : "email";
    await dispatch({
      tenantId,
      canal,
      destino: tel ? cli!.telefone! : email,
      assunto: canal === "email" ? `Técnico a caminho — ${empresa}` : undefined,
      corpo,
      related_kind: "os_a_caminho",
      related_id: osId,
    });
  } catch (err) {
    reportarErro("os-a-caminho", err, { osId });
  }
}
