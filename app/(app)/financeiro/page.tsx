import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Landmark,
  Plus,
  Pencil,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { BANK_TYPE_LABEL, type BankAccountType, type FinanceStatus } from "@/lib/financeiro";
import type { Field } from "@/components/app/resource-form";
import { salvarBanco, excluirBanco, salvarCentro, excluirCentro } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Financeiro" };

type AR = {
  valor: number;
  valor_pago: number;
  status: FinanceStatus;
  pago_em: string | null;
  vencimento: string;
  bank_account_id: string | null;
};
type AP = AR & { cost_center_id: string | null };

const bankFields: Field[] = [
  { name: "nome", label: "Nome", required: true, full: true },
  { name: "tipo", label: "Tipo", type: "select", options: (Object.keys(BANK_TYPE_LABEL) as BankAccountType[]).map((k) => ({ value: k, label: BANK_TYPE_LABEL[k] })) },
  { name: "banco", label: "Banco" },
  { name: "saldo_inicial", label: "Saldo inicial (R$)", type: "number" },
  { name: "ativo", label: "Ativa", type: "switch" },
];
const centroFields: Field[] = [
  { name: "nome", label: "Nome", required: true, full: true },
  { name: "ativo", label: "Ativo", type: "switch" },
];

export default async function FinanceiroPage() {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [{ data: arData }, { data: apData }, { data: banksData }, { data: ccData }] =
    await Promise.all([
      supabase.from("accounts_receivable").select("valor, valor_pago, status, pago_em, vencimento, bank_account_id"),
      supabase.from("accounts_payable").select("valor, valor_pago, status, pago_em, vencimento, bank_account_id, cost_center_id"),
      supabase.from("bank_accounts").select("id, nome, tipo, banco, saldo_inicial, ativo").order("nome"),
      supabase.from("cost_centers").select("id, nome, ativo").order("nome"),
    ]);

  const ar = (arData as AR[] | null) ?? [];
  const ap = (apData as AP[] | null) ?? [];
  const banks = (banksData as { id: string; nome: string; tipo: BankAccountType; banco: string | null; saldo_inicial: number; ativo: boolean }[] | null) ?? [];
  const centros = (ccData as { id: string; nome: string; ativo: boolean }[] | null) ?? [];

  const aberto = (c: { status: FinanceStatus }) => c.status === "a_vencer" || c.status === "parcial";
  const saldoAberto = (c: { valor: number; valor_pago: number }) => Number(c.valor) - Number(c.valor_pago);
  const aReceber = ar.filter(aberto).reduce((s, c) => s + saldoAberto(c), 0);
  const aPagar = ap.filter(aberto).reduce((s, c) => s + saldoAberto(c), 0);

  // 🐛 corrigido: saldo real = inicial + tudo que entrou − tudo que saiu (antes só somava saldo_inicial)
  const recebidoTotal = ar.reduce((s, c) => s + Number(c.valor_pago), 0);
  const pagoTotal = ap.reduce((s, c) => s + Number(c.valor_pago), 0);
  const saldoInicial = banks.reduce((s, b) => s + Number(b.saldo_inicial), 0);
  const saldoReal = saldoInicial + recebidoTotal - pagoTotal;

  const noMes = (c: { status: FinanceStatus; pago_em: string | null }) =>
    c.status === "quitado" && c.pago_em != null && c.pago_em.slice(0, 10) >= mesInicio;
  const recebidoMes = ar.filter(noMes).reduce((s, c) => s + Number(c.valor_pago), 0);
  const pagoMes = ap.filter(noMes).reduce((s, c) => s + Number(c.valor_pago), 0);
  const resultadoMes = recebidoMes - pagoMes;

  // saldo real por conta
  const saldoConta = new Map<string, number>(banks.map((b) => [b.id, Number(b.saldo_inicial)]));
  for (const c of ar) if (c.bank_account_id && saldoConta.has(c.bank_account_id)) saldoConta.set(c.bank_account_id, saldoConta.get(c.bank_account_id)! + Number(c.valor_pago));
  for (const c of ap) if (c.bank_account_id && saldoConta.has(c.bank_account_id)) saldoConta.set(c.bank_account_id, saldoConta.get(c.bank_account_id)! - Number(c.valor_pago));

  // aging de inadimplência (a receber em aberto)
  const aging = { aVencer: 0, f30: 0, f60: 0, f60plus: 0 };
  for (const c of ar.filter(aberto)) {
    const venc = new Date(`${c.vencimento}T00:00:00`);
    const dias = Math.floor((hoje.getTime() - venc.getTime()) / 86_400_000);
    const s = saldoAberto(c);
    if (dias <= 0) aging.aVencer += s;
    else if (dias <= 30) aging.f30 += s;
    else if (dias <= 60) aging.f60 += s;
    else aging.f60plus += s;
  }
  const agingRows = [
    { label: "A vencer", valor: aging.aVencer, tone: "bg-primary/60" },
    { label: "1–30 dias", valor: aging.f30, tone: "bg-warning/70" },
    { label: "31–60 dias", valor: aging.f60, tone: "bg-orange-500/70" },
    { label: "60+ dias", valor: aging.f60plus, tone: "bg-destructive/70" },
  ];
  const agingMax = Math.max(1, ...agingRows.map((r) => r.valor));
  const inadimplencia = aging.f30 + aging.f60 + aging.f60plus;

  // tendência 6 meses (recebido × pago)
  const base = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    };
  });
  const trendMap = new Map(months.map((m) => [m.key, { mes: m.mes, recebido: 0, pago: 0 }]));
  for (const c of ar) if (c.pago_em) { const b = trendMap.get(c.pago_em.slice(0, 7)); if (b) b.recebido += Number(c.valor_pago); }
  for (const c of ap) if (c.pago_em) { const b = trendMap.get(c.pago_em.slice(0, 7)); if (b) b.pago += Number(c.valor_pago); }
  const trend = months.map((m) => trendMap.get(m.key)!);

  // DRE simples: despesas do mês por centro de custo
  const nomeCentro = new Map(centros.map((c) => [c.id, c.nome]));
  const despMap = new Map<string, number>();
  for (const c of ap.filter(noMes)) {
    const nome = c.cost_center_id ? nomeCentro.get(c.cost_center_id) ?? "Sem centro" : "Sem centro";
    despMap.set(nome, (despMap.get(nome) ?? 0) + Number(c.valor_pago));
  }
  const despesas = [...despMap.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  const despMax = Math.max(1, ...despesas.map((d) => d.valor));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Financeiro" description="Caixa real, fluxo, inadimplência e resultado do mês." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={ArrowDownCircle} label="A receber" value={formatBRL(aReceber)} hint={inadimplencia > 0 ? `${formatBRL(inadimplencia)} vencido` : "em dia"} href="/financeiro/receber" tone={inadimplencia > 0 ? "danger" : "sky"} />
        <KpiCard icon={ArrowUpCircle} label="A pagar" value={formatBRL(aPagar)} href="/financeiro/pagar" tone="amber" />
        <KpiCard icon={Wallet} label="Saldo em contas" value={formatBRL(saldoReal)} hint={`Inicial ${formatBRL(saldoInicial)}`} tone={saldoReal < 0 ? "danger" : "emerald"} />
        <KpiCard icon={Landmark} label="Resultado do mês" value={formatBRL(resultadoMes)} hint={`Receb. ${formatBRL(recebidoMes)} · Pago ${formatBRL(pagoMes)}`} tone={resultadoMes < 0 ? "danger" : "violet"} />
      </div>

      <Panel
        title="Fluxo de caixa"
        action={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Recebido</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" /> Pago</span>
          </div>
        }
      >
        <CashflowChart data={trend} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Inadimplência (a receber)">
          {aReceber === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nada a receber em aberto.</p>
          ) : (
            <div className="space-y-2.5">
              {agingRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.valor > 0 ? Math.max(4, (r.valor / agingMax) * 100) : 0}%` }} />
                  </div>
                  <span className="w-24 text-right tabular-nums">{formatBRL(r.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Despesas do mês por centro de custo">
          {despesas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma despesa paga neste mês.</p>
          ) : (
            <div className="space-y-2.5">
              {despesas.map((d) => (
                <div key={d.nome} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{d.nome}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500/50 to-rose-500/80" style={{ width: `${Math.max(4, (d.valor / despMax) * 100)}%` }} />
                  </div>
                  <span className="w-24 text-right tabular-nums">{formatBRL(d.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Contas bancárias</CardTitle>
            <ResourceDialog
              trigger={<Button size="sm"><Plus className="size-4" /> Nova</Button>}
              title="Nova conta bancária"
              fields={bankFields}
              action={salvarBanco.bind(null, null)}
            />
          </CardHeader>
          <CardContent>
            {banks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma conta.</p>
            ) : (
              <ul className="divide-y">
                {banks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2">
                    <span>
                      <span className="font-medium">{b.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{BANK_TYPE_LABEL[b.tipo]}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-sm font-medium">{formatBRL(saldoConta.get(b.id) ?? b.saldo_inicial)}</span>
                      <ResourceDialog
                        trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                        title="Editar conta"
                        fields={bankFields}
                        defaultValues={b}
                        action={salvarBanco.bind(null, b.id)}
                      />
                      <DeleteButton nome={b.nome} action={excluirBanco.bind(null, b.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Centros de custo</CardTitle>
            <ResourceDialog
              trigger={<Button size="sm"><Plus className="size-4" /> Novo</Button>}
              title="Novo centro de custo"
              fields={centroFields}
              action={salvarCentro.bind(null, null)}
            />
          </CardHeader>
          <CardContent>
            {centros.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum centro.</p>
            ) : (
              <ul className="divide-y">
                {centros.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{c.nome}</span>
                    <div className="flex items-center gap-2">
                      <ResourceDialog
                        trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                        title="Editar centro"
                        fields={centroFields}
                        defaultValues={c}
                        action={salvarCentro.bind(null, c.id)}
                      />
                      <DeleteButton nome={c.nome} action={excluirCentro.bind(null, c.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
