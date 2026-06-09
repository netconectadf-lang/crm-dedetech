import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { AppRole } from "@/lib/types";

/** Client sem tipo de tabela — este helper é genérico por nome de tabela. */
async function untypedClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export type SaveState = { error?: string; message?: string } | null;

type SaveArgs = {
  table: string;
  schema: z.ZodTypeAny;
  formData: FormData;
  roles: AppRole[];
  path: string;
  /** id presente = update; ausente = insert. */
  id?: string | null;
  /** ajustes extras no payload já validado (ex.: campos derivados). */
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** se true, grava `created_by` = usuário atual no INSERT (tabela precisa ter a coluna). */
  setCreatedBy?: boolean;
};

/**
 * Cria ou atualiza um registro com escopo de tenant + validação Zod.
 * A RLS garante o isolamento; aqui setamos tenant_id no insert por garantia.
 */
export async function saveRecord({
  table,
  schema,
  formData,
  roles,
  path,
  id,
  transform,
  setCreatedBy,
}: SaveArgs): Promise<SaveState> {
  const ctx = await requireRole(roles);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let payload: Record<string, unknown> = {
    ...(parsed.data as Record<string, unknown>),
  };
  if (transform) payload = transform(payload);

  const supabase = await untypedClient();

  if (id) {
    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
    if (error) return { error: "Não foi possível salvar as alterações." };
  } else {
    const { error } = await supabase
      .from(table)
      .insert({
        ...payload,
        tenant_id: ctx.tenantId,
        ...(setCreatedBy ? { created_by: ctx.userId } : {}),
      });
    if (error) return { error: "Não foi possível criar o registro." };
  }

  revalidatePath(path);
  return { message: "Salvo com sucesso." };
}

/** Exclui um registro com escopo de tenant. */
export async function deleteRecord(
  table: string,
  id: string,
  roles: AppRole[],
  path: string,
): Promise<void> {
  const ctx = await requireRole(roles);
  const supabase = await untypedClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) {
    if ((error as { code?: string }).code === "23503") {
      throw new Error(
        "Não é possível excluir: há registros vinculados (ex.: OS, contratos ou cobranças).",
      );
    }
    throw new Error("Não foi possível excluir o registro. Tente novamente.");
  }
  revalidatePath(path);
}
