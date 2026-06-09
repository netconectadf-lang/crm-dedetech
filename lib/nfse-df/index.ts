import "server-only";

import { lerCertificado } from "@/lib/nfse-gov/cert";
import { requestMtls } from "@/lib/nfse-gov/transport";
import type { Certificado, DadosEmissao, ResultadoNfse, Ambiente } from "@/lib/nfse-gov/types";

import { montarLoteDpsSincrono } from "./lote";

export type { DadosEmissao, Certificado, ResultadoNfse } from "@/lib/nfse-gov/types";

const NS = "http://www.sped.fazenda.gov.br/nfse";
const VERSAO = "1.01";

/** Endpoint do webservice ISSnet/DF por ambiente. */
function endpoint(ambiente: Ambiente): string {
  return ambiente === 1
    ? "https://nfse.issnetonline.com.br/nfse.asmx"
    : "https://nfse.issnetonline.com.br/wsnfsenacional/homologacao/nfse.asmx";
}

/** Cabeçalho exigido pelo webservice (nfseCabecMsg). */
function cabecalho(): string {
  return `<cabecalho versao="${VERSAO}" xmlns="${NS}"><versaoDados>${VERSAO}</versaoDados></cabecalho>`;
}

/**
 * Monta o envelope SOAP 1.1 (document/literal wrapped). Apesar do WSDL declarar
 * os parâmetros como xsd:string, o webservice do ISSnet/DF exige o XML
 * **literal aninhado** (NÃO escapado) — confirmado em homologação.
 */
function envelopeSoap(metodo: string, dadosMsg: string): string {
  return (
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="${NS}">` +
    `<soap:Body>` +
    `<ws:${metodo}>` +
    `<ws:nfseCabecMsg>${cabecalho()}</ws:nfseCabecMsg>` +
    `<ws:nfseDadosMsg>${dadosMsg}</ws:nfseDadosMsg>` +
    `</ws:${metodo}>` +
    `</soap:Body>` +
    `</soap:Envelope>`
  );
}

/** SOAP Fault → mensagem legível. */
function extrairFault(soapResp: string): string | null {
  const m = soapResp.match(/<(?:\w+:)?faultstring>([\s\S]*?)<\/(?:\w+:)?faultstring>/i);
  return m ? m[1].trim() : null;
}

/** Mensagens de erro do retorno do padrão nacional (ListaMensagemRetorno). */
function extrairErros(xmlResp: string): string | null {
  const erros: string[] = [];
  const re = /<MsgRetorno>([\s\S]*?)<\/MsgRetorno>|<Mensagem>([\s\S]*?)<\/Mensagem>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xmlResp))) {
    const bloco = m[0];
    const cod = bloco.match(/<(?:Codigo|cMsg)>([\s\S]*?)<\/(?:Codigo|cMsg)>/i)?.[1] ?? "";
    const desc = bloco.match(/<(?:Mensagem|xMsg|Descricao|Correcao)>([\s\S]*?)<\/(?:Mensagem|xMsg|Descricao|Correcao)>/i)?.[1] ?? "";
    const txt = `${cod} ${desc}`.trim();
    if (txt) erros.push(txt);
  }
  return erros.length ? erros.join("; ") : null;
}

/** Extrai a chave de acesso (50 dígitos) da NFS-e retornada. */
function extrairChave(xml: string): string | undefined {
  const m = xml.match(/Id="NFS(\d{50})"/) ?? xml.match(/<chNFSe>(\d{50})<\/chNFSe>/);
  return m?.[1];
}

/** Faz a chamada SOAP por mTLS e devolve o XML de retorno (já desescapado). */
async function chamarSoap(
  metodo: string,
  dadosMsg: string,
  certificado: Certificado,
  ambiente: Ambiente,
): Promise<{ ok: boolean; xml: string; fault?: string; httpStatus: number }> {
  const envelope = envelopeSoap(metodo, dadosMsg);
  const res = await requestMtls(endpoint(ambiente), certificado, {
    method: "POST",
    body: envelope,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      Accept: "text/xml",
      SOAPAction: `${NS}/${metodo}`,
    },
  });
  const fault = extrairFault(res.body);
  if (fault) return { ok: false, xml: res.body, fault, httpStatus: res.status };
  // A resposta vem como XML literal (não escapado); usamos o corpo SOAP direto.
  return { ok: res.status >= 200 && res.status < 300, xml: res.body, httpStatus: res.status };
}

/**
 * Emite uma NFS-e pelo webservice do ISSnet/DF (padrão nacional, SOAP síncrono).
 * Reaproveita a montagem/assinatura da DPS do módulo nacional; a diferença é o
 * empacotamento em lote e o transporte SOAP.
 */
export async function emitirNfseDF(dados: DadosEmissao, certificado: Certificado): Promise<ResultadoNfse> {
  let idDps: string | undefined;
  try {
    const cert = lerCertificado(certificado);
    const { xml: loteXml, idDps: id } = montarLoteDpsSincrono(dados, cert, new Date());
    idDps = id;

    const r = await chamarSoap("RecepcionarLoteDpsSincrono", loteXml, certificado, dados.ambiente);
    if (r.fault) return { ok: false, status: "erro", idDps, error: `SOAP Fault: ${r.fault}` };

    const erros = extrairErros(r.xml);
    if (erros) return { ok: false, status: "erro", idDps, error: erros, mensagem: erros };

    if (!r.ok) return { ok: false, status: "erro", idDps, error: `HTTP ${r.httpStatus}`, mensagem: r.xml.slice(0, 400) };

    const chaveAcesso = extrairChave(r.xml);
    return { ok: true, status: "autorizada", idDps, chaveAcesso, xmlNfse: r.xml };
  } catch (e) {
    return { ok: false, status: "erro", idDps, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Valida o XML do lote no webservice (operação ValidarXml) SEM emitir.
 * Use na homologação para conferir a estrutura antes de emitir de verdade.
 */
export async function validarXmlDF(
  dados: DadosEmissao,
  certificado: Certificado,
): Promise<{ ok: boolean; mensagem: string; xml: string }> {
  const cert = lerCertificado(certificado);
  const { xml: loteXml } = montarLoteDpsSincrono(dados, cert, new Date());
  const r = await chamarSoap("ValidarXml", loteXml, certificado, dados.ambiente);
  if (r.fault) return { ok: false, mensagem: `SOAP Fault: ${r.fault}`, xml: r.xml };
  const erros = extrairErros(r.xml);
  return { ok: !erros, mensagem: erros ?? "XML válido", xml: r.xml };
}
