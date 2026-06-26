import { NextResponse } from "next/server";
import { parseWebhook, enviarTexto } from "@/lib/site/whatsapp";
import { responder } from "@/lib/site/bot/brain";

// Roda no Node (precisa da service key do Supabase e do SDK da Anthropic).
export const runtime = "nodejs";
// Nunca cachear o webhook.
export const dynamic = "force-dynamic";

// Tenant (dedetizadora) que este número de WhatsApp atende. MVP: um só.
const TENANT_ID = process.env.WHATSAPP_TENANT_ID!;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

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
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignora payload inválido
  }

  const msg = parseWebhook(body);
  if (!msg || !msg.texto) {
    return NextResponse.json({ ok: true }); // status/mídia/etc — ignora
  }

  try {
    const resposta = await responder(TENANT_ID, msg.de, msg.texto);
    await enviarTexto(msg.de, resposta);
  } catch (err) {
    console.error("[whatsapp] erro ao processar mensagem:", err);
    await enviarTexto(
      msg.de,
      "Desculpe, tivemos um problema técnico. Tente novamente em instantes.",
    );
  }

  return NextResponse.json({ ok: true });
}
