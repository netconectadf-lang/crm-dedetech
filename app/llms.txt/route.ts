import { site } from "@/lib/site/site";

// "Sitemap curado para LLMs" (GEO): ajuda ChatGPT/Perplexity/Claude a achar e
// citar as páginas certas do Dedetech. Servido em /llms.txt (estático).
export const dynamic = "force-static";

const U = site.url;

const FUNCIONALIDADES: [string, string][] = [
  ["ordens-de-servico", "Ordens de serviço no celular — agende, execute e emita o certificado em campo"],
  ["contratos-recorrentes", "Contratos recorrentes — receita previsível com visitas e cobranças automáticas"],
  ["estoque-anvisa", "Estoque com rastreabilidade ANVISA — lotes, validade e saneantes"],
  ["financeiro-cobranca", "Financeiro e cobrança automática — PIX, boleto e fluxo de caixa"],
  ["nota-fiscal", "Nota fiscal de serviço (NFS-e) — emissão integrada"],
  ["mip-monitoramento", "MIP e monitoramento — dispositivos com QR e laudos"],
  ["gps-frota", "GPS e frota — rota dos técnicos e controle de veículos"],
  ["site-captacao", "Site de captação — página para o cliente agendar"],
];

const BLOG: [string, string][] = [
  ["como-precificar-servico-dedetizacao", "Como precificar serviços de dedetização sem perder dinheiro"],
  ["contratos-recorrentes-receita-previsivel", "Contratos recorrentes: como ter receita previsível na sua dedetizadora"],
  ["vigilancia-sanitaria-dedetizadora", "Exigências da Vigilância Sanitária para dedetizadoras"],
  ["certificado-de-dedetizacao-correto", "Como emitir o certificado de dedetização corretamente"],
  ["controle-estoque-saneantes-anvisa", "Controle de estoque de saneantes: o que a ANVISA exige"],
  ["5-sinais-dedetizadora-precisa-sistema", "5 sinais de que sua dedetizadora precisa de um sistema"],
  ["como-conseguir-mais-clientes-dedetizadora", "Como conseguir mais clientes para sua dedetizadora"],
  ["mip-clientes-corporativos-cobrar-mais", "MIP: como atender clientes corporativos e cobrar mais"],
  ["planilha-x-sistema-dedetizadora", "Planilha x sistema: quando vale a pena trocar"],
];

export function GET() {
  const body = `# Dedetech — Sistema para Dedetizadoras
> ${site.description}

O Dedetech é um software/CRM de gestão feito para empresas de dedetização e controle de pragas (dedetizadoras). Substitui caderno, planilha e WhatsApp por um sistema único: ordens de serviço no celular, contratos recorrentes, estoque com rastreabilidade ANVISA, financeiro com cobrança automática e nota fiscal de serviço (NFS-e).

## Páginas principais
- [Início](${U}): visão geral do sistema para dedetizadoras
- [Funcionalidades](${U}/funcionalidades): todos os recursos do sistema
- [Para quem é](${U}/para-quem): por porte (autônomo, pequena/média, frota/corporativo) e tipo de cliente
- [Começar grátis](${U}/comecar): criar conta no Dedetech
- [Contato](${U}/contato): falar com a equipe

## Funcionalidades
${FUNCIONALIDADES.map(([s, d]) => `- [${d.split(" — ")[0]}](${U}/funcionalidades/${s}): ${d.split(" — ")[1] ?? d}`).join("\n")}

## Blog (conteúdo para donos de dedetizadora)
${BLOG.map(([s, t]) => `- [${t}](${U}/blog/${s})`).join("\n")}

## Contato
- WhatsApp: ${site.phone}
- E-mail: ${site.email}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
