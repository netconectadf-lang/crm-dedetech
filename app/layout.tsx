import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/providers/analytics";
import { PwaRegister } from "@/components/providers/pwa-register";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dedetech-crm.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dedetech — Sistema de gestão para dedetizadoras",
    template: "%s · Dedetech",
  },
  description:
    "O sistema completo para empresas de controle de pragas: funil de vendas, contratos recorrentes, ordens de serviço no celular, estoque com rastreabilidade, MIP com QR Code e financeiro — tudo num lugar só.",
  applicationName: "Dedetech",
  keywords: [
    "sistema para dedetizadora",
    "software de controle de pragas",
    "CRM para dedetizadora",
    "gestão de dedetização",
    "ordem de serviço dedetização",
    "MIP monitoramento integrado de pragas",
    "ERP controle de pragas",
  ],
  authors: [{ name: "Dedetech" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Dedetech",
    title: "Dedetech — Sistema de gestão para dedetizadoras",
    description:
      "Funil, contratos recorrentes, OS no celular, estoque rastreável, MIP com QR e financeiro. O ERP de campo das dedetizadoras.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dedetech — Sistema de gestão para dedetizadoras",
    description:
      "Funil, contratos, OS no celular, estoque, MIP com QR e financeiro — tudo num lugar só.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <PwaRegister />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
