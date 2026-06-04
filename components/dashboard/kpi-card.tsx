import Link from "next/link";
import { ChevronsUpDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "default" | "danger" | "ok" | "warning";

const toneText: Record<Tone, string> = {
  default: "text-foreground",
  danger: "text-destructive",
  ok: "text-primary",
  warning: "text-warning",
};

const toneIcon: Record<Tone, string> = {
  default: "bg-muted/70 text-muted-foreground ring-border/60",
  danger: "bg-destructive/12 text-destructive ring-destructive/25",
  ok: "bg-primary/12 text-primary ring-primary/25",
  warning: "bg-warning/12 text-warning ring-warning/25",
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
  const inner = (
    <div
      style={style}
      className={cn(
        "group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-5",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
        href &&
          "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_var(--color-primary)]",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg ring-1",
            toneIcon[tone],
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        {href && (
          <ChevronsUpDown className="size-4 rotate-45 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums leading-tight",
            toneText[tone],
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="text-xs text-muted-foreground tabular-nums">{hint}</p>
        )}
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
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
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
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
