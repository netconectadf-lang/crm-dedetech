import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";
import type { Variacao } from "@/lib/relatorios";

type Tone = "sky" | "emerald" | "violet" | "amber" | "rose" | "cyan";

const TONE: Record<Tone, { num: string; chip: string; bar: string }> = {
  sky: { num: "text-sky-300", chip: "bg-sky-500/15 text-sky-300 ring-sky-500/30", bar: "from-sky-400" },
  emerald: { num: "text-emerald-300", chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", bar: "from-emerald-400" },
  violet: { num: "text-violet-300", chip: "bg-violet-500/15 text-violet-300 ring-violet-500/30", bar: "from-violet-400" },
  amber: { num: "text-amber-300", chip: "bg-amber-500/15 text-amber-300 ring-amber-500/30", bar: "from-amber-400" },
  rose: { num: "text-rose-300", chip: "bg-rose-500/15 text-rose-300 ring-rose-500/30", bar: "from-rose-400" },
  cyan: { num: "text-cyan-300", chip: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30", bar: "from-cyan-400" },
};

/**
 * Cartão de métrica com valor grande, variação vs. período anterior (seta +
 * %, colorida por bem/mal) e sparkline de tendência no rodapé.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  deltaLabel,
  hint,
  spark,
  /** quando true, alta é ruim (ex.: inadimplência) — inverte a cor da variação */
  invertDelta = false,
  style,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  delta?: Variacao;
  deltaLabel?: string;
  hint?: string;
  spark?: number[];
  invertDelta?: boolean;
  style?: React.CSSProperties;
}) {
  const t = TONE[tone];

  // cor da variação: subir é bom (verde) salvo invertDelta; estável = neutro
  let deltaTone = "text-muted-foreground bg-muted/60";
  let DeltaIcon = Minus;
  if (delta && delta.dir !== "flat" && delta.pct != null) {
    const bom = invertDelta ? delta.dir === "down" : delta.dir === "up";
    deltaTone = bom
      ? "text-emerald-300 bg-emerald-500/15"
      : "text-rose-300 bg-rose-500/15";
    DeltaIcon = delta.dir === "up" ? ArrowUpRight : ArrowDownRight;
  }
  const deltaTxt =
    delta == null
      ? null
      : delta.pct == null
        ? "novo"
        : `${delta.pct > 0 ? "+" : ""}${delta.pct}%`;

  return (
    <div
      style={style}
      className={cn(
        "group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border/60",
        "bg-gradient-to-b from-card/90 to-card/55 p-5 backdrop-blur-sm",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
    >
      <span
        aria-hidden
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-70", t.bar)}
      />
      {spark && spark.length > 1 && (
        <Sparkline
          data={spark}
          className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-9 opacity-20", t.num)}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span className={cn("grid size-10 place-items-center rounded-xl ring-1", t.chip)}>
          <Icon className="size-5" />
        </span>
        {deltaTxt != null && (
          <span
            className={cn("flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums", deltaTone)}
            title={deltaLabel}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {deltaTxt}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-semibold leading-tight tabular-nums", t.num)}>{value}</p>
        {(hint ?? deltaLabel) && (
          <p className="text-xs text-muted-foreground">{hint ?? deltaLabel}</p>
        )}
      </div>
    </div>
  );
}
