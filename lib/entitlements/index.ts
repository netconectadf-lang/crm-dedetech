import "server-only";

import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildFeatures,
  can,
  limitOf,
  EMPTY_ENTITLEMENTS,
  type EntitlementData,
  type SubStatus,
} from "./core";

/**
 * Resolve os entitlements do tenant ativo no servidor:
 * assinatura → plano → features/limites. Respeita a RLS (usa o client da sessão).
 * Use o resultado com os helpers de ./core (can, limitOf, withinLimit).
 */
export async function getEntitlements(): Promise<EntitlementData> {
  const ctx = await getAuthContext();
  const tenantId = ctx?.tenantId ?? null;
  if (!tenantId) return EMPTY_ENTITLEMENTS;

  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, plan_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!sub) return { ...EMPTY_ENTITLEMENTS, tenantId };

  const subRow = sub as { status: string | null; plan_id: string };
  const { data: plan } = await supabase
    .from("plans")
    .select("nome, features, limite_usuarios, limite_os_mes, limite_storage_gb")
    .eq("id", subRow.plan_id)
    .maybeSingle();

  const planRow = plan as
    | {
        nome: string | null;
        features: unknown;
        limite_usuarios: number | null;
        limite_os_mes: number | null;
        limite_storage_gb: number | null;
      }
    | null;

  return {
    tenantId,
    planName: planRow?.nome ?? null,
    status: (subRow.status ?? "none") as SubStatus,
    features: planRow
      ? buildFeatures(planRow.features, {
          usuarios: planRow.limite_usuarios,
          os_mes: planRow.limite_os_mes,
          storage_gb: planRow.limite_storage_gb,
        })
      : {},
  };
}

/**
 * Guard de rota: exige que o plano do tenant tenha a feature.
 * Se não tiver, redireciona pro dashboard com aviso. Defesa em profundidade
 * (a UI já esconde/bloqueia via nav, mas isto impede acesso direto por URL).
 */
export async function requireFeature(feature: string): Promise<EntitlementData> {
  const ent = await getEntitlements();
  if (!can(ent, feature)) redirect(`/dashboard?bloqueado=${encodeURIComponent(feature)}`);
  return ent;
}

/** Erro de cota de OS no mês corrente (null = ok). */
export async function osQuotaError(): Promise<string | null> {
  const ent = await getEntitlements();
  const limit = limitOf(ent, "limite.os_mes");
  if (limit === null || !ent.tenantId) return null;
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { count } = await supabase
    .from("service_orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ent.tenantId)
    .gte("created_at", start);
  const current = count ?? 0;
  if (current >= limit)
    return `Limite do plano: ${limit} ordens de serviço por mês atingido (${current}/${limit}). Faça upgrade para criar mais.`;
  return null;
}

/** Erro de cota de usuários/assentos (null = ok). Conta membros + convites pendentes. */
export async function seatQuotaError(): Promise<string | null> {
  const ent = await getEntitlements();
  const limit = limitOf(ent, "limite.usuarios");
  if (limit === null || !ent.tenantId) return null;
  const supabase = await createClient();
  const [members, invites] = await Promise.all([
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ent.tenantId),
    supabase
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ent.tenantId)
      .eq("status", "pending"),
  ]);
  const used = (members.count ?? 0) + (invites.count ?? 0);
  if (used >= limit)
    return `Limite do plano: ${limit} usuários atingido (${used}/${limit}). Faça upgrade para convidar mais.`;
  return null;
}

export {
  can,
  limitOf,
  withinLimit,
  canAddMore,
  isActive,
  type EntitlementData,
  type SubStatus,
} from "./core";
