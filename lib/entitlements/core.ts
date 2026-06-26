/**
 * Entitlements — lógica PURA (sem I/O), usável no servidor e no cliente.
 * Responde "este tenant pode usar a feature X?" e "qual o limite de Y?".
 *
 * FONTE DA VERDADE dos planos = hub **Cortex**, que escreve direto no banco
 * deste app (tabela `plans` master + `platform_plans` vitrine). A assinatura do
 * tenant vive em `subscriptions` (Cortex lê, é READ-ONLY pra ele).
 *
 * ── PRECEDÊNCIA DA RECONCILIAÇÃO (reconcileEntitlements) ──────────────────────
 * Para cada feature key, o valor efetivo é:
 *
 *     efetivo[key] = feature_flags[key] ?? (assinaturaUtilizável ? plano[key] : false)
 *
 * Ou seja: o **feature_flag VENCE o plano**. Ele é o override explícito por
 * tenant (exceção manual) — liga ou desliga uma feature independentemente do
 * plano e até do status da assinatura. Na ausência de flag, vale o plano,
 * porém só se a assinatura estiver utilizável:
 *   - status `active`                       → utilizável
 *   - status `trialing` + current_period_end no futuro → utilizável (trial ativo)
 *   - status `trialing` vencido             → NÃO utilizável (trial vencido = pago bloqueado)
 *   - status `past_due` / `canceled` / `none` → NÃO utilizável
 * Sem flag e sem plano → false.
 *
 * As keys de feature seguem o `.cortex/features.catalog.json`.
 */

import catalog from "../../.cortex/features.catalog.json";

export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

/** De onde veio o valor efetivo de cada feature (auditoria/depuração). */
export type FeatureSource = "flag" | "plan" | "default";

export type Limits = {
  usuarios: number | null;
  os_mes: number | null;
  storage_gb: number | null;
};

export type EntitlementData = {
  tenantId: string | null;
  /** Nome do plano vigente (plans.nome). */
  plan: string | null;
  status: SubStatus;
  /** ISO da data de fim do trial, quando status = trialing. null caso contrário. */
  trialEndsAt: string | null;
  /** Features booleanas efetivas (já reconciliadas com flags + status). */
  features: Record<string, boolean>;
  limits: Limits;
  /** Origem de cada feature efetiva. */
  source: Record<string, FeatureSource>;
};

/** Mapa "limite.xxx" → coluna do shape Limits. Única ponte key↔coluna. */
const LIMIT_KEYS: Record<string, keyof Limits> = {
  "limite.usuarios": "usuarios",
  "limite.os_mes": "os_mes",
  "limite.storage_gb": "storage_gb",
};

/** Todas as feature keys booleanas que o CRM reconhece (do catálogo versionado). */
export const KNOWN_FEATURE_KEYS: string[] = (catalog.features ?? [])
  .filter((f: { type?: string }) => f.type === "boolean")
  .map((f: { key: string }) => f.key);

/** Mapa key → label legível (catálogo). Para mensagens de bloqueio/upgrade. */
const FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  (catalog.features ?? []).map((f: { key: string; label?: string }) => [f.key, f.label ?? f.key]),
);

/** Nome amigável de uma feature ("nfse" → "Nota Fiscal (NFS-e)"). Fallback = a própria key. */
export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key;
}

/** Assinatura ativa por status simples (sem considerar vencimento do trial). */
export function isActive(status: SubStatus): boolean {
  return status === "active" || status === "trialing";
}

/**
 * A assinatura está utilizável agora? (libera as features DERIVADAS DO PLANO).
 * Trial só conta se current_period_end ainda está no futuro.
 */
export function subscriptionUsable(
  status: SubStatus,
  currentPeriodEnd: string | null,
  now: Date,
): boolean {
  if (status === "active") return true;
  if (status === "trialing") {
    // trial vale se não tem prazo definido (null) OU ainda não venceu.
    if (currentPeriodEnd === null) return true;
    return new Date(currentPeriodEnd).getTime() > now.getTime();
  }
  return false; // past_due / canceled / none
}

/** Normaliza o features JSONB do plano (array de keys OU objeto key→bool) em Set de keys ligadas. */
function planFeatureSet(featuresJson: unknown): Set<string> {
  const on = new Set<string>();
  if (Array.isArray(featuresJson)) {
    for (const k of featuresJson) if (typeof k === "string") on.add(k);
  } else if (featuresJson && typeof featuresJson === "object") {
    for (const [k, v] of Object.entries(featuresJson as Record<string, unknown>)) {
      if (v === true) on.add(k);
    }
  }
  return on;
}

/**
 * Coração da camada: resolve os entitlements efetivos de um tenant a partir
 * dos dados crus do banco. PURA e testável (ver tests/entitlements.test.ts).
 * Aplica a precedência documentada no topo do arquivo.
 */
export function reconcileEntitlements(input: {
  tenantId: string | null;
  planName: string | null;
  status: SubStatus;
  currentPeriodEnd: string | null;
  /** plans.features (jsonb) — array de keys ou objeto key→bool. */
  planFeatures: unknown;
  planLimits: Limits;
  /** feature_flags do tenant (override explícito). */
  flags: Array<{ key: string; enabled: boolean }>;
  now: Date;
}): EntitlementData {
  const usable = subscriptionUsable(input.status, input.currentPeriodEnd, input.now);
  const planOn = planFeatureSet(input.planFeatures);
  const flagMap = new Map<string, boolean>();
  for (const f of input.flags) if (f && typeof f.key === "string") flagMap.set(f.key, !!f.enabled);

  // Universo de keys: catálogo + as que vierem do plano + as que vierem das flags.
  const keys = new Set<string>([...KNOWN_FEATURE_KEYS, ...planOn, ...flagMap.keys()]);

  const features: Record<string, boolean> = {};
  const source: Record<string, FeatureSource> = {};
  for (const key of keys) {
    if (flagMap.has(key)) {
      // override explícito vence tudo (inclusive status)
      features[key] = flagMap.get(key)!;
      source[key] = "flag";
    } else if (usable && planOn.has(key)) {
      features[key] = true;
      source[key] = "plan";
    } else {
      features[key] = false;
      source[key] = "default";
    }
  }

  return {
    tenantId: input.tenantId,
    plan: input.planName,
    status: input.status,
    trialEndsAt: input.status === "trialing" ? input.currentPeriodEnd : null,
    features,
    limits: input.planLimits,
    source,
  };
}

/** Pode usar a feature? Lê o valor já reconciliado (flags + status embutidos). */
export function can(data: EntitlementData, feature: string): boolean {
  return data.features[feature] === true;
}

/** Limite numérico de uma cota ("limite.os_mes"…). null = ilimitado / não definido. */
export function limitOf(data: EntitlementData, key: string): number | null {
  const col = LIMIT_KEYS[key];
  if (!col) return null;
  const v = data.limits[col];
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
  plan: null,
  status: "none",
  trialEndsAt: null,
  features: {},
  limits: { usuarios: null, os_mes: null, storage_gb: null },
  source: {},
};
