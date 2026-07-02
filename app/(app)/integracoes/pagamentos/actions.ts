"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { pingAsaas, registrarWebhookAsaas } from "@/lib/asaas";

/** Base pública do app (para montar a URL do webhook). */
async function appOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const ROLES = ["owner"] as const;

type Ambiente = "sandbox" | "production";

function parseAmbiente(v: FormDataEntryValue | null): Ambiente {
  return v === "production" ? "production" : "sandbox";
}

/** Testa a credencial Asaas informada (sem salvar). */
export async function testarConexao(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; nome?: string; error?: string }> {
  await requireRole([...ROLES]);
  const apiKey = String(formData.get("api_key") ?? "").trim();
  const environment = parseAmbiente(formData.get("environment"));
  if (!apiKey) return { ok: false, error: "Informe a chave de API." };
  return pingAsaas({ apiKey, environment });
}

/** Conecta/atualiza a conta de pagamento da empresa (Asaas). */
export async function salvarPagamentos(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const ctx = await requireRole([...ROLES]);
  const supabase = await createClient();

  const apiKey = String(formData.get("api_key") ?? "").trim();
  const environment = parseAmbiente(formData.get("environment"));
  const walletId = String(formData.get("wallet_id") ?? "").trim() || null;
  const jurosCartao = Math.max(0, Number(String(formData.get("juros_cartao_pct") ?? "0").replace(",", ".")) || 0);
  if (!apiKey) return { ok: false, error: "Informe a chave de API do Asaas." };

  // valida antes de salvar — evita gravar uma chave que não funciona
  const ping = await pingAsaas({ apiKey, environment });
  if (!ping.ok) return { ok: false, error: ping.error ?? "Chave inválida." };

  const { data: existing } = await supabase
    .from("payment_integrations")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();

  if ((existing as { id: string } | null)?.id) {
    const { error } = await supabase
      .from("payment_integrations")
      .update({
        provider: "asaas",
        api_key: apiKey,
        environment,
        wallet_id: walletId,
        juros_cartao_pct: jurosCartao,
        enabled: true,
      } as never)
      .eq("tenant_id", ctx.tenantId);
    if (error) return { ok: false, error: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("payment_integrations").insert({
      tenant_id: ctx.tenantId,
      provider: "asaas",
      api_key: apiKey,
      environment,
      wallet_id: walletId,
      juros_cartao_pct: jurosCartao,
      enabled: true,
    } as never);
    if (error) return { ok: false, error: "Não foi possível conectar." };
  }

  // Auto-registra o webhook no Asaas (best-effort) — evita o dono ter que colar
  // a URL no painel. Usa o webhook_token do tenant (gera se ainda não houver).
  let webhookMsg = "";
  try {
    const { data: integ } = await supabase
      .from("payment_integrations")
      .select("webhook_token")
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();
    let token = (integ as { webhook_token: string | null } | null)?.webhook_token ?? null;
    if (!token) {
      token = randomUUID();
      await supabase
        .from("payment_integrations")
        .update({ webhook_token: token } as never)
        .eq("tenant_id", ctx.tenantId);
    }
    const url = `${await appOrigin()}/api/webhooks/asaas`;
    const reg = await registrarWebhookAsaas({ apiKey, environment }, { url, authToken: token });
    webhookMsg = reg.ok
      ? reg.jaExistia
        ? " Webhook já configurado."
        : " Webhook registrado automaticamente."
      : " (Configure o webhook manualmente no Asaas — não consegui registrar.)";
  } catch {
    webhookMsg = " (Configure o webhook manualmente no Asaas.)";
  }

  revalidatePath("/integracoes/pagamentos");
  revalidatePath("/integracoes");
  return { ok: true, message: `Conta conectada (${ping.nome ?? "Asaas"}).${webhookMsg}` };
}

/** Desconecta a conta de pagamento (desativa as cobranças automáticas). */
export async function desconectarPagamentos(): Promise<void> {
  const ctx = await requireRole([...ROLES]);
  const supabase = await createClient();
  await supabase
    .from("payment_integrations")
    .update({ enabled: false } as never)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/integracoes/pagamentos");
  revalidatePath("/integracoes");
}
