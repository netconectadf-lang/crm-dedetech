"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import { leadSchema } from "@/lib/validators/funil";
import type { AppRole } from "@/lib/types";
import type { DealStage, LossReason } from "@/lib/funil";

const ROLES: AppRole[] = ["owner", "comercial"];

export async function criarLead(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, owner_id: ctx.userId } as never);
  if (error) return { error: "Não foi possível criar o lead." };
  revalidatePath("/funil");
  return { message: "Lead criado." };
}

export async function atualizarDeal(
  id: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update(parsed.data as never)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/funil");
  return { message: "Salvo." };
}

/** Move o deal para outro estágio. Ao perder, registra o motivo. */
export async function moverDeal(
  dealId: string,
  stage: DealStage,
  motivo?: LossReason,
) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("deals")
    .update({
      stage,
      motivo_perda: stage === "perdido" ? (motivo ?? "outro") : null,
    })
    .eq("id", dealId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/funil");
}

export async function excluirDeal(id: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase.from("deals").delete().eq("id", id).eq("tenant_id", ctx.tenantId);
  revalidatePath("/funil");
}
