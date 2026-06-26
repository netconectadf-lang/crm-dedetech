import { ImageResponse } from "next/og";

import { site } from "@/lib/site/site";

export const alt = `${site.name} — Sistema para Dedetizadoras`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagem de compartilhamento social (OG/Twitter) — tema dark esmeralda.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(120% 120% at 80% 0%, #0b2a20 0%, #08130f 55%)",
          color: "#e9f3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#12ce8e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#08130f",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            D
          </div>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#5eead4" }}>{site.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1.5,
          }}
        >
          <span>Sistema completo para</span>
          <span style={{ color: "#12ce8e" }}>dedetizadoras</span>
        </div>
        <div style={{ fontSize: 30, color: "#9fb4ab", marginTop: 32, maxWidth: 900 }}>
          Ordens de serviço, contratos recorrentes, estoque ANVISA, cobrança e NFS-e — tudo em um só lugar.
        </div>
        <div style={{ fontSize: 26, color: "#12ce8e", marginTop: 48, fontWeight: 600 }}>
          {`${site.tagline} · dedetech.com.br`}
        </div>
      </div>
    ),
    { ...size },
  );
}
