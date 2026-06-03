"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LogIn, LogOut, Loader2 } from "lucide-react";

import { registrarPonto } from "@/app/(app)/rh/actions";
import { Button } from "@/components/ui/button";

export function PontoButton({ employeeId }: { employeeId: string }) {
  const [pending, setPending] = useState<"entrada" | "saida" | null>(null);

  async function bater(tipo: "entrada" | "saida") {
    setPending(tipo);
    const coords = await new Promise<{ lat: number | null; lng: number | null }>(
      (resolve) => {
        if (!navigator.geolocation) return resolve({ lat: null, lng: null });
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({ lat: null, lng: null }),
          { timeout: 5000 },
        );
      },
    );
    try {
      await registrarPonto(employeeId, tipo, coords.lat, coords.lng);
      toast.success(`Ponto de ${tipo} registrado.`);
    } catch {
      toast.error("Não foi possível registrar o ponto.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => bater("entrada")} disabled={pending !== null}>
        {pending === "entrada" ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Entrada
      </Button>
      <Button variant="outline" onClick={() => bater("saida")} disabled={pending !== null}>
        {pending === "saida" ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        Saída
      </Button>
    </div>
  );
}
