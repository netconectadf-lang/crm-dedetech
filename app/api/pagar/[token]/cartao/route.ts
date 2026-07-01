import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureAsaasCustomer,
  criarPagamentoCartaoAsaas,
  deletarCobrancaAsaas,
  type AsaasConfig,
} from "@/lib/asaas";
import { calcularParcelas } from "@/lib/parcelas";
import { liberarComissoesDaAr } from "@/lib/comissoes";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Anti card-testing: no máx. 6 tentativas / 5 min por token de cobrança.
  if (!(await rateLimit("cartao", { limit: 6, windowSeconds: 300, key: token }))) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429 },
    );
  }

  let body: {
    parcelas?: number;
    card?: { number?: string; holderName?: string; expiryMonth?: string; expiryYear?: string; ccv?: string };
    holder?: { nome?: string; cpf?: string; cep?: string; numero?: string; telefone?: string; email?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: chargeData } = await admin
    .from("charges")
    .select("id, valor, status, provider_charge_id, ar_id, client_id, tenant_id, vencimento")
    .eq("pay_token", token)
    .maybeSingle();
  const charge = chargeData as {
    id: string;
    valor: number;
    status: string;
    provider_charge_id: string | null;
    ar_id: string | null;
    client_id: string | null;
    tenant_id: string;
    vencimento: string | null;
  } | null;
  if (!charge) return NextResponse.json({ ok: false, error: "Cobrança não encontrada." }, { status: 404 });
  if (charge.status === "pago") return NextResponse.json({ ok: false, error: "Esta cobrança já foi paga." });

  // integração Asaas + juros
  const { data: intData } = await admin
    .from("payment_integrations")
    .select("api_key, environment, wallet_id, enabled, juros_cartao_pct")
    .eq("tenant_id", charge.tenant_id)
    .maybeSingle();
  const integ = intData as {
    api_key: string;
    environment: "sandbox" | "production";
    wallet_id: string | null;
    enabled: boolean;
    juros_cartao_pct: number | null;
  } | null;
  if (!integ?.enabled || !integ.api_key) {
    return NextResponse.json({ ok: false, error: "Pagamento por cartão indisponível." });
  }
  const config: AsaasConfig = {
    apiKey: integ.api_key,
    environment: integ.environment,
    walletId: integ.wallet_id,
  };

  // cliente como customer no Asaas
  const { data: clientData } = charge.client_id
    ? await admin
        .from("clients")
        .select("id, razao_social, documento, email, telefone, asaas_customer_id")
        .eq("id", charge.client_id)
        .maybeSingle()
    : { data: null };
  const cli = clientData as {
    id: string;
    razao_social: string;
    documento: string | null;
    email: string | null;
    telefone: string | null;
    asaas_customer_id: string | null;
  } | null;
  if (!cli) return NextResponse.json({ ok: false, error: "Cliente da cobrança não encontrado." });

  const cust = await ensureAsaasCustomer(config, {
    id: cli.id,
    nome: cli.razao_social,
    documento: body.holder?.cpf ?? cli.documento,
    email: body.holder?.email ?? cli.email,
    telefone: body.holder?.telefone ?? cli.telefone,
    asaasCustomerId: cli.asaas_customer_id,
  });
  if (!cust.customerId) {
    return NextResponse.json({ ok: false, error: "Não foi possível identificar o cliente no Asaas (confira o CPF)." });
  }
  if (cust.customerId !== cli.asaas_customer_id) {
    await admin.from("clients").update({ asaas_customer_id: cust.customerId } as never).eq("id", cli.id);
  }

  // parcelas (1-6) e total com juros
  const n = Math.min(6, Math.max(1, Number(body.parcelas) || 1));
  const opcao = calcularParcelas(Number(charge.valor), Number(integ.juros_cartao_pct ?? 0)).find((p) => p.n === n)!;

  const card = body.card ?? {};
  const holder = body.holder ?? {};
  const remoteIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const pg = await criarPagamentoCartaoAsaas(config, {
    customerId: cust.customerId,
    total: opcao.total,
    installmentCount: n,
    dueDate: charge.vencimento ?? new Date().toISOString().slice(0, 10),
    descricao: `Cobrança ${charge.id.slice(0, 8)}`,
    holderName: card.holderName ?? "",
    number: card.number ?? "",
    expiryMonth: card.expiryMonth ?? "",
    expiryYear: card.expiryYear ?? "",
    ccv: card.ccv ?? "",
    nome: holder.nome ?? cli.razao_social,
    email: holder.email ?? cli.email ?? "",
    cpfCnpj: holder.cpf ?? cli.documento ?? "",
    postalCode: holder.cep ?? "",
    addressNumber: holder.numero ?? "",
    phone: holder.telefone ?? cli.telefone ?? "",
    remoteIp,
  });

  if (!pg.ok) return NextResponse.json({ ok: false, error: pg.error ?? "Pagamento não aprovado." });

  const aprovado = pg.status === "CONFIRMED" || pg.status === "RECEIVED";
  if (!aprovado) {
    return NextResponse.json({ ok: false, error: "Pagamento não foi aprovado pela operadora." });
  }

  // baixa: marca a cobrança e a conta como pagas; remove a cobrança original pendente
  await admin.from("charges").update({ status: "pago", provider_charge_id: pg.id ?? null } as never).eq("id", charge.id);
  if (charge.ar_id) {
    await admin
      .from("accounts_receivable")
      .update({ status: "quitado", valor_pago: charge.valor } as never)
      .eq("id", charge.ar_id);
    // Libera comissões provisionadas (base = principal da AR, sem os juros do
    // cartão). Idempotente. Espelha a baixa manual e o webhook.
    await liberarComissoesDaAr(admin, charge.tenant_id, charge.ar_id, Number(charge.valor));
  }
  if (charge.provider_charge_id && charge.provider_charge_id !== pg.id) {
    await deletarCobrancaAsaas(config, charge.provider_charge_id);
  }

  return NextResponse.json({ ok: true });
}
