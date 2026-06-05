"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { Ponto } from "./map-loader";

const CAMADAS = ["os", "ponto", "cliente"] as const;
type Camada = (typeof CAMADAS)[number];

const COR: Record<Camada, string> = {
  os: "#10b981", // emerald — ordens de serviço
  ponto: "#38bdf8", // sky — check-ins de ponto
  cliente: "#a78bfa", // violet — clientes
};
const LABEL: Record<Camada, string> = {
  os: "Ordens de serviço",
  ponto: "Check-ins de ponto",
  cliente: "Clientes",
};

export default function OperacaoMap({ pontos }: { pontos: Ponto[] }) {
  const [ativo, setAtivo] = useState<Record<Camada, boolean>>({ os: true, ponto: true, cliente: true });

  const centro = useMemo<[number, number]>(() => {
    if (!pontos.length) return [-15.793, -47.882]; // Brasília/DF
    const lat = pontos.reduce((s, p) => s + p.lat, 0) / pontos.length;
    const lng = pontos.reduce((s, p) => s + p.lng, 0) / pontos.length;
    return [lat, lng];
  }, [pontos]);

  const contagem = useMemo(() => {
    const c: Record<Camada, number> = { os: 0, ponto: 0, cliente: 0 };
    for (const p of pontos) c[p.camada]++;
    return c;
  }, [pontos]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CAMADAS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setAtivo((a) => ({ ...a, [c]: !a[c] }))}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              ativo[c] ? "border-border bg-muted/40 text-foreground" : "border-border/40 text-muted-foreground opacity-60"
            }`}
          >
            <span className="size-2.5 rounded-full" style={{ background: COR[c] }} />
            {LABEL[c]} ({contagem[c]})
          </button>
        ))}
      </div>

      <div className="h-[600px] overflow-hidden rounded-xl border border-border/60">
        <MapContainer center={centro} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {CAMADAS.filter((c) => ativo[c]).map((c) => (
            <LayerGroup key={c}>
              {pontos
                .filter((p) => p.camada === c)
                .map((p) => (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat, p.lng]}
                    radius={7}
                    pathOptions={{ color: COR[c], fillColor: COR[c], fillOpacity: 0.7, weight: 1.5 }}
                  >
                    <Popup>
                      <strong>{p.titulo}</strong>
                      <br />
                      {p.sub}
                    </Popup>
                  </CircleMarker>
                ))}
            </LayerGroup>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
