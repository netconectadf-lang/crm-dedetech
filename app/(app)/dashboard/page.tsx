import Link from "next/link";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  KanbanSquare,
  Building2,
  ClipboardList,
  Boxes,
  Radar,
  ShieldCheck,
  ChevronsUpDown,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
  Plus,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { requireTenant, hasRole } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/data/dashboard";
import { formatBRL } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/funil";
import { OS_STATUS_LABEL, type OsStatus } from "@/lib/os";
import { cn } from "@/lib/utils";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";

export const metadata = { title: "Dashboard" };

const stageBar: Record<string, string> = {
  lead: "from-slate-500/50 to-slate-400/70",
  contato: "from-sky-500/55 to-sky-400/75",
  diagnostico: "from-cyan-500/55 to-cyan-400/75",
  orcamento: "from-violet-500/55 to-violet-400/80",
  negociacao: "from-amber-500/60 to-amber-400/85",
  ganho: "from-emerald-500/75 to-emerald-400",
  perdido: "from-rose-500/60 to-rose-400/85",
};

const osDot: Record<OsStatus, string> = {
  agendada: "bg-chart-3",
  a_caminho: "bg-chart-2",
  em_execucao: "bg-warning",
  executada: "bg-primary",
  faturada: "bg-chart-1",
  cancelada: "bg-destructive",
};

const CHIP_TONE: Record<string, string> = {
  emerald: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25",
  sky: "bg-sky-500/12 text-sky-300 ring-sky-500/25",
  amber: "bg-amber-500/12 text-amber-300 ring-amber-500/25",
  rose: "bg-rose-500/12 text-rose-300 ring-rose-500/25",
  violet: "bg-violet-500/12 text-violet-300 ring-violet-500/25",
};

