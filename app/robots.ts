import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dedetech-crm.vercel.app";

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
