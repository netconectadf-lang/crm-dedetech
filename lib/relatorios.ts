// Helpers puros de agregação para os relatórios gerenciais (/relatorios).
// Sem dependência de banco/UI — fáceis de testar e reaproveitar.

export const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

/**
 * Extrai ano/mês de uma data ISO lendo direto a string `YYYY-MM-DD...`.
 * Evita bugs de fuso (datas `date` viram meia-noite UTC; timestamptz variam).
 */
export function anoMes(iso: string): { ano: number; mes: number } {
  return { ano: Number(iso.slice(0, 4)), mes: Number(iso.slice(5, 7)) - 1 };
}

/** Soma `getValor` por mês (0–11) das linhas cuja data cai no `ano`. */
export function serieMensal<T>(
  rows: T[],
  ano: number,
  getDate: (r: T) => string | null | undefined,
  getValor: (r: T) => number,
): number[] {
  const buckets = Array<number>(12).fill(0);
  for (const r of rows) {
    const d = getDate(r);
    if (!d) continue;
    const { ano: a, mes } = anoMes(d);
    if (a === ano && mes >= 0 && mes < 12) buckets[mes] += getValor(r);
  }
  return buckets;
}

export type RankItem = { chave: string; valor: number; qtd: number };

/** Agrupa por chave somando valor e contando ocorrências; ordena por valor desc. */
export function agruparRanking<T>(
  rows: T[],
  getChave: (r: T) => string | null | undefined,
  getValor: (r: T) => number,
): RankItem[] {
  const map = new Map<string, RankItem>();
  for (const r of rows) {
    const chave = (getChave(r) || "—").trim() || "—";
    const cur = map.get(chave) ?? { chave, valor: 0, qtd: 0 };
    cur.valor += getValor(r);
    cur.qtd += 1;
    map.set(chave, cur);
  }
  return [...map.values()].sort((a, b) => b.valor - a.valor);
}

/** Conta ocorrências por chave; ordena por contagem desc. */
export function contarPor<T>(
  rows: T[],
  getChave: (r: T) => string | null | undefined,
): RankItem[] {
  return agruparRanking(rows, getChave, () => 1);
}

// ─── Período (ano inteiro ou um mês) e comparação ──────────────────────

/** Período de análise: ano inteiro (`mes` undefined) ou um mês (1-12). */
export type Periodo = { ano: number; mes?: number };

/** O período imediatamente anterior (mês anterior, ou ano anterior). */
export function periodoAnterior(p: Periodo): Periodo {
  if (p.mes == null) return { ano: p.ano - 1 };
  return p.mes <= 1 ? { ano: p.ano - 1, mes: 12 } : { ano: p.ano, mes: p.mes - 1 };
}

/** Rótulo legível do período (ex.: "Junho de 2026" ou "Ano de 2026"). */
export function rotuloPeriodo(p: Periodo): string {
  const MESES_LONGOS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return p.mes == null ? `Ano de ${p.ano}` : `${MESES_LONGOS[p.mes - 1]} de ${p.ano}`;
}

/** Uma data ISO pertence ao período? (ano bate e, se houver, o mês também). */
export function noPeriodo(iso: string | null | undefined, p: Periodo): boolean {
  if (!iso) return false;
  const { ano, mes } = anoMes(iso);
  if (ano !== p.ano) return false;
  return p.mes == null || mes === p.mes - 1;
}

/** Soma `getValor` das linhas que caem no período. */
export function somaNoPeriodo<T>(
  rows: T[],
  p: Periodo,
  getDate: (r: T) => string | null | undefined,
  getValor: (r: T) => number,
): number {
  return rows.reduce((s, r) => (noPeriodo(getDate(r), p) ? s + getValor(r) : s), 0);
}

export type Variacao = { pct: number | null; dir: "up" | "down" | "flat" };

/** Variação percentual de `atual` sobre `anterior` (null se base 0). */
export function variacao(atual: number, anterior: number): Variacao {
  if (anterior === 0) return { pct: atual === 0 ? 0 : null, dir: atual > 0 ? "up" : "flat" };
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const dir = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { pct: Math.round(pct), dir };
}
