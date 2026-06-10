"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Seletor de ano com deep-link (?ano=) — navegável por teclado e Back/Forward. */
export function AnoNav({ ano, maxAno }: { ano: number; maxAno: number }) {
  const router = useRouter();
  const ir = (a: number) => router.push(`/relatorios?ano=${a}`);

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Ano anterior"
        onClick={() => ir(ano - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-14 text-center text-sm font-semibold tabular-nums">{ano}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Próximo ano"
        disabled={ano >= maxAno}
        onClick={() => ir(ano + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
