/**
 * TESTE EM PRODUÇÃO — emite 1 NFS-e real de R$ 1,00 (série 9, isolada) para
 * validar a integração ISSnet/DF. A nota deve ser CANCELADA depois.
 * Rodar: node --conditions=react-server --import tsx scripts/emitir-producao-teste.mts
 */
import { readFileSync } from "node:fs";
import { createDecipheriv, scryptSync } from "node:crypto";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { emitirNfseDF } = await import("../lib/nfse-df/index.ts");

function decryptSecret(b64: string): Buffer {
  const raw = process.env.NFSE_CERT_KEY!;
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : scryptSync(raw, "nfse-cert-salt", 32);
  const buf = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const rows = await fetch(
  `${SUPA}/rest/v1/nfse_certificado?tenant_id=eq.3aa56352-4ce8-4835-a85b-8ee0f0dd7c0e&select=pfx_cripto,senha_cripto`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
).then((r) => r.json());
const certificado = { pfx: decryptSecret(rows[0].pfx_cripto), senha: decryptSecret(rows[0].senha_cripto).toString("utf-8") };

const dados = {
  ambiente: 1 as const, // PRODUÇÃO (validade jurídica)
  serie: "9", // série isolada de teste
  numero: 1,
  dataCompetencia: "2026-06-09",
  municipioEmissor: "5300108",
  prestador: { cnpj: "50213173000166", inscricaoMunicipal: "0821025000156", opSimplesNacional: 3 as const, regimeEspecial: 0 as const },
  tomador: {
    documento: "24921465015256",
    nome: "BLUEFIT ACADEMIAS DE GINASTICA E PARTICIPACOES S.A.",
    email: "legalizacao@bluefitacademia.com.br",
    endereco: { codMunicipio: "5208707", cep: "74250100", logradouro: "RUA C143", numero: "S/N", bairro: "BRO JARDIM AMERICA" },
  },
  servico: { codTribNacional: "071301", codTribMunicipal: "710", nbs: "118032100", descricao: "TESTE DE INTEGRACAO - controle de pragas (nota a ser cancelada)", codMunicipioPrestacao: "5300108" },
  valores: { valorServico: 1.0, aliquotaIss: 5 },
  ibsCbs: { finNFSe: "0", cIndOp: "020201", indDest: "0", cst: "000", cClassTrib: "000001" },
};

console.log("⚠️  EMITINDO NOTA REAL EM PRODUÇÃO (R$ 1,00, série 9)...");
const e = await emitirNfseDF(dados, certificado);
console.log("\nok:", e.ok, "| status:", e.status);
console.log("erro:", e.error);
console.log("chave:", e.chaveAcesso);
console.log("idDps:", e.idDps);
console.log("\n--- retorno (1500) ---\n" + (e.xmlNfse ?? e.mensagem ?? "").slice(0, 1500));
