"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, LogOut, Loader2 } from "lucide-react";

import { baterPontoColaborador } from "@/app/(colaborador)/actions";
import { Button } from "@/components/ui/button";

export function PontoColaborador() {
  const router = useRouter();
  const [pending, setPending] = useState<"entrada" | "saida" | null>(null);

  async function bater(tipo: "entrada" | "saida") {
    setPending(tipo);
    const coords = await new Promise<{ lat: number | null; lng: number | null }>((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 5000 },
      );
    });
    const r = await baterPontoColaborador(tipo, coords.lat, coords.lng);
    if (r.ok) {
      toast.success(`Ponto de ${tipo} registrado.`);
      router.refresh();
    } else {
      toast.error("Não foi possível registrar o ponto.");
    }
    setPending(null);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="lg" className="h-14 text-base" onClick={() => bater("entrada")} disabled={pending !== null}>
        {pending === "entrada" ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />} Entrada
      </Button>
      <Button size="lg" variant="outline" className="h-14 text-base" onClick={() => bater("saida")} disabled={pending !== null}>
        {pending === "saida" ? <Loader2 className="size-5 animate-spin" /> : <LogOut className="size-5" />} Saída
      </Button>
    </div>
  );
}
