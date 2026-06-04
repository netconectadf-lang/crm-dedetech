"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/lib/format";

type Point = { mes: string; recebido: number; pago: number };

type TooltipEntry = { name?: string; value?: number; color?: string };

const compactBRL = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`;

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
          <span
            className="size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">
            {p.name === "recebido" ? "Recebido" : "Pago"}:
          </span>
          <span className="font-medium text-foreground">
            {formatBRL(Number(p.value))}
          </span>
        </p>
      ))}
    </div>
  );
}

export function CashflowChart({ data }: { data: Point[] }) {
  const hasData = data.some((d) => d.recebido > 0 || d.pago > 0);

  if (!hasData) {
    return (
      <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border/60 text-center">
        <p className="text-sm text-muted-foreground">
          Sem movimentação de caixa nos últimos 6 meses.
        </p>
      </div>
    );
  }

  const totalRec = data.reduce((s, d) => s + d.recebido, 0);
  const totalPago = data.reduce((s, d) => s + d.pago, 0);
  const summary = `Fluxo de caixa dos últimos 6 meses: total recebido ${formatBRL(
    totalRec,
  )}, total pago ${formatBRL(totalPago)}.`;

  return (
    <div className="h-56 w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
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
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--color-border)" }}
          />
          <Area
            type="monotone"
            dataKey="recebido"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#gradRecebido)"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="pago"
            stroke="var(--color-warning)"
            strokeWidth={2}
            fill="url(#gradPago)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
