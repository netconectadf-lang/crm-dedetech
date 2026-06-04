import "server-only";

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
    const res = await fetch(`${URL}/instance/connectionState/${INSTANCE}`, {
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
    const res = await fetch(`${URL}/instance/connect/${INSTANCE}`, {
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
    const res = await fetch(`${URL}/instance/logout/${INSTANCE}`, {
      method: "DELETE",
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
