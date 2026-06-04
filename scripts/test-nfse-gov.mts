/**
 * Harness local do motor NFS-e Nacional (Fase 1).
 * Valida a MECÂNICA sem certificado real: monta DPS, valida contra o XSD oficial,
 * assina com um certificado de teste e verifica a assinatura.
 *
 * Rodar: node --conditions=react-server --import tsx scripts/test-nfse-gov.mts
 */
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DOMParser } from "@xmldom/xmldom";
import { SignedXml } from "xml-crypto";

import { montarDps } from "../lib/nfse-gov/dps";
import { montarPedidoCancelamento } from "../lib/nfse-gov/evento";
import { assinarDps, assinarXml } from "../lib/nfse-gov/sign";
import { lerCertificado } from "../lib/nfse-gov/cert";
import { gzipBase64, unBase64Gzip } from "../lib/nfse-gov/transport";
import type { DadosEmissao } from "../lib/nfse-gov/types";

const SCHEMA_DIR = "docs/nfse-gov/schemas/Schemas/1.01";

/**
 * Cria uma cópia sanitizada dos XSD num tmp dir: remove os ^/$ literais dos
 * patterns (defeito dos schemas do governo — em XSD ^$ são literais, não âncoras,
 * e o libxml/xmllint os rejeita; o validador do Ambiente Nacional os trata como âncora).
 */
