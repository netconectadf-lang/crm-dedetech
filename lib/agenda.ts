// Helpers de calendário para a agenda semanal de operadores (/agenda).
// Datas tratadas como strings YYYY-MM-DD; instantes (timestamptz) são
// "bucketizados" no fuso de Brasília para casar com o dia de calendário local.

export const TZ_BR = "America/Sao_Paulo";

export const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"] as const;

/** Segunda-feira (YYYY-MM-DD) da semana que contém a data informada. */
export function segundaDaSemana(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`); // meio-dia UTC evita viradas de dia
  const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Os 7 dias (YYYY-MM-DD) a partir da segunda informada. */
export function semanaDias(segundaYmd: string): string[] {
  const base = new Date(`${segundaYmd}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/** Soma `dias` a uma data YYYY-MM-DD. */
export function addDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Dia de calendário (YYYY-MM-DD) de um instante ISO, no fuso de Brasília. */
export function ymdNoFuso(iso: string, tz = TZ_BR): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Instante ISO (UTC) do 1º dia do mês corrente às 00:00 no fuso de Brasília.
 * BR = UTC-3 sem horário de verão desde 2019 → 00:00 BR = 03:00Z.
 * Usado p/ contar cota mensal na fronteira LOCAL, não na UTC (que viraria o
 * mês 3h antes, contando OS das últimas horas do mês no mês seguinte).
 */
export function inicioDoMesBR(nowIso: string, tz = TZ_BR): string {
  const [y, m] = ymdNoFuso(nowIso, tz).split("-");
  return `${y}-${m}-01T03:00:00.000Z`;
}

/** Hora:minuto (HH:MM) de um instante ISO, no fuso de Brasília. */
export function horaNoFuso(iso: string, tz = TZ_BR): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Rótulo curto de um dia (ex.: "10/06") para o cabeçalho da coluna. */
export function rotuloDia(ymd: string): string {
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
}
