import Link from "next/link";
import { headers } from "next/headers";
import { CreditCard, ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { pingAsaas } from "@/lib/asaas";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PagamentosForm } from "@/components/integracoes/pagamentos-form";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Pagamentos · Integrações" };

async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function PagamentosPage() {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("payment_integrations")
    .select("api_key, environment, wallet_id, webhook_token, enabled, juros_cartao_pct")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const row = data as {
    api_key: string;
    environment: "sandbox" | "production";
    wallet_id: string | null;
    webhook_token: string;
    enabled: boolean;
    juros_cartao_pct: number | null;
  } | null;

  const connected = Boolean(row?.enabled && row?.api_key);
  const environment = row?.environment ?? "sandbox";

  // confirma o nome da conta (só quando conectado)
  let accountName: string | undefined;
  if (connected && row) {
    const ping = await pingAsaas({ apiKey: row.api_key, environment });
    if (ping.ok) accountName = ping.nome;
  }

  const origin = await appOrigin();
  const webhookUrl = `${origin}/api/webhooks/asaas`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <Link
          href="/integracoes"
          className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Integrações
        </Link>
        <PageHeader
          title="Pagamentos"
          description="Conecte a conta Asaas da empresa para cobrar clientes por PIX, boleto e cartão — com baixa automática."
          action={
            <AjudaTela
              titulo="Como funciona Pagamentos"
              descricao="Conecte a conta Asaas da SUA empresa. As cobranças são geradas na sua conta e o dinheiro cai direto pra você — o Dedetech só dispara a cobrança e dá baixa quando o cliente paga."
              topicos={[
                {
                  titulo: "Conectar",
                  itens: [
                    "Chave de API — copie do painel do Asaas em Integrações ▸ Chave de API.",
                    "Ambiente — Sandbox para testar; Produção para cobrar de verdade.",
                    "Testar conexão — confirma se a chave é válida antes de salvar.",
                  ],
                },
                {
                  titulo: "Webhook (baixa automática)",
                  itens: [
                    "Cole a URL do webhook no Asaas com o evento Cobranças.",
                    "Token — valida que o aviso veio mesmo do Asaas (segurança).",
                    "Quando o cliente paga, a Conta a Receber é quitada sozinha.",
                  ],
                },
                {
                  titulo: "Cobrar",
                  itens: [
                    "Em Financeiro ▸ A receber, use PIX / Boleto / Cartão em cada conta.",
                    "O cliente é cadastrado automaticamente no Asaas na 1ª cobrança.",
                    "O link da cobrança é enviado ao cliente pelo WhatsApp (se conectado).",
                  ],
                },
              ]}
              dica="Comece no Sandbox para testar o fluxo inteiro sem cobrar ninguém. Depois troque a chave para Produção."
            />
          }
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <CardTitle className="text-base">Conta Asaas</CardTitle>
          </div>
          <CardDescription>
            PIX, boleto e cartão de crédito. Taxas e prazos de repasse são os da sua própria conta Asaas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PagamentosForm
            connected={connected}
            accountName={accountName}
            environment={environment}
            walletId={row?.wallet_id ?? ""}
            jurosCartao={Number(row?.juros_cartao_pct ?? 0)}
            webhookUrl={webhookUrl}
            webhookToken={row?.webhook_token ?? ""}
          />
        </CardContent>
      </Card>
    </main>
  );
}
