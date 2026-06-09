import "server-only";

import type { IbsCbs } from "@/lib/nfse-gov/types";

/**
 * Correlação oficial (cTribNac → cNBS) para os serviços típicos de uma
 * dedetizadora. Fonte: tabela de correlação do Sistema Nacional NFS-e
 * (Correlacao_TribNac_NBS_cClassTribIBSCBS_CSTIBSCBS_IndOp.xlsx).
 */
const NBS_POR_TRIB: Record<string, string> = {
  "071301": "118032100", // Dedetização, desinsetização (extermínio de pragas)
  "071302": "118032100", // Desinfecção, imunização, higienização
  "071303": "118032100", // Desratização
  "071304": "118032100", // Pulverização
  "071305": "118032100", // Controle de pragas
  "071001": "118031000", // Limpeza/manutenção de vias, parques, jardins
  "071002": "118031000", // Limpeza/manutenção de imóveis, piscinas
  "071008": "118031000", // Limpeza de imóveis (caixa d'água/reservatório)
};

/** cNBS correspondente ao código de tributação nacional (se conhecido). */
export function nbsPorTrib(cTribNac: string): string | undefined {
  return NBS_POR_TRIB[cTribNac];
}

/**
 * Grupo IBS/CBS padrão para serviços de dedetização/limpeza no Simples
 * Nacional (tributação integral). Todos os subitens de 7.10 e 7.13 caem em
 * CST 000 / cClassTrib 000001 / cIndOp 020201 (serviço sobre bem imóvel).
 * Valores fiscais — confirmar com o contador antes de produção.
 */
export function ibsCbsPadrao(): IbsCbs {
  return {
    finNFSe: "0", // NFS-e regular
    cIndOp: "020201", // serviço prestado fisicamente sobre bem imóvel
    indDest: "0", // destinatário é o próprio tomador
    cst: "000", // tributação integral
    cClassTrib: "000001", // tributadas integralmente pelo IBS e CBS
  };
}
