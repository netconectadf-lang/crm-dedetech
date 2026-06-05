"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
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
    } as never)
    .eq("id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { message: "Configurações salvas." };
}
