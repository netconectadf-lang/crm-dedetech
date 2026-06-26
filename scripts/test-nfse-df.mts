/**
 * Teste de homologação da integração NFS-e ISSnet/DF.
 * Lê o certificado A1 do banco, monta um lote de teste e chama ValidarXml +
 * RecepcionarLoteDpsSincrono no ambiente de HOMOLOGAÇÃO (sem validade jurídica).
 *
 * Rodar:  npx tsx scripts/test-nfse-df.mts
 */
import { readFileSync } from "node:fs";
import { createDecipheriv, scryptSync } from "node:crypto";

// carrega .env.local manualmente
for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { emitirNfseDF, validarXmlDF } = await import("../lib/nfse-df/index.ts");
const { montarLoteDpsSincrono } = await import("../lib/nfse-df/lote.ts");
const { lerCertificado } = await import("../lib/nfse-gov/cert.ts");

function decryptSecret(b64: string): Buffer {
  const raw = process.env.NFSE_CERT_KEY!;
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : scryptSync(raw, "nfse-cert-salt", 32);
  const buf = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
}

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TENANT = "3aa56352-4ce8-4835-a85b-8ee0f0dd7c0e";

const rows = await fetch(
  `${SUPA}/rest/v1/nfse_certificado?tenant_id=eq.${TENANT}&select=pfx_cripto,senha_cripto`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
).then((r) => r.json());

const certificado = { pfx: decryptSecret(rows[0].pfx_cripto), senha: decryptSecret(rows[0].senha_cripto).toString("utf-8") };
console.log("Certificado carregado:", certificado.pfx.length, "bytes");

const dados = {
  ambiente: 2 as const, // HOMOLOGAÇÃO
  serie: "1",
  numero: 900001,
  dataCompetencia: "2026-06-09",
  municipioEmissor: "5300108",
  prestador: { cnpj: "50213173000166", inscricaoMunicipal: "0821025000156", opSimplesNacional: 3 as const, regimeEspecial: 0 as const },
  tomador: { documento: "24921465015256", nome: "TOMADOR TESTE HOMOLOGACAO LTDA", email: "teste@exemplo.com" },
  servico: { codTribNacional: "071301", codTribMunicipal: "710", nbs: "118032100", descricao: "Servico de controle de pragas - TESTE HOMOLOGACAO", codMunicipioPrestacao: "5300108" },
  valores: { valorServico: 100.0, aliquotaIss: 5 },
  ibsCbs: { finNFSe: "0", cIndOp: "020201", indDest: "0", cst: "000", cClassTrib: "000001" },
};

// 1) Mostra o XML do lote montado (para inspeção)
const cert = lerCertificado(certificado);
const { xml } = montarLoteDpsSincrono(dados, cert, new Date());
const { writeFileSync } = await import("node:fs");
writeFileSync("/tmp/df/lote_gerado.xml", '<?xml version="1.0" encoding="UTF-8"?>\n' + xml);
console.log("Lote salvo em /tmp/df/lote_gerado.xml");
console.log("\n===== XML do lote (primeiros 900 chars) =====\n" + xml.slice(0, 900));

// 2) Emissão síncrona em HOMOLOGAÇÃO (sem validade jurídica)
console.log("\n===== RecepcionarLoteDpsSincrono (homologação) =====");
const e = await emitirNfseDF(dados, certificado);
console.log("ok:", e.ok, "| status:", e.status);
console.log("erro:", e.error);
console.log("chave:", e.chaveAcesso);
console.log("retorno XML (1200):", (e.xmlNfse ?? e.mensagem ?? "").slice(0, 1200));
void validarXmlDF;
