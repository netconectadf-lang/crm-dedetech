import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { enviarLembretes } from "@/lib/lembretes/enviar";
import { gerarOsRecorrentes } from "@/lib/contratos/recorrencia";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Lembretes automáticos por WhatsApp (revisão chegando + contrato a vencer).
 * Protegido por CRON_SECRET (header Authorization: Bearer <secret>).
 * ?dry=1 = simulação (lista quem receberia, sem enviar) — use para validar antes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dry") === "1";

  const db = createAdminClient();
  const { data } = await db.from("tenants").select("id");
  const tenants = (data as { id: string }[] | null) ?? [];

  const resultados = [];
  for (const t of tenants) {
    // 1) gera as OS recorrentes dos contratos ativos (antes de avisar).
    const recorrencia = await gerarOsRecorrentes(db, t.id, { dryRun });
    // 2) lembretes (revisão/renovação/aniversário).
    const lembretes = await enviarLembretes(t.id, { dryRun });
    resultados.push({ tenant: t.id, recorrencia, ...lembretes });
  }

  return NextResponse.json({ ok: true, dryRun, tenants: resultados }, { status: 200 });
}
