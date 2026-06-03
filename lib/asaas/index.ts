import "server-only";

const ASAAS_BASE =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

export function asaasEnabled() {
  return Boolean(process.env.ASAAS_API_KEY);
}

export type AsaasCharge = {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  invoiceUrl?: string;
  pixPayload?: string;
  error?: string;
};

/**
 * Cria uma cobrança no Asaas. Inerte (skipped) sem ASAAS_API_KEY — nesse caso
 * o chamador registra uma cobrança MANUAL. A sincronização de clientes Asaas
 * (customer) e a assinatura recorrente entram com as credenciais reais.
 */
export async function criarCobrancaAsaas(args: {
  customerId?: string;
  valor: number;
  vencimento: string;
  descricao: string;
  tipo: "boleto" | "pix";
}): Promise<AsaasCharge> {
  const key = process.env.ASAAS_API_KEY;
  if (!key || !args.customerId) {
    return { ok: true, skipped: true };
  }
  try {
    const res = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { access_token: key, "content-type": "application/json" },
      body: JSON.stringify({
        customer: args.customerId,
        billingType: args.tipo === "pix" ? "PIX" : "BOLETO",
        value: args.valor,
        dueDate: args.vencimento,
        description: args.descricao,
      }),
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    const d = await res.json();
    return {
      ok: true,
      id: d?.id,
      invoiceUrl: d?.invoiceUrl ?? d?.bankSlipUrl,
      pixPayload: d?.pixQrCode?.payload,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
