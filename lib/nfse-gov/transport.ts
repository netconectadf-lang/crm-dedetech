import "server-only";

import { gzipSync, gunzipSync } from "node:zlib";
import https from "node:https";

import type { CertMaterial } from "./cert";

/** Comprime (GZip) e codifica (Base64) o XML para envio no corpo JSON. */
export function gzipBase64(xml: string): string {
  return gzipSync(Buffer.from(xml, "utf-8")).toString("base64");
}

/** Inverte: Base64 → GZip → XML (para ler a NFS-e devolvida). */
export function unBase64Gzip(b64: string): string {
  return gunzipSync(Buffer.from(b64, "base64")).toString("utf-8");
}

/** URLs base por ambiente (1 = produção, 2 = produção restrita/homologação). */
export function baseUrls(ambiente: 1 | 2) {
  return ambiente === 1
    ? {
        sefin: "https://sefin.nfse.gov.br/SefinNacional",
        adn: "https://adn.nfse.gov.br",
      }
    : {
        sefin: "https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional",
        adn: "https://adn.producaorestrita.nfse.gov.br",
      };
}

export type HttpResposta = { status: number; body: string; raw: Buffer };

/**
 * Requisição HTTPS com autenticação mútua (mTLS) usando o certificado A1.
 * O Ambiente Nacional exige que o cliente apresente o certificado ICP-Brasil.
 */
export function requestMtls(
  url: string,
  cert: CertMaterial,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {},
): Promise<HttpResposta> {
  const u = new URL(url);
  const payload = options.body;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: options.method ?? "GET",
        // material do certificado para o handshake mTLS
        key: cert.privateKeyPem,
        cert: cert.chainPem,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload).toString() } : {}),
          ...options.headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          resolve({ status: res.statusCode ?? 0, body: raw.toString("utf-8"), raw });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}
