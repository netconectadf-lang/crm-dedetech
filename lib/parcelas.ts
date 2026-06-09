/**
 * Opções de parcelamento do cartão.
 * Regra: 1x e 2x SEM juros; 3x a 6x com JUROS COMPOSTOS sobre o % ao mês.
 *   total = base × (1 + i)^n   (i = juros/100), arredondado a 2 casas.
 */
export type Parcela = { n: number; total: number; valorParcela: number; juros: boolean };

const MAX_PARCELAS = 6;
const SEM_JUROS_ATE = 2;

export function calcularParcelas(base: number, jurosPctMes: number): Parcela[] {
  const i = Math.max(0, Number(jurosPctMes) || 0) / 100;
  const out: Parcela[] = [];
  for (let n = 1; n <= MAX_PARCELAS; n++) {
    const comJuros = n > SEM_JUROS_ATE && i > 0;
    const total = comJuros ? Math.round(base * Math.pow(1 + i, n) * 100) / 100 : base;
    out.push({
      n,
      total,
      valorParcela: Math.round((total / n) * 100) / 100,
      juros: comJuros,
    });
  }
  return out;
}
