import "server-only";

/**
 * fetch com TIMEOUT (e retry opcional) para chamadas a APIs externas.
 *
 * O `fetch` do Node não tem timeout padrão: uma API lenta (Asaas, Evolution,
 * prefeitura da NFS-e, Meta) segura a função serverless até o limite da Vercel.
 * Este wrapper aborta após `timeoutMs` e, opcionalmente, tenta de novo em
 * falhas transitórias (rede/5xx/timeout) com backoff. Use em TODA integração.
 *
 * Repare que ele NÃO engole o erro: lança em timeout/rede após esgotar as
 * tentativas — o chamador decide como reportar (ver lib/observability).
 */
export type FetchTimeoutOpts = RequestInit & {
  /** Tempo máximo por tentativa (ms). Padrão 12s. */
  timeoutMs?: number;
  /** Nº de novas tentativas em falha transitória. Padrão 0 (sem retry). */
  retries?: number;
  /** Base do backoff exponencial entre tentativas (ms). Padrão 300ms. */
  backoffMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithTimeout(
  url: string,
  opts: FetchTimeoutOpts = {},
): Promise<Response> {
  const { timeoutMs = 12_000, retries = 0, backoffMs = 300, ...init } = opts;

  let ultimoErro: unknown;
  for (let tentativa = 0; tentativa <= retries; tentativa++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      // 5xx é transitório — vale re-tentar se ainda há tentativas.
      if (res.status >= 500 && res.status < 600 && tentativa < retries) {
        ultimoErro = new Error(`HTTP ${res.status}`);
        await sleep(backoffMs * 2 ** tentativa);
        continue;
      }
      return res;
    } catch (err) {
      // AbortError (timeout) ou erro de rede — re-tenta se puder.
      ultimoErro = err;
      if (tentativa < retries) {
        await sleep(backoffMs * 2 ** tentativa);
        continue;
      }
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error(String(ultimoErro));
}
