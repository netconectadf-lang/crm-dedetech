"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { lgpdRequestSchema } from "@/lib/validators/auth";

export type LgpdState = { error?: string; message?: string } | null;

export async function createLgpdRequest(
  _prev: LgpdState,
  formData: FormData,
): Promise<LgpdState> {
  const ctx = await requireRole(["owner", "financeiro"]);

  const parsed = lgpdRequestSchema.safeParse({
    tipo: formData.get("tipo"),
    titular_email: formData.get("titular_email"),
    detalhe: formData.get("detalhe") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lgpd_requests").insert({
    tenant_id: ctx.tenantId,
    ...parsed.data,
  });
  if (error) return { error: "Não foi possível registrar a solicitação." };

  revalidatePath("/lgpd");
  return { message: "Solicitação registrada." };
}

export async function resolveLgpdRequest(id: string, done: boolean) {
  const ctx = await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();
  await supabase
    .from("lgpd_requests")
    .update({ status: done ? "done" : "in_progress" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/lgpd");
}
