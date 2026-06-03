import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook do Asaas. Valida o token (se configurado) e, no pagamento
 * confirmado, marca a cobrança como paga e quita a Conta a Receber vinculada.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (expected && req.headers.get("asaas-access-token") !== expected) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const event = body?.event as string | undefined;
  const paymentId = body?.payment?.id as string | undefined;
  if (!paymentId) return NextResponse.json({ ok: true });

  const pago = event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED";
  if (!pago) return NextResponse.json({ ok: true });

  const db = createAdminClient();
  const { data: chargeData } = await db
    .from("charges")
    .select("id, ar_id")
    .eq("provider_charge_id", paymentId)
    .maybeSingle();
  const charge = chargeData as { id: string; ar_id: string | null } | null;
  if (!charge) return NextResponse.json({ ok: true });

  await db.from("charges").update({ status: "pago" }).eq("id", charge.id);

  if (charge.ar_id) {
    const { data: ar } = await db
      .from("accounts_receivable")
      .select("valor")
      .eq("id", charge.ar_id)
      .maybeSingle();
    if (ar) {
      await db
        .from("accounts_receivable")
        .update({
          valor_pago: (ar as { valor: number }).valor,
          status: "quitado",
          pago_em: new Date().toISOString(),
        })
        .eq("id", charge.ar_id);
    }
  }

  return NextResponse.json({ ok: true });
}
