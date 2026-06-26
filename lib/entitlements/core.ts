/**
 * Entitlements — lógica PURA (sem I/O), usável no servidor e no cliente.
 * Responde "este tenant pode usar a feature X?" e "qual o limite de Y?",
 * a partir do plano da assinatura. Fonte da verdade dos planos = tabela `plans`
 * (gerida pelo hub Cortex). As keys de feature seguem o features.catalog.json.
 */

export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

export type EntitlementData = {
  tenantId: string | null;
  planName: string | null;
  status: SubStatus;
  /** features ligadas (boolean=true) + limites (limite.* = número) */
  features: Record<string, boolean | number>;
};

/** Assinatura utilizável (libera features). past_due/canceled/none = bloqueado. */
export function isActive(status: SubStatus): boolean {
  return status === "active" || status === "trialing";
}

/** Monta o mapa de features a partir do JSONB do plano + colunas de limite. */
export function buildFeatures(
  featuresJson: unknown,
  limits: {
    usuarios: number | null;
    os_mes: number | null;
    storage_gb: number | null;
  },
): Record<string, boolean | number> {
  const out: Record<string, boolean | number> = {};
  if (Array.isArray(featuresJson)) {
    for (const k of featuresJson) if (typeof k === "string") out[k] = true;
  } else if (featuresJson && typeof featuresJson === "object") {
    for (const [k, v] of Object.entries(featuresJson as Record<string, unknown>)) {
      if (v === true || typeof v === "number") out[k] = v as boolean | number;
    }
  }
  if (typeof limits.usuarios === "number") out["limite.usuarios"] = limits.usuarios;
  if (typeof limits.os_mes === "number") out["limite.os_mes"] = limits.os_mes;
  if (typeof limits.storage_gb === "number") out["limite.storage_gb"] = limits.storage_gb;
  return out;
}

/** Pode usar a feature? (exige assinatura ativa + feature ligada no plano) */
export function can(data: EntitlementData, feature: string): boolean {
  if (!isActive(data.status)) return false;
  return data.features[feature] === true;
}

/** Limite numérico de uma cota. null = ilimitado / não definido. */
export function limitOf(data: EntitlementData, key: string): number | null {
  const v = data.features[key];
  return typeof v === "number" ? v : null;
}

/** `current` está dentro do limite? (≤ limite; ilimitado = sempre true) */
export function withinLimit(data: EntitlementData, key: string, current: number): boolean {
  const lim = limitOf(data, key);
  return lim === null ? true : current <= lim;
}

/** Ainda cabe mais um? (current < limite; ilimitado = sempre true) */
export function canAddMore(data: EntitlementData, key: string, current: number): boolean {
  const lim = limitOf(data, key);
  return lim === null ? true : current < lim;
}

export const EMPTY_ENTITLEMENTS: EntitlementData = {
  tenantId: null,
  planName: null,
  status: "none",
  features: {},
};
