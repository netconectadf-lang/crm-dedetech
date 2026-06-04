import "server-only";

import forge from "node-forge";

import type { Certificado } from "./types";

export type CertMaterial = {
  /** Chave privada em PEM (PKCS#8/PKCS#1). */
  privateKeyPem: string;
  /** Certificado do titular em PEM. */
  certificatePem: string;
  /** Cadeia completa em PEM (titular + intermediários), para mTLS. */
  chainPem: string;
  /** CNPJ/CPF extraído do certificado (apenas dígitos), quando disponível. */
  titularDoc?: string;
  /** Data de validade (notAfter) do certificado. */
  validadeAte?: Date;
  /** Nome do titular (CN). */
  titularNome?: string;
};

/**
 * Lê um certificado A1 (.pfx/.p12) e extrai chave privada + cadeia em PEM.
 * Usado tanto na assinatura XMLDSIG quanto no mTLS de transporte.
 */
export function lerCertificado(cert: Certificado): CertMaterial {
  const der = forge.util.createBuffer(cert.pfx.toString("binary"));
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, cert.senha);

  // Chave privada
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag =
    keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0] ??
    p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0];
  if (!keyBag?.key) throw new Error("Certificado sem chave privada legível.");
  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);

  // Certificados (titular + cadeia)
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
  const certs = certBags.map((b) => b.cert).filter(Boolean) as forge.pki.Certificate[];
  if (!certs.length) throw new Error("Certificado sem cadeia de certificados.");

  // O titular é o cert cujo "subject" não é CA / que casa com a chave; usamos o primeiro
  // e ordenamos a cadeia depois. Para mTLS, o Node aceita titular + intermediários concatenados.
  const titular = certs[0];
  const certificatePem = forge.pki.certificateToPem(titular);
  const chainPem = certs.map((c) => forge.pki.certificateToPem(c)).join("\n");

  // Extrai o documento do titular (campos CN ou serialNumber costumam conter o CNPJ).
  let titularDoc: string | undefined;
  const cn = titular.subject.getField("CN")?.value as string | undefined;
  const match = cn?.match(/(\d{11,14})/);
  if (match) titularDoc = match[1];
  const titularNome = cn?.replace(/:\d{11,14}.*$/, "").trim();
  const validadeAte = titular.validity?.notAfter;

  return { privateKeyPem, certificatePem, chainPem, titularDoc, titularNome, validadeAte };
}
