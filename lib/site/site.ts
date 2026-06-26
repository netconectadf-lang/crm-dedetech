// Configuração e conteúdo do Dedetech (SaaS para dedetizadoras)
export const site = {
  name: "Dedetech",
  tagline: "Gestão sem pragas",
  description:
    "O sistema completo para sua dedetizadora: ordens de serviço no celular, contratos recorrentes, estoque com rastreabilidade ANVISA, cobrança automática e nota fiscal — tudo em um só lugar.",
  url: "https://dedetech.com.br",
  email: "contato@dedetech.com.br",
  phone: "(61) 99142-1131",
  whatsapp: "https://wa.me/5561991421131?text=Ol%C3%A1!%20Quero%20conhecer%20o%20Dedetech",
  // Sistema web (CRM) — projeto dedetech-crm no mesmo team Vercel
  app: "https://dedetech-crm.vercel.app",
  login: "https://dedetech-crm.vercel.app/login",
  // Confirmação de e-mail/login finaliza no CRM (resolve sessão cross-domain)
  authCallback: "https://dedetech-crm.vercel.app/auth/callback?next=/dashboard",
  // Cadastro acontece numa página da própria vitrine
  signup: "/comecar",
} as const;

// Perfis sociais OFICIAIS da Dedetech. Preencha para ativar o `sameAs` no schema
// (sinal de entidade que faz a IA/Google reconhecerem a marca). Ex.:
//   "https://www.instagram.com/dedetech",
//   "https://www.linkedin.com/company/dedetech",
//   "https://www.facebook.com/dedetech",
export const socialProfiles: string[] = [
  "https://www.instagram.com/dedetechbr",
];

// Autor editorial do blog (E-E-A-T). TROQUE pelo nome do responsável real pelo
// conteúdo (fundador/especialista) e, idealmente, preencha `sameAs` com o LinkedIn.
export const author = {
  name: "Equipe Dedetech",
  role: "Especialistas em gestão de dedetizadoras",
  knowsAbout: [
    "Controle de pragas",
    "Gestão de dedetizadoras",
    "Dedetização",
    "Conformidade ANVISA e Vigilância Sanitária",
  ],
  sameAs: [] as string[],
};

export type Feature = {
  slug: string;
  name: string;
  short: string;
  icon: string;
  highlight?: boolean;
  category: string;
  long: string;
  bullets: string[];
  image?: string;
};

export const featureCategories = ["Campo", "Comercial", "Financeiro", "Operação"];

