import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ColaboradorContext = {
  userId: string;
  employeeId: string;
  tenantId: string;
  nome: string;
};

/**
 * Resolve o acesso do Portal do Colaborador: o usuário logado está vinculado
 * a um funcionário ativo (employees.user_id)? Usa o admin client porque o
 * colaborador NÃO é membro do tenant (a RLS não o deixa ver nada). null = sem acesso.
 */
export async function getColaboradorContext(): Promise<ColaboradorContext | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("employees")
    .select("id, tenant_id, nome")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();
  if (!data) return null;

  const row = data as { id: string; tenant_id: string; nome: string };
  return { userId: user.id, employeeId: row.id, tenantId: row.tenant_id, nome: row.nome };
}

export async function hasColaboradorAccess(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .maybeSingle();
  return !!data;
}
