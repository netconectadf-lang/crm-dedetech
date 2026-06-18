import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/public-url";

const SITE_URL = publicSiteUrl();

/** Áreas privadas (app autenticado) e rotas com token — fora do índice. */
const PRIVATE = [
  "/api/",
  "/auth/",
  "/portal",
  "/proposta/",
  "/nps/",
  "/convite/",
  "/dashboard",
  "/funil",
  "/contratos",
  "/chamados",
  "/os",
  "/estoque",
  "/mip",
  "/comunicacao",
  "/financeiro",
  "/clientes",
  "/servicos",
  "/produtos",
  "/fornecedores",
  "/funcionarios",
  "/veiculos",
  "/plano-de-contas",
  "/rh",
  "/equipe",
  "/auditoria",
  "/lgpd",
  "/configuracoes",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
