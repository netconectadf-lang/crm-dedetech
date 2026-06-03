export type ContractPeriodicity =
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";

export type ContractStatus = "ativo" | "suspenso" | "cancelado" | "encerrado";
export type AdjustmentIndex = "nenhum" | "igpm" | "ipca";

export const PERIODICITY_MONTHS: Record<ContractPeriodicity, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

export const PERIODICITY_LABEL: Record<ContractPeriodicity, string> = {
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
};

export const INDEX_LABEL: Record<AdjustmentIndex, string> = {
  nenhum: "Sem reajuste",
  igpm: "IGP-M",
  ipca: "IPCA",
};

/**
 * Próximas N datas de visita/faturamento a partir da vigência, no dia de
 * faturamento, respeitando a periodicidade. Datas no futuro (>= hoje).
 */
export function proximasVisitas(
  vigenciaInicio: string,
  diaFaturamento: number,
  periodicidade: ContractPeriodicity,
  count = 6,
  hoje = new Date(),
): Date[] {
  const step = PERIODICITY_MONTHS[periodicidade];
  const inicio = new Date(`${vigenciaInicio}T00:00:00`);
  const dia = Math.min(Math.max(diaFaturamento, 1), 28);

  // primeira ocorrência no mês da vigência
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), dia);
  const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  // avança até a primeira data >= hoje
  let guard = 0;
  while (cursor < hojeZero && guard < 240) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + step, dia);
    guard++;
  }

  const datas: Date[] = [];
  for (let i = 0; i < count; i++) {
    datas.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + step, dia);
  }
  return datas;
}
