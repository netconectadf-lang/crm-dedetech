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

// ─── Conversão de orçamentos (funil comercial) ─────────────────────────

export type QuoteLite = {
  status: string;
  enviado_em: string | null;
  aceito_em: string | null;
  recusado_em: string | null;
  valor: number;
};

export type ResumoOrcamentos = {
  enviados: number;
  aceitos: number;
  recusados: number;
  valorAceito: number;
  ticketAceito: number;
  /** Taxa de ganho = aceitos / (aceitos + recusados decididos). 0–100. */
  taxaGanho: number;
  /** Ciclo médio de fechamento (dias entre enviado_em e aceito_em). */
  cicloDias: number | null;
};

/** Funil de orçamentos do período: contagem por evento (enviado/aceito/recusado). */
export function resumoOrcamentos(quotes: QuoteLite[], p: Periodo): ResumoOrcamentos {
  const enviadosArr = quotes.filter((q) => noPeriodo(q.enviado_em, p));
  const aceitosArr = quotes.filter((q) => noPeriodo(q.aceito_em, p));
  const recusadosArr = quotes.filter((q) => noPeriodo(q.recusado_em, p));

  const valorAceito = aceitosArr.reduce((s, q) => s + Number(q.valor), 0);
  const decididos = aceitosArr.length + recusadosArr.length;

  let somaDias = 0;
  let comAmbas = 0;
  for (const q of aceitosArr) {
    if (q.enviado_em && q.aceito_em) {
      const d = (new Date(q.aceito_em).getTime() - new Date(q.enviado_em).getTime()) / 86_400_000;
      if (d >= 0) {
        somaDias += d;
        comAmbas += 1;
      }
    }
  }

  return {
    enviados: enviadosArr.length,
    aceitos: aceitosArr.length,
    recusados: recusadosArr.length,
    valorAceito,
    ticketAceito: aceitosArr.length ? valorAceito / aceitosArr.length : 0,
    taxaGanho: decididos ? Math.round((aceitosArr.length / decididos) * 100) : 0,
    cicloDias: comAmbas ? Math.round(somaDias / comAmbas) : null,
  };
}

// ─── Produtividade por técnico ─────────────────────────────────────────

export type OsProdutividade = {
  tecnico: string | null;
  tempo_execucao_min: number | null;
  km_rodado: number | null;
  custo_total: number | null;
};

export type TecnicoStat = {
  tecnico: string;
  qtd: number;
  tempoMedioMin: number | null;
  kmTotal: number;
  custoTotal: number;
};

/** Agrega OS executadas por técnico: nº de OS, tempo médio, km e custo. */
export function produtividadePorTecnico(rows: OsProdutividade[]): TecnicoStat[] {
  const map = new Map<string, { qtd: number; somaTempo: number; comTempo: number; km: number; custo: number }>();
  for (const o of rows) {
    const nome = (o.tecnico || "Sem técnico").trim() || "Sem técnico";
    const cur = map.get(nome) ?? { qtd: 0, somaTempo: 0, comTempo: 0, km: 0, custo: 0 };
    cur.qtd += 1;
    if (o.tempo_execucao_min != null) {
      cur.somaTempo += Number(o.tempo_execucao_min);
      cur.comTempo += 1;
    }
    cur.km += Number(o.km_rodado ?? 0);
    cur.custo += Number(o.custo_total ?? 0);
    map.set(nome, cur);
  }
  return [...map.entries()]
    .map(([tecnico, v]) => ({
      tecnico,
      qtd: v.qtd,
      tempoMedioMin: v.comTempo ? Math.round(v.somaTempo / v.comTempo) : null,
      kmTotal: Math.round(v.km),
      custoTotal: Math.round(v.custo * 100) / 100,
    }))
    .sort((a, b) => b.qtd - a.qtd);
}

// ─── Aging de inadimplência ────────────────────────────────────────────

export type AgingFaixa = { faixa: string; valor: number; qtd: number };

/**
 * Distribui as contas a receber VENCIDAS em aberto por faixa de atraso.
 * `getSaldo` devolve o valor em aberto (valor − valor_pago).
 */
export function agingInadimplencia<T>(
  rows: T[],
  hojeIso: string,
  getVencimento: (r: T) => string | null | undefined,
  getSaldo: (r: T) => number,
  estaAberto: (r: T) => boolean,
): AgingFaixa[] {
  const faixas: AgingFaixa[] = [
    { faixa: "1–30 dias", valor: 0, qtd: 0 },
    { faixa: "31–60 dias", valor: 0, qtd: 0 },
    { faixa: "61–90 dias", valor: 0, qtd: 0 },
    { faixa: "90+ dias", valor: 0, qtd: 0 },
  ];
  const hoje = new Date(`${hojeIso}T00:00:00Z`).getTime();
  for (const r of rows) {
    const venc = getVencimento(r);
    if (!venc || !estaAberto(r)) continue;
    const dias = Math.floor((hoje - new Date(`${venc.slice(0, 10)}T00:00:00Z`).getTime()) / 86_400_000);
    if (dias <= 0) continue; // ainda não venceu
    const saldo = getSaldo(r);
    if (saldo <= 0) continue;
    const i = dias <= 30 ? 0 : dias <= 60 ? 1 : dias <= 90 ? 2 : 3;
    faixas[i].valor += saldo;
    faixas[i].qtd += 1;
  }
  return faixas;
}

export type Variacao = { pct: number | null; dir: "up" | "down" | "flat" };

/** Variação percentual de `atual` sobre `anterior` (null se base 0). */
export function variacao(atual: number, anterior: number): Variacao {
  if (anterior === 0) return { pct: atual === 0 ? 0 : null, dir: atual > 0 ? "up" : "flat" };
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const dir = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { pct: Math.round(pct), dir };
}