function Chip({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof CHIP_TONE;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums ring-1 ring-inset",
        CHIP_TONE[tone],
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

export default async function DashboardPage() {
  const ctx = await requireTenant();
  const m = await getDashboardMetrics();
  const primeiroNome = ctx.fullName?.split(" ")[0] ?? "bem-vindo";
  const hojeLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const showFin = hasRole(ctx.role, ["owner", "financeiro"]);
  const showCom = hasRole(ctx.role, ["owner", "comercial"]);
  const showOp = hasRole(ctx.role, ["owner", "operacional", "tecnico"]);

  const funilMax = Math.max(1, ...m.funil.map((f) => f.count));

  // Alertas operacionais derivados das métricas (sem query extra)
  const alertas: {
    label: string;
    href: string;
    icon: typeof Boxes;
    tone: "danger" | "warning";
  }[] = [];
  if (showFin && m.vencidoReceber > 0)
    alertas.push({
      label: `${formatBRL(m.vencidoReceber)} vencido a receber`,
      href: "/financeiro/receber",
      icon: ArrowDownCircle,
      tone: "danger",
    });
  if (showOp && m.estoqueCritico > 0)
    alertas.push({
      label: `${m.estoqueCritico} ${m.estoqueCritico === 1 ? "produto abaixo" : "produtos abaixo"} do mínimo`,
      href: "/estoque",
      icon: Boxes,
      tone: "warning",
    });
  if (showOp && m.mipCritico > 0)
    alertas.push({
      label: `${m.mipCritico} ${m.mipCritico === 1 ? "ponto MIP crítico" : "pontos MIP críticos"}`,
      href: "/mip",
      icon: Radar,
      tone: "danger",
    });

  let delay = 0;
  const next = () => ({ animationDelay: `${(delay++) * 60}ms` }) as const;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {primeiroNome}
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {hojeLabel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {showOp && (
              <Chip tone="amber" icon={ClipboardList}>
                {m.osHoje} OS hoje
              </Chip>
            )}
            {showFin && m.aReceber > 0 && (
              <Chip tone="sky" icon={ArrowDownCircle}>
                {formatBRL(m.aReceber)} a receber
              </Chip>
            )}
            {showFin && m.vencidoReceber > 0 && (
              <Chip tone="rose" icon={AlertTriangle}>
                {formatBRL(m.vencidoReceber)} vencido
              </Chip>
            )}
            {showFin && m.mrr > 0 && (
              <Chip tone="emerald" icon={Wallet}>
                {formatBRL(m.mrr)}/mês
              </Chip>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
          {ROLE_LABELS[ctx.role]}
        </span>
      </div>

      {/* Ações rápidas — atalhos para os cadastros do dia a dia */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            { href: "/os", label: "Incluir nova OS", icon: Plus, show: showOp },
            { href: "/os?status=agendada", label: "Atender OS", icon: ClipboardList, show: showOp },
            { href: "/financeiro/pagar", label: "Pagar", icon: ArrowUpCircle, show: showFin },
            { href: "/financeiro/receber", label: "Receber", icon: ArrowDownCircle, show: showFin },
            { href: "/notas", label: "Notas fiscais", icon: FileText, show: showFin },
          ] as { href: string; label: string; icon: LucideIcon; show: boolean }[]
        )
          .filter((a) => a.show)
          .map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-medium text-foreground">{a.label}</span>
              </Link>
            );
          })}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showFin && (
          <>
            <KpiCard
              style={next()}
              icon={Wallet}
              label="MRR (contratos)"
              value={formatBRL(m.mrr)}
              hint={`${m.contratosAtivos} ${m.contratosAtivos === 1 ? "contrato ativo" : "contratos ativos"}`}
              href="/contratos"
              tone="emerald"
            />
            <KpiCard
              style={next()}
              icon={ArrowDownCircle}
              label="A receber"
              value={formatBRL(m.aReceber)}
              hint={m.vencidoReceber > 0 ? `${formatBRL(m.vencidoReceber)} vencido` : "em dia"}
              href="/financeiro/receber"
              tone={m.vencidoReceber > 0 ? "danger" : "sky"}
              spark={m.trend.map((p) => p.recebido)}
            />
            <KpiCard
              style={next()}
              icon={ArrowUpCircle}
              label="A pagar"
              value={formatBRL(m.aPagar)}
              href="/financeiro/pagar"
              tone="amber"
              spark={m.trend.map((p) => p.pago)}
            />
            <KpiCard
              style={next()}
              icon={Landmark}
              label="Resultado do mês"
              value={formatBRL(m.resultadoMes)}
              hint={`Receb. ${formatBRL(m.recebidoMes)} · Pago ${formatBRL(m.pagoMes)}`}
              tone={m.resultadoMes < 0 ? "danger" : "violet"}
              spark={m.trend.map((p) => p.recebido - p.pago)}
            />
          </>
        )}
        {showCom && (
          <>
            <KpiCard
              style={next()}
              icon={KanbanSquare}
              label="Conversão do funil"
              value={`${m.conversao}%`}
              hint={`${m.ganhos} ${m.ganhos === 1 ? "negócio ganho" : "negócios ganhos"}`}
              href="/funil"
              tone="violet"
            />
            <KpiCard
              style={next()}
              icon={Building2}
              label="Clientes ativos"
              value={String(m.clientesAtivos)}
              href="/clientes"
              tone="sky"
              spark={m.clientesTrend}
            />
          </>
        )}
        {showOp && (
          <>
            <KpiCard
              style={next()}
              icon={ClipboardList}
              label="OS de hoje"
              value={String(m.osHoje)}
              hint={m.osHoje > 0 ? "agendadas para hoje" : "nada agendado"}
              href="/os"
              tone={m.osHoje > 0 ? "amber" : "default"}
              spark={m.osTrend}
            />
            <KpiCard
              style={next()}
              icon={Boxes}
              label="Estoque crítico"
              value={String(m.estoqueCritico)}
              hint={m.estoqueCritico > 0 ? "abaixo do mínimo" : "níveis ok"}
              href="/estoque"
              tone={m.estoqueCritico > 0 ? "warning" : "cyan"}
            />
            <KpiCard
              style={next()}
              icon={Radar}
              label="Pontos MIP críticos"
              value={String(m.mipCritico)}
              hint={m.mipCritico > 0 ? "exigem ação" : "sob controle"}
              href="/mip"
              tone={m.mipCritico > 0 ? "danger" : "cyan"}
            />
          </>
        )}
      </div>

      {/* Fluxo de caixa (6 meses) */}
      {showFin && (
        <Panel
          style={next()}
          title="Fluxo de caixa" accent="emerald"
          action={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Recebido
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-warning" /> Pago
              </span>
            </div>
          }
        >
          <CashflowChart data={m.trend} />
        </Panel>
      )}

      {/* Funil + OS */}
      <div className="grid gap-5 lg:grid-cols-2">
        {showCom && (
          <Panel
            style={next()}
            title="Funil comercial" accent="violet"
            action={
              <Link
                href="/funil"
                className="inline-flex items-center gap-0.5 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Ver funil
                <ChevronsUpDown className="size-3.5 rotate-45" />
              </Link>
            }
          >
            {m.funil.every((f) => f.count === 0) ? (
              <EmptyHint>Nenhum negócio no funil ainda.</EmptyHint>
            ) : (
              <div className="space-y-2.5">
                {m.funil.map((f) => (
                  <div key={f.stage} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                      {STAGE_LABEL[f.stage]}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r transition-all",
                          stageBar[f.stage],
                        )}
                        style={{ width: `${Math.max(f.count > 0 ? 6 : 0, (f.count / funilMax) * 100)}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-medium tabular-nums">
                      {f.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {showOp && (
          <Panel
            style={next()}
            title="Ordens de serviço" accent="amber"
            action={
              <Link
                href="/os"
                className="inline-flex items-center gap-0.5 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Ver OS
                <ChevronsUpDown className="size-3.5 rotate-45" />
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(OS_STATUS_LABEL) as OsStatus[]).map((s) => (
                <Link
                  key={s}
                  href={`/os?status=${s}`}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", osDot[s])}
                    />
                    {OS_STATUS_LABEL[s]}
                  </span>
                  <span className="text-base font-semibold tabular-nums">
                    {m.osPorStatus[s] ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {/* Próximas OS */}
      {showOp && m.proximasOs.length > 0 && (
        <Panel
          style={next()}
          title="Próximas OS" accent="amber"
          action={
            <Link
              href="/os"
              className="inline-flex items-center gap-0.5 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Ver todas
              <ChevronsUpDown className="size-3.5 rotate-45" />
            </Link>
          }
        >
          <div className="divide-y divide-border/60">
            {m.proximasOs.map((o) => (
              <Link
                key={o.id}
                href={`/os/${o.id}`}
                className="group flex items-center justify-between gap-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">#{o.numero}</span>
                  <span className="truncate font-medium group-hover:text-primary">{o.cliente}</span>
                  {o.cidade && <span className="shrink-0 text-xs text-muted-foreground">· {o.cidade}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {o.scheduled_at ? new Date(o.scheduled_at).toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <span className={cn("size-2 rounded-full", osDot[o.status as OsStatus])} />
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {/* Oportunidades de receita: contratos a vencer + revisões a recontatar */}
      {(showFin || showCom) && (m.contratosVencendo.length > 0 || m.revisoesProximas.length > 0) && (
        <Panel style={next()} title="Oportunidades de receita" accent="emerald">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CalendarClock className="size-3.5" /> Contratos a vencer (30 dias)
              </h4>
              {m.contratosVencendo.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Nenhum nos próximos 30 dias.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {m.contratosVencendo.map((c) => (
                    <Link
                      key={c.id}
                      href={`/contratos/${c.id}`}
                      className="group flex items-center justify-between gap-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium group-hover:text-primary">{c.cliente}</span>
                        {c.titulo && <span className="text-xs text-muted-foreground"> · {c.titulo}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(c.vigencia_fim).toLocaleDateString("pt-BR")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RefreshCw className="size-3.5" /> Revisões a recontatar
              </h4>
              {m.revisoesProximas.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Nenhuma revisão próxima.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {m.revisoesProximas.map((r) => (
                    <Link
                      key={r.id}
                      href={`/os/${r.id}`}
                      className="group flex items-center justify-between gap-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium group-hover:text-primary">{r.cliente}</span>
                        {r.cidade && <span className="text-xs text-muted-foreground"> · {r.cidade}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(r.proxima_revisao_em).toLocaleDateString("pt-BR")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Alertas operacionais */}
      {(showFin || showOp) && (
        <Panel style={next()} title="Alertas operacionais">
          {alertas.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3.5">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Tudo sob controle — nenhum alerta pendente.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {alertas.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href + a.label}
                    href={a.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      a.tone === "danger"
                        ? "border-destructive/25 bg-destructive/8 hover:bg-destructive/12"
                        : "border-warning/25 bg-warning/8 hover:bg-warning/12",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        a.tone === "danger" ? "text-destructive" : "text-warning",
                      )}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {a.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </main>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
