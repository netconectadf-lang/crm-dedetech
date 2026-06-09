"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPinned } from "lucide-react";

import { geocodificarClientesLote } from "@/app/(app)/clientes/geocode-actions";
import { Button } from "@/components/ui/button";

export function GeocodeButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [progresso, setProgresso] = useState<string | null>(null);

  function rodar() {
    start(async () => {
      let totalOk = 0;
      let guard = 0; // trava de segurança
      // processa lote a lote até não restar pendente
      while (guard < 100) {
        guard++;
        const r = await geocodificarClientesLote();
        totalOk += r.ok;
        setProgresso(`${totalOk} localizado(s) · ${r.restantes} restante(s)…`);
        if (r.restantes === 0 || r.processados === 0) break;
      }
      setProgresso(null);
      toast.success(`Geocoding concluído: ${totalOk} cliente(s) localizado(s).`);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size={size} disabled={pending} onClick={rodar}>
      <MapPinned className="size-4" />
      {pending ? (progresso ?? "Buscando coordenadas…") : "Buscar coordenadas dos endereços"}
    </Button>
  );
}
