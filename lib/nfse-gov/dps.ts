import "server-only";

import type { DadosEmissao } from "./types";

const NS = "http://www.sped.fazenda.gov.br/nfse";

/** Escapa caracteres reservados de XML em conteúdo textual. */
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Mantém apenas dígitos. */
function digits(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Formata número como decimal com 2 casas, padrão TSDec15V2 (ex.: "1250.00"). */
function dec2(n: number): string {
  return n.toFixed(2);
}

/** Zera à esquerda até `len` posições. */
function pad(v: string | number, len: number): string {
  return String(v).replace(/\D/g, "").padStart(len, "0").slice(-len);
}

/**
 * Monta o identificador de 45 posições da DPS:
 * "DPS" + cLocEmi(7) + tpInsc(1) + InscFederal(14) + Série(5) + Núm(15)
 * tpInsc: 1 = CPF, 2 = CNPJ.
 */
export function montarIdDps(d: DadosEmissao): string {
  const cnpj = digits(d.prestador.cnpj);
  const tpInsc = cnpj.length === 14 ? "2" : "1";
  const inscFederal = pad(cnpj, 14);
  const serie = pad(d.serie, 5);
  const numero = pad(d.numero, 15);
  return `DPS${pad(d.municipioEmissor, 7)}${tpInsc}${inscFederal}${serie}${numero}`;
}

/**
 * Data/hora UTC no formato exigido (TSDateTimeUTC): AAAA-MM-DDThh:mm:ss-03:00.
 * O offset precisa ser hora cheia (minutos 00).
 */
function dhEmiNow(now: Date): string {
  // America/Sao_Paulo = -03:00 (sem horário de verão desde 2019).
  const off = -3;
  const local = new Date(now.getTime() + off * 3600_000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  const base =
    `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
    `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}`;
  const sign = off <= 0 ? "-" : "+";
  return `${base}${sign}${p(Math.abs(off))}:00`;
}

/** Bloco de documento (CNPJ ou CPF) do prestador/tomador. */
function docTag(documento: string): string {
  const doc = digits(documento);
  return doc.length === 14 ? `<CNPJ>${doc}</CNPJ>` : `<CPF>${pad(doc, 11)}</CPF>`;
}

/**
 * Monta o XML da DPS (não assinado) conforme o leiaute nacional v1.01.
 * Retorna o XML e o Id usado (que será referenciado na assinatura).
 */
export function montarDps(d: DadosEmissao, now: Date): { xml: string; id: string } {
  const id = montarIdDps(d);
  const v = d.valores;
  const tribISSQN = v.tribISSQN ?? 1;
  const retISSQN = v.retISSQN ?? 1;

  const prest = d.prestador;
  const toma = d.tomador;
  const serv = d.servico;

  // Endereço do tomador (opcional, mas recomendado).
  const endToma = toma.endereco
    ? `<end>` +
      `<endNac>` +
      `<cMun>${pad(toma.endereco.codMunicipio, 7)}</cMun>` +
      `<CEP>${pad(toma.endereco.cep, 8)}</CEP>` +
      `</endNac>` +
      `<xLgr>${esc(toma.endereco.logradouro)}</xLgr>` +
      `<nro>${esc(toma.endereco.numero)}</nro>` +
      (toma.endereco.complemento ? `<xCpl>${esc(toma.endereco.complemento)}</xCpl>` : "") +
      `<xBairro>${esc(toma.endereco.bairro)}</xBairro>` +
      `</end>`
    : "";

  const infDPS =
    `<infDPS Id="${id}">` +
    `<tpAmb>${d.ambiente}</tpAmb>` +
    `<dhEmi>${dhEmiNow(now)}</dhEmi>` +
    `<verAplic>${esc(d.versaoAplicativo ?? "dedetech-1.0")}</verAplic>` +
    // série sem zeros à esquerda no elemento (o pad de 5 posições é usado só no Id)
    `<serie>${String(parseInt(digits(d.serie) || "1", 10))}</serie>` +
    `<nDPS>${digits(String(d.numero))}</nDPS>` +
    `<dCompet>${d.dataCompetencia}</dCompet>` +
    `<tpEmit>1</tpEmit>` + // 1 = Prestador
    `<cLocEmi>${pad(d.municipioEmissor, 7)}</cLocEmi>` +
    // --- Prestador ---
    `<prest>` +
    docTag(prest.cnpj) +
    (prest.inscricaoMunicipal ? `<IM>${esc(prest.inscricaoMunicipal)}</IM>` : "") +
    `<regTrib>` +
    `<opSimpNac>${prest.opSimplesNacional}</opSimpNac>` +
    `<regEspTrib>${prest.regimeEspecial}</regEspTrib>` +
    `</regTrib>` +
    `</prest>` +
    // --- Tomador ---
    `<toma>` +
    docTag(toma.documento) +
    `<xNome>${esc(toma.nome)}</xNome>` +
    endToma +
    (toma.email ? `<email>${esc(toma.email)}</email>` : "") +
    `</toma>` +
    // --- Serviço ---
    `<serv>` +
    `<locPrest>` +
    `<cLocPrestacao>${pad(serv.codMunicipioPrestacao, 7)}</cLocPrestacao>` +
    `</locPrest>` +
    `<cServ>` +
    `<cTribNac>${esc(serv.codTribNacional)}</cTribNac>` +
    (serv.codTribMunicipal ? `<cTribMun>${esc(String(parseInt(digits(serv.codTribMunicipal) || "0", 10)))}</cTribMun>` : "") +
    `<xDescServ>${esc(serv.descricao)}</xDescServ>` +
    (serv.nbs ? `<cNBS>${esc(serv.nbs)}</cNBS>` : "") +
    `</cServ>` +
    `</serv>` +
    // --- Valores ---
    `<valores>` +
    `<vServPrest>` +
    `<vServ>${dec2(v.valorServico)}</vServ>` +
    `</vServPrest>` +
    `<trib>` +
    `<tribMun>` +
    `<tribISSQN>${tribISSQN}</tribISSQN>` +
    `<tpRetISSQN>${retISSQN}</tpRetISSQN>` +
    `<pAliq>${dec2(v.aliquotaIss)}</pAliq>` +
    `</tribMun>` +
    `<totTrib>` +
    `<indTotTrib>0</indTotTrib>` + // 0 = não informar valor estimado de tributos
    `</totTrib>` +
    `</trib>` +
    `</valores>` +
    // --- IBS/CBS (Reforma Tributária) — exigido pelo leiaute do DF/ISSnet ---
    (d.ibsCbs
      ? `<IBSCBS>` +
        `<finNFSe>${esc(d.ibsCbs.finNFSe)}</finNFSe>` +
        `<cIndOp>${esc(d.ibsCbs.cIndOp)}</cIndOp>` +
        `<indDest>${esc(d.ibsCbs.indDest)}</indDest>` +
        `<valores>` +
        `<trib>` +
        `<gIBSCBS>` +
        `<CST>${esc(d.ibsCbs.cst)}</CST>` +
        `<cClassTrib>${esc(d.ibsCbs.cClassTrib)}</cClassTrib>` +
        `</gIBSCBS>` +
        `</trib>` +
        `</valores>` +
        `</IBSCBS>`
      : "") +
    `</infDPS>`;

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<DPS xmlns="${NS}" versao="1.01">${infDPS}</DPS>`;

  return { xml, id };
}
