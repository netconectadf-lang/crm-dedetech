import { cn } from "@/lib/utils";
import type { Tone } from "@/components/dashboard/kpi-card";

export type BarRow = {
  label: string;
  /** valor que dimensiona a barra (relativo ao maior) */
  value: number;
  /** texto exibido à direita (já formatado) */
  display: string;
  /** texto secundário discreto (ex.: "12 OS") */
  sub?: string;
};

const BAR_BG: Record<string, string> = {
  sky: "bg-sky-500/70",
  violet: "bg-violet-500/70",
  emerald: "bg-emerald-500/70",
  amber: "bg-amber-500/70",
  rose: "bg-rose-500/70",
  cyan: "bg-cyan-500/70",
  indigo: "bg-indigo-500/70",
  default: "bg-primary/70",
};

/**
 * Lista de barras horizontais para rankings. Cada linha mostra o rótulo,
 * uma barra proporcional ao maior valor e o número formatado à direita.
 */
export function BarList({
  rows,
  tone = "sky",
  emptyLabel = "Sem dados no período.",
}: {
  rows: BarRow[];
  tone?: Tone;
  emptyLabel?: string;
}) {
  if (!rows.length) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  const bar = BAR_BG[tone] ?? BAR_BG.default;

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-foreground">{r.label}</span>
            <span className="shrink-0 tabular-nums font-medium text-foreground">
              {r.display}
              {r.sub && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{r.sub}</span>
              )}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn("h-full rounded-full", bar)}
              style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
