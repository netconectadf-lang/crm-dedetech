import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { inicioDoMesBR } from "@/lib/agenda";
import {
  can,
  limitOf,
  reconcileEntitlements,
  EMPTY_ENTITLEMENTS,
  type EntitlementData,
  type SubStatus,
} from "./core";

/**
 * Resolve os entitlements de um tenant no servidor a partir do banco:
 *   subscriptions → plans  (base)  ⊕  feature_flags (override por tenant).
 * Toda a lógica de precedência/trial vive em reconcileEntitlements (./core, pura).
 * Respeita a RLS (usa o client da sessão).
 *
 * PRECEDÊNCIA (ver reconcileEntitlements): efetivo[key] = feature_flags[key] ??
 *   (assinaturaUtilizável ? plano[key] : false). O feature_flag VENCE o plano.
 *
 * NOTA (verificado 26/06/2026): a tabela feature_flags está VAZIA em produção
 *   (0 linhas). A reconciliação abaixo é, portanto, um no-op hoje (cai sempre no
 *   plano) — fica pronta para quando o Cortex passar a gravar overrides por tenant.
 *
 * @param tenantId opcional — se omitido, usa o tenant ativo da sessão.
 *
 * Memoizado por request (React cache): o layout do app, o provider e os
 * layouts de segmento (requireFeature) compartilham UMA única resolução por
 * render, sem múltiplas idas ao banco.
 */
export const getEntitlements = cache(async (tenantId?: string): Promise<EntitlementData> => {
  let resolvedTenantId = tenantId ?? null;
  if (!resolvedTenantId) {
    const ctx = await getAuthContext();
    resolvedTenantId = ctx?.tenantId ?? null;
  }
  if (!resolvedTenantId) return EMPTY_ENTITLEMENTS;

  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, plan_id, current_period_end")
    .eq("tenant_id", resolvedTenantId)
    .maybeSingle();

  // Flags valem mesmo sem assinatura (override explícito por exceção).
  const { data: flagRows } = await supabase
    .from("feature_flags")
    .select("key, enabled")
    .eq("tenant_id", resolvedTenantId);
  const flags = (flagRows ?? []) as Array<{ key: string; enabled: boolean }>;

  if (!sub) {
    return reconcileEntitlements({
      tenantId: resolvedTenantId,
      planName: null,
      status: "none",
      currentPeriodEnd: null,
      planFeatures: null,
      planLimits: { usuarios: null, os_mes: null, storage_gb: null },
      flags,
      now: new Date(),
    });
  }

  const subRow = sub as {
    status: string | null;
    plan_id: string;
    current_period_end: string | null;
  };
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

  return reconcileEntitlements({
    tenantId: resolvedTenantId,
    planName: planRow?.nome ?? null,
    status: (subRow.status ?? "none") as SubStatus,
    currentPeriodEnd: subRow.current_period_end,
    planFeatures: planRow?.features ?? null,
    planLimits: {
      usuarios: planRow?.limite_usuarios ?? null,
      os_mes: planRow?.limite_os_mes ?? null,
      storage_gb: planRow?.limite_storage_gb ?? null,
    },
    flags,
    now: new Date(),
  });
});

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
  // Fronteira do mês no fuso de Brasília (não UTC — senão a virada acontece 3h
  // cedo e OS das últimas horas do mês contam no mês seguinte).
  const start = inicioDoMesBR(new Date().toISOString());
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
  featureLabel,
  limitOf,
  withinLimit,
  canAddMore,
  isActive,
  type EntitlementData,
  type SubStatus,
} from "./core";
