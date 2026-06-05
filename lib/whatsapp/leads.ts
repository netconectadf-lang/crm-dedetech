/**
 * Classificador de conversas por PALAVRAS-CHAVE (sem IA, custo zero) para achar
 * leads de dedetização / prestação de serviço nas conversas do WhatsApp.
 */

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // tira acentos
}

// palavras SEM acento (o texto também é normalizado antes de comparar)
const PALAVRAS: { peso: number; termos: string[] }[] = [
  {
    peso: 3, // serviço explícito — sinal forte
    termos: [
      "dedetiza", "dedetizacao", "dedetizadora", "desratiza", "descupiniza",
      "descupinizacao", "sanitiza", "sanitizacao", "higieniza", "pulveriza",
      "controle de praga", "caixa d agua", "caixa dagua", "limpeza de caixa",
      "bebedouro", "controle de roedor", "mip",
    ],
  },
  {
    peso: 2, // praga citada
    termos: [
      "barata", "rato", "ratos", "camundongo", "cupim", "cupins", "formiga",
      "escorpiao", "aranha", "pulga", "carrapato", "mosquito", "pombo",
      "morcego", "percevejo", "traca", "praga", "pragas", "inseto", "roedor",
      "marimbondo", "abelha", "lacraia",
    ],
  },
  {
    peso: 1, // intenção comercial
    termos: [
      "orcamento", "valor", "quanto custa", "quanto fica", "preco", "agendar",
      "agendamento", "visita", "contratar", "atende", "voces fazem", "vcs fazem",
      "faz dedetizacao", "tem como", "garantia", "metro quadrado",
    ],
  },
];

export type Pontuacao = { score: number; matched: string[] };

/** Pontua um texto (quanto maior, mais provável que seja um lead de serviço). */
export function pontuarConversa(texto: string): Pontuacao {
  const t = normalizar(texto);
  const matched = new Set<string>();
  let score = 0;
  for (const { peso, termos } of PALAVRAS) {
    for (const termo of termos) {
      if (t.includes(termo)) {
        matched.add(termo);
        score += peso;
      }
    }
  }
  return { score, matched: [...matched] };
}
