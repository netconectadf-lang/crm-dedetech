"use client";

import { createContext, useContext } from "react";
import {
  can as canFn,
  limitOf as limitFn,
  withinLimit as withinFn,
  canAddMore as canAddFn,
  EMPTY_ENTITLEMENTS,
  type EntitlementData,
} from "./core";

const Ctx = createContext<EntitlementData>(EMPTY_ENTITLEMENTS);

/**
 * Disponibiliza os entitlements para componentes client. Coloque no layout
 * passando o resultado de getEntitlements() (resolvido no servidor).
 */
export function EntitlementsProvider({
  value,
  children,
}: {
  value: EntitlementData;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEntitlements() {
  const data = useContext(Ctx);
  return {
    data,
    planName: data.planName,
    status: data.status,
    can: (feature: string) => canFn(data, feature),
    limitOf: (key: string) => limitFn(data, key),
    withinLimit: (key: string, current: number) => withinFn(data, key, current),
    canAddMore: (key: string, current: number) => canAddFn(data, key, current),
  };
}

/** Renderiza children só se a feature estiver liberada no plano. */
export function Gate({
  feature,
  fallback = null,
  children,
}: {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can } = useEntitlements();
  return <>{can(feature) ? children : fallback}</>;
}
