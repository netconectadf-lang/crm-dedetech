import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getPaymentIntegration,
  ensureAsaasCustomer,
  criarCobrancaAsaas,
  type ChargeTipo,
} from "@/lib/asaas";
import { dispatch } from "@/lib/notify/dispatch";

export type CobrancaResult = {
  ok: boolean;
  error?: string;
  invoiceUrl?: string | null;
  pixPayload?: string | null;
  pixQrImage?: string | null; // QR PIX em base64 (p/ o app exibir como imagem)
  payUrl?: string | null; // página de pagamento PRÓPRIA (/pagar/[token])
  manual?: boolean;
};

/**
 * Núcleo da geração de cobrança (PIX/boleto/cartão) para uma Conta a Receber.
 * Sem dependência de auth/Next — recebe o client + tenantId + origin prontos,
 * para ser reusado pela server action (web) e pelo endpoint /api/cobranca (app).
 */
export async function gerarCobrancaCore(
  supabase: SupabaseClient,
  tenantId: string,
  arId: string,
  tipo: ChargeTipo,
  origin: string,
): Promise<CobrancaResult> {
  const { data: arData } = await supabase
    .from("accounts_receivable")
    .select(
      "id, descricao, valor, vencimento, client_id, clients(id, razao_social, documento, telefone, email, asaas_customer_id)",
    )
    .eq("id", arId)
    .eq("tenant_id", tenantId) // impede IDOR cross-tenant (AR de outra empresa)
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

  const config = await getPaymentIntegration(supabase, tenantId);

  // Sincroniza o cliente como customer no Asaas
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
    if (customerId && customerId !== c.asaas_customer_id) {
      await supabase.from("clients").update({ asaas_customer_id: customerId } as never).eq("id", c.id);
    }
  }

  const asaas = await criarCobrancaAsaas(config, {
    customerId,
    valor: Number(ar.valor),
    vencimento: ar.vencimento,
    descricao: ar.descricao,
    tipo,
  });

  if (config && asaas.skipped) {
    return { ok: false, error: "Não consegui criar o cliente no Asaas. Confira se o cliente tem CPF/CNPJ válido." };
  }
  if (config && !asaas.ok) {
    return { ok: false, error: asaas.error ? `Asaas recusou: ${asaas.error}` : "O Asaas recusou a cobrança." };
  }

  const payToken = randomUUID();
  const payUrl = `${origin}/pagar/${payToken}`;

  const { data: chargeData } = await supabase
    .from("charges")
    .insert({
      tenant_id: tenantId,
      ar_id: ar.id,
      client_id: ar.client_id,
      provider: asaas.skipped ? "manual" : "asaas",
      tipo,
      valor: ar.valor,
      vencimento: ar.vencimento,
      provider_charge_id: asaas.id ?? null,
      invoice_url: asaas.invoiceUrl ?? null,
      pix_payload: asaas.pixPayload ?? null,
      pix_qr: asaas.pixQrImage ?? null,
      pay_token: payToken,
    } as never)
    .select("id")
    .single();
  const charge = chargeData as { id: string } | null;

  if (ar.clients?.telefone) {
    await dispatch({
      tenantId,
      canal: "whatsapp",
      destino: ar.clients.telefone,
      corpo: `Olá! Sua cobrança "${ar.descricao}" está disponível para pagamento: ${payUrl}`,
      related_kind: "cobranca",
      related_id: charge?.id,
    });
  }

  return {
    ok: true,
    invoiceUrl: asaas.invoiceUrl ?? null,
    pixPayload: asaas.pixPayload ?? null,
    pixQrImage: asaas.pixQrImage ?? null,
    payUrl,
    manual: asaas.skipped === true,
  };
}
