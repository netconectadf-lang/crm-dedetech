"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function OsMapa({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return (
    <div className="h-56 overflow-hidden rounded-lg border border-border/60">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <CircleMarker
          center={[lat, lng]}
          radius={8}
          pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.7, weight: 2 }}
        >
          <Popup>{label}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
