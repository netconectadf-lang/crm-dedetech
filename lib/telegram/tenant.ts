import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TgCtx = { tenantId: string; botToken: string };

/** Resolve a empresa pelo segredo do webhook (multi-empresa). Fallback: env legado. */
export async function resolverIntegracao(secret: string | null): Promise<TgCtx | null> {
  if (secret) {
    const db = createAdminClient();
    const { data } = await db
      .from("telegram_integrations")
      .select("tenant_id, bot_token, enabled")
      .eq("webhook_secret", secret)
      .maybeSingle();
    const row = data as { tenant_id: string; bot_token: string; enabled: boolean } | null;
    if (row?.enabled) return { tenantId: row.tenant_id, botToken: row.bot_token };
  }
  // compatibilidade com o bot único antigo (env)
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  const envTenant = process.env.TELEGRAM_TENANT_ID;
  const envSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (envToken && envTenant && (!envSecret || envSecret === secret)) {
    return { tenantId: envTenant, botToken: envToken };
  }
  return null;
}

/** Registra o chat como pendente na 1ª interação (não rebaixa quem já é aprovado). */
export async function registrarChat(
  tenantId: string,
  chatId: string | number,
  nome?: string | null,
) {
  const db = createAdminClient();
  await db
    .from("telegram_chats")
    .upsert(
      { tenant_id: tenantId, chat_id: String(chatId), nome: nome ?? null },
      { onConflict: "tenant_id,chat_id", ignoreDuplicates: true },
    );
}

/** Status do chat: 'aprovado' | 'pendente' | 'bloqueado' | null (novo). */
export async function statusChat(
  tenantId: string,
  chatId: string | number,
): Promise<string | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("telegram_chats")
    .select("status")
    .eq("tenant_id", tenantId)
    .eq("chat_id", String(chatId))
    .maybeSingle();
  return (data as { status: string } | null)?.status ?? null;
}
