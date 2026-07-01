import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { liberarComissoesDaAr } from "@/lib/comissoes";

/**
 * Webhook do Asaas (multi-tenant). O token enviado no header identifica a
 * empresa: cada conta conectada tem o seu próprio webhook_token. No pagamento
 * confirmado, marca a cobrança como paga e quita a Conta a Receber vinculada.
 * Fail-closed: token desconhecido → 401.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("asaas-access-token");
  if (!token) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const db = createAdminClient();

  // Token por empresa (payment_integrations.webhook_token) é o caminho correto.
  // O token GLOBAL legado quita cobrança de qualquer tenant → desativado por
  // padrão. Só é aceito se ASAAS_WEBHOOK_ALLOW_LEGACY === "true" (emergência).
  const globalToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const permiteLegado = process.env.ASAAS_WEBHOOK_ALLOW_LEGACY === "true";
  let tenantId: string | null = null;

  if (globalToken && permiteLegado && token === globalToken) {
    tenantId = null; // aceita qualquer tenant (modo legado, opt-in)
  } else {
    const { data: integ } = await db
      .from("payment_integrations")
      .select("tenant_id, enabled")
      .eq("webhook_token", token)
      .maybeSingle();
    const row = integ as { tenant_id: string; enabled: boolean } | null;
    if (!row || !row.enabled) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
    tenantId = row.tenant_id;
  }

  const body = await req.json().catch(() => null);
  const event = body?.event as string | undefined;
  const paymentId = body?.payment?.id as string | undefined;
  if (!paymentId) return NextResponse.json({ ok: true });

  const pago = event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED";
  if (!pago) return NextResponse.json({ ok: true });

  let q = db.from("charges").select("id, ar_id, tenant_id").eq("provider_charge_id", paymentId);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: chargeData } = await q.maybeSingle();
  const charge = chargeData as { id: string; ar_id: string | null; tenant_id: string } | null;
  if (!charge) return NextResponse.json({ ok: true });

  await db.from("charges").update({ status: "pago" }).eq("id", charge.id);

  if (charge.ar_id) {
    const { data: ar } = await db
      .from("accounts_receivable")
      .select("valor")
      .eq("id", charge.ar_id)
      .maybeSingle();
    if (ar) {
      const valorPago = (ar as { valor: number }).valor;
      await db
        .from("accounts_receivable")
        .update({
          valor_pago: valorPago,
          status: "quitado",
          pago_em: new Date().toISOString(),
        })
        .eq("id", charge.ar_id);
      // Libera as comissões provisionadas dessa AR (idempotente: só age nas
      // que ainda estão "provisionada"). Espelha o fluxo da baixa manual.
      await liberarComissoesDaAr(db, charge.tenant_id, charge.ar_id, valorPago);
    }
  }

  return NextResponse.json({ ok: true });
}
