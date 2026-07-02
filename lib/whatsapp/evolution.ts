import "server-only";

import { reportarErro } from "@/lib/observability";
import { fetchWithTimeout } from "@/lib/http";

/**
 * Helpers da Evolution API para CONECTAR o número (QR Code / status).
 *
 * Estado atual: instância ÚNICA via env (EVOLUTION_URL/KEY/INSTANCE) — a
 * instância do cliente-âncora (A7). O desenho multi-tenant (uma instância por
 * tenant, credenciais por empresa) está em docs/whatsapp-arquitetura.md (Fase 9).
 */

const URL = process.env.EVOLUTION_URL;
const KEY = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

export type WaState = "open" | "connecting" | "close" | "unknown";

export function evolutionConfigured(): boolean {
  return Boolean(URL && KEY && INSTANCE);
}

function headers() {
  return { apikey: KEY as string, "content-type": "application/json" };
}

/** Estado da conexão: open = conectado, connecting = aguardando QR, close = desconectado. */
export async function getConnectionState(): Promise<WaState> {
  if (!evolutionConfigured()) return "unknown";
  try {
    const res = await fetchWithTimeout(`${URL}/instance/connectionState/${INSTANCE}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) return "unknown";
    const d = (await res.json().catch(() => ({}))) as {
      instance?: { state?: string };
      state?: string;
    };
    const state = d?.instance?.state ?? d?.state;
    if (state === "open" || state === "connecting" || state === "close") return state;
    return "unknown";
  } catch {
    return "unknown";
  }
}

export type ConnectResult = {
  state: WaState;
  /** QR Code em data-URL (image/png) para exibir na tela. */
  qr?: string;
  /** Código de pareamento alternativo (digitar no WhatsApp em vez de escanear). */
  pairingCode?: string;
  error?: string;
};

/** Inicia/retoma a conexão e devolve o QR Code para escanear. */
export async function connectInstance(): Promise<ConnectResult> {
  if (!evolutionConfigured()) {
    return { state: "unknown", error: "WhatsApp não configurado (faltam credenciais da Evolution)." };
  }
  try {
    const res = await fetchWithTimeout(`${URL}/instance/connect/${INSTANCE}`, {
      headers: headers(),
      cache: "no-store",
    });
    const d = (await res.json().catch(() => ({}))) as {
      base64?: string;
      code?: string;
      pairingCode?: string;
      instance?: { state?: string };
      state?: string;
    };
    if (!res.ok) {
      return { state: "unknown", error: typeof d === "object" ? JSON.stringify(d) : "Falha ao conectar." };
    }
    // Já conectado: Evolution devolve o state em vez de QR.
    const state = d?.instance?.state ?? d?.state;
    if (state === "open") return { state: "open" };

    const raw = d?.base64;
    const qr = raw ? (raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`) : undefined;
    // `code` é o conteúdo do QR (não um código digitável) — só expõe pairingCode real.
    return { state: "connecting", qr, pairingCode: d?.pairingCode ?? undefined };
  } catch (e) {
    return { state: "unknown", error: String(e) };
  }
}

