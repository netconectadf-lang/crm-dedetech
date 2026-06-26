import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { site } from "@/lib/site/site";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { JsonLd } from "@/components/site/json-ld";
import { graph, organizationNode, webSiteNode } from "@/lib/site/schema";

// --font-sans (Plus Jakarta) já vem do root layout do CRM; aqui só o display.
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Sistema para Dedetizadoras`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "sistema para dedetizadora",
    "software para controle de pragas",
    "programa para dedetizadora",
    "CRM para dedetizadora",
    "ordem de serviço dedetização",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Sistema para Dedetizadoras`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Sistema para Dedetizadoras`,
    description: site.description,
  },
  alternates: { canonical: site.url },
  robots: { index: true, follow: true },
};

// Schema global: grafo conectado Organization + WebSite (@id reutilizável)
const globalJsonLd = graph(organizationNode(), webSiteNode());

export const viewport: Viewport = { themeColor: "#07ad79" };

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${display.variable} flex min-h-screen flex-col bg-bg text-cream antialiased`}>
      <JsonLd data={globalJsonLd} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
