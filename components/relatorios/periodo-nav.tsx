"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/**
 * Seletor de período com deep-link: modo Ano (?ano=) ou Mês (?ano=&mes=).
 * Stepper ‹ › navega ano a ano ou mês a mês (cruzando o ano).
 */
export function PeriodoNav({
  ano,
  mes,
  maxAno,
  mesAtual,
}: {
  ano: number;
  mes?: number; // 1-12, ausente = modo ano
  maxAno: number;
  mesAtual: number; // mês default ao entrar no modo Mês
}) {
  const router = useRouter();
  const ir = (a: number, m?: number) =>
    router.push(m ? `/relatorios?ano=${a}&mes=${m}` : `/relatorios?ano=${a}`);

  const modoMes = mes != null;

  function passo(delta: number) {
    if (!modoMes) {
      ir(ano + delta);
      return;
    }
    let m = mes! + delta;
    let a = ano;
    if (m < 1) { m = 12; a -= 1; }
    if (m > 12) { m = 1; a += 1; }
    ir(a, m);
  }

  const noFuturo = modoMes
    ? ano > maxAno || (ano === maxAno && (mes ?? 0) >= mesAtual)
    : ano >= maxAno;

  const valor = modoMes ? `${MESES_CURTO[mes! - 1]} ${ano}` : String(ano);

  return (
    <div className="flex items-center gap-2">
      {/* segmented Ano | Mês */}
      <div className="flex rounded-lg border border-border/60 bg-card/60 p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => ir(ano)}
          aria-pressed={!modoMes}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            !modoMes ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Ano
        </button>
        <button
          type="button"
          onClick={() => ir(ano, mes ?? mesAtual)}
          aria-pressed={modoMes}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            modoMes ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Mês
        </button>
      </div>

      {/* stepper */}
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-1">
        <Button variant="ghost" size="icon" className="size-8" aria-label="Período anterior" onClick={() => passo(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-20 text-center text-sm font-semibold tabular-nums">{valor}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Próximo período"
          disabled={noFuturo}
          onClick={() => passo(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
