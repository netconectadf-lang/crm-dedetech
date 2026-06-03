export type AbsenceType = "ferias" | "atestado" | "licenca" | "folga" | "falta";
export type AbsenceStatus = "solicitada" | "aprovada" | "recusada";
export type ExamType = "admissional" | "periodico" | "demissional" | "retorno" | "mudanca";

export const ABSENCE_TYPE_LABEL: Record<AbsenceType, string> = {
  ferias: "Férias",
  atestado: "Atestado",
  licenca: "Licença",
  folga: "Folga",
  falta: "Falta",
};

export const ABSENCE_STATUS_LABEL: Record<AbsenceStatus, string> = {
  solicitada: "Solicitada",
  aprovada: "Aprovada",
  recusada: "Recusada",
};

export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  demissional: "Demissional",
  retorno: "Retorno ao trabalho",
  mudanca: "Mudança de função",
};

/** Dias até a data (negativo = vencido). null se sem data. */
export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/** Vence em <= dias (e ainda não passou muito)? Para alertas. */
export function vencendo(date: string | null, dias = 30): boolean {
  const d = daysUntil(date);
  return d != null && d <= dias;
}
