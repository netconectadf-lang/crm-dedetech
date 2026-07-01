import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { parseWebhook, enviarTexto } from "@/lib/site/whatsapp";
import { responder } from "@/lib/site/bot/brain";
import { rateLimit } from "@/lib/rate-limit";
import { reportarErro } from "@/lib/observability";

// Roda no Node (precisa da service key do Supabase e do SDK da Anthropic).
export const runtime = "nodejs";
// Nunca cachear o webhook.
export const dynamic = "force-dynamic";
// Teto de tempo: o loop de IA + envio roda inline; não deixar pendurar.
export const maxDuration = 30;

// Tenant (dedetizadora) que este número de WhatsApp atende. MVP: um só.
const TENANT_ID = process.env.WHATSAPP_TENANT_ID!;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
// App Secret da Meta — usado p/ validar a assinatura X-Hub-Signature-256.
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

/**
 * Valida a assinatura HMAC-SHA256 que a Meta envia no header
 * `x-hub-signature-256: sha256=<hex>`, calculada sobre o corpo BRUTO.
 * Comparação em tempo constante. Retorna false se algo não bate.
 */
function assinaturaValida(rawBody: string, header: string | null): boolean {
  if (!APP_SECRET || !header?.startsWith("sha256=")) return false;
  const esperado = createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  const recebido = header.slice("sha256=".length);
  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(recebido, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET — handshake de verificação do webhook na Meta.
 * A Meta chama com hub.mode/hub.verify_token/hub.challenge; devolvemos o challenge.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

/**
 * POST — mensagens recebidas. Respondemos 200 rápido e processamos a mensagem.
 *
 * Segurança (fail-closed no que é perigoso — escrita no banco com service_role
 * e gasto de tokens da Anthropic):
 *  1. Kill-switch de emergência via BOT_DESLIGADO=true.
 *  2. Assinatura HMAC da Meta obrigatória (sem WHATSAPP_APP_SECRET não processa).
 *  3. Rate limit por número (anti-DoS financeiro).
 * Em todos os casos respondemos 200 para a Meta não reenviar o evento.
 */
export async function POST(req: Request) {
  // Kill-switch: desliga o bot sem redeploy.
  if (process.env.BOT_DESLIGADO === "true") {
    return NextResponse.json({ ok: true });
  }

  // Lê o corpo BRUTO uma vez (necessário p/ validar a assinatura).
  const rawBody = await req.text();

  // Sem App Secret configurado NÃO processamos (evita escrita/gasto sem auth).
  if (!APP_SECRET) {
    console.error("[whatsapp] WHATSAPP_APP_SECRET ausente — webhook não processado.");
    return NextResponse.json({ ok: true });
  }
  if (!assinaturaValida(rawBody, req.headers.get("x-hub-signature-256"))) {
    console.error("[whatsapp] assinatura X-Hub-Signature-256 inválida — descartado.");
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true }); // ignora payload inválido
  }

  const msg = parseWebhook(body);
  if (!msg || !msg.texto) {
    return NextResponse.json({ ok: true }); // status/mídia/etc — ignora
  }

  // Rate limit por número: no máx. 10 mensagens/min por remetente.
  const liberado = await rateLimit("wa-bot", { limit: 10, windowSeconds: 60, key: msg.de });
  if (!liberado) {
    console.warn("[whatsapp] rate limit estourado para", msg.de);
    return NextResponse.json({ ok: true });
  }

  try {
    const resposta = await responder(TENANT_ID, msg.de, msg.texto);
    await enviarTexto(msg.de, resposta);
  } catch (err) {
    reportarErro("whatsapp-bot", err, { de: msg.de });
    await enviarTexto(
      msg.de,
      "Desculpe, tivemos um problema técnico. Tente novamente em instantes.",
    );
  }

  return NextResponse.json({ ok: true });
}
