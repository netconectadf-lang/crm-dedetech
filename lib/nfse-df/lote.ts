import "server-only";

import { montarDps } from "@/lib/nfse-gov/dps";
import { assinarDps, assinarXml } from "@/lib/nfse-gov/sign";
import type { CertMaterial } from "@/lib/nfse-gov/cert";
import type { DadosEmissao } from "@/lib/nfse-gov/types";

const NS = "http://www.sped.fazenda.gov.br/nfse";

/** Remove o prolog `<?xml ...?>` (não afeta a assinatura, que é sobre o elemento). */
function semProlog(xml: string): string {
  return xml.replace(/^\s*<\?xml[^>]*\?>\s*/i, "");
}

function digits(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Monta o XML `EnviarLoteDpsSincronoEnvio` do padrão nacional processado pelo
 * ISSnet/DF: uma DPS assinada dentro de um LoteDps, e o lote também assinado.
 *
 * Reaproveita a montagem e a assinatura da DPS do módulo nacional (mesmo
 * leiaute v1.01, mesmo namespace). A diferença do DF é só o empacotamento em
 * lote + transporte SOAP (ver ./index.ts).
 */
export function montarLoteDpsSincrono(
  dados: DadosEmissao,
  cert: CertMaterial,
  now: Date,
): { xml: string; idDps: string; idLote: string } {
  // 1. DPS assinada (referencia infDPS) — idêntica à do emissor nacional.
  const { xml: dpsXml, id: idDps } = montarDps(dados, now);
  const dpsAssinada = semProlog(assinarDps(dpsXml, idDps, cert));

  // 2. Monta o LoteDps com a DPS assinada embutida (não alterar a DPS depois
  //    de assinada — apenas remover o prolog é seguro).
  const idLote = `Lote${digits(String(dados.numero)) || "1"}`;
  const cnpj = digits(dados.prestador.cnpj);
  const docTag = cnpj.length === 14 ? `<CNPJ>${cnpj}</CNPJ>` : `<CPF>${cnpj.padStart(11, "0")}</CPF>`;
  const im = dados.prestador.inscricaoMunicipal
    ? `<IM>${dados.prestador.inscricaoMunicipal.replace(/[<>&]/g, "")}</IM>`
    : "";

  const loteDps =
    `<LoteDps Id="${idLote}" versao="1.01">` +
    `<NumeroLote>${digits(String(dados.numero)) || "1"}</NumeroLote>` +
    `<Prestador>${docTag}${im}</Prestador>` +
    `<QuantidadeDps>1</QuantidadeDps>` +
    `<ListaDps>${dpsAssinada}</ListaDps>` +
    `</LoteDps>`;

  // 3. Envelope do envio (sem assinatura ainda) e assinatura do lote.
  const envioSemAssinatura =
    `<EnviarLoteDpsSincronoEnvio xmlns="${NS}">${loteDps}</EnviarLoteDpsSincronoEnvio>`;

  // Assina o LoteDps (referencia o atributo Id do LoteDps); a <Signature>
  // entra logo após o LoteDps, dentro do EnviarLoteDpsSincronoEnvio.
  const xml = semProlog(assinarXml(envioSemAssinatura, idLote, cert, "LoteDps"));

  return { xml, idDps, idLote };
}
