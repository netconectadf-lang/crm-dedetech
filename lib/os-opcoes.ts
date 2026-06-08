// Opções da Nova OS: "principais" mostradas por padrão + "ver mais" expande.

/** Tipos de imóvel — não há catálogo no banco; lista fixa. */
export const TIPOS_IMOVEL_PRINCIPAIS = ["Casa", "Apartamento", "Loja", "Condomínio"];
export const TIPOS_IMOVEL_MAIS = [
  "Galpão",
  "Indústria",
  "Restaurante",
  "Escola",
  "Hospital",
  "Escritório",
  "Supermercado",
  "Hotel",
  "Sítio / Chácara",
  "Terreno",
];

/** Pragas mais comuns — usadas para destacar do catálogo (resto fica em "ver mais"). */
export const PRAGAS_PRINCIPAIS = [
  "Barata",
  "Formiga",
  "Escorpião",
  "Rato",
  "Cupim",
  "Mosquito",
  "Aranha",
  "Pulga",
];

/** Estruturas/áreas mais comuns. */
export const ESTRUTURAS_PRINCIPAIS = [
  "Cozinha",
  "Banheiro",
  "Quarto",
  "Sala",
  "Quintal",
  "Garagem",
  "Caixa d'água",
  "Telhado",
];

/** Um serviço é "dedetização" (mostra pragas) se o nome casar com isto. */
export function ehDedetizacao(nomeServico: string | null | undefined): boolean {
  if (!nomeServico) return false;
  return /dedet|praga|inseto|controle de praga/i.test(nomeServico);
}
