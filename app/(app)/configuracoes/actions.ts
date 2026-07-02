"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

export type ConfigState = { error?: string; message?: string } | null;

const schema = z.object({
  razao_social: z.string().min(2, "Informe a razão social"),
  nome_fantasia: z.string().optional(),
  registro_vigilancia_sanitaria: z.string().optional(),
  cor_primaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use #RRGGBB)")
    .optional()
    .or(z.literal("")),
  preco_combustivel_litro: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).optional(),
  ),
  custo_hora_padrao: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).optional(),
  ),
  nfse_inscricao_municipal: z.string().optional(),
  nfse_codigo_municipio: z.string().optional(),
  nfse_item_lista_servico: z.string().optional(),
  nfse_aliquota_iss: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).max(100).optional(),
  ),
  nfse_iss_retido: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  email_remetente_nome: z.string().optional(),
  email_responder_para: z
    .string()
    .email("E-mail de resposta inválido")
    .optional()
    .or(z.literal("")),
  google_review_url: z
    .string()
    .url("Link inválido (cole a URL completa)")
    .optional()
    .or(z.literal("")),
});

export async function updateTenant(
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const ctx = await requireRole(["owner"]);

  const parsed = schema.safeParse({
    razao_social: formData.get("razao_social"),
    nome_fantasia: formData.get("nome_fantasia") || undefined,
    registro_vigilancia_sanitaria:
      formData.get("registro_vigilancia_sanitaria") || undefined,
    cor_primaria: formData.get("cor_primaria") || undefined,
    preco_combustivel_litro: formData.get("preco_combustivel_litro") || undefined,
    custo_hora_padrao: formData.get("custo_hora_padrao") || undefined,
    nfse_inscricao_municipal: formData.get("nfse_inscricao_municipal") || undefined,
    nfse_codigo_municipio: formData.get("nfse_codigo_municipio") || undefined,
    nfse_item_lista_servico: formData.get("nfse_item_lista_servico") || undefined,
    nfse_aliquota_iss: formData.get("nfse_aliquota_iss") || undefined,
    nfse_iss_retido: formData.get("nfse_iss_retido") ?? false,
    email_remetente_nome: formData.get("email_remetente_nome") || undefined,
    email_responder_para: formData.get("email_responder_para") || undefined,
    google_review_url: formData.get("google_review_url") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Upload opcional da logo: o admin escolhe o arquivo no form; sobe pro bucket
  // público "branding" e guarda a URL pública em logo_url. Só atualiza logo_url
  // quando um arquivo novo é enviado (salvar sem escolher arquivo não apaga a logo).
  let logoUrl: string | undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    if (!logoFile.type.startsWith("image/")) {
      return { error: "A logo precisa ser uma imagem (PNG, JPG, WEBP ou SVG)." };
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "A logo deve ter no máximo 2 MB." };
    }
    const ext = (logoFile.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${ctx.tenantId}/logo-${Date.now()}.${ext || "png"}`;
    const admin = createAdminClient();
    const { error: upErr } = await admin.storage
      .from("branding")
      .upload(path, logoFile, { contentType: logoFile.type, upsert: true });
    if (upErr) return { error: "Não foi possível enviar a logo." };
    logoUrl = admin.storage.from("branding").getPublicUrl(path).data.publicUrl;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      razao_social: parsed.data.razao_social,
      nome_fantasia: parsed.data.nome_fantasia ?? null,
      registro_vigilancia_sanitaria:
        parsed.data.registro_vigilancia_sanitaria ?? null,
      cor_primaria: parsed.data.cor_primaria || "#0F766E",
      preco_combustivel_litro: parsed.data.preco_combustivel_litro ?? null,
      custo_hora_padrao: parsed.data.custo_hora_padrao ?? null,
      nfse_inscricao_municipal: parsed.data.nfse_inscricao_municipal ?? null,
      nfse_codigo_municipio: parsed.data.nfse_codigo_municipio ?? null,
      nfse_item_lista_servico: parsed.data.nfse_item_lista_servico ?? null,
      nfse_aliquota_iss: parsed.data.nfse_aliquota_iss ?? null,
      nfse_iss_retido: parsed.data.nfse_iss_retido,
      email_remetente_nome: parsed.data.email_remetente_nome ?? null,
      email_responder_para: parsed.data.email_responder_para || null,
      google_review_url: parsed.data.google_review_url || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    } as never)
    .eq("id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { message: "Configurações salvas." };
}
