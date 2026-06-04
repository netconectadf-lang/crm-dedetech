"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  validarBot,
  registrarWebhookTelegram,
  removerWebhookTelegram,
} from "@/lib/telegram";
import type { SaveState } from "@/lib/crud-helpers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dedetech-crm.vercel.app";
const WEBHOOK_URL = `${APP_URL}/api/integrations/telegram`;

/** Conecta o bot do Telegram da empresa: valida o token e registra o webhook. */
export async function conectarBot(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner"]);
  const token = String(formData.get("bot_token") ?? "").trim();
  if (!token.includes(":")) return { error: "Token inválido. Cole o token do @BotFather." };

  const info = await validarBot(token);
  if (!info.ok) return { error: "Token não reconhecido pelo Telegram. Confira no @BotFather." };

  const secret = randomBytes(20).toString("hex");
  const ok = await registrarWebhookTelegram(token, WEBHOOK_URL, secret);
  if (!ok) return { error: "Não consegui registrar o webhook no Telegram. Tente de novo." };

  const supabase = await createClient();
  const { error } = await supabase.from("telegram_integrations").upsert(
    {
      tenant_id: ctx.tenantId,
      bot_token: token,
      bot_username: info.username ?? null,
      webhook_secret: secret,
      enabled: true,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { error: "Não foi possível salvar a integração." };

  revalidatePath("/integracoes/telegram");
  return { message: `Bot @${info.username ?? ""} conectado!` };
}

export async function desconectarBot(): Promise<void> {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("telegram_integrations")
    .select("bot_token")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const token = (data as { bot_token: string } | null)?.bot_token;
  if (token) await removerWebhookTelegram(token);
  await supabase.from("telegram_integrations").delete().eq("tenant_id", ctx.tenantId);
  revalidatePath("/integracoes/telegram");
}

async function mudarStatusChat(id: string, status: "aprovado" | "bloqueado") {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();
  await supabase
    .from("telegram_chats")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/integracoes/telegram");
}

export async function aprovarChat(id: string): Promise<void> {
  await mudarStatusChat(id, "aprovado");
}

export async function bloquearChat(id: string): Promise<void> {
  await mudarStatusChat(id, "bloqueado");
}

export async function removerChat(id: string): Promise<void> {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();
  await supabase.from("telegram_chats").delete().eq("id", id).eq("tenant_id", ctx.tenantId);
  revalidatePath("/integracoes/telegram");
}