/** Desconecta o aparelho (logout). */
export async function logoutInstance(): Promise<boolean> {
  if (!evolutionConfigured()) return false;
  try {
    const res = await fetchWithTimeout(`${URL}/instance/logout/${INSTANCE}`, {
      method: "DELETE",
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Envio e extração (campanhas) ────────────────────────────────────

export type SendTextResult = { ok: boolean; providerId?: string; error?: string };

/** Envia uma mensagem de texto. `numero` deve estar em dígitos (55DDDNNN...). */
export async function sendText(numero: string, text: string): Promise<SendTextResult> {
  if (!evolutionConfigured()) return { ok: false, error: "WhatsApp não configurado." };
  const num = (numero ?? "").replace(/\D/g, "");
  if (!num) return { ok: false, error: "Número inválido." };
  try {
    const res = await fetchWithTimeout(`${URL}/message/sendText/${INSTANCE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ number: num, text }),
    });
    const d = (await res.json().catch(() => ({}))) as { key?: { id?: string }; message?: string };
    if (!res.ok) {
      reportarErro("evolution-send", new Error(d?.message ?? JSON.stringify(d)), { numero: num });
      return { ok: false, error: d?.message ?? JSON.stringify(d) };
    }
    return { ok: true, providerId: d?.key?.id };
  } catch (e) {
    reportarErro("evolution-send", e, { numero: num });
    return { ok: false, error: String(e) };
  }
}

export type ContatoWa = { nome: string; telefone: string };

function numeroDeJid(jid: string): string {
  return (jid ?? "").split("@")[0]?.replace(/\D/g, "") ?? "";
}

/** Lista os contatos salvos no WhatsApp conectado (exclui grupos/broadcast). */
export async function findContacts(): Promise<ContatoWa[]> {
  if (!evolutionConfigured()) return [];
  try {
    const res = await fetchWithTimeout(`${URL}/chat/findContacts/${INSTANCE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ where: {} }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => [])) as Array<{
      remoteJid?: string;
      id?: string;
      pushName?: string;
      name?: string;
    }>;
    const lista = Array.isArray(data) ? data : [];
    return lista
      .map((c) => {
        const jid = c.remoteJid ?? c.id ?? "";
        return { jid, nome: c.name ?? c.pushName ?? "", telefone: numeroDeJid(jid) };
      })
      .filter(
        (c) =>
          !c.jid.endsWith("@g.us") &&
          !c.jid.endsWith("@broadcast") &&
          !c.jid.endsWith("@lid") &&
          c.telefone.length >= 12 &&
          c.telefone.length <= 13,
      )
      .map(({ nome, telefone }) => ({ nome, telefone }));
  } catch {
    return [];
  }
}

export type MensagemWa = {
  telefone: string;
  pushName: string;
  texto: string;
  fromMe: boolean;
  timestamp: number;
};

/**
 * Puxa um lote de mensagens recentes numa única chamada (offset = tamanho do
 * lote). Já filtra conversas INDIVIDUAIS e extrai o texto da mensagem.
 */
export async function findMessages(limite = 5000): Promise<MensagemWa[]> {
  if (!evolutionConfigured()) return [];
  try {
    const res = await fetchWithTimeout(`${URL}/chat/findMessages/${INSTANCE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ where: {}, offset: limite }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => ({}))) as {
      messages?: { records?: unknown[] } | unknown[];
    };
    const raw = Array.isArray(data.messages)
      ? data.messages
      : ((data.messages as { records?: unknown[] } | undefined)?.records ?? []);

    const out: MensagemWa[] = [];
    for (const r of raw as Array<{
      key?: { remoteJid?: string; fromMe?: boolean };
      pushName?: string;
      message?: Record<string, unknown>;
      messageTimestamp?: number;
    }>) {
      const jid = r.key?.remoteJid ?? "";
      if (!jid.endsWith("@s.whatsapp.net")) continue; // só individuais
      const tel = numeroDeJid(jid);
      if (tel.length < 12 || tel.length > 13) continue;
      const m = r.message ?? {};
      const texto =
        (m.conversation as string) ||
        (m.extendedTextMessage as { text?: string } | undefined)?.text ||
        (m.imageMessage as { caption?: string } | undefined)?.caption ||
        (m.videoMessage as { caption?: string } | undefined)?.caption ||
        "";
      if (!texto) continue;
      out.push({
        telefone: tel,
        pushName: r.pushName ?? "",
        texto,
        fromMe: Boolean(r.key?.fromMe),
        timestamp: Number(r.messageTimestamp ?? 0),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export type GrupoWa = { jid: string; nome: string; participantes: number };

/** Lista os grupos do WhatsApp conectado. */
export async function fetchGroups(): Promise<GrupoWa[]> {
  if (!evolutionConfigured()) return [];
  try {
    const res = await fetchWithTimeout(
      `${URL}/group/fetchAllGroups/${INSTANCE}?getParticipants=false`,
      { headers: headers(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json().catch(() => [])) as Array<{
      id?: string;
      subject?: string;
      size?: number;
    }>;
    const lista = Array.isArray(data) ? data : [];
    return lista
      .filter((g) => g.id)
      .map((g) => ({ jid: g.id as string, nome: g.subject ?? "Grupo", participantes: g.size ?? 0 }));
  } catch {
    return [];
  }
}

/** Extrai os participantes (números) de um grupo. */
export async function groupParticipants(groupJid: string): Promise<ContatoWa[]> {
  if (!evolutionConfigured()) return [];
  try {
    const res = await fetchWithTimeout(
      `${URL}/group/participants/${INSTANCE}?groupJid=${encodeURIComponent(groupJid)}`,
      { headers: headers(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json().catch(() => ({}))) as {
      participants?: Array<{ id?: string }>;
    };
    return (data?.participants ?? [])
      .map((p) => ({ nome: "", telefone: numeroDeJid(p.id ?? "") }))
      .filter((c) => c.telefone.length >= 12 && c.telefone.length <= 13);
  } catch {
    return [];
  }
}
