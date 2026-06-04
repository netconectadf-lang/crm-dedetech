"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Pause, Loader2, CheckCircle2 } from "lucide-react";

import { dispararProxima } from "@/app/(app)/whatsapp/campanhas/actions";
import { Button } from "@/components/ui/button";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Disparador({
  campanhaId,
  intervaloSegundos,
  total,
  enviadosIniciais,
  falhasIniciais,
  pendentesIniciais,
}: {
  campanhaId: string;
  intervaloSegundos: number;
  total: number;
  enviadosIniciais: number;
  falhasIniciais: number;
  pendentesIniciais: number;
}) {
  const router = useRouter();
  const [rodando, setRodando] = useState(false);
  const [enviados, setEnviados] = useState(enviadosIniciais);
  const [falhas, setFalhas] = useState(falhasIniciais);
  const [pendentes, setPendentes] = useState(pendentesIniciais);
  const pararRef = useRef(false);

  const feitos = enviados + falhas;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const concluido = pendentes === 0 && total > 0;

  async function iniciar() {
    if (pendentes === 0) return;
    setRodando(true);
    pararRef.current = false;

    while (!pararRef.current) {
      const r = await dispararProxima(campanhaId);
      if (r.erro && !r.enviado && r.restantes === 0 && !r.concluido) {
        toast.error(r.erro);
        break;
      }
      if (r.enviado) setEnviados((n) => n + 1);
      else if (!r.concluido) setFalhas((n) => n + 1);
      setPendentes(r.restantes);

      if (r.concluido) {
        toast.success("Campanha concluída!");
        break;
      }
      await sleep(Math.max(2, intervaloSegundos) * 1000);
    }

    setRodando(false);
    router.refresh();
  }

  function parar() {
    pararRef.current = true;
    setRodando(false);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Progresso do disparo</span>
        <span className="tabular-nums text-muted-foreground">
          {feitos}/{total} ({pct}%)
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-300">✓ {enviados} enviados</span>
        {falhas > 0 && <span className="text-rose-300">✗ {falhas} falhas</span>}
        <span>⏳ {pendentes} pendentes</span>
      </div>

      <div className="flex gap-2">
        {concluido ? (
          <span className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="size-4" /> Campanha concluída
          </span>
        ) : rodando ? (
          <Button onClick={parar} variant="outline" size="sm">
            <Pause className="size-4" /> Pausar
          </Button>
        ) : (
          <Button onClick={iniciar} size="sm" disabled={pendentes === 0}>
            {feitos > 0 ? <Play className="size-4" /> : <Play className="size-4" />}
            {feitos > 0 ? "Continuar disparo" : "Iniciar disparo"}
          </Button>
        )}
        {rodando && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Enviando… (intervalo {intervaloSegundos}s)
          </span>
        )}
      </div>
    </div>
  );
}
