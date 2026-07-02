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

/**
 * Data de faturamento de um contrato que cai no mês de referência (ano/mês,
 * mês 1-12), respeitando vigência e periodicidade. Retorna null se não há
 * faturamento devido nesse mês (ex.: contrato trimestral fora do ciclo, ou
 * mês anterior ao início / posterior ao fim da vigência).
 */
export function faturamentoNoMes(
  vigenciaInicio: string,
  diaFaturamento: number,
  periodicidade: ContractPeriodicity,
  ano: number,
  mes: number, // 1-12
  vigenciaFim?: string | null,
): Date | null {
  const step = PERIODICITY_MONTHS[periodicidade];
  const inicio = new Date(`${vigenciaInicio}T00:00:00`);
  const dia = Math.min(Math.max(diaFaturamento, 1), 28);

  const primeiroDoMesRef = new Date(ano, mes - 1, 1);
  const ultimoDoMesRef = new Date(ano, mes, 0); // dia 0 do próximo mês = último dia

  // primeira ocorrência (mês da vigência, no dia de faturamento)
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), dia);

  // avança em passos de `step` meses até alcançar/passar o mês de referência
  let guard = 0;
  while (cursor < primeiroDoMesRef && guard < 600) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + step, dia);
    guard++;
  }

  // a ocorrência precisa cair dentro do mês de referência
  if (cursor < primeiroDoMesRef || cursor > ultimoDoMesRef) return null;

  // respeita o fim da vigência
  if (vigenciaFim) {
    const fim = new Date(`${vigenciaFim}T00:00:00`);
    if (cursor > fim) return null;
  }
  return cursor;
}

/** Formata um Date local como "YYYY-MM-DD" (sem timezone shift). */
export function ymdLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Primeira data de visita de um contrato (dia de faturamento >= início da vigência). */
export function primeiraVisita(vigenciaInicio: string, diaFaturamento: number): Date {
  const inicio = new Date(`${vigenciaInicio}T00:00:00`);
  const dia = Math.min(Math.max(diaFaturamento, 1), 28);
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), dia);
  if (cursor < inicio) cursor = new Date(inicio.getFullYear(), inicio.getMonth() + 1, dia);
  return cursor;
}

/** Avança uma data de visita em 1 período (respeitando o dia de faturamento). */
export function avancarPeriodo(
  d: Date,
  periodicidade: ContractPeriodicity,
  diaFaturamento: number,
): Date {
  const dia = Math.min(Math.max(diaFaturamento, 1), 28);
  return new Date(d.getFullYear(), d.getMonth() + PERIODICITY_MONTHS[periodicidade], dia);
}

/**
 * Quantos aniversários anuais completos transcorreram entre o início da
 * vigência e a data de referência (ex.: a data de vencimento). Usado para saber
 * quantas vezes o reajuste anual já incidiu sobre o contrato.
 */
export function aniversariosCompletos(vigenciaInicio: string, ref: Date): number {
  const inicio = new Date(`${vigenciaInicio}T00:00:00`);
  let anos = ref.getFullYear() - inicio.getFullYear();
  const antesDoAniversario =
    ref.getMonth() < inicio.getMonth() ||
    (ref.getMonth() === inicio.getMonth() && ref.getDate() < inicio.getDate());
  if (antesDoAniversario) anos -= 1;
  return Math.max(anos, 0);
}

/**
 * Aplica o reajuste anual composto sobre o valor base, uma vez por aniversário
 * completo. `percentualAnual` é o índice acumulado do período (IGP-M/IPCA, % a.a.).
 * Sem ciclos ou sem percentual, devolve o valor base. Arredonda a 2 casas.
 */
export function valorReajustado(
  valorBase: number,
  ciclos: number,
  percentualAnual: number,
): number {
  if (!percentualAnual || ciclos <= 0) return valorBase;
  const fator = Math.pow(1 + percentualAnual / 100, ciclos);
  return Math.round(valorBase * fator * 100) / 100;
}
