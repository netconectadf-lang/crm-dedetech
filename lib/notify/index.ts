import "server-only";

import { sendEmail } from "@/lib/email";

export type SendResult = {
  ok: boolean;
  skipped?: boolean;
  providerId?: string;
  error?: string;
};

/**
 * Envia texto por WhatsApp via Evolution API. Inerte (skipped) sem credencial
 * — assim o fluxo de notificação nunca quebra antes do provider ser ligado.
 * Ver docs/whatsapp-arquitetura.md p/ o desenho multi-tenant definitivo.
 */
export async function sendWhatsApp(
  to: string,
  text: string,
): Promise<SendResult> {
  const url = process.env.EVOLUTION_URL;
  const key = process.env.EVOLUTION_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  const numero = to.replace(/\D/g, "");
  if (!url || !key || !instance || !numero) {
    console.info(`[wa:dev] ${to}: ${text.slice(0, 50)} (Evolution off)`);
    return { ok: true, skipped: true };
  }
  try {
    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: "POST",
      headers: { apikey: key, "content-type": "application/json" },
      body: JSON.stringify({ number: numero, text }),
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    const d = await res.json().catch(() => ({}));
    return { ok: true, providerId: d?.key?.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** E-mail via Resend (já inerte sem RESEND_API_KEY). */
export async function sendMail(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  const r = await sendEmail({ to, subject, html });
  return { ok: r.ok, skipped: "skipped" in r ? r.skipped : undefined };
}
