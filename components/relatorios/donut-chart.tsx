"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type DonutSlice = { label: string; value: number; color: string };

type TooltipEntry = { name?: string; value?: number; payload?: DonutSlice };

function fmt(v: number, total: number) {
  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
  return `${v.toLocaleString("pt-BR")} · ${pct}%`;
}

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="flex items-center gap-2 tabular-nums">
        <span className="size-2 rounded-full" style={{ background: p.payload?.color }} />
        <span className="font-medium text-foreground">{p.name}</span>
        <span className="text-muted-foreground">{fmt(Number(p.value), total)}</span>
      </p>
    </div>
  );
}

/**
 * Donut acessível com total no centro e legenda à direita (valor + %).
 * `unidade` rotula o total central (ex.: "OS", "contas").
 */
export function DonutChart({
  data,
  unidade = "",
  centerLabel,
  empty = "Sem dados no período.",
}: {
  data: DonutSlice[];
  unidade?: string;
  centerLabel?: string;
  empty?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="grid h-48 place-items-center rounded-lg border border-dashed border-border/60 text-center">
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }

  const resumo = data.map((d) => `${d.label}: ${fmt(d.value, total)}`).join("; ");

  return (
    <div className="flex items-center gap-4" role="img" aria-label={resumo}>
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{total.toLocaleString("pt-BR")}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {centerLabel ?? unidade}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.label}</span>
            <span className="shrink-0 tabular-nums font-medium">{fmt(d.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
