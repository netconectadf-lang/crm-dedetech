import Link from "next/link";

import { requireTenant, hasRole } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/data/dashboard";
import { formatBRL } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/funil";
import { OS_STATUS_LABEL, OS_STATUS_TONE, type OsStatus } from "@/lib/os";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard" };

function Kpi({
  label,
  value,
  hint,
  href,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "danger" | "ok";
}) {
  const inner = (
    <Card className={href ? "transition-colors hover:border-teal-300" : ""}>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            tone === "danger" && "text-rose-600",
            tone === "ok" && "text-emerald-600",
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const ctx = await requireTenant();
  const m = await getDashboardMetrics();
  const primeiroNome = ctx.fullName?.split(" ")[0] ?? "bem-vindo";

  const showFin = hasRole(ctx.role, ["owner", "financeiro"]);
  const showCom = hasRole(ctx.role, ["owner", "comercial"]);
  const showOp = hasRole(ctx.role, ["owner", "operacional", "tecnico"]);

  const funilMax = Math.max(1, ...m.funil.map((f) => f.count));
  const stageTone: Record<string, string> = {
    lead: "bg-slate-400",
    contato: "bg-sky-400",
    diagnostico: "bg-indigo-400",
    orcamento: "bg-amber-400",
    negociacao: "bg-purple-400",
    ganho: "bg-emerald-500",
    perdido: "bg-rose-400",
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {primeiroNome} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral · você está como <strong>{ROLE_LABELS[ctx.role]}</strong>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showFin && (
          <>
            <Kpi label="MRR (contratos)" value={formatBRL(m.mrr)} hint={`${m.contratosAtivos} ativos`} href="/contratos" />
            <Kpi label="A receber" value={formatBRL(m.aReceber)} hint={m.vencidoReceber > 0 ? `${formatBRL(m.vencidoReceber)} vencido` : "em dia"} href="/financeiro/receber" tone={m.vencidoReceber > 0 ? "danger" : undefined} />
            <Kpi label="A pagar" value={formatBRL(m.aPagar)} href="/financeiro/pagar" />
            <Kpi label="Resultado do mês" value={formatBRL(m.resultadoMes)} hint={`Receb. ${formatBRL(m.recebidoMes)} · Pago ${formatBRL(m.pagoMes)}`} tone={m.resultadoMes < 0 ? "danger" : "ok"} />
          </>
        )}
        {showCom && (
          <>
            <Kpi label="Conversão do funil" value={`${m.conversao}%`} hint={`${m.ganhos} ganhos`} href="/funil" />
            <Kpi label="Clientes ativos" value={String(m.clientesAtivos)} href="/clientes" />
          </>
        )}
        {showOp && (
          <>
            <Kpi label="OS de hoje" value={String(m.osHoje)} href="/os" />
            <Kpi label="Estoque crítico" value={String(m.estoqueCritico)} href="/estoque" tone={m.estoqueCritico > 0 ? "danger" : undefined} />
            <Kpi label="Pontos MIP críticos" value={String(m.mipCritico)} href="/mip" tone={m.mipCritico > 0 ? "danger" : undefined} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {showCom && (
          <Card>
            <CardHeader><CardTitle className="text-base">Funil comercial</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {m.funil.map((f) => (
                <div key={f.stage} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-muted-foreground">{STAGE_LABEL[f.stage]}</span>
                  <div className="h-5 flex-1 rounded bg-muted">
                    <div className={cn("h-5 rounded", stageTone[f.stage])} style={{ width: `${(f.count / funilMax) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{f.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {showOp && (
          <Card>
            <CardHeader><CardTitle className="text-base">Ordens de serviço por status</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(Object.keys(OS_STATUS_LABEL) as OsStatus[]).map((s) => (
                <Link key={s} href={`/os?status=${s}`} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", OS_STATUS_TONE[s])}>
                  {OS_STATUS_LABEL[s]}: <span className="tabular-nums">{m.osPorStatus[s] ?? 0}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
