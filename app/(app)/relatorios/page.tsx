import {
  TrendingUp,
  Banknote,
  AlertTriangle,
  ClipboardCheck,
  Receipt,
  Gauge,
  Users,
  Smile,
  FileCheck2,
  Percent,
  Target,
  Clock,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { metricasNps } from "@/lib/nps";
import {
  MESES_CURTOS,
  serieMensal,
  agruparRanking,
  contarPor,
  somaNoPeriodo,
  noPeriodo,
  periodoAnterior,
  rotuloPeriodo,
  variacao,
  resumoOrcamentos,
  produtividadePorTecnico,
  agingInadimplencia,
  type Periodo,
  type QuoteLite,
} from "@/lib/relatorios";
import { OS_STATUS } from "@/lib/os-status";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/dashboard/kpi-card";
import { MiniStat } from "@/components/dashboard/mini-stat";
import { MetricCard } from "@/components/relatorios/metric-card";
import { FaturamentoChart } from "@/components/relatorios/faturamento-chart";
import { DonutChart } from "@/components/relatorios/donut-chart";
import { BarList, type BarRow } from "@/components/relatorios/bar-list";
import { PeriodoNav } from "@/components/relatorios/periodo-nav";

export const metadata = { title: "Relatórios" };

type ArRow = {
  valor: number;
  valor_pago: number;
  status: string;
  vencimento: string;
  pago_em: string | null;
  clients: { razao_social: string | null } | null;
};
type OsRow = {
  status: string;
  scheduled_at: string | null;
  client_id: string | null;
  clients: { bairro: string | null } | null;
  tempo_execucao_min: number | null;
  km_rodado: number | null;
  custo_produtos: number | null;
  custo_combustivel: number | null;
  custo_mao_obra: number | null;
  custo_total: number | null;
  employees: { nome: string | null } | null;
};
type QuoteItemRow = { subtotal: number | null };
type QuoteRow = {
  status: string;
  enviado_em: string | null;
  aceito_em: string | null;
  recusado_em: string | null;
  desconto: number | null;
  quote_items: QuoteItemRow[] | null;
};
type ComissaoRow = { valor: number; created_at: string; employees: { nome: string | null } | null };
type NpsRow = { score: number | null; respondido_em: string | null };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;

  const { ano: anoParam, mes: mesParam } = await searchParams;
  const ano = Number(anoParam) || anoAtual;
  const mesNum = Number(mesParam);
  const mes = mesNum >= 1 && mesNum <= 12 ? mesNum : undefined;

  const periodo: Periodo = { ano, mes };
  const anterior = periodoAnterior(periodo);
  const hoje = agora.toISOString().slice(0, 10);

  // janela de 2 anos (período atual + anterior) para calcular variações
  const janIni = `${ano - 1}-01-01`;
  const janFim = `${ano}-12-31`;
  const janProx = `${ano + 1}-01-01`;

  const [arFatRes, arRecRes, osRes, comissRes, npsRes, quotesRes] = await Promise.all([
    supabase
      .from("accounts_receivable")
      .select("valor, valor_pago, status, vencimento, pago_em, clients:client_id(razao_social)")
      .neq("status", "cancelado")
      .gte("vencimento", janIni)
      .lte("vencimento", janFim),
    supabase
      .from("accounts_receivable")
      .select("valor, valor_pago, status, vencimento, pago_em, clients:client_id(razao_social)")
      .gte("pago_em", janIni)
      .lt("pago_em", janProx),
    supabase
      .from("service_orders")
      .select(
        "status, scheduled_at, client_id, clients:client_id(bairro), tempo_execucao_min, km_rodado, custo_produtos, custo_combustivel, custo_mao_obra, custo_total, employees:tecnico_id(nome)",
      )
      .gte("scheduled_at", janIni)
      .lt("scheduled_at", janProx),
    supabase
      .from("commissions")
      .select("valor, created_at, employees:employee_id(nome)")
      .neq("status", "cancelada")
      .gte("created_at", janIni)
      .lt("created_at", janProx),
    supabase
      .from("nps_responses")
      .select("score, respondido_em")
      .not("respondido_em", "is", null)
      .gte("respondido_em", janIni)
      .lt("respondido_em", janProx),
    supabase
      .from("quotes")
      .select("status, enviado_em, aceito_em, recusado_em, desconto, quote_items(subtotal)")
      .neq("status", "rascunho")
      .or(`enviado_em.gte.${janIni},aceito_em.gte.${janIni},recusado_em.gte.${janIni}`),
  ]);

  const arFat = (arFatRes.data ?? []) as unknown as ArRow[];
  const arRec = (arRecRes.data ?? []) as unknown as ArRow[];
  const os = (osRes.data ?? []) as unknown as OsRow[];
  const comiss = (comissRes.data ?? []) as unknown as ComissaoRow[];
  const nps = (npsRes.data ?? []) as NpsRow[];
  const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];

  // ─── recortes do período atual ──────────────────────────────
  const fatPer = arFat.filter((r) => noPeriodo(r.vencimento, periodo));
  const osPer = os.filter((o) => noPeriodo(o.scheduled_at, periodo));
  const execPer = osPer.filter((o) => o.status === "executada" || o.status === "faturada");
  const emAberto = (r: ArRow) => r.status !== "quitado";

  // financeiro
  const faturado = fatPer.reduce((s, r) => s + Number(r.valor), 0);
  const recebidoDoFat = fatPer.reduce((s, r) => s + Number(r.valor_pago), 0);
  const vencido = fatPer
    .filter((r) => emAberto(r) && r.vencimento < hoje)
    .reduce((s, r) => s + (Number(r.valor) - Number(r.valor_pago)), 0);
  const aVencer = fatPer
    .filter((r) => emAberto(r) && r.vencimento >= hoje)
    .reduce((s, r) => s + (Number(r.valor) - Number(r.valor_pago)), 0);
  const recebido = somaNoPeriodo(arRec, periodo, (r) => r.pago_em, (r) => Number(r.valor_pago));
  const ticket = fatPer.length ? faturado / fatPer.length : 0;
  const taxaReceb = faturado > 0 ? Math.round((recebidoDoFat / faturado) * 100) : 0;

  // período anterior (para variações)
  const fatAnt = somaNoPeriodo(arFat, anterior, (r) => r.vencimento, (r) => Number(r.valor));
  const recAnt = somaNoPeriodo(arRec, anterior, (r) => r.pago_em, (r) => Number(r.valor_pago));
  const inadAnt = arFat
    .filter((r) => noPeriodo(r.vencimento, anterior) && emAberto(r) && r.vencimento < hoje)
    .reduce((s, r) => s + (Number(r.valor) - Number(r.valor_pago)), 0);
  const execAnt = os.filter(
    (o) => noPeriodo(o.scheduled_at, anterior) && (o.status === "executada" || o.status === "faturada"),
  ).length;

  // operacional / satisfação
  const clientesAtendidos = new Set(execPer.map((o) => o.client_id).filter(Boolean)).size;
  const npsPer = metricasNps(nps.filter((n) => noPeriodo(n.respondido_em, periodo)).map((n) => n.score ?? 0));

  // ─── séries mensais (ano todo) p/ sparkline e hero ──────────
  const sFat = serieMensal(arFat, ano, (r) => r.vencimento, (r) => Number(r.valor));
  const sRec = serieMensal(arRec, ano, (r) => r.pago_em, (r) => Number(r.valor_pago));
  const sExec = serieMensal(
    os.filter((o) => o.status === "executada" || o.status === "faturada"),
    ano,
    (o) => o.scheduled_at,
    () => 1,
  );
  const serie = MESES_CURTOS.map((m, i) => ({ mes: m, faturado: sFat[i], recebido: sRec[i] }));

  // ─── donuts ─────────────────────────────────────────────────
  const statusCount = contarPor(osPer, (o) => o.status);
  const donutOs = OS_STATUS.map((s) => ({
    label: s.label,
    value: statusCount.find((c) => c.chave === s.key)?.qtd ?? 0,
    color: s.color,
  })).filter((d) => d.value > 0);

  const donutReceb = [
    { label: "Recebido", value: Math.round(recebidoDoFat), color: "#34d399" },
    { label: "A vencer", value: Math.round(aVencer), color: "#38bdf8" },
    { label: "Vencido", value: Math.round(vencido), color: "#fb7185" },
  ].filter((d) => d.value > 0);

  // ─── rankings ───────────────────────────────────────────────
  const bairroRows: BarRow[] = contarPor(execPer, (o) => o.clients?.bairro)
    .slice(0, 8)
    .map((b) => ({ label: b.chave, value: b.qtd, display: String(b.qtd), sub: "OS" }));

  const topClientes: BarRow[] = agruparRanking(fatPer, (r) => r.clients?.razao_social, (r) => Number(r.valor))
    .slice(0, 8)
    .map((c) => ({ label: c.chave, value: c.valor, display: formatBRL(c.valor), sub: `${c.qtd}×` }));

  const comissRows: BarRow[] = agruparRanking(
    comiss.filter((c) => noPeriodo(c.created_at, periodo)),
    (c) => c.employees?.nome,
    (c) => Number(c.valor),
  )
    .slice(0, 8)
    .map((r) => ({ label: r.chave, value: r.valor, display: formatBRL(r.valor), sub: `${r.qtd}×` }));

  // ─── Conversão de orçamentos ────────────────────────────────
  const quotesLite: QuoteLite[] = quotes.map((q) => ({
    status: q.status,
    enviado_em: q.enviado_em,
    aceito_em: q.aceito_em,
    recusado_em: q.recusado_em,
    valor:
      (q.quote_items ?? []).reduce((s, i) => s + Number(i.subtotal ?? 0), 0) -
      Number(q.desconto ?? 0),
  }));
  const orc = resumoOrcamentos(quotesLite, periodo);

  // ─── Margem / DRE do período (custo já gravado na OS executada) ──
  const custoProdutos = execPer.reduce((s, o) => s + Number(o.custo_produtos ?? 0), 0);
  const custoCombustivel = execPer.reduce((s, o) => s + Number(o.custo_combustivel ?? 0), 0);
  const custoMaoObra = execPer.reduce((s, o) => s + Number(o.custo_mao_obra ?? 0), 0);
  const custoTotal = custoProdutos + custoCombustivel + custoMaoObra;
  const margem = faturado - custoTotal;
  const margemPct = faturado > 0 ? Math.round((margem / faturado) * 100) : 0;
  const donutCustos = [
    { label: "Mão de obra", value: Math.round(custoMaoObra), color: "#f59e0b" },
    { label: "Produtos", value: Math.round(custoProdutos), color: "#8b5cf6" },
    { label: "Combustível", value: Math.round(custoCombustivel), color: "#38bdf8" },
  ].filter((d) => d.value > 0);

  // ─── Produtividade por técnico ──────────────────────────────
  const tecnicos = produtividadePorTecnico(
    execPer.map((o) => ({
      tecnico: o.employees?.nome ?? null,
      tempo_execucao_min: o.tempo_execucao_min,
      km_rodado: o.km_rodado,
      custo_total: o.custo_total,
    })),
  );
  const tecnicoRows: BarRow[] = tecnicos.slice(0, 8).map((t) => ({
    label: t.tecnico,
    value: t.qtd,
    display: `${t.qtd} OS`,
    sub: t.tempoMedioMin != null ? `${t.tempoMedioMin} min/OS · ${t.kmTotal} km` : `${t.kmTotal} km`,
  }));

  // ─── Aging de inadimplência (snapshot de hoje) ──────────────
  const aging = agingInadimplencia(
    arFat,
    hoje,
    (r) => r.vencimento,
    (r) => Number(r.valor) - Number(r.valor_pago),
    (r) => r.status !== "quitado",
  );
  const agingRows: BarRow[] = aging.map((f) => ({
    label: f.faixa,
    value: f.valor,
    display: formatBRL(f.valor),
    sub: `${f.qtd} conta(s)`,
  }));

  const vsLabel = mes == null ? "vs. ano anterior" : "vs. mês anterior";
  const highlight = mes != null ? mes - 1 : undefined;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <PageHeader
        title="Relatórios gerenciais"
        description={rotuloPeriodo(periodo)}
        action={<PeriodoNav ano={ano} mes={mes} maxAno={anoAtual} mesAtual={mesAtual} />}
      />

      {/* KPIs principais (financeiro + operacional) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Faturado"
          value={formatBRL(faturado)}
          tone="sky"
          delta={variacao(faturado, fatAnt)}
          deltaLabel={vsLabel}
          spark={sFat}
        />
        <MetricCard
          icon={Banknote}
          label="Recebido"
          value={formatBRL(recebido)}
          tone="emerald"
          delta={variacao(recebido, recAnt)}
          deltaLabel={vsLabel}
          spark={sRec}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Inadimplência"
          value={formatBRL(vencido)}
          tone="rose"
          delta={variacao(vencido, inadAnt)}
          deltaLabel={vsLabel}
          invertDelta
          hint="vencido em aberto"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="OS executadas"
          value={String(execPer.length)}
          tone="violet"
          delta={variacao(execPer.length, execAnt)}
          deltaLabel={vsLabel}
          spark={sExec}
        />
      </div>

      {/* faixa de indicadores secundários */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Receipt} label="Ticket médio" value={formatBRL(ticket)} tone="bg-sky-500/15 text-sky-300" />
        <MiniStat icon={Gauge} label="Taxa de recebimento" value={`${taxaReceb}%`} tone="bg-emerald-500/15 text-emerald-300" />
        <MiniStat icon={Smile} label="NPS" value={npsPer.total ? String(npsPer.nps) : "—"} tone="bg-amber-500/15 text-amber-300" />
        <MiniStat icon={Users} label="Clientes atendidos" value={String(clientesAtendidos)} tone="bg-violet-500/15 text-violet-300" />
      </div>

      {/* hero: evolução mensal */}
      <Panel title="Faturado × Recebido por mês" accent="sky">
        <FaturamentoChart data={serie} highlight={highlight} />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> Faturado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400" /> Recebido
          </span>
          {mes != null && <span>· mês destacado: {MESES_CURTOS[mes - 1]}</span>}
        </div>
      </Panel>

      {/* composições (donuts) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Ordens de serviço por status" accent="violet">
          <DonutChart data={donutOs} unidade="OS" empty="Nenhuma OS no período." />
        </Panel>
        <Panel title="Composição do faturamento" accent="emerald">
          <DonutChart data={donutReceb} centerLabel="contas" empty="Sem contas no período." />
        </Panel>
      </div>

      {/* rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Atuação por bairro" accent="cyan">
          <p className="-mt-1 text-xs text-muted-foreground">OS executadas por região.</p>
          <BarList rows={bairroRows} tone="cyan" emptyLabel="Nenhuma OS executada no período." />
        </Panel>
        <Panel title="Top clientes por faturamento" accent="indigo">
          <p className="-mt-1 text-xs text-muted-foreground">Maiores valores faturados no período.</p>
          <BarList rows={topClientes} tone="indigo" emptyLabel="Sem faturamento no período." />
        </Panel>
      </div>

      <Panel title="Comissões por funcionário" accent="amber">
        <BarList rows={comissRows} tone="amber" emptyLabel="Nenhuma comissão no período." />
      </Panel>

      {/* ─── Conversão de orçamentos ─── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Conversão de orçamentos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat icon={FileCheck2} label="Enviados" value={String(orc.enviados)} tone="bg-sky-500/15 text-sky-300" />
          <MiniStat icon={Target} label="Taxa de ganho" value={`${orc.taxaGanho}%`} tone="bg-emerald-500/15 text-emerald-300" />
          <MiniStat icon={Banknote} label="Valor fechado" value={formatBRL(orc.valorAceito)} tone="bg-violet-500/15 text-violet-300" />
          <MiniStat
            icon={Clock}
            label="Ciclo médio"
            value={orc.cicloDias != null ? `${orc.cicloDias} dias` : "—"}
            tone="bg-amber-500/15 text-amber-300"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {orc.aceitos} aceito(s) · {orc.recusados} recusado(s) · ticket médio {formatBRL(orc.ticketAceito)}
        </p>
      </div>

      {/* ─── Margem / DRE ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Margem do período" accent="emerald">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat icon={TrendingUp} label="Receita (faturado)" value={formatBRL(faturado)} tone="bg-sky-500/15 text-sky-300" />
            <MiniStat icon={Receipt} label="Custo das OS" value={formatBRL(custoTotal)} tone="bg-rose-500/15 text-rose-300" />
            <MiniStat icon={Banknote} label="Margem bruta" value={formatBRL(margem)} tone="bg-emerald-500/15 text-emerald-300" />
            <MiniStat icon={Percent} label="Margem %" value={`${margemPct}%`} tone="bg-violet-500/15 text-violet-300" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Custo apurado nas OS executadas (produtos + combustível + mão de obra).
          </p>
        </Panel>
        <Panel title="Composição do custo" accent="amber">
          <DonutChart data={donutCustos} centerLabel="custo" empty="Sem custo apurado no período." />
        </Panel>
      </div>

      {/* ─── Produtividade + Aging ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Produtividade por técnico" accent="cyan">
          <p className="-mt-1 text-xs text-muted-foreground">OS executadas por técnico no período.</p>
          <BarList rows={tecnicoRows} tone="cyan" emptyLabel="Nenhuma OS executada no período." />
        </Panel>
        <Panel title="Inadimplência por faixa de atraso" accent="rose">
          <p className="-mt-1 text-xs text-muted-foreground">Contas vencidas em aberto, hoje.</p>
          <BarList rows={agingRows} tone="rose" emptyLabel="Nenhuma conta vencida em aberto." />
        </Panel>
      </div>
    </main>
  );
}
