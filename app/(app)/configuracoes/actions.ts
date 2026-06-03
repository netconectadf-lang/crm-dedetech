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
    })
    .eq("id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { message: "Configurações salvas." };
}
