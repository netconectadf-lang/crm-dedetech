import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

/** IP do cliente a partir dos headers (Vercel popula x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

/**
 * Limita ações públicas por janela fixa, sem dependência externa (Postgres).
 * Retorna `true` se LIBERADO, `false` se estourou o limite.
 * Falha em ABERTO: se o limiter der erro, não bloqueia o usuário legítimo.
 */
export async function rateLimit(
  action: string,
  opts: { limit: number; windowSeconds: number; key?: string },
): Promise<boolean> {
  const id = opts.key ?? (await clientIp());
  const bucket = `${action}:${id}`;
  const db = createAdminClient();
  const { data, error } = await db.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_limit: opts.limit,
    p_window_seconds: opts.windowSeconds,
  });
  if (error) return true; // fail-open
  return data === true;
}