export const features: Feature[] = [
  {
    slug: "ordens-de-servico",
    name: "Ordens de Serviço no celular",
    short: "O técnico preenche a ficha em campo (com foto, assinatura e GPS) — funciona até sem internet.",
    icon: "clipboard",
    image: "/feat/feat-os.jpg",
    category: "Campo",
    long: "A ficha de prestação de visita é digital e preenchida pelo próprio técnico no celular, mesmo sem sinal. Ao finalizar, o Dedetech dispara em cascata a baixa de estoque, o certificado, a cobrança e a nota.",
    bullets: ["Funciona offline e sincroniza sozinho", "Foto, assinatura do cliente e geolocalização", "Produtos com lote e diluição vinculados ao estoque", "Certificado e comprovante gerados na hora"],
  },
  {
    slug: "contratos-recorrentes",
    name: "Contratos recorrentes",
    short: "Gere visitas e cobranças automáticas dos contratos mensais. Sua receita previsível, no piloto automático.",
    icon: "repeat",
    highlight: true,
    image: "/feat/feat-contratos.jpg",
    category: "Comercial",
    long: "Cadastre o contrato uma vez e o sistema cuida do resto: gera as ordens de serviço na periodicidade certa, dispara a cobrança recorrente e avisa sobre reajustes e renovações. Sua receita vira previsível.",
    bullets: ["Visitas geradas automaticamente", "Cobrança recorrente por boleto/PIX", "Reajuste anual e alertas de renovação", "Rentabilidade por contrato"],
  },
  {
    slug: "estoque-anvisa",
    name: "Estoque com rastreabilidade ANVISA",
    short: "Controle de lotes, validade e FEFO. Saiba qual produto foi usado em cada serviço.",
    icon: "box",
    image: "/feat/feat-estoque.jpg",
    category: "Operação",
    long: "Controle total de saneantes por lote e validade, com FEFO automático (sai primeiro o que vence antes) e bloqueio de produto vencido. Rastreabilidade completa: do lote ao serviço e ao cliente.",
    bullets: ["Lotes, validade e FEFO automático", "Alertas de vencimento (30/60/90 dias)", "Rastreabilidade lote → OS → cliente", "Consumo teórico x real por serviço"],
  },
  {
    slug: "financeiro-cobranca",
    name: "Financeiro e cobrança automática",
    short: "Contas a pagar e receber, fluxo de caixa e boleto/PIX com baixa automática via Asaas.",
    icon: "wallet",
    image: "/feat/feat-financeiro.jpg",
    category: "Financeiro",
    long: "Toda a parte financeira num lugar: contas a pagar e receber, fluxo de caixa, DRE e cobrança automática por boleto e PIX com baixa na hora que o cliente paga. Régua de cobrança inclusa.",
    bullets: ["Contas a pagar e receber", "Boleto/PIX automático (Asaas)", "Baixa automática ao receber", "Fluxo de caixa, DRE e inadimplência"],
  },
  {
    slug: "nota-fiscal",
    name: "Nota fiscal de serviço (NFSe)",
    short: "Emita a NFSe direto da ordem de serviço, em múltiplos municípios.",
    image: "/feat/feat-nfse.jpg",
    icon: "doc",
    category: "Financeiro",
    long: "Emita a nota fiscal de serviço direto da ordem de serviço, em vários municípios, com o XML e o DANFE guardados e enviados ao cliente automaticamente.",
    bullets: ["Emissão multi-município", "Direto da ordem de serviço", "XML e DANFE armazenados", "Envio automático ao cliente"],
  },
  {
    slug: "mip-monitoramento",
    name: "MIP e monitoramento",
    short: "Mapa de iscas e armadilhas com QR Code e laudos — ideal para clientes corporativos.",
    icon: "target",
    image: "/feat/feat-mip.jpg",
    category: "Campo",
    long: "Manejo Integrado de Pragas para clientes corporativos: mapa de dispositivos (iscas e armadilhas) com QR Code, leitura por visita e laudos de monitoramento — o documento que o cliente leva para a auditoria dele.",
    bullets: ["Dispositivos com QR Code", "Leitura por visita (consumo/captura)", "Série temporal e pontos críticos", "Laudo de monitoramento em PDF"],
  },
  {
    slug: "gps-frota",
    name: "GPS da frota",
    short: "Acompanhe a equipe em tempo real e comprove o atendimento com o cruzamento GPS x ordem de serviço.",
    icon: "map",
    image: "/feat/feat-gps.jpg",
    category: "Operação",
    long: "Acompanhe a frota em tempo real, veja o histórico de rotas e comprove o atendimento cruzando a posição do GPS com o endereço e o horário da ordem de serviço.",
    bullets: ["Mapa em tempo real", "Histórico de rotas e KM", "Geofence vinculada à OS", "Alertas de manutenção"],
  },
  {
    slug: "site-captacao",
    name: "Seu site que capta clientes",
    short: "Cada empresa ganha um site profissional, otimizado para o Google, que envia os pedidos direto para o seu funil.",
    icon: "globe",
    highlight: true,
    image: "/feat/feat-site.jpg",
    category: "Comercial",
    long: "Mais do que gerir por dentro, o Dedetech coloca a sua empresa na internet: um site profissional, otimizado para o Google, com seus serviços e cidades atendidas — e cada pedido cai direto no seu funil de vendas.",
    bullets: ["Otimizado para o Google (SEO)", "Páginas por serviço e cidade", "Formulário que vira lead no funil", "Sua marca, suas cores e contatos"],
  },
];

