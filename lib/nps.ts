// Métricas de NPS a partir de uma lista de notas (0–10). Pura e testável.

export type NpsMetricas = {
  total: number;
  promotores: number; // 9–10
  neutros: number; // 7–8
  detratores: number; // 0–6
  nps: number; // -100 a 100
  media: number; // 0–10, 1 casa
};

export function metricasNps(scores: number[]): NpsMetricas {
  const total = scores.length;
  if (!total) {
    return { total: 0, promotores: 0, neutros: 0, detratores: 0, nps: 0, media: 0 };
  }
  const promotores = scores.filter((s) => s >= 9).length;
  const detratores = scores.filter((s) => s <= 6).length;
  const neutros = total - promotores - detratores;
  const nps = Math.round(((promotores - detratores) / total) * 100);
  const media = Math.round((scores.reduce((a, b) => a + b, 0) / total) * 10) / 10;
  return { total, promotores, neutros, detratores, nps, media };
}

/** Tom de cor para um valor de NPS (alinhado ao KpiCard). */
export function npsTone(total: number, nps: number): "default" | "ok" | "warning" | "danger" {
  if (total === 0) return "default";
  if (nps >= 50) return "ok";
  if (nps < 0) return "danger";
  return "warning";
}
