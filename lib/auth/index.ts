import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, AuthContext } from "@/lib/types";

/**
 * Resolve o contexto autenticado no servidor: usuário + empresa ativa + papel.
 * Retorna null se não há sessão. O papel/empresa vêm do banco (fonte da
 * verdade); a RLS usa os mesmos dados via claims do JWT.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, active_tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const tenantId =
    (profile as { active_tenant_id: string | null } | null)?.active_tenant_id ??
    null;

  let role: AppRole | null = null;
  if (tenantId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    role = (membership as { role: AppRole } | null)?.role ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName:
      (profile as { full_name: string | null } | null)?.full_name ?? null,
    tenantId,
    role,
  };
}

/** Exige sessão. Redireciona para /login se não houver. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Exige sessão + empresa ativa. Se o usuário está logado mas ainda não tem
 * empresa (ex.: signup interrompido), manda criar uma.
 */
export async function requireTenant(): Promise<
  AuthContext & { tenantId: string; role: AppRole }
> {
  const ctx = await requireAuth();
  if (!ctx.tenantId || !ctx.role) {
    // Pode ser um usuário do Portal do Cliente (sem membership de empresa).
    const { hasPortalAccess } = await import("@/lib/portal");
    if (await hasPortalAccess(ctx.userId)) redirect("/portal");
    // ...ou um colaborador (funcionário com login, sem membership).
    const { hasColaboradorAccess } = await import("@/lib/colaborador");
    if (await hasColaboradorAccess(ctx.userId)) redirect("/colaborador");
    redirect("/signup");
  }
  return ctx as AuthContext & { tenantId: string; role: AppRole };
}

/**
 * Exige que o usuário tenha um dos papéis informados na empresa ativa.
 * Defesa em profundidade — a RLS continua sendo a rede de segurança final.
 */
export async function requireRole(
  roles: AppRole[],
): Promise<AuthContext & { tenantId: string; role: AppRole }> {
  const ctx = await requireTenant();
  if (!roles.includes(ctx.role)) redirect("/dashboard");
  return ctx;
}

/** Helper booleano para render condicional na UI. */
export function hasRole(role: AppRole | null, roles: AppRole[]): boolean {
  return role != null && roles.includes(role);
}
