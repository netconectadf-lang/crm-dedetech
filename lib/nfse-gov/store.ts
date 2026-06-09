import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { lerCertificado } from "./cert";
import { encryptSecret, decryptSecret, decryptText } from "./crypto";
import type { Ambiente, Certificado, OpSimplesNacional, RegimeEspecial } from "./types";

/** Parâmetros fiscais da empresa (tabela tenants). */
export type ConfigFiscal = {
  cnpj: string | null;
  inscricaoMunicipal: string | null;
  codigoMunicipio: string | null;
  codTribNacional: string | null;
  codTribMunicipal: string | null;
  aliquotaIss: number | null;
  issRetido: boolean;
  opSimplesNacional: OpSimplesNacional;
  regimeEspecial: RegimeEspecial;
  ambiente: Ambiente;
  serie: string;
};

/** Resumo do certificado para exibir na UI (NUNCA inclui o .pfx). */
export type CertResumo = {
  titularDoc: string | null;
  validade: string | null;
  atualizadoEm: string;
};

/**
 * Valida e salva o certificado A1 da empresa (criptografado).
 * Roda com service role: a tabela nfse_certificado é bloqueada para usuários.
 */
export async function salvarCertificado(
  tenantId: string,
  pfx: Buffer,
  senha: string,
): Promise<{ titularDoc?: string; validade?: Date }> {
  // valida abrindo o pfx (lança se a senha estiver errada ou o arquivo for inválido)
  const mat = lerCertificado({ pfx, senha });

  const db = createAdminClient();
  const { error } = await db.from("nfse_certificado").upsert(
    {
      tenant_id: tenantId,
      pfx_cripto: encryptSecret(pfx),
      senha_cripto: encryptSecret(senha),
      titular_doc: mat.titularDoc ?? null,
      validade: mat.validadeAte ? mat.validadeAte.toISOString().slice(0, 10) : null,
    },
    { onConflict: "tenant_id" },
  );
  if (error) throw new Error("Não foi possível salvar o certificado.");
  return { titularDoc: mat.titularDoc, validade: mat.validadeAte };
}

/** Remove o certificado da empresa. */
export async function removerCertificado(tenantId: string): Promise<void> {
  const db = createAdminClient();
  await db.from("nfse_certificado").delete().eq("tenant_id", tenantId);
}

/** Carrega e descriptografa o certificado para uso na emissão. null se não houver. */
export async function carregarCertificado(tenantId: string): Promise<Certificado | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("nfse_certificado")
    .select("pfx_cripto, senha_cripto")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const row = data as { pfx_cripto: string; senha_cripto: string } | null;
  if (!row) return null;
  return { pfx: decryptSecret(row.pfx_cripto), senha: decryptText(row.senha_cripto) };
}

/** Resumo do certificado para a UI (sem o material sensível). */
export async function resumoCertificado(tenantId: string): Promise<CertResumo | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("nfse_certificado")
    .select("titular_doc, validade, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const row = data as { titular_doc: string | null; validade: string | null; updated_at: string } | null;
  if (!row) return null;
  return { titularDoc: row.titular_doc, validade: row.validade, atualizadoEm: row.updated_at };
}

/** Carrega os parâmetros fiscais da empresa. */
export async function carregarConfigFiscal(tenantId: string): Promise<ConfigFiscal | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("tenants")
    .select(
      "cnpj, nfse_inscricao_municipal, nfse_codigo_municipio, nfse_cod_trib_nacional, " +
        "nfse_cod_trib_municipal, nfse_aliquota_iss, nfse_iss_retido, nfse_op_simples_nacional, " +
        "nfse_reg_especial, nfse_ambiente, nfse_serie",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (!data) return null;
  const t = data as unknown as Record<string, unknown>;
  return {
    cnpj: (t.cnpj as string) ?? null,
    inscricaoMunicipal: (t.nfse_inscricao_municipal as string) ?? null,
    codigoMunicipio: (t.nfse_codigo_municipio as string) ?? null,
    codTribNacional: (t.nfse_cod_trib_nacional as string) ?? null,
    codTribMunicipal: (t.nfse_cod_trib_municipal as string) ?? null,
    aliquotaIss: (t.nfse_aliquota_iss as number) ?? null,
    issRetido: Boolean(t.nfse_iss_retido),
    opSimplesNacional: ((t.nfse_op_simples_nacional as number) ?? 3) as OpSimplesNacional,
    regimeEspecial: ((t.nfse_reg_especial as number) ?? 0) as RegimeEspecial,
    ambiente: ((t.nfse_ambiente as number) ?? 2) as Ambiente,
    serie: (t.nfse_serie as string) ?? "1",
  };
}
