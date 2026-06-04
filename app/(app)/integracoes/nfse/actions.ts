"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { salvarCertificado, removerCertificado } from "@/lib/nfse-gov/store";
import type { SaveState } from "@/lib/crud-helpers";

/** Faz upload e valida o certificado digital A1 (.pfx) da empresa. */
export async function salvarCertificadoNfse(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner"]);

  const arquivo = formData.get("pfx");
  const senha = String(formData.get("senha") ?? "");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione o arquivo do certificado (.pfx ou .p12)." };
  }
  if (arquivo.size > 200 * 1024) {
    return { error: "Arquivo muito grande para um certificado (máx. 200 KB)." };
  }
  if (!senha) return { error: "Informe a senha do certificado." };

  const pfx = Buffer.from(await arquivo.arrayBuffer());
  try {
    const { titularDoc, validade } = await salvarCertificado(ctx.tenantId, pfx, senha);
    revalidatePath("/integracoes/nfse");
    const venc = validade ? ` Válido até ${validade.toLocaleDateString("pt-BR")}.` : "";
    return { message: `Certificado salvo${titularDoc ? ` (titular ${titularDoc})` : ""}.${venc}` };
  } catch {
    return { error: "Não foi possível ler o certificado. Confira o arquivo e a senha." };
  }
}

/** Remove o certificado da empresa. */
export async function removerCertificadoNfse(): Promise<void> {
  const ctx = await requireRole(["owner"]);
  await removerCertificado(ctx.tenantId);
  revalidatePath("/integracoes/nfse");
}

const configSchema = z.object({
  cnpj: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  codigoMunicipio: z.string().regex(/^\d{7}$/, "Código IBGE deve ter 7 dígitos").optional().or(z.literal("")),
  codTribNacional: z.string().regex(/^\d{6}$/, "Código de tributação nacional deve ter 6 dígitos").optional().or(z.literal("")),
  aliquotaIss: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).max(100).optional(),
  ),
  issRetido: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  opSimplesNacional: z.preprocess((v) => Number(v), z.union([z.literal(1), z.literal(2), z.literal(3)])),
  regimeEspecial: z.preprocess((v) => Number(v), z.number().int().min(0).max(9)),
  ambiente: z.preprocess((v) => Number(v), z.union([z.literal(1), z.literal(2)])),
  serie: z.string().regex(/^\d{1,5}$/, "Série deve ter de 1 a 5 dígitos").default("1"),
});

/** Salva os parâmetros fiscais do emissor NFS-e Nacional. */
export async function salvarConfigNfse(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const ctx = await requireRole(["owner"]);

  const parsed = configSchema.safeParse({
    cnpj: formData.get("cnpj") || undefined,
    inscricaoMunicipal: formData.get("inscricaoMunicipal") || undefined,
    codigoMunicipio: formData.get("codigoMunicipio") || undefined,
    codTribNacional: formData.get("codTribNacional") || undefined,
    aliquotaIss: formData.get("aliquotaIss") || undefined,
    issRetido: formData.get("issRetido") ?? false,
    opSimplesNacional: formData.get("opSimplesNacional") ?? 3,
    regimeEspecial: formData.get("regimeEspecial") ?? 0,
    ambiente: formData.get("ambiente") ?? 2,
    serie: formData.get("serie") || "1",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      cnpj: d.cnpj || null,
      nfse_inscricao_municipal: d.inscricaoMunicipal || null,
      nfse_codigo_municipio: d.codigoMunicipio || null,
      nfse_cod_trib_nacional: d.codTribNacional || null,
      nfse_aliquota_iss: d.aliquotaIss ?? null,
      nfse_iss_retido: d.issRetido,
      nfse_op_simples_nacional: d.opSimplesNacional,
      nfse_reg_especial: d.regimeEspecial,
      nfse_ambiente: d.ambiente,
      nfse_serie: d.serie,
    })
    .eq("id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar os dados fiscais." };

  revalidatePath("/integracoes/nfse");
  return { message: "Dados fiscais salvos." };
}
