import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dedetech — Gestão sem pragas",
    short_name: "Dedetech",
    description: "Gestão para empresas de controle de pragas.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#08130f",
    theme_color: "#08130f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
