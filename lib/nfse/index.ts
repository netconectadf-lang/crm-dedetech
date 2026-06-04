import "server-only";

const BASE =
  process.env.FOCUS_NFE_ENV === "production"
    ? "https://api.focusnfe.com.br"
    : "https://homologacao.focusnfe.com.br";

export function nfseEnabled() {
  return Boolean(process.env.FOCUS_NFE_TOKEN);
}

function authHeader() {
  const token = process.env.FOCUS_NFE_TOKEN ?? "";
  return "Basic " + Buffer.from(`${token}:`).toString("base64");
}

export type NfseResult = {
  ok: boolean;
  skipped?: boolean;
  status?: "processando" | "autorizada" | "erro" | "cancelada";
  numero?: string;
  codigoVerificacao?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  mensagem?: string;
  error?: string;
};

// Focus NFe → status interno
const STATUS_MAP: Record<string, NfseResult["status"]> = {
  autorizado: "autorizada",
  processando_autorizacao: "processando",
  erro_autorizacao: "erro",
  cancelado: "cancelada",
};

function normaliza(d: Record<string, unknown>): NfseResult {
  const status = STATUS_MAP[String(d?.status)] ?? "processando";
  const url = (p: unknown) =>
    typeof p === "string" ? (p.startsWith("http") ? p : `${BASE}${p}`) : undefined;
  return {
    ok: true,
    status,
    numero: d?.numero ? String(d.numero) : undefined,
    codigoVerificacao: d?.codigo_verificacao ? String(d.codigo_verificacao) : undefined,
    pdfUrl: url(d?.url) ?? url(d?.caminho_pdf_nota_fiscal),
    xmlUrl: url(d?.caminho_xml_nota_fiscal),
    mensagem:
      (d?.mensagem as string) ??
      (d?.erros as { mensagem?: string }[] | undefined)?.[0]?.mensagem,
  };
}

/** Emite a NFS-e no Focus NFe. Inerte (skipped) sem FOCUS_NFE_TOKEN. */
export async function emitirNFSe(ref: string, payload: object): Promise<NfseResult> {
  if (!nfseEnabled()) return { ok: true, skipped: true };
  try {
    const res = await fetch(`${BASE}/v2/nfse?ref=${encodeURIComponent(ref)}`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error:
          (d?.mensagem as string) ??
          (d?.erros as { mensagem?: string }[] | undefined)?.[0]?.mensagem ??
          JSON.stringify(d),
      };
    }
    return normaliza(d);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Consulta o status de uma NFS-e pela referência. */
export async function consultarNFSe(ref: string): Promise<NfseResult> {
  if (!nfseEnabled()) return { ok: true, skipped: true };
  try {
    const res = await fetch(`${BASE}/v2/nfse/${encodeURIComponent(ref)}`, {
      headers: { Authorization: authHeader() },
    });
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: JSON.stringify(d) };
    return normaliza(d);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Cancela uma NFS-e. */
export async function cancelarNFSe(ref: string, justificativa: string): Promise<NfseResult> {
  if (!nfseEnabled()) return { ok: true, skipped: true };
  try {
    const res = await fetch(`${BASE}/v2/nfse/${encodeURIComponent(ref)}`, {
      method: "DELETE",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ justificativa }),
    });
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: JSON.stringify(d) };
    return { ok: true, status: "cancelada" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
