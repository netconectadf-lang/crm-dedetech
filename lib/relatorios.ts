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
