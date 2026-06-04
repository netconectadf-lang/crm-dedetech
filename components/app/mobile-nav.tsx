"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/app/sidebar";
import type { AppRole } from "@/lib/types";

/** Gatilho de navegação para telas pequenas — abre a sidebar num drawer. */
export function MobileNav({ role }: { role: AppRole | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-64 gap-0 bg-card p-0"
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_18px_-2px_var(--color-primary)]">
            D
          </span>
          <SheetTitle className="font-semibold tracking-tight">
            Dedetech
            <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              crm
            </span>
          </SheetTitle>
        </div>

        {/* Fecha o drawer só ao clicar num link (não ao expandir uma seção) */}
        <div
          className="flex-1 overflow-y-auto"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <Sidebar role={role} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
