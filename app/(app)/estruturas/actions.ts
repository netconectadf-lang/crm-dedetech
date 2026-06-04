"use server";

import { revalidatePath } from "next/cache";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { estruturaSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional"];

export async function salvarEstrutura(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "estruturas",
    schema: estruturaSchema,
    formData,
    roles: ROLES,
    path: "/estruturas",
    id,
  });
}

export async function excluirEstrutura(id: string) {
  await deleteRecord("estruturas", id, ROLES, "/estruturas");
}

/** Adiciona uma estrutura na hora (a partir da ficha da OS). Idempotente. */
export async function adicionarEstruturaRapida(
  nome: string,
): Promise<{ ok: boolean; nome?: string; error?: string }> {
  const ctx = await requireRole(ROLES);
  const parsed = estruturaSchema.safeParse({ nome, ativo: "true" });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("estruturas")
    .insert({ tenant_id: ctx.tenantId, nome: parsed.data.nome, ativo: true });
  if (error) {
    if (error.code === "23505") return { ok: true, nome: parsed.data.nome }; // já existe
    return { ok: false, error: "Não foi possível adicionar." };
  }
  revalidatePath("/estruturas");
  return { ok: true, nome: parsed.data.nome };
}
