import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { renderScript } from "@/lib/whatsapp/render";
import { sendText } from "@/lib/whatsapp/evolution";

export type DisparoResult = {
  enviado: boolean;
  restantes: number;
  concluido: boolean;
  erro?: string;
};

/** Recalcula os contadores da campanha a partir dos disparos. */
export async function sincronizarContadores(
  db: SupabaseClient,
  campanhaId: string,
  tenantId: string,
): Promise<{ enviados: number; falhas: number; pendentes: number }> {
  const counts = await Promise.all(
    ["enviado", "falha", "pendente"].map((s) =>
      db
        .from("wa_disparos")
        .select("id", { count: "exact", head: true })
        .eq("campanha_id", campanhaId)
        .eq("status", s),
    ),
  );
  const [enviados, falhas, pendentes] = counts.map((c) => c.count ?? 0);
  await db
    .from("wa_campanhas")
    .update({ enviados, falhas, total_contatos: enviados + falhas + pendentes })
    .eq("id", campanhaId)
    .eq("tenant_id", tenantId);
  return { enviados, falhas, pendentes };
}

/**
 * Envia a PRÓXIMA mensagem pendente de uma campanha. Núcleo sem auth/Next —
 * recebe o `db` pronto — reusado pela server action (aba aberta) e pelo cron
 * (drena campanhas em "enviando" mesmo com a aba fechada).
 */
export async function enviarProximoDisparo(
  db: SupabaseClient,
  tenantId: string,
  campanhaId: string,
): Promise<DisparoResult> {
  const { data: campRaw } = await db
    .from("wa_campanhas")
    .select("id, script_id, status")
    .eq("id", campanhaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const camp = campRaw as { id: string; script_id: string | null; status: string } | null;
  if (!camp) return { enviado: false, restantes: 0, concluido: true, erro: "Campanha não encontrada." };
  if (!camp.script_id) return { enviado: false, restantes: 0, concluido: true, erro: "Campanha sem script." };

  const [{ data: scriptRaw }, { data: tenantRaw }] = await Promise.all([
    db.from("wa_scripts").select("corpo").eq("id", camp.script_id).maybeSingle(),
    db.from("tenants").select("razao_social, nome_fantasia").eq("id", tenantId).maybeSingle(),
  ]);
  const corpo = (scriptRaw as { corpo: string } | null)?.corpo;
  if (!corpo) return { enviado: false, restantes: 0, concluido: true, erro: "Script não encontrado." };
  const tnt = tenantRaw as { razao_social: string; nome_fantasia: string | null } | null;
  const empresa = tnt?.nome_fantasia || tnt?.razao_social || "";

  const { data: dispRaw } = await db
    .from("wa_disparos")
    .select("id, telefone, nome, contato_id")
    .eq("campanha_id", campanhaId)
    .eq("tenant_id", tenantId)
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const disp = dispRaw as { id: string; telefone: string; nome: string | null; contato_id: string | null } | null;

  if (!disp) {
    await db
      .from("wa_campanhas")
      .update({ status: "concluida", concluida_em: new Date().toISOString() })
      .eq("id", campanhaId)
      .eq("tenant_id", tenantId);
    return { enviado: false, restantes: 0, concluido: true };
  }

  if (camp.status !== "enviando") {
    await db
      .from("wa_campanhas")
      .update({ status: "enviando", iniciada_em: new Date().toISOString() })
      .eq("id", campanhaId)
      .eq("tenant_id", tenantId);
  }

  let v1: string | null = null;
  let v2: string | null = null;
  let v3: string | null = null;
  if (disp.contato_id) {
    const { data: c } = await db
      .from("wa_contatos")
      .select("variavel_1, variavel_2, variavel_3")
      .eq("id", disp.contato_id)
      .maybeSingle();
    const cc = c as { variavel_1: string | null; variavel_2: string | null; variavel_3: string | null } | null;
    v1 = cc?.variavel_1 ?? null;
    v2 = cc?.variavel_2 ?? null;
    v3 = cc?.variavel_3 ?? null;
  }

  const msg = renderScript(corpo, { nome: disp.nome, empresa, variavel_1: v1, variavel_2: v2, variavel_3: v3 });

  const r = await sendText(disp.telefone, msg);

  await db
    .from("wa_disparos")
    .update({
      status: r.ok ? "enviado" : "falha",
      mensagem_enviada: msg,
      erro: r.ok ? null : r.error ?? "Falha no envio",
      provider_message_id: r.providerId ?? null,
      enviado_em: new Date().toISOString(),
    })
    .eq("id", disp.id)
    .eq("tenant_id", tenantId);

  const { pendentes } = await sincronizarContadores(db, campanhaId, tenantId);
  const concluido = pendentes === 0;
  if (concluido) {
    await db
      .from("wa_campanhas")
      .update({ status: "concluida", concluida_em: new Date().toISOString() })
      .eq("id", campanhaId)
      .eq("tenant_id", tenantId);
  }
  return { enviado: r.ok, restantes: pendentes, concluido, erro: r.ok ? undefined : r.error };
}