// FAQ por funcionalidade — alimenta AEO/GEO (perguntas reais do ICP) e FAQPage schema.
export const featureFaqs: Record<string, { q: string; a: string }[]> = {
  "ordens-de-servico": [
    { q: "A ordem de serviço funciona sem internet?", a: "Sim. O técnico preenche a ficha de visita no celular mesmo sem sinal; os dados sincronizam automaticamente quando a rede voltar." },
    { q: "O que é gerado quando o técnico finaliza a OS?", a: "Ao finalizar, o Dedetech dispara em cascata a baixa de estoque, o certificado, a cobrança e a nota fiscal — tudo a partir da mesma ordem de serviço." },
    { q: "A ficha tem foto e assinatura do cliente?", a: "Sim. A ficha digital registra foto, assinatura do cliente e geolocalização do atendimento, servindo como comprovante do serviço." },
  ],
  "contratos-recorrentes": [
    { q: "Como os contratos geram visitas automaticamente?", a: "Você cadastra o contrato uma vez com a periodicidade desejada e o sistema gera as ordens de serviço na frequência certa, sem precisar lançar visita por visita." },
    { q: "A cobrança recorrente é automática?", a: "Sim. O contrato dispara a cobrança recorrente por boleto ou PIX e dá baixa automática quando o cliente paga." },
    { q: "Dá para acompanhar a rentabilidade por contrato?", a: "Sim. O Dedetech mostra a rentabilidade de cada contrato e avisa sobre reajustes anuais e renovações." },
  ],
  "estoque-anvisa": [
    { q: "O estoque controla lote e validade?", a: "Sim. Cada saneante é controlado por lote e validade, com FEFO automático (sai primeiro o que vence antes) e bloqueio de produto vencido." },
    { q: "Como funciona a rastreabilidade ANVISA?", a: "O sistema rastreia do lote até o serviço e o cliente, mostrando exatamente qual produto e lote foram usados em cada atendimento." },
    { q: "Recebo alertas de vencimento?", a: "Sim. Há alertas de vencimento em 30, 60 e 90 dias, além da comparação entre consumo teórico e real por serviço." },
  ],
  "financeiro-cobranca": [
    { q: "Como funciona a cobrança por boleto e PIX?", a: "A cobrança é automática via Asaas: o sistema emite boleto/PIX e dá baixa na hora em que o cliente paga, sem conferência manual." },
    { q: "O Dedetech mostra fluxo de caixa e DRE?", a: "Sim. Você tem contas a pagar e receber, fluxo de caixa, DRE e acompanhamento de inadimplência em um só lugar." },
    { q: "Tem régua de cobrança para inadimplentes?", a: "Sim. A régua de cobrança envia lembretes automáticos, reduzindo a inadimplência sem trabalho manual." },
  ],
  "nota-fiscal": [
    { q: "A NFSe é emitida direto da ordem de serviço?", a: "Sim. A nota fiscal de serviço é emitida a partir da própria OS, sem redigitar dados." },
    { q: "Funciona em vários municípios?", a: "Sim. A emissão é multi-município, e o XML e o DANFE ficam armazenados e são enviados automaticamente ao cliente." },
  ],
  "mip-monitoramento": [
    { q: "Para que serve o MIP e monitoramento?", a: "O Manejo Integrado de Pragas atende clientes corporativos com mapa de dispositivos (iscas e armadilhas) por QR Code, leitura por visita e laudos — o documento que o cliente leva para a auditoria dele." },
    { q: "Gera laudo de monitoramento?", a: "Sim. O sistema produz laudo de monitoramento em PDF, com série temporal e pontos críticos identificados." },
  ],
  "gps-frota": [
    { q: "Como o GPS comprova o atendimento?", a: "O Dedetech cruza a posição do GPS com o endereço e o horário da ordem de serviço, comprovando que a visita aconteceu no local e na hora certos." },
    { q: "Dá para ver a equipe em tempo real?", a: "Sim. Você acompanha a frota em tempo real, com histórico de rotas, KM rodado e alertas de manutenção." },
  ],
  "site-captacao": [
    { q: "O site incluso é profissional de verdade?", a: "Sim. Cada empresa ganha um site profissional otimizado para o Google, com seus serviços e cidades atendidas — não é um modelo genérico." },
    { q: "Os pedidos do site caem onde?", a: "O formulário do site vira lead direto no seu funil de vendas dentro do Dedetech, com sua marca, cores e contatos." },
  ],
};

