// Blog B2B do Dedetech — para donos e gestores de dedetizadoras.
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  /** Data da última atualização real (dateModified no schema). Cai em `date` se ausente. */
  updated?: string;
  readingMin: number;
  category: string;
  cover: string;
  featured?: boolean;
  takeaways?: string[];
  body: Block[];
};

export const categories = ["Todos", "Gestão", "Comercial", "Financeiro", "Conformidade", "Operação"];

export const posts: Post[] = [
  {
    slug: "como-precificar-servico-dedetizacao",
    title: "Como precificar serviços de dedetização sem perder dinheiro",
    excerpt: "Muita dedetizadora cobra no 'achismo' e trabalha de graça. Veja como montar um preço que cobre custos e dá lucro.",
    date: "2026-05-30",
    readingMin: 6,
    category: "Financeiro",
    cover: "/blog/precificar.jpg",
    featured: true,
    takeaways: [
      "Calcule o custo por OS (produto + mão de obra + deslocamento).",
      "Inclua custos fixos rateados, não só o do serviço.",
      "Defina uma margem-alvo e precifique a partir dela.",
      "Contratos recorrentes melhoram a previsibilidade.",
    ],
    body: [
      { type: "p", text: "Precificar 'de cabeça' é um dos maiores erros de quem tem dedetizadora. Sem saber o custo real de cada atendimento, é fácil cobrar pouco e descobrir no fim do mês que o caixa não fecha." },
      { type: "h2", text: "Comece pelo custo por ordem de serviço" },
      { type: "p", text: "Some o que cada atendimento consome de verdade: produto utilizado (por diluição e m²), mão de obra do técnico (proporcional ao tempo), combustível e desgaste do veículo. Esse é o seu custo variável por OS." },
      { type: "h2", text: "Não esqueça dos custos fixos" },
      { type: "ul", items: [
        "Aluguel, internet, contador e softwares",
        "Salários e encargos da equipe administrativa",
        "Licenças, registros e EPI",
        "Marketing e impostos",
      ] },
      { type: "p", text: "Rateie os custos fixos pelo número de atendimentos do mês e some ao custo variável. Sobre esse total, aplique a margem de lucro que você quer. Aí sim você tem um preço que sustenta o negócio." },
      { type: "h2", text: "Como o Dedetech ajuda" },
      { type: "p", text: "O Dedetech calcula o custo por OS (produto + mão de obra + deslocamento) e mostra a rentabilidade por contrato, para você precificar com dados reais — não no achismo." },
    ],
  },
  {
    slug: "contratos-recorrentes-receita-previsivel",
    title: "Contratos recorrentes: como ter receita previsível na sua dedetizadora",
    excerpt: "Depender de serviço avulso é uma montanha-russa. Contratos periódicos dão previsibilidade e aumentam o valor do seu negócio.",
    date: "2026-05-28",
    readingMin: 5,
    category: "Comercial",
    cover: "/blog/contratos.jpg",
    featured: true,
    takeaways: [
      "Receita recorrente é mais previsível e valoriza a empresa.",
      "Ofereça planos mensais, trimestrais e semestrais.",
      "Automatize as visitas e a cobrança para não perder prazos.",
    ],
    body: [
      { type: "p", text: "Quem vive de serviço avulso conhece a montanha-russa: um mês cheio, outro vazio. Contratos recorrentes (manutenção periódica) resolvem isso — e transformam a dedetizadora num negócio mais estável e valioso." },
      { type: "h2", text: "Por que apostar em contratos" },
      { type: "ul", items: [
        "Receita previsível todo mês (MRR)",
        "Relacionamento de longo prazo com o cliente",
        "Menos esforço de venda a cada mês",
        "Empresa mais valiosa (receita recorrente vale mais)",
      ] },
      { type: "h2", text: "Como estruturar" },
      { type: "p", text: "Ofereça periodicidades (mensal, trimestral, semestral) com preço fechado e visitas programadas. O segredo é a consistência: a visita tem que acontecer na data certa e a cobrança tem que sair sozinha." },
      { type: "h2", text: "Automatize com o Dedetech" },
      { type: "p", text: "No Dedetech, você cadastra o contrato uma vez e o sistema gera as ordens de serviço e as cobranças recorrentes automaticamente, com alertas de reajuste e renovação." },
    ],
  },
  {
    slug: "vigilancia-sanitaria-dedetizadora",
    title: "Exigências da Vigilância Sanitária para dedetizadoras",
    excerpt: "Para operar legalmente, sua dedetizadora precisa cumprir uma série de requisitos. Veja os principais.",
    date: "2026-05-26",
    readingMin: 6,
    category: "Conformidade",
    cover: "/blog/vigilancia.jpg",
    takeaways: [
      "Licença da Vigilância Sanitária é obrigatória.",
      "É preciso ter um Responsável Técnico habilitado.",
      "Saneantes devem ter registro na ANVISA.",
      "O certificado de execução é exigido na fiscalização.",
    ],
    body: [
      { type: "p", text: "Controle de pragas é uma atividade regulada. Operar sem cumprir as exigências da Vigilância Sanitária expõe a empresa a multas e interdição — além de ser um risco à saúde pública." },
      { type: "h2", text: "Principais requisitos" },
      { type: "ul", items: [
        "Licença de funcionamento da Vigilância Sanitária",
        "Responsável Técnico (RT) com registro em conselho (CRBio, CRQ, etc.)",
        "Uso de saneantes registrados na ANVISA",
        "Emissão de certificado/comprovante de execução",
        "Controle de EPI e saúde ocupacional da equipe (NR-6, ASO)",
      ] },
      { type: "h2", text: "Documentação em dia evita dor de cabeça" },
      { type: "p", text: "Na fiscalização, é comum pedirem o certificado dos serviços com os produtos usados e o registro ANVISA. Ter isso organizado e rastreável é o que separa a empresa profissional da amadora." },
      { type: "p", text: "O Dedetech gera o certificado no formato correto e mantém a rastreabilidade de cada produto usado em cada serviço — pronto para a fiscalização." },
    ],
  },
  {
    slug: "certificado-de-dedetizacao-correto",
    title: "Como emitir o certificado de dedetização corretamente",
    excerpt: "O certificado é um documento regulado. Veja o que ele precisa conter para ter validade.",
    date: "2026-05-24",
    readingMin: 4,
    category: "Conformidade",
    cover: "/blog/certificado.jpg",
    takeaways: [
      "O certificado deve listar os produtos com registro ANVISA.",
      "Precisa dos dados e assinatura do Responsável Técnico.",
      "Deve informar praga-alvo, garantia e orientações.",
    ],
    body: [
      { type: "p", text: "O certificado (ou comprovante de execução) não é um papel qualquer — é um documento regulado que comprova o serviço. Se vier incompleto, perde a validade na fiscalização e na auditoria do cliente." },
      { type: "h2", text: "O que não pode faltar" },
      { type: "ul", items: [
        "Dados da empresa e nº de registro na Vigilância Sanitária",
        "Pragas-alvo controladas",
        "Produtos usados: nome, princípio ativo e registro ANVISA",
        "Orientação em caso de intoxicação e telefone do CIT",
        "Método, período de reentrada e prazo de garantia",
        "Nome, registro no conselho e assinatura do RT",
      ] },
      { type: "p", text: "Preencher tudo isso à mão a cada serviço é trabalhoso e dá erro. O Dedetech gera o certificado completo automaticamente ao finalizar a ordem de serviço." },
    ],
  },
  {
    slug: "controle-estoque-saneantes-anvisa",
    title: "Controle de estoque de saneantes: o que a ANVISA exige",
    excerpt: "Lote, validade e rastreabilidade não são opcionais. Entenda como controlar seu estoque do jeito certo.",
    date: "2026-05-22",
    readingMin: 5,
    category: "Operação",
    cover: "/blog/estoque.jpg",
    takeaways: [
      "Controle por lote e validade é obrigatório.",
      "Use FEFO: sai primeiro o que vence antes.",
      "Mantenha a rastreabilidade lote → serviço → cliente.",
    ],
    body: [
      { type: "p", text: "Saneantes são produtos controlados. Um estoque desorganizado leva a produto vencido, perda financeira e problema na fiscalização. O controle correto é por lote e validade." },
      { type: "h2", text: "Boas práticas de estoque" },
      { type: "ul", items: [
        "Registre cada lote com validade e nota de entrada",
        "Aplique FEFO (First Expire, First Out)",
        "Bloqueie o uso de produto vencido",
        "Saiba qual lote foi usado em qual serviço (rastreabilidade)",
      ] },
      { type: "p", text: "Essa rastreabilidade é exigida em auditorias e protege a empresa em caso de qualquer ocorrência. O Dedetech faz o controle de lote, validade e FEFO automaticamente, ligando cada produto à ordem de serviço e ao cliente." },
    ],
  },
  {
    slug: "5-sinais-dedetizadora-precisa-sistema",
    title: "5 sinais de que sua dedetizadora precisa de um sistema",
    excerpt: "Planilha e caderno seguram por um tempo. Veja os sinais de que chegou a hora de profissionalizar.",
    date: "2026-05-20",
    readingMin: 4,
    category: "Gestão",
    cover: "/blog/sistema.jpg",
    takeaways: [
      "Perder prazo de visita ou cobrança é sinal de alerta.",
      "Não saber quanto cada serviço dá de lucro é perigoso.",
      "Retrabalho e papelada consomem seu tempo.",
    ],
    body: [
      { type: "p", text: "Toda dedetizadora começa no caderno e na planilha. Mas a partir de certo ponto, isso vira gargalo. Veja se você já está nesses sinais:" },
      { type: "h2", text: "Os 5 sinais" },
      { type: "ul", items: [
        "Você já perdeu visita de contrato ou esqueceu de cobrar alguém",
        "Não sabe ao certo quanto cada serviço ou contrato dá de lucro",
        "A papelada das ordens de serviço se perde ou atrasa",
        "O técnico liga toda hora para tirar dúvida da agenda",
        "Na fiscalização, demora para achar certificado e rastreabilidade",
      ] },
      { type: "p", text: "Se você marcou dois ou mais, está perdendo dinheiro e tempo. Um sistema como o Dedetech organiza tudo — e se paga com o que você deixa de perder." },
    ],
  },
  {
    slug: "como-conseguir-mais-clientes-dedetizadora",
    title: "Como conseguir mais clientes para sua dedetizadora",
    excerpt: "Indicação é ótima, mas não dá para depender só dela. Veja como atrair clientes de forma previsível.",
    date: "2026-05-18",
    readingMin: 5,
    category: "Comercial",
    cover: "/blog/clientes.jpg",
    takeaways: [
      "Ter um site que aparece no Google é essencial hoje.",
      "Google e redes sociais geram clientes locais.",
      "Capture os contatos num funil, não só no WhatsApp.",
    ],
    body: [
      { type: "p", text: "Indicação é a melhor venda, mas é imprevisível. Para crescer com constância, a dedetizadora precisa aparecer onde o cliente procura: na internet." },
      { type: "h2", text: "Onde seu cliente te procura" },
      { type: "ul", items: [
        "Google: 'dedetizadora perto de mim', 'controle de escorpião [cidade]'",
        "Google Business Profile com avaliações",
        "Instagram e Facebook locais",
        "Indicações (que um bom serviço multiplica)",
      ] },
      { type: "h2", text: "Transforme visita em cliente" },
      { type: "p", text: "Não basta aparecer — é preciso capturar o contato e dar sequência. Um site com formulário que vira lead, organizado num funil, evita que a oportunidade se perca no meio das mensagens." },
      { type: "p", text: "Por isso o Dedetech já vem com um site profissional otimizado para o Google, com os pedidos caindo direto no seu funil de vendas." },
    ],
  },
  {
    slug: "mip-clientes-corporativos-cobrar-mais",
    title: "MIP: como atender clientes corporativos e cobrar mais",
    excerpt: "Indústrias e redes de alimentos pagam mais — mas exigem monitoramento e laudos. Veja como entrar nesse mercado.",
    date: "2026-05-16",
    readingMin: 5,
    category: "Operação",
    cover: "/blog/mip.jpg",
    takeaways: [
      "Clientes corporativos exigem MIP e laudos.",
      "Esse mercado paga mais e dá contratos longos.",
      "Monitoramento com QR Code profissionaliza o serviço.",
    ],
    body: [
      { type: "p", text: "Atender só residências limita o faturamento. Indústrias de alimentos, redes e condomínios pagam mais e fecham contratos longos — mas exigem o Manejo Integrado de Pragas (MIP) e documentação para as auditorias deles (ISO, ANVISA)." },
      { type: "h2", text: "O que esse cliente espera" },
      { type: "ul", items: [
        "Mapa de dispositivos (iscas e armadilhas) por unidade",
        "Leitura periódica e histórico de cada ponto",
        "Laudos de monitoramento para a auditoria",
        "Rastreabilidade e profissionalismo",
      ] },
      { type: "p", text: "Fazer isso no papel é inviável. O Dedetech traz o MIP com dispositivos por QR Code, leitura por visita e laudos prontos — o que abre a porta para você cobrar mais e disputar contratos corporativos." },
    ],
  },
  {
    slug: "planilha-x-sistema-dedetizadora",
    title: "Planilha x sistema: quando vale a pena trocar",
    excerpt: "A planilha é grátis, mas tem um custo escondido. Veja quando ela passa a atrapalhar mais do que ajuda.",
    date: "2026-05-14",
    readingMin: 4,
    category: "Gestão",
    cover: "/blog/planilha.jpg",
    takeaways: [
      "Planilha não avisa prazo nem cobra sozinha.",
      "O custo escondido é o seu tempo e o que você perde.",
      "Sistema se paga ao recuperar cobranças e contratos.",
    ],
    body: [
      { type: "p", text: "A planilha parece gratuita, mas tem um custo invisível: o seu tempo, os prazos que passam batido e as cobranças que ninguém faz. Em algum momento, ela trava o crescimento." },
      { type: "h2", text: "O que a planilha não faz" },
      { type: "ul", items: [
        "Não gera a visita do contrato na data certa",
        "Não cobra o cliente automaticamente",
        "Não funciona no celular do técnico em campo",
        "Não emite certificado nem nota fiscal",
        "Não mostra o lucro real por serviço",
      ] },
      { type: "p", text: "Quando você soma o que deixa de cobrar e o tempo que gasta organizando tudo na mão, o sistema sai mais barato que a planilha. O Dedetech foi feito exatamente para isso." },
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
export const relatedPosts = (post: Post, n = 3) =>
  posts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, n).concat(
    posts.filter((p) => p.slug !== post.slug && p.category !== post.category)
  ).slice(0, n);
