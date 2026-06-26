import { describe, expect, it } from "vitest";

import {
  reconcileEntitlements,
  subscriptionUsable,
  can,
  limitOf,
  withinLimit,
  canAddMore,
  type SubStatus,
} from "@/lib/entitlements/core";

const NOW = new Date("2026-06-26T12:00:00Z");
const FUTURO = "2026-07-10T00:00:00Z";
const PASSADO = "2026-06-01T00:00:00Z";

function reconcile(opts: {
  status: SubStatus;
  currentPeriodEnd?: string | null;
  planFeatures?: unknown;
  flags?: Array<{ key: string; enabled: boolean }>;
  limits?: { usuarios: number | null; os_mes: number | null; storage_gb: number | null };
}) {
  return reconcileEntitlements({
    tenantId: "t1",
    planName: "Plano Teste",
    status: opts.status,
    currentPeriodEnd: opts.currentPeriodEnd ?? null,
    planFeatures: opts.planFeatures ?? [],
    planLimits: opts.limits ?? { usuarios: null, os_mes: null, storage_gb: null },
    flags: opts.flags ?? [],
    now: NOW,
  });
}

describe("reconciliador — precedência feature_flags > plano", () => {
  it("plano LIBERA + flag NEGA = nega (flag vence)", () => {
    const ent = reconcile({
      status: "active",
      planFeatures: ["nfse"],
      flags: [{ key: "nfse", enabled: false }],
    });
    expect(can(ent, "nfse")).toBe(false);
    expect(ent.source.nfse).toBe("flag");
  });

  it("plano NEGA + flag LIBERA = libera (flag vence)", () => {
    const ent = reconcile({
      status: "active",
      planFeatures: ["os"], // nfse NÃO está no plano
      flags: [{ key: "nfse", enabled: true }],
    });
    expect(can(ent, "nfse")).toBe(true);
    expect(ent.source.nfse).toBe("flag");
  });

  it("sem flag = vale o plano", () => {
    const ent = reconcile({ status: "active", planFeatures: ["os", "funil"] });
    expect(can(ent, "os")).toBe(true);
    expect(ent.source.os).toBe("plan");
    expect(can(ent, "nfse")).toBe(false);
    expect(ent.source.nfse).toBe("default");
  });

  it("flag liberada vence até com assinatura cancelada (override de exceção)", () => {
    const ent = reconcile({
      status: "canceled",
      planFeatures: ["os"],
      flags: [{ key: "nfse", enabled: true }],
    });
    expect(can(ent, "nfse")).toBe(true); // flag força mesmo sem assinatura
    expect(can(ent, "os")).toBe(false); // plano bloqueado pelo status
  });
});

describe("reconciliador — trial e status", () => {
  it("trial ativo (current_period_end no futuro) libera o plano", () => {
    const ent = reconcile({
      status: "trialing",
      currentPeriodEnd: FUTURO,
      planFeatures: ["os", "nfse"],
    });
    expect(can(ent, "os")).toBe(true);
    expect(can(ent, "nfse")).toBe(true);
    expect(ent.trialEndsAt).toBe(FUTURO);
  });

  it("trial VENCIDO = pago bloqueado", () => {
    const ent = reconcile({
      status: "trialing",
      currentPeriodEnd: PASSADO,
      planFeatures: ["os", "nfse"],
    });
    expect(can(ent, "os")).toBe(false);
    expect(can(ent, "nfse")).toBe(false);
  });

  it("trialing sem current_period_end (null) = libera (trial sem prazo = vigente)", () => {
    const ent = reconcile({ status: "trialing", currentPeriodEnd: null, planFeatures: ["os"] });
    expect(can(ent, "os")).toBe(true);
  });

  it("active libera; past_due e canceled bloqueiam o plano", () => {
    expect(can(reconcile({ status: "active", planFeatures: ["os"] }), "os")).toBe(true);
    expect(can(reconcile({ status: "past_due", planFeatures: ["os"] }), "os")).toBe(false);
    expect(can(reconcile({ status: "canceled", planFeatures: ["os"] }), "os")).toBe(false);
    expect(can(reconcile({ status: "none", planFeatures: ["os"] }), "os")).toBe(false);
  });

  it("aceita features JSONB como objeto key→bool", () => {
    const ent = reconcile({ status: "active", planFeatures: { os: true, funil: false } });
    expect(can(ent, "os")).toBe(true);
    expect(can(ent, "funil")).toBe(false);
  });
});

describe("subscriptionUsable", () => {
  it("trial vence exatamente no current_period_end", () => {
    expect(subscriptionUsable("trialing", "2026-06-26T12:00:00Z", NOW)).toBe(false); // ==agora não conta
    expect(subscriptionUsable("trialing", "2026-06-26T12:00:01Z", NOW)).toBe(true);
  });
});

describe("limites", () => {
  it("withinLimit/canAddMore respeitam a cota e tratam ilimitado", () => {
    const ent = reconcile({
      status: "active",
      planFeatures: ["os"],
      limits: { usuarios: 3, os_mes: 50, storage_gb: null },
    });
    expect(limitOf(ent, "limite.usuarios")).toBe(3);
    expect(limitOf(ent, "limite.storage_gb")).toBe(null); // ilimitado
    expect(withinLimit(ent, "limite.usuarios", 3)).toBe(true);
    expect(withinLimit(ent, "limite.usuarios", 4)).toBe(false);
    expect(canAddMore(ent, "limite.usuarios", 3)).toBe(false); // já no teto
    expect(canAddMore(ent, "limite.usuarios", 2)).toBe(true);
    expect(withinLimit(ent, "limite.storage_gb", 9999)).toBe(true); // ilimitado
  });
});
