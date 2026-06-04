"use server";

import { revalidatePath } from "next/cache";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { pragaSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional"];

export async function salvarPraga(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "pragas",
    schema: pragaSchema,
    formData,
    roles: ROLES,
    path: "/pragas",
    id,
  });
}

export async function excluirPraga(id: string) {
  await deleteRecord("pragas", id, ROLES, "/pragas");
}

/** Adiciona uma praga na hora (a partir da ficha da OS). Idempotente. */
export async function adicionarPragaRapida(
  nome: string,
): Promise<{ ok: boolean; nome?: string; error?: string }> {
  const ctx = await requireRole(ROLES);
  const parsed = pragaSchema.safeParse({ nome, ativo: "true" });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("pragas")
    .insert({ tenant_id: ctx.tenantId, nome: parsed.data.nome, ativo: true });
  if (error) {
    if (error.code === "23505") return { ok: true, nome: parsed.data.nome }; // já existe
    return { ok: false, error: "Não foi possível adicionar." };
  }
  revalidatePath("/pragas");
  return { ok: true, nome: parsed.data.nome };
}
