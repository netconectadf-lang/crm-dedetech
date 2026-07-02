import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { enviarProximoDisparo } from "@/lib/whatsapp/campanha-core";
import { reportarErro } from "@/lib/observability";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Anti-ban: espaçamento entre mensagens e teto de envios por execução (a
// campanha continua na próxima rodada do cron). Fica bem dentro do maxDuration.
const INTERVALO_MS = 4_000;
const MAX_POR_EXECUCAO = 10;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Worker de campanhas de WhatsApp. Drena as campanhas em "enviando" que ainda
 * têm disparos pendentes — assim a campanha continua MESMO com a aba do
 * operador fechada (antes o loop era client-side e parava ao fechar a aba).
 *
 * A conta Vercel é HOBBY (máx. 2 crons, já usados por trilogo+lembretes), então
 * este endpoint NÃO está no vercel.json: deve ser acionado por um pinger externo
 * (UptimeRobot) a cada ~5 min. Aceita o segredo via header Authorization: Bearer
 * <CRON_SECRET> OU via ?key=<CRON_SECRET> (monitores simples não mandam header).
 * ?dry=1 lista o que faria, sem enviar.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const autorizado =
    !!secret &&
    (request.headers.get("authorization") === `Bearer ${secret}` ||
      url.searchParams.get("key") === secret);
  if (!autorizado) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dry = url.searchParams.get("dry") === "1";

  const db = createAdminClient();

  // Campanhas em andamento com pelo menos 1 disparo pendente.
  const { data: campRaw } = await db
    .from("wa_campanhas")
    .select("id, tenant_id")
    .eq("status", "enviando");
  const campanhas = (campRaw as { id: string; tenant_id: string }[] | null) ?? [];

  const pendentesPorCamp: { id: string; tenant_id: string; pendentes: number }[] = [];
  for (const c of campanhas) {
    const { count } = await db
      .from("wa_disparos")
      .select("id", { count: "exact", head: true })
      .eq("campanha_id", c.id)
      .eq("status", "pendente");
    if ((count ?? 0) > 0) pendentesPorCamp.push({ ...c, pendentes: count ?? 0 });
  }

  if (dry) {
    return NextResponse.json({ ok: true, dry: true, campanhas: pendentesPorCamp });
  }

  let enviados = 0;
  const resultados: { campanha: string; enviados: number; restantes: number }[] = [];

  // Reparte o teto entre as campanhas ativas p/ nenhuma monopolizar a janela.
  const porCampanha = pendentesPorCamp.length
    ? Math.max(1, Math.floor(MAX_POR_EXECUCAO / pendentesPorCamp.length))
    : 0;

  for (const c of pendentesPorCamp) {
    let restantes = c.pendentes;
    for (let i = 0; i < porCampanha && enviados < MAX_POR_EXECUCAO; i++) {
      try {
        const r = await enviarProximoDisparo(db, c.tenant_id, c.id);
        enviados += 1;
        restantes = r.restantes;
        if (r.concluido) break;
        await sleep(INTERVALO_MS);
      } catch (err) {
        reportarErro("cron-campanhas", err, { campanha: c.id });
        break;
      }
    }
    resultados.push({ campanha: c.id, enviados, restantes });
  }

  return NextResponse.json({ ok: true, enviados, campanhas: resultados });
}
