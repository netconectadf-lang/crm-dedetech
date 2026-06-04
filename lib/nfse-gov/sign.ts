import "server-only";

import { SignedXml } from "xml-crypto";

import type { CertMaterial } from "./cert";

// Algoritmos do padrão XMLDSIG usado pelo ecossistema SPED/NFS-e.
const C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
const ENVELOPED = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
const RSA_SHA1 = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
const SHA1 = "http://www.w3.org/2000/09/xmldsig#sha1";

/**
 * Assina a DPS com XMLDSIG (assinatura envelopada).
 * A <Signature> é inserida como irmã de <infDPS>, dentro de <DPS>,
 * referenciando o atributo Id de infDPS (URI="#<Id>").
 *
 * @param xml  XML da DPS não assinado
 * @param id   valor do atributo Id de infDPS
 * @param cert material do certificado A1 (chave + cert em PEM)
 */
export function assinarDps(xml: string, id: string, cert: CertMaterial): string {
  const sig = new SignedXml({
    privateKey: cert.privateKeyPem,
    publicCert: cert.certificatePem,
    signatureAlgorithm: RSA_SHA1,
    canonicalizationAlgorithm: C14N,
  });

  sig.addReference({
    xpath: "//*[local-name(.)='infDPS']",
    transforms: [ENVELOPED, C14N],
    digestAlgorithm: SHA1,
    uri: id,
  });

  sig.computeSignature(xml, {
    // a assinatura vai logo após infDPS (irmã), conforme o XSD (DPS > infDPS, Signature)
    location: { reference: "//*[local-name(.)='infDPS']", action: "after" },
  });

  return sig.getSignedXml();
}
