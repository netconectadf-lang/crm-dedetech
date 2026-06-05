import Link from "next/link";
import { ChevronsUpDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Tone =
  | "default"
  | "ok"
  | "danger"
  | "warning"
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo";

type ToneStyle = { num: string; chip: string; bar: string; hover: string };

const TONE: Record<Tone, ToneStyle> = {
  default: {
    num: "text-foreground",
    chip: "bg-muted/70 text-muted-foreground ring-border/60",
    bar: "from-muted-foreground/40",
    hover: "hover:border-border hover:shadow-black/40",
  },
  ok: {
    num: "text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    bar: "from-emerald-400",
    hover: "hover:border-emerald-500/40 hover:shadow-emerald-500/25",
  },
  emerald: {
    num: "text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    bar: "from-emerald-400",
    hover: "hover:border-emerald-500/40 hover:shadow-emerald-500/25",
  },
  sky: {
    num: "text-sky-300",
    chip: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    bar: "from-sky-400",
    hover: "hover:border-sky-500/40 hover:shadow-sky-500/25",
  },
  violet: {
    num: "text-violet-300",
    chip: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
    bar: "from-violet-400",
    hover: "hover:border-violet-500/40 hover:shadow-violet-500/25",
  },
  amber: {
    num: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    bar: "from-amber-400",
    hover: "hover:border-amber-500/40 hover:shadow-amber-500/25",
  },
  warning: {
    num: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    bar: "from-amber-400",
    hover: "hover:border-amber-500/40 hover:shadow-amber-500/25",
  },
  rose: {
    num: "text-rose-300",
    chip: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    bar: "from-rose-400",
    hover: "hover:border-rose-500/40 hover:shadow-rose-500/25",
  },
  danger: {
    num: "text-rose-300",
    chip: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    bar: "from-rose-400",
    hover: "hover:border-rose-500/40 hover:shadow-rose-500/25",
  },
  cyan: {
    num: "text-cyan-300",
    chip: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
    bar: "from-cyan-400",
    hover: "hover:border-cyan-500/40 hover:shadow-cyan-500/25",
  },
  indigo: {
    num: "text-indigo-300",
    chip: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
    bar: "from-indigo-400",
    hover: "hover:border-indigo-500/40 hover:shadow-indigo-500/25",
  },
};

export function KpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "default",
  style,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  icon: LucideIcon;
  tone?: Tone;
  style?: React.CSSProperties;
}) {
  const t = TONE[tone];
  const inner = (
    <div
      style={style}
      className={cn(
        "group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-5",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
        href && "transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-18px]",
        href && t.hover,
      )}
    >
      {/* barra de acento no topo */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-70",
          t.bar,
        )}
      />
      <div className="flex items-start justify-between">
        <span className={cn("grid size-10 place-items-center rounded-xl ring-1", t.chip)}>
          <Icon className="size-5" />
        </span>
        {href && (
          <ChevronsUpDown className="size-4 rotate-45 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={cn("text-2xl font-semibold tabular-nums leading-tight", t.num)}>
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground tabular-nums">{hint}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function Panel({
  title,
  action,
  className,
  children,
  style,
  accent,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** cor do título/realce do painel */
  accent?: Tone;
}) {
  // classes literais (Tailwind não detecta classes geradas em runtime)
  const PANEL_DOT: Record<Tone, string> = {
    default: "bg-primary",
    ok: "bg-emerald-400",
    emerald: "bg-emerald-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    warning: "bg-amber-400",
    rose: "bg-rose-400",
    danger: "bg-rose-400",
    cyan: "bg-cyan-400",
    indigo: "bg-indigo-400",
  };
  const dot = accent ? PANEL_DOT[accent] : "bg-primary";
  return (
    <section
      style={style}
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-card/80 p-5",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className={cn("h-3.5 w-1 rounded-full", dot)} aria-hidden />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
