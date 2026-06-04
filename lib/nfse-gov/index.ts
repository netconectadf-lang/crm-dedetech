import "server-only";

import { lerCertificado } from "./cert";
import { montarDps } from "./dps";
import { assinarDps } from "./sign";
import { baseUrls, gzipBase64, requestMtls, unBase64Gzip } from "./transport";
import type { Ambiente, Certificado, DadosEmissao, ResultadoNfse } from "./types";

export type { DadosEmissao, Certificado, ResultadoNfse } from "./types";
export { montarDps, montarIdDps } from "./dps";

/** Tenta extrair a chave de acesso (50 dígitos) do XML da NFS-e. */
function extrairChave(xmlNfse: string): string | undefined {
  // O Id do infNFSe traz a chave precedida do literal "NFS".
  const m = xmlNfse.match(/Id="NFS(\d{50})"/) ?? xmlNfse.match(/<chNFSe>(\d{50})<\/chNFSe>/);
  return m?.[1];
}

/** Lê o corpo JSON da resposta de forma tolerante. */
function parseBody(body: string): Record<string, unknown> {
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Emite uma NFS-e diretamente no Sistema Nacional NFS-e (gov.br).
 * Monta a DPS, assina com o A1, comprime e envia por mTLS ao Sefin Nacional.
 */
export async function emitirNfse(dados: DadosEmissao, certificado: Certificado): Promise<ResultadoNfse> {
  let idDps: string | undefined;
  try {
    const cert = lerCertificado(certificado);
    const { xml, id } = montarDps(dados, new Date());
    idDps = id;
    const assinado = assinarDps(xml, id, cert);
    const dpsXmlGZipB64 = gzipBase64(assinado);

    const { sefin } = baseUrls(dados.ambiente);
    const res = await requestMtls(`${sefin}/nfse`, cert, {
      method: "POST",
      body: JSON.stringify({ dpsXmlGZipB64 }),
    });

    const data = parseBody(res.body);

    if (res.status >= 200 && res.status < 300) {
      const nfseB64 = (data.nfseXmlGZipB64 ?? data.NfseXmlGZipB64) as string | undefined;
      const xmlNfse = nfseB64 ? unBase64Gzip(nfseB64) : undefined;
      const chaveAcesso =
        (data.chaveAcesso as string | undefined) ?? (xmlNfse ? extrairChave(xmlNfse) : undefined);
      return { ok: true, status: "autorizada", idDps, chaveAcesso, xmlNfse };
    }

    // Erros de negócio: a API devolve `erros: [{ codigo, descricao }]` ou `mensagem`.
    const erros = data.erros as { codigo?: string; descricao?: string }[] | undefined;
    const mensagem =
      erros?.map((e) => `${e.codigo ?? ""} ${e.descricao ?? ""}`.trim()).join("; ") ||
      (data.mensagem as string) ||
      `HTTP ${res.status}`;
    return { ok: false, status: "erro", idDps, error: mensagem, mensagem };
  } catch (e) {
    return { ok: false, status: "erro", idDps, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Consulta uma NFS-e pela chave de acesso. */
export async function consultarNfse(
  chaveAcesso: string,
  certificado: Certificado,
  ambiente: Ambiente,
): Promise<ResultadoNfse> {
  try {
    const cert = lerCertificado(certificado);
    const { sefin } = baseUrls(ambiente);
    const res = await requestMtls(`${sefin}/nfse/${encodeURIComponent(chaveAcesso)}`, cert);
    const data = parseBody(res.body);
    if (res.status >= 200 && res.status < 300) {
      const nfseB64 = (data.nfseXmlGZipB64 ?? data.NfseXmlGZipB64) as string | undefined;
      const xmlNfse = nfseB64 ? unBase64Gzip(nfseB64) : undefined;
      return { ok: true, status: "autorizada", chaveAcesso, xmlNfse };
    }
    return { ok: false, status: "erro", error: `HTTP ${res.status}`, mensagem: res.body.slice(0, 300) };
  } catch (e) {
    return { ok: false, status: "erro", error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Baixa o DANFSe (PDF) gerado pelo Ambiente Nacional.
 * Retorna o PDF em Buffer, ou null em caso de erro.
 */
export async function baixarDanfse(
  chaveAcesso: string,
  certificado: Certificado,
  ambiente: Ambiente,
): Promise<Buffer | null> {
  try {
    const cert = lerCertificado(certificado);
    const { adn } = baseUrls(ambiente);
    const res = await requestMtls(`${adn}/danfse/${encodeURIComponent(chaveAcesso)}`, cert, {
      headers: { Accept: "application/pdf" },
    });
    if (res.status >= 200 && res.status < 300) return Buffer.from(res.body, "binary");
    return null;
  } catch {
    return null;
  }
}

/**
 * Cancela uma NFS-e via evento de cancelamento (e101101).
 * TODO(fase-3): montar e assinar o XML de pedido de evento conforme
 * pedRegEvento_v1.01.xsd e enviar em POST /nfse/{chave}/eventos.
 * Estrutura pronta; o leiaute do evento será preenchido no teste com o certificado real.
 */
export async function cancelarNfse(): Promise<ResultadoNfse> {
  return {
    ok: false,
    error: "Cancelamento por evento ainda não implementado (fase 3, requer certificado para validar o leiaute).",
  };
}
