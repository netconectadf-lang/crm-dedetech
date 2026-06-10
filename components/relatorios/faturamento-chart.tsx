"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/lib/format";

export type FaturamentoPoint = { mes: string; faturado: number; recebido: number };

type TooltipEntry = { name?: string; value?: number; color?: string };

const compactBRL = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`;

const LABELS: Record<string, string> = { faturado: "Faturado", recebido: "Recebido" };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium capitalize text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular-nums">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{LABELS[p.name ?? ""] ?? p.name}:</span>
          <span className="font-medium text-foreground">{formatBRL(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

export function FaturamentoChart({
  data,
  highlight,
}: {
  data: FaturamentoPoint[];
  /** índice do mês (0-11) a destacar; os demais ficam esmaecidos */
  highlight?: number;
}) {
  const hasData = data.some((d) => d.faturado > 0 || d.recebido > 0);
  const op = (i: number) => (highlight == null || highlight === i ? 1 : 0.32);

  if (!hasData) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-dashed border-border/60 text-center">
        <p className="text-sm text-muted-foreground">Sem faturamento registrado no período.</p>
      </div>
    );
  }

  const totalFat = data.reduce((s, d) => s + d.faturado, 0);
  const totalRec = data.reduce((s, d) => s + d.recebido, 0);
  const summary = `Faturado ${formatBRL(totalFat)}, recebido ${formatBRL(totalRec)} no período.`;

  return (
    <div className="h-64 w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            className="capitalize"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            tickFormatter={compactBRL}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
          <Bar dataKey="faturado" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fillOpacity={op(i)} />
            ))}
          </Bar>
          <Bar dataKey="recebido" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fillOpacity={op(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
