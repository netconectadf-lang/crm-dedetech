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

export type ConfKey = "sem" | "vencido" | "vencendo" | "ok";

/** Classifica a conformidade de uma validade (ASO, EPI, anuidade). */
export function conformidade(
  date: string | null | undefined,
): { key: ConfKey; label: string; dot: string } {
  if (!date) return { key: "sem", label: "Sem registro", dot: "bg-muted-foreground/50" };
  const d = daysUntil(date)!;
  if (d < 0) return { key: "vencido", label: "Vencido", dot: "bg-destructive" };
  if (d <= 30) return { key: "vencendo", label: `Vence em ${d}d`, dot: "bg-warning" };
  return { key: "ok", label: "Em dia", dot: "bg-primary" };
}

/** Formata uma duração em milissegundos como "8h 30m". */
export function formatDuracao(ms: number): string {
  if (ms <= 0) return "—";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}
