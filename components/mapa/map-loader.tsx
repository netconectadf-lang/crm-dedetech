"use client";

import dynamic from "next/dynamic";

export type Ponto = {
  id: string;
  camada: "os" | "ponto" | "cliente";
  lat: number;
  lng: number;
  titulo: string;
  sub: string;
};

// Leaflet só roda no cliente — carregado sem SSR.
const OperacaoMap = dynamic(() => import("./operacao-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground">
      Carregando mapa…
    </div>
  ),
});

export function MapaLoader({ pontos }: { pontos: Ponto[] }) {
  return <OperacaoMap pontos={pontos} />;
}
