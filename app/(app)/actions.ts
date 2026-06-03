"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** Troca a empresa ativa do usuário e re-emite o JWT com o novo tenant_id. */
export async function switchTenant(tenantId: string) {
  const ctx = await requireAuth();

  const supabase = await createClient();
  // Só permite trocar para uma empresa onde o usuário é membro (RLS reforça).
  const { data: membership } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", ctx.userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!membership) redirect("/dashboard");

  await supabase
    .from("profiles")
    .update({ active_tenant_id: tenantId })
    .eq("id", ctx.userId);
  await supabase.auth.refreshSession();

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
