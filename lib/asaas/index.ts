import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Credenciais do gateway de uma empresa (vêm de payment_integrations). */
export type AsaasConfig = {
  apiKey: string;
  environment: "sandbox" | "production";
  walletId?: string | null;
};

export type ChargeTipo = "boleto" | "pix" | "cartao";

function baseUrl(env: AsaasConfig["environment"]) {
  return env === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
}

const BILLING: Record<ChargeTipo, string> = {
  boleto: "BOLETO",
  pix: "PIX",
  cartao: "CREDIT_CARD",
};

async function asaasFetch(
  config: AsaasConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${baseUrl(config.environment)}${path}`, {
    ...init,
    headers: {
      access_token: config.apiKey,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Carrega a integração de pagamento ativa do tenant. Retorna null quando a
 * empresa ainda não conectou (ou desabilitou) a conta — nesse caso o chamador
 * registra uma cobrança MANUAL.
 */
export async function getPaymentIntegration(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<(AsaasConfig & { id: string; webhookToken: string }) | null> {
  const { data } = await supabase
    .from("payment_integrations")
    .select("id, api_key, environment, wallet_id, webhook_token, enabled, provider")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const row = data as {
    id: string;
    api_key: string;
    environment: "sandbox" | "production";
    wallet_id: string | null;
    webhook_token: string;
    enabled: boolean;
    provider: string;
  } | null;
  if (!row || !row.enabled || !row.api_key) return null;
  return {
    id: row.id,
    apiKey: row.api_key,
    environment: row.environment,
    walletId: row.wallet_id,
    webhookToken: row.webhook_token,
  };
}

/** Testa a credencial buscando os dados da conta no Asaas. */
export async function pingAsaas(
  config: AsaasConfig,
): Promise<{ ok: boolean; nome?: string; error?: string }> {
  try {
    const res = await asaasFetch(config, "/myAccount");
    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        error:
          res.status === 401
            ? "Chave de API inválida para este ambiente."
            : `Falha ao validar (${res.status}). ${txt.slice(0, 160)}`,
      };
    }
    const d = await res.json();
    return { ok: true, nome: d?.name ?? d?.companyName ?? d?.email };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Garante um customer Asaas para o cliente: usa o externalReference (id do
 * cliente no CRM) para achar um existente; se não houver, cria. Devolve o id.
 */
export async function ensureAsaasCustomer(
  config: AsaasConfig,
  cliente: {
    id: string;
    nome: string;
    documento?: string | null;
    email?: string | null;
    telefone?: string | null;
    asaasCustomerId?: string | null;
  },
): Promise<{ customerId?: string; error?: string }> {
  // já espelhado
  if (cliente.asaasCustomerId) return { customerId: cliente.asaasCustomerId };

  const cpfCnpj = (cliente.documento ?? "").replace(/\D/g, "");
  try {
    // procura por externalReference (idempotente entre cobranças)
    const busca = await asaasFetch(
      config,
      `/customers?externalReference=${encodeURIComponent(cliente.id)}`,
    );
    if (busca.ok) {
      const lista = await busca.json();
      const achado = lista?.data?.[0]?.id as string | undefined;
      if (achado) return { customerId: achado };
    }

    const res = await asaasFetch(config, "/customers", {
      method: "POST",
      body: JSON.stringify({
        name: cliente.nome,
        cpfCnpj: cpfCnpj || undefined,
        email: cliente.email || undefined,
        phone: (cliente.telefone ?? "").replace(/\D/g, "") || undefined,
        externalReference: cliente.id,
      }),
    });
    if (!res.ok) return { error: (await res.text()).slice(0, 200) };
    const d = await res.json();
    return { customerId: d?.id };
  } catch (e) {
    return { error: String(e) };
  }
}

export type AsaasCharge = {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  invoiceUrl?: string;
  pixPayload?: string;
  pixQrImage?: string; // QR Code em base64 (encodedImage do Asaas)
  error?: string;
};

/**
 * Cria uma cobrança no Asaas (boleto, PIX ou link de cartão). Sem config ou
 * sem customerId, devolve skipped — o chamador registra cobrança MANUAL.
 */
export async function criarCobrancaAsaas(
  config: AsaasConfig | null,
  args: {
    customerId?: string;
    valor: number;
    vencimento: string;
    descricao: string;
    tipo: ChargeTipo;
  },
): Promise<AsaasCharge> {
  if (!config || !args.customerId) return { ok: true, skipped: true };
  try {
    const res = await asaasFetch(config, "/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: args.customerId,
        billingType: BILLING[args.tipo],
        value: args.valor,
        dueDate: args.vencimento,
        description: args.descricao,
        externalReference: args.descricao,
      }),
    });
    if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 200) };
    const d = await res.json();

    // para PIX, busca o QR Code (copia-e-cola + imagem)
    let pixPayload: string | undefined;
    let pixQrImage: string | undefined;
    if (args.tipo === "pix" && d?.id) {
      const qr = await asaasFetch(config, `/payments/${d.id}/pixQrCode`);
      if (qr.ok) {
        const qrData = await qr.json();
        pixPayload = qrData?.payload;
        pixQrImage = qrData?.encodedImage;
      }
    }

    return {
      ok: true,
      id: d?.id,
      invoiceUrl: d?.invoiceUrl ?? d?.bankSlipUrl,
      pixPayload,
      pixQrImage,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
