"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { visibleSections } from "@/lib/navigation";
import type { AppRole } from "@/lib/types";

export function Sidebar({ role }: { role: AppRole | null }) {
  const pathname = usePathname();
  const sections = visibleSections(role);

  return (
    <nav className="flex flex-col gap-4 p-3">
      {sections.map((section, i) => (
        <div key={section.titulo ?? i} className="flex flex-col gap-1">
          {section.titulo && (
            <span className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {section.titulo}
            </span>
          )}
          {section.itens.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-700 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
