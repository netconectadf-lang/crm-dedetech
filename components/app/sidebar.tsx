"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { visibleSections, featureForHref, type NavItem } from "@/lib/navigation";
import { useEntitlements } from "@/lib/entitlements/provider";
import type { AppRole } from "@/lib/types";

const STORAGE = "dedetech-nav-open";

type AccentStyle = { sec: string; bar: string; bg: string; icon: string };

const ACCENT: Record<string, AccentStyle> = {
  violet: { sec: "text-violet-400/80", bar: "bg-violet-400 shadow-violet-500/50", bg: "bg-violet-500/12 ring-violet-500/30", icon: "text-violet-300" },
  amber: { sec: "text-amber-400/80", bar: "bg-amber-400 shadow-amber-500/50", bg: "bg-amber-500/12 ring-amber-500/30", icon: "text-amber-300" },
  emerald: { sec: "text-emerald-400/80", bar: "bg-emerald-400 shadow-emerald-500/50", bg: "bg-emerald-500/12 ring-emerald-500/30", icon: "text-emerald-300" },
  sky: { sec: "text-sky-400/80", bar: "bg-sky-400 shadow-sky-500/50", bg: "bg-sky-500/12 ring-sky-500/30", icon: "text-sky-300" },
  cyan: { sec: "text-cyan-400/80", bar: "bg-cyan-400 shadow-cyan-500/50", bg: "bg-cyan-500/12 ring-cyan-500/30", icon: "text-cyan-300" },
  rose: { sec: "text-rose-400/80", bar: "bg-rose-400 shadow-rose-500/50", bg: "bg-rose-500/12 ring-rose-500/30", icon: "text-rose-300" },
  indigo: { sec: "text-indigo-400/80", bar: "bg-indigo-400 shadow-indigo-500/50", bg: "bg-indigo-500/12 ring-indigo-500/30", icon: "text-indigo-300" },
};

const DEFAULT_ACCENT: AccentStyle = {
  sec: "text-muted-foreground/60",
  bar: "bg-primary shadow-primary/50",
  bg: "bg-primary/12 ring-primary/25",
  icon: "text-primary",
};

function NavLink({ item, active, accent, locked }: { item: NavItem; active: boolean; accent: AccentStyle; locked?: boolean }) {
  const Icon = item.icon;
  if (locked) {
    return (
      <div
        title="Disponível em outro plano de assinatura"
        aria-disabled="true"
        className="group relative flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted-foreground/40"
      >
        <Icon className="size-[18px] shrink-0 text-muted-foreground/40" />
        <span className="flex-1">{item.label}</span>
        <Lock className="size-3.5 shrink-0 text-muted-foreground/50" />
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? cn("text-foreground ring-1", accent.bg)
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {active && (
        <span className={cn("absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full shadow-[0_0_10px]", accent.bar)} />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? accent.icon : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      />
      {item.label}
    </Link>
  );
}

export function Sidebar({ role }: { role: AppRole | null }) {
  const pathname = usePathname();
  const sections = visibleSections(role);
  const { can } = useEntitlements();

  const isLocked = (href: string) => {
    const feat = featureForHref(href);
    return feat ? !can(feat) : false;
  };
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const temAtivo = (itens: NavItem[]) => itens.some((i) => isActive(i.href));

  const [aberto, setAberto] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let salvo: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) salvo = JSON.parse(raw);
    } catch {
      /* ignora */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync inicial do localStorage
    setAberto(salvo);
  }, []);

  function alternar(titulo: string, estaAberto: boolean) {
    setAberto((o) => {
      const next = { ...o, [titulo]: !estaAberto };
      try {
        localStorage.setItem(STORAGE, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  }

  return (
    <nav className="flex flex-col gap-1.5 p-3">
      {sections.map((section, i) => {
        const acc = (section.accent && ACCENT[section.accent]) || DEFAULT_ACCENT;

        // sem título (Dashboard) — sempre visível
        if (!section.titulo) {
          return (
            <div key={i} className="flex flex-col gap-0.5">
              {section.itens.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} accent={DEFAULT_ACCENT} locked={isLocked(item.href)} />
              ))}
            </div>
          );
        }

        const open = aberto[section.titulo] ?? temAtivo(section.itens);
        const SectionIcon = section.icon;
        return (
          <div key={section.titulo} className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => alternar(section.titulo!, open)}
              aria-expanded={open}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/75 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span className="flex items-center gap-2">
                {SectionIcon && <SectionIcon className={cn("size-4 shrink-0", acc.sec)} />}
                {section.titulo}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-200",
                  open ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {open && (
              <div className="flex flex-col gap-0.5">
                {section.itens.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href)} accent={acc} locked={isLocked(item.href)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
