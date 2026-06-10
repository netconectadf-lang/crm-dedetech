import {
  TrendingUp,
  Banknote,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import {
  MESES_CURTOS,
  serieMensal,
  agruparRanking,
  contarPor,
} from "@/lib/relatorios";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { FaturamentoChart } from "@/components/relatorios/faturamento-chart";
import { BarList, type BarRow } from "@/components/relatorios/bar-list";
import { AnoNav } from "@/components/relatorios/ano-nav";

export const metadata = { title: "Relatórios" };

type ArRow = {
  valor: number;
  valor_pago: number;
  status: string;
  vencimento: string;
  pago_em: string | null;
};
type OsRow = {
  status: string;
  scheduled_at: string | null;
  clients: { bairro: string | null; cidade: string | null } | null;
};
type ComissaoRow = {
  valor: number;
  employees: { nome: string | null } | null;
};

const STATUS_OS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  a_caminho: "A caminho",
  em_execucao: "Em execução",
  executada: "Executada",
  faturada: "Faturada",
  cancelada: "Cancelada",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const anoAtual = new Date().getFullYear();
  const { ano: anoParam } = await searchParams;
  const ano = Number(anoParam) || anoAtual;
  const ini = `${ano}-01-01`;
  const fim = `${ano}-12-31`;
  const proxAno = `${ano + 1}-01-01`;
  const hoje = new Date().toISOString().slice(0, 10);

  const [arFatRes, arRecRes, osRes, comissRes] = await Promise.all([
    // faturado no ano (por vencimento) — exclui cancelados
    supabase
      .from("accounts_receivable")
      .select("valor, valor_pago, status, vencimento, pago_em")
      .neq("status", "cancelado")
      .gte("vencimento", ini)
      .lte("vencimento", fim),
    // recebido no ano (por data de baixa)
    supabase
      .from("accounts_receivable")
      .select("valor, valor_pago, status, vencimento, pago_em")
      .gte("pago_em", ini)
      .lt("pago_em", proxAno),
    // OS do ano (por agendamento) + bairro do cliente
    supabase
      .from("service_orders")
      .select("status, scheduled_at, clients:client_id(bairro, cidade)")
      .gte("scheduled_at", ini)
      .lt("scheduled_at", proxAno),
    // comissões do ano
    supabase
      .from("commissions")
      .select("valor, employees:employee_id(nome), created_at")
      .neq("status", "cancelada")
      .gte("created_at", ini)
      .lt("created_at", proxAno),
  ]);

  const arFat = (arFatRes.data ?? []) as ArRow[];
  const arRec = (arRecRes.data ?? []) as ArRow[];
  const os = (osRes.data ?? []) as unknown as OsRow[];
  const comiss = (comissRes.data ?? []) as unknown as ComissaoRow[];

  // ─── KPIs ───────────────────────────────────────────────
  const totalFaturado = arFat.reduce((s, r) => s + Number(r.valor), 0);
  const totalRecebido = arRec.reduce((s, r) => s + Number(r.valor_pago), 0);
  const inadimplencia = arFat
    .filter((r) => r.status !== "quitado" && r.vencimento < hoje)
    .reduce((s, r) => s + (Number(r.valor) - Number(r.valor_pago)), 0);
  const osExecutadas = os.filter(
    (o) => o.status === "executada" || o.status === "faturada",
  );
  const ticketMedio = arFat.length ? totalFaturado / arFat.length : 0;

  // ─── Série mensal faturado vs recebido ──────────────────
  const sFat = serieMensal(arFat, ano, (r) => r.vencimento, (r) => Number(r.valor));
  const sRec = serieMensal(arRec, ano, (r) => r.pago_em, (r) => Number(r.valor_pago));
  const serie = MESES_CURTOS.map((mes, i) => ({
    mes,
    faturado: sFat[i],
    recebido: sRec[i],
  }));

  // ─── Atuação por bairro (OS executadas) ─────────────────
  const bairros = contarPor(osExecutadas, (o) => o.clients?.bairro).slice(0, 8);
  const bairroRows: BarRow[] = bairros.map((b) => ({
    label: b.chave,
    value: b.qtd,
    display: String(b.qtd),
    sub: "OS",
  }));

  // ─── Ranking de comissões por funcionário ───────────────
  const ranking = agruparRanking(
    comiss,
    (c) => c.employees?.nome,
    (c) => Number(c.valor),
  ).slice(0, 8);
  const comissRows: BarRow[] = ranking.map((r) => ({
    label: r.chave,
    value: r.valor,
    display: formatBRL(r.valor),
    sub: `${r.qtd}×`,
  }));

  // ─── OS por status ──────────────────────────────────────
  const porStatus = contarPor(os, (o) => o.status);
  const statusRows: BarRow[] = porStatus.map((s) => ({
    label: STATUS_OS_LABEL[s.chave] ?? s.chave,
    value: s.qtd,
    display: String(s.qtd),
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <PageHeader
        title="Relatórios gerenciais"
        description={`Visão consolidada do ano de ${ano}.`}
        action={<AnoNav ano={ano} maxAno={anoAtual} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Faturado no ano"
          value={formatBRL(totalFaturado)}
          hint={`${arFat.length} lançamento(s)`}
          tone="sky"
          spark={sFat}
        />
        <KpiCard
          icon={Banknote}
          label="Recebido no ano"
          value={formatBRL(totalRecebido)}
          hint={
            totalFaturado > 0
              ? `${Math.round((totalRecebido / totalFaturado) * 100)}% do faturado`
              : undefined
          }
          tone="emerald"
          spark={sRec}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Inadimplência"
          value={formatBRL(inadimplencia)}
          hint="vencido em aberto"
          tone={inadimplencia > 0 ? "rose" : "emerald"}
        />
        <KpiCard
          icon={ClipboardCheck}
          label="OS executadas"
          value={String(osExecutadas.length)}
          hint={`ticket médio ${formatBRL(ticketMedio)}`}
          tone="violet"
        />
      </div>

      <Panel title="Faturado × Recebido por mês" accent="sky">
        <FaturamentoChart data={serie} />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> Faturado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400" /> Recebido
          </span>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Atuação por bairro" accent="cyan">
          <p className="-mt-1 text-xs text-muted-foreground">
            OS executadas por região no ano.
          </p>
          <BarList rows={bairroRows} tone="cyan" emptyLabel="Nenhuma OS executada no período." />
        </Panel>

        <Panel title="Comissões por funcionário" accent="amber">
          <p className="-mt-1 text-xs text-muted-foreground">
            Total provisionado/liberado/pago no ano.
          </p>
          <BarList rows={comissRows} tone="amber" emptyLabel="Nenhuma comissão no período." />
        </Panel>
      </div>

      <Panel title="Ordens de serviço por status" accent="violet">
        <BarList rows={statusRows} tone="violet" emptyLabel="Nenhuma OS no período." />
      </Panel>
    </main>
  );
}
