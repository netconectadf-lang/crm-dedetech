"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { visibleSections, type NavItem } from "@/lib/navigation";
import type { AppRole } from "@/lib/types";

const STORAGE = "dedetech-nav-open";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary/12 text-foreground ring-1 ring-primary/25"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      />
      {item.label}
    </Link>
  );
}

export function Sidebar({ role }: { role: AppRole | null }) {
  const pathname = usePathname();
  const sections = visibleSections(role);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const temAtivo = (itens: NavItem[]) => itens.some((i) => isActive(i.href));

  // override do usuário por seção; default = seção contém a rota ativa.
  // lemos o localStorage uma vez no mount (sistema externo).
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
        // sem título (Dashboard) — sempre visível
        if (!section.titulo) {
          return (
            <div key={i} className="flex flex-col gap-0.5">
              {section.itens.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} />
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
                {SectionIcon && (
                  <SectionIcon className="size-4 shrink-0 text-muted-foreground/60" />
                )}
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
                  <NavLink key={item.href} item={item} active={isActive(item.href)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
