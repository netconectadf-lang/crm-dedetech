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

/** Meses completos entre uma data e hoje (0 se futuro). */
export function mesesDesde(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  const h = new Date();
  let m = (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
  if (h.getDate() < d.getDate()) m -= 1;
  return Math.max(0, m);
}

/** Tempo de casa legível (ex.: "2a 3m"). */
export function formatTempoCasa(date: string | null): string {
  const m = mesesDesde(date);
  if (m == null) return "—";
  const anos = Math.floor(m / 12);
  const meses = m % 12;
  if (anos === 0) return `${meses}m`;
  return meses === 0 ? `${anos}a` : `${anos}a ${meses}m`;
}

/** Dias entre duas datas (inclusivo, mínimo 1). */
export function diasEntre(inicio: string, fim: string): number {
  const a = new Date(`${inicio}T00:00:00`).getTime();
  const b = new Date(`${fim}T00:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

/** O nascimento cai no mês atual? (aniversariante do mês) */
export function aniversarianteEsteMes(nascimento: string | null): boolean {
  if (!nascimento) return false;
  return Number(nascimento.slice(5, 7)) === new Date().getMonth() + 1;
}

export type FeriasInfo = {
  periodos: number;
  diasDireito: number;
  diasGozados: number;
  saldo: number;
  vencidas: boolean; // risco de pagamento em dobro
};

/**
 * Saldo de férias (CLT): a cada 12 meses de casa = 30 dias de direito.
 * `vencidas` sinaliza risco de dobra (período aquisitivo antigo cujo
 * período concessivo já fechou sem o gozo).
 */
export function feriasInfo(
  dataAdmissao: string | null,
  diasGozados: number,
): FeriasInfo | null {
  const m = mesesDesde(dataAdmissao);
  if (m == null) return null;
  const periodos = Math.floor(m / 12);
  const diasDireito = periodos * 30;
  const saldo = Math.max(0, diasDireito - diasGozados);
  const vencidas = periodos >= 2 && diasGozados < (periodos - 1) * 30;
  return { periodos, diasDireito, diasGozados, saldo, vencidas };
}
