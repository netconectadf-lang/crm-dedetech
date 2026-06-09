"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  getPaymentIntegration,
  ensureAsaasCustomer,
  criarCobrancaAsaas,
  type ChargeTipo,
} from "@/lib/asaas";
import { dispatch } from "@/lib/notify/dispatch";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "financeiro"];

export type CobrancaResult = {
  ok: boolean;
  error?: string;
  invoiceUrl?: string | null;
  pixPayload?: string | null;
  manual?: boolean;
};

/**
 * Gera uma cobrança (boleto/PIX/cartão) para uma Conta a Receber. Usa a conta
 * Asaas da empresa quando conectada (sincronizando o cliente como customer);
 * sem integração, registra uma cobrança MANUAL. Notifica o cliente com o link.
 * Retorna o resultado (link/PIX ou o erro do Asaas) para a UI exibir.
 */
export async function gerarCobranca(arId: string, tipo: ChargeTipo): Promise<CobrancaResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const { data: arData } = await supabase
    .from("accounts_receivable")
    .select(
      "id, descricao, valor, vencimento, client_id, clients(id, razao_social, documento, telefone, email, asaas_customer_id)",
    )
    .eq("id", arId)
    .maybeSingle();
  const ar = arData as unknown as {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    client_id: string | null;
    clients: {
      id: string;
      razao_social: string;
      documento: string | null;
      telefone: string | null;
      email: string | null;
      asaas_customer_id: string | null;
    } | null;
  } | null;
  if (!ar) return { ok: false, error: "Conta a receber não encontrada." };

  const config = await getPaymentIntegration(supabase, ctx.tenantId);

  // Sincroniza o cliente como customer no Asaas (necessário para a cobrança real)
  let customerId: string | undefined;
  if (config && ar.clients) {
    const c = ar.clients;
    const r = await ensureAsaasCustomer(config, {
      id: c.id,
      nome: c.razao_social,
      documento: c.documento,
      email: c.email,
      telefone: c.telefone,
      asaasCustomerId: c.asaas_customer_id,
    });
    customerId = r.customerId;
    // grava o id do customer para reaproveitar nas próximas cobranças
    if (customerId && customerId !== c.asaas_customer_id) {
      await supabase
        .from("clients")
        .update({ asaas_customer_id: customerId } as never)
        .eq("id", c.id);
    }
  }

  const asaas = await criarCobrancaAsaas(config, {
    customerId,
    valor: Number(ar.valor),
    vencimento: ar.vencimento,
    descricao: ar.descricao,
    tipo,
  });

  // Asaas conectado mas não criou → surface o motivo (não cria cobrança fantasma)
  if (config && asaas.skipped) {
    return {
      ok: false,
      error:
        "Não consegui criar o cliente no Asaas. Confira se o cliente tem CPF/CNPJ válido.",
    };
  }
  if (config && !asaas.ok) {
    return { ok: false, error: asaas.error ? `Asaas recusou: ${asaas.error}` : "O Asaas recusou a cobrança." };
  }

  const { data: chargeData } = await supabase
    .from("charges")
    .insert({
      tenant_id: ctx.tenantId,
      ar_id: ar.id,
      client_id: ar.client_id,
      provider: asaas.skipped ? "manual" : "asaas",
      tipo,
      valor: ar.valor,
      vencimento: ar.vencimento,
      provider_charge_id: asaas.id ?? null,
      invoice_url: asaas.invoiceUrl ?? null,
      pix_payload: asaas.pixPayload ?? null,
    } as never)
    .select("id, invoice_url")
    .single();
  const charge = chargeData as { id: string; invoice_url: string | null } | null;

  // notifica o cliente com o link (inerte sem WhatsApp/e-mail configurado)
  if (ar.clients?.telefone && asaas.invoiceUrl) {
    await dispatch({
      tenantId: ctx.tenantId,
      canal: "whatsapp",
      destino: ar.clients.telefone,
      corpo: `Olá! Sua cobrança "${ar.descricao}" está disponível: ${asaas.invoiceUrl}`,
      related_kind: "cobranca",
      related_id: charge?.id,
    });
  }

  revalidatePath("/financeiro/receber");
  return {
    ok: true,
    invoiceUrl: asaas.invoiceUrl ?? null,
    pixPayload: asaas.pixPayload ?? null,
    manual: asaas.skipped === true,
  };
}
