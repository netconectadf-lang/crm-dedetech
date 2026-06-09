"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { pingAsaas } from "@/lib/asaas";

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

  revalidatePath("/integracoes/pagamentos");
  revalidatePath("/integracoes");
  return { ok: true, message: `Conta conectada (${ping.nome ?? "Asaas"}).` };
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
