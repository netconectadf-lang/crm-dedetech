"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/lib/format";

type Point = { date: string; spend: number; conversas: number };

type TooltipEntry = { name?: string; value?: number; color?: string };

const diaMes = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

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
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular-nums">
          <span
            className="size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">
            {p.name === "spend" ? "Gasto" : "Conversas"}:
          </span>
          <span className="font-medium text-foreground">
            {p.name === "spend" ? formatBRL(Number(p.value)) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function GastoConversasChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sem dados no período — a campanha ainda não veiculou.
      </div>
    );
  }
  const pontos = data.map((p) => ({ ...p, label: diaMes(p.date) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={pontos}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/50"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            yAxisId="gasto"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => `R$${v}`}
          />
          <YAxis
            yAxisId="conversas"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            yAxisId="gasto"
            dataKey="spend"
            name="spend"
            fill="var(--color-sky-500, #0ea5e9)"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
            opacity={0.85}
          />
          <Line
            yAxisId="conversas"
            dataKey="conversas"
            name="conversas"
            stroke="var(--color-emerald-400, #34d399)"
            strokeWidth={2}
            dot={false}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
