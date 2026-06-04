import "server-only";

const NS = "http://www.sped.fazenda.gov.br/nfse";
const TP_EVENTO_CANCELAMENTO = "101101";

/** Código de justificativa de cancelamento. */
export type MotivoCancelamento = 1 | 2 | 9; // 1=Erro na emissão; 2=Serviço não prestado; 9=Outros

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function digits(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Data/hora UTC no formato TSDateTimeUTC (AAAA-MM-DDThh:mm:ss-03:00). */
function dhEvento(now: Date): string {
  const off = -3;
  const local = new Date(now.getTime() + off * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
    `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}-03:00`
  );
}

export type DadosCancelamento = {
  ambiente: 1 | 2;
  /** Chave de acesso da NFS-e a cancelar (50 dígitos). */
  chaveAcesso: string;
  /** CNPJ do autor do pedido (o prestador). */
  cnpjAutor: string;
  motivo: MotivoCancelamento;
  /** Descrição do motivo (15 a 255 caracteres). */
  justificativa: string;
};

/**
 * Monta o XML do pedido de registro de evento de CANCELAMENTO (e101101).
 * Id = "PRE" + chave de acesso (50) + tipo do evento (6) = PRE + 56 dígitos.
 */
export function montarPedidoCancelamento(d: DadosCancelamento, now: Date): { xml: string; id: string } {
  const chave = digits(d.chaveAcesso).padStart(50, "0").slice(-50);
  const id = `PRE${chave}${TP_EVENTO_CANCELAMENTO}`;

  const infPedReg =
    `<infPedReg Id="${id}">` +
    `<tpAmb>${d.ambiente}</tpAmb>` +
    `<verAplic>dedetech-1.0</verAplic>` +
    `<dhEvento>${dhEvento(now)}</dhEvento>` +
    `<CNPJAutor>${digits(d.cnpjAutor)}</CNPJAutor>` +
    `<chNFSe>${chave}</chNFSe>` +
    `<e101101>` +
    `<xDesc>Cancelamento de NFS-e</xDesc>` +
    `<cMotivo>${d.motivo}</cMotivo>` +
    `<xMotivo>${esc(d.justificativa)}</xMotivo>` +
    `</e101101>` +
    `</infPedReg>`;

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<pedRegEvento xmlns="${NS}" versao="1.01">${infPedReg}</pedRegEvento>`;

  return { xml, id };
}
