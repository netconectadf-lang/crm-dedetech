/**
 * Integração com a WhatsApp Cloud API (Meta oficial).
 * Só duas operações no MVP: enviar texto e ler a mensagem recebida do webhook.
 */

const GRAPH_VERSION = "v21.0";

const TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;

/** Envia uma mensagem de texto para um número (formato E.164 sem '+': ex 5561999999999). */
export async function enviarTexto(para: string, texto: string): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: para,
      type: "text",
      text: { body: texto },
    }),
  });

  if (!resp.ok) {
    const erro = await resp.text();
    console.error("[whatsapp] falha ao enviar:", resp.status, erro);
  }
}

export type MensagemRecebida = {
  de: string; // telefone do cliente (E.164 sem '+')
  texto: string; // corpo da mensagem
  nomeContato?: string; // nome do perfil do WhatsApp, se vier
};

/**
 * Extrai a mensagem de texto do payload do webhook da Meta.
 * Retorna null se o evento não for uma mensagem de texto de cliente
 * (ex.: status de entrega, reações, mídia — ignorados no MVP).
 */
export function parseWebhook(body: unknown): MensagemRecebida | null {
  try {
    const entry = (body as any)?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const msg = change?.messages?.[0];
    if (!msg || msg.type !== "text") return null;

    return {
      de: msg.from,
      texto: msg.text?.body ?? "",
      nomeContato: change?.contacts?.[0]?.profile?.name,
    };
  } catch {
    return null;
  }
}
