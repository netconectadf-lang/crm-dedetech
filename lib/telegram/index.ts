import "server-only";

import { reportarErro } from "@/lib/observability";

export function telegramEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/** Envia uma mensagem de texto (Markdown). `token` da empresa; default = env. */
export async function enviarTelegram(
  chatId: number | string,
  text: string,
  token?: string,
) {
  const tk = token ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!tk) return;
  try {
    await fetch(`https://api.telegram.org/bot${tk}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (e) {
    reportarErro("telegram-send", e, { chatId }); // não derruba o webhook
  }
}

/** Valida um token de bot (getMe) e devolve o @username. */
export async function validarBot(
  token: string,
): Promise<{ ok: boolean; username?: string; nome?: string }> {
  try {
    const d = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
    if (!d?.ok) return { ok: false };
    return { ok: true, username: d.result?.username, nome: d.result?.first_name };
  } catch {
    return { ok: false };
  }
}

/** Registra o webhook do bot apontando para a URL (com secret_token). */
export async function registrarWebhookTelegram(token: string, url: string, secret: string) {
  try {
    const d = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message"] }),
    }).then((r) => r.json());
    return Boolean(d?.ok);
  } catch {
    return false;
  }
}

/** Remove o webhook do bot. */
export async function removerWebhookTelegram(token: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: "POST" });
  } catch {
    /* ignora */
  }
}

/** Baixa um arquivo (ex.: PDF de pedido) enviado ao bot. */
export async function baixarArquivoTelegram(
  fileId: string,
  token?: string,
): Promise<ArrayBuffer | null> {
  const tk = token ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!tk) return null;
  try {
    const info = await fetch(
      `https://api.telegram.org/bot${tk}/getFile?file_id=${fileId}`,
    ).then((r) => r.json());
    const path = info?.result?.file_path;
    if (!path) return null;
    const res = await fetch(`https://api.telegram.org/file/bot${tk}/${path}`);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** Chats autorizados a lançar despesas (env, separados por vírgula). */
export function chatAutorizado(chatId: number | string) {
  const lista = (process.env.TELEGRAM_ALLOWED_CHATS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return lista.length === 0 ? false : lista.includes(String(chatId));
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Interpreta texto livre como despesa: extrai o 1º número como valor (formato
 * BR: 1.500,50) e o resto como descrição. "gasolina 150" ou "150 gasolina".
 */
export function parseDespesa(
  text: string,
): { valor: number; descricao: string } | null {
  const m = text.match(/(\d[\d.]*(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const bruto = m[0];
  // BR "1.500,50" → 1500.50 ; "150.50" (sem vírgula) mantém o ponto decimal
  let valorStr = bruto;
  if (bruto.includes(",")) valorStr = bruto.replace(/\./g, "").replace(",", ".");
  const valor = Number(valorStr);
  if (!Number.isFinite(valor) || valor <= 0) return null;

  const descricao =
    text.replace(bruto, " ").replace(/r\$/gi, " ").replace(/\s+/g, " ").trim() ||
    "Despesa";
  return { valor, descricao: cap(descricao) };
}
