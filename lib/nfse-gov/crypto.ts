import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Criptografia simétrica (AES-256-GCM) para o certificado A1 e sua senha.
 * Mesmo com acesso ao banco, o .pfx é inútil sem a NFSE_CERT_KEY (só no servidor).
 *
 * Layout do blob (base64): [IV(12) | authTag(16) | ciphertext].
 */

function chave(): Buffer {
  const raw = process.env.NFSE_CERT_KEY;
  if (!raw) throw new Error("NFSE_CERT_KEY não configurada no ambiente.");
  // Aceita 64 hex (32 bytes) direto; caso contrário, deriva via scrypt.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return scryptSync(raw, "nfse-cert-salt", 32);
}

/** Criptografa um segredo (Buffer ou string) → string base64. */
export function encryptSecret(plain: Buffer | string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave(), iv);
  const input = typeof plain === "string" ? Buffer.from(plain, "utf-8") : plain;
  const enc = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/** Descriptografa um blob base64 → Buffer. */
export function decryptSecret(b64: string): Buffer {
  const buf = Buffer.from(b64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", chave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/** Descriptografa um blob base64 → string UTF-8. */
export function decryptText(b64: string): string {
  return decryptSecret(b64).toString("utf-8");
}
