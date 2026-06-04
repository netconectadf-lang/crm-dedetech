import "server-only";

import { SignedXml } from "xml-crypto";

import type { CertMaterial } from "./cert";

// Algoritmos do padrão XMLDSIG usado pelo ecossistema SPED/NFS-e.
const C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
const ENVELOPED = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
const RSA_SHA1 = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
const SHA1 = "http://www.w3.org/2000/09/xmldsig#sha1";

/**
 * Assina um documento com XMLDSIG (assinatura envelopada), referenciando o
 * elemento `elemento` pelo seu atributo Id. A <Signature> entra logo após ele.
 *
 * @param xml      XML não assinado
 * @param id       valor do atributo Id do elemento referenciado
 * @param cert     material do certificado A1 (chave + cert em PEM)
 * @param elemento nome local do elemento assinado (ex.: "infDPS", "infPedReg")
 */
export function assinarXml(
  xml: string,
  id: string,
  cert: CertMaterial,
  elemento = "infDPS",
): string {
  const xpath = `//*[local-name(.)='${elemento}']`;
  const sig = new SignedXml({
    privateKey: cert.privateKeyPem,
    publicCert: cert.certificatePem,
    signatureAlgorithm: RSA_SHA1,
    canonicalizationAlgorithm: C14N,
  });

  sig.addReference({ xpath, transforms: [ENVELOPED, C14N], digestAlgorithm: SHA1, uri: id });
  sig.computeSignature(xml, { location: { reference: xpath, action: "after" } });

  return sig.getSignedXml();
}

/** Assina a DPS (referencia infDPS). */
export function assinarDps(xml: string, id: string, cert: CertMaterial): string {
  return assinarXml(xml, id, cert, "infDPS");
}