function prepararSchemas(): string {
  const dir = mkdtempSync(join(tmpdir(), "xsd-"));
  for (const f of readdirSync(SCHEMA_DIR)) {
    const src = join(SCHEMA_DIR, f);
    if (!f.endsWith(".xsd")) {
      copyFileSync(src, join(dir, f));
      continue;
    }
    const fixed = readFileSync(src, "utf-8")
      .replace(/(<xs:pattern value=")\^/g, "$1")
      .replace(/\$("\s*\/>)/g, "$1");
    writeFileSync(join(dir, f), fixed);
  }
  return join(dir, "DPS_v1.01.xsd");
}
const XSD = prepararSchemas();

let falhas = 0;
const ok = (m: string) => console.log(`  ✓ ${m}`);
const fail = (m: string) => {
  console.log(`  ✗ ${m}`);
  falhas++;
};

// --- 1. Dados de exemplo (A7 Dedetizadora, Brasília/DF, dedetização) ---
const dados: DadosEmissao = {
  ambiente: 2,
  serie: "1",
  numero: 1,
  dataCompetencia: "2026-06-04",
  municipioEmissor: "5300108", // Brasília
  prestador: {
    cnpj: "12345678000199",
    inscricaoMunicipal: "12345",
    opSimplesNacional: 3,
    regimeEspecial: 0,
  },
  tomador: {
    documento: "11122233344",
    nome: "Cliente Exemplo Ltda",
    email: "cliente@exemplo.com.br",
    endereco: {
      codMunicipio: "5300108",
      cep: "70000000",
      logradouro: "SQN 110 Bloco A",
      numero: "101",
      bairro: "Asa Norte",
    },
  },
  servico: {
    codTribNacional: "070213", // dedetização (LC 116 item 7.13)
    descricao: "Servico de dedetizacao e controle de pragas urbanas em residencia.",
    codMunicipioPrestacao: "5300108",
  },
  valores: { valorServico: 1250, aliquotaIss: 5, tribISSQN: 1, retISSQN: 1 },
};

console.log("\n[1] Montagem da DPS");
const { xml, id } = montarDps(dados, new Date(Date.UTC(2026, 5, 4, 15, 0, 0)));
ok(`Id (${id.length} chars): ${id}`);
if (id.length === 45 && /^DPS\d{42}$/.test(id)) ok("Id no formato DPS[0-9]{42}");
else fail("Id fora do padrão de 45 posições");

// well-formed?
const doc = new DOMParser().parseFromString(xml, "text/xml");
if (doc.getElementsByTagName("infDPS").length === 1) ok("XML well-formed com <infDPS>");
else fail("XML mal formado");

// --- 2. Validação contra o XSD oficial (xmllint) ---
console.log("\n[2] Validação contra o XSD oficial");
const tmp = mkdtempSync(join(tmpdir(), "dps-"));
const xmlPath = join(tmp, "dps.xml");
writeFileSync(xmlPath, xml);
function validarXsd(arquivo: string, label: string, xsd = XSD) {
  try {
    execFileSync("xmllint", ["--noout", "--schema", xsd, arquivo], { stdio: "pipe" });
    ok(`${label} válido contra o XSD`);
  } catch (e: any) {
    const out = (e.stderr?.toString() ?? e.stdout?.toString() ?? String(e)).trim();
    fail(`${label} inválido:\n${out.split("\n").slice(0, 8).map((l: string) => "      " + l).join("\n")}`);
  }
}
validarXsd(xmlPath, "DPS não assinada");

// --- 3. Leitura do certificado de teste ---
console.log("\n[3] Certificado de teste (.pfx)");
const cert = lerCertificado({ pfx: readFileSync("docs/nfse-gov/test-cert.pfx"), senha: "teste123" });
if (cert.privateKeyPem.includes("PRIVATE KEY")) ok("chave privada extraída");
else fail("falha ao extrair chave privada");
if (cert.certificatePem.includes("CERTIFICATE")) ok("certificado extraído");
else fail("falha ao extrair certificado");
ok(`documento do titular: ${cert.titularDoc ?? "(não detectado)"}`);

// --- 4. Assinatura XMLDSIG ---
console.log("\n[4] Assinatura XMLDSIG");
const assinado = assinarDps(xml, id, cert);
if (assinado.includes("<Signature") || assinado.includes(":Signature")) ok("elemento <Signature> presente");
else fail("assinatura não inserida");

const signedPath = join(tmp, "dps-signed.xml");
writeFileSync(signedPath, assinado);
validarXsd(signedPath, "DPS ASSINADA");

// verificação criptográfica da assinatura
try {
  const verify = new SignedXml({ publicCert: cert.certificatePem });
  const sigEl = new DOMParser()
    .parseFromString(assinado, "text/xml")
    .getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature")[0];
  verify.loadSignature(sigEl as any);
  const valido = verify.checkSignature(assinado);
  if (valido) ok("assinatura criptograficamente VÁLIDA");
  else fail("assinatura inválida");
} catch (e) {
  fail("erro ao verificar assinatura: " + (e instanceof Error ? e.message : String(e)));
}

// --- 5. GZip + Base64 round-trip ---
console.log("\n[5] GZip + Base64 (transporte)");
const b64 = gzipBase64(assinado);
ok(`comprimido: ${assinado.length} → ${b64.length} bytes (base64)`);
if (unBase64Gzip(b64) === assinado) ok("round-trip íntegro (descompacta idêntico)");
else fail("round-trip corrompido");

// --- 6. Evento de cancelamento (e101101) ---
console.log("\n[6] Evento de cancelamento (e101101)");
const evXsd = XSD.replace("DPS_v1.01.xsd", "pedRegEvento_v1.01.xsd");
const canc = montarPedidoCancelamento(
  {
    ambiente: 2,
    chaveAcesso: "5".repeat(50),
    cnpjAutor: "50213173000166",
    motivo: 9,
    justificativa: "Cancelamento de teste para validacao do schema XSD",
  },
  new Date(Date.UTC(2026, 5, 4, 15, 0, 0)),
);
if (/^PRE\d{56}$/.test(canc.id)) ok(`Id do evento: ${canc.id}`);
else fail(`Id do evento fora do padrão (esperado PRE+56 díg): ${canc.id}`);
const evPath = join(tmp, "evento.xml");
writeFileSync(evPath, canc.xml);
validarXsd(evPath, "pedRegEvento não assinado", evXsd);
const evAssinado = assinarXml(canc.xml, canc.id, cert, "infPedReg");
writeFileSync(join(tmp, "evento-signed.xml"), evAssinado);
validarXsd(join(tmp, "evento-signed.xml"), "pedRegEvento ASSINADO", evXsd);

console.log(`\n${falhas === 0 ? "✅ TODOS OS TESTES PASSARAM" : `❌ ${falhas} FALHA(S)`}\n`);
process.exit(falhas === 0 ? 0 : 1);
