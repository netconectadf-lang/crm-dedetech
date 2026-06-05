"use client";

import dynamic from "next/dynamic";

const OsMapa = dynamic(() => import("./os-mapa"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground">
      Carregando mapa…
    </div>
  ),
});

export function OsMapaLoader(props: { lat: number; lng: number; label: string }) {
  return <OsMapa {...props} />;
}
