"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { addDias } from "@/lib/agenda";
import { Button } from "@/components/ui/button";

/** Navegação de semana com deep-link (?s=YYYY-MM-DD). */
export function SemanaNav({
  segunda,
  hojeSegunda,
  rotulo,
}: {
  segunda: string;
  hojeSegunda: string;
  rotulo: string;
}) {
  const router = useRouter();
  const ir = (ymd: string) => router.push(`/agenda?s=${ymd}`);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        aria-label="Semana anterior"
        onClick={() => ir(addDias(segunda, -7))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-44 text-center text-sm font-semibold tabular-nums">{rotulo}</span>
      <Button
        variant="outline"
        size="sm"
        aria-label="Próxima semana"
        onClick={() => ir(addDias(segunda, 7))}
      >
        <ChevronRight className="size-4" />
      </Button>
      {segunda !== hojeSegunda && (
        <Button variant="ghost" size="sm" onClick={() => ir(hojeSegunda)}>
          <CalendarDays className="size-4" /> Hoje
        </Button>
      )}
    </div>
  );
}
