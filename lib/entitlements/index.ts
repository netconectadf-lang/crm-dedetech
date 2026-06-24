import "server-only";

import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildFeatures,
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

export {
  can,
  limitOf,
  withinLimit,
  canAddMore,
  isActive,
  type EntitlementData,
  type SubStatus,
} from "./core";