export type Segment = { name: string; desc: string; plan: string; points: string[] };
export const segments: Segment[] = [
  {
    name: "Autônomo e MEI",
    desc: "Você que está começando e quer profissionalizar a operação sem complicação.",
    plan: "Starter",
    points: ["Organize clientes e ordens de serviço", "Atenda pelo celular, até offline", "Tenha um site profissional desde o dia 1"],
  },
  {
    name: "Pequena e média dedetizadora",
    desc: "Você que já tem equipe e quer crescer com receita previsível.",
    plan: "Pro",
    points: ["Contratos recorrentes e cobrança automática", "Estoque ANVISA e financeiro completo", "Nota fiscal e WhatsApp automatizado"],
  },
  {
    name: "Operação com frota e contratos corporativos",
    desc: "Você que atende indústria, condomínios e grandes contas.",
    plan: "Enterprise",
    points: ["MIP e monitoramento com laudos", "GPS da frota e portal do cliente", "RH, ponto e suporte prioritário"],
  },
];

export type ClientType = { name: string; desc: string; icon: string };
export const clientTypes: ClientType[] = [
  { name: "Residencial", desc: "Atendimento rápido, com certificado e garantia para o cliente final.", icon: "home" },
  { name: "Comercial e restaurantes", desc: "Certificado e laudo para a Vigilância Sanitária, com monitoramento.", icon: "store" },
  { name: "Indústria alimentícia", desc: "MIP com rastreabilidade e laudos para auditorias ISO e ANVISA.", icon: "factory" },
  { name: "Condomínios", desc: "Contratos recorrentes, histórico e relatórios para a administração.", icon: "building" },
];

export const steps = [
  { n: "01", t: "Cadastre sua empresa", d: "Crie a conta da sua dedetizadora em minutos e convide sua equipe." },
  { n: "02", t: "Coloque a operação no sistema", d: "Clientes, contratos, serviços e estoque em um só lugar — o técnico já atende pelo celular." },
  { n: "03", t: "Cresça no automático", d: "Contratos geram visitas e cobranças sozinhos, e seu site novo traz mais clientes." },
];

export const benefits = [
  "Acabe com a papelada e as planilhas soltas",
  "Receita recorrente previsível com contratos",
  "Conformidade ANVISA e Vigilância Sanitária",
  "Dinheiro entra sozinho (boleto/PIX automático)",
  "Equipe e atendimentos sob controle",
  "Mais clientes pelo site otimizado",
];

export type Plan = {
  name: string;
  price: string;
  period: string;
  for: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  ctaHref?: string;
};

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "R$ 149",
    period: "/mês",
    for: "Autônomo ou empresa começando",
    features: ["Até 2 usuários", "Cadastros e clientes", "Ordens de serviço no celular", "Agenda e funil", "Site profissional incluso"],
    cta: "Começar",
    ctaHref: site.signup,
  },
  {
    name: "Pro",
    price: "R$ 349",
    period: "/mês",
    for: "Pequena e média dedetizadora",
    features: ["Até 8 usuários", "Tudo do Starter", "Contratos recorrentes", "Estoque ANVISA + financeiro", "Cobrança automática (Asaas)", "Nota fiscal (NFSe)", "WhatsApp automatizado"],
    highlight: true,
    cta: "Testar o Pro",
    ctaHref: site.signup,
  },
  {
    name: "Enterprise",
    price: "R$ 799",
    period: "/mês",
    for: "Operação com frota e contratos corporativos",
    features: ["Usuários ilimitados", "Tudo do Pro", "MIP e monitoramento", "GPS da frota", "Portal do cliente", "RH e ponto", "Suporte prioritário"],
    cta: "Falar com vendas",
    ctaHref: site.whatsapp,
  },
];

export const faqs = [
  {
    q: "Preciso instalar algo?",
    a: "Não. O Dedetech roda no navegador e no celular. O técnico atende pelo próprio celular, mesmo sem internet — os dados sincronizam quando voltar a rede.",
  },
  {
    q: "Serve para a minha dedetizadora?",
    a: "Sim. O Dedetech atende desde o autônomo até empresas com frota e contratos corporativos. Você escolhe o plano conforme o tamanho da operação.",
  },
  {
    q: "Como funciona a nota fiscal e a cobrança?",
    a: "A NFSe é emitida direto da ordem de serviço (multi-município) e a cobrança por boleto/PIX é automática, com baixa quando o cliente paga.",
  },
  {
    q: "O site incluso é de verdade?",
    a: "Sim. Cada empresa ganha um site profissional, otimizado para o Google, com seus serviços e áreas de atendimento — e os pedidos caem direto no seu funil de vendas.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Cada empresa tem seus dados totalmente isolados, com backup automático e em conformidade com a LGPD.",
  },
];
