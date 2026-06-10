// Fonte única de verdade dos status de Ordem de Serviço: rótulo, cor de
// gráfico (hex) e classe de chip (Tailwind). Usado em /relatorios e /agenda.

export type OsStatusMeta = { key: string; label: string; color: string; chip: string };

export const OS_STATUS: OsStatusMeta[] = [
  { key: "agendada", label: "Agendada", color: "#38bdf8", chip: "border-sky-500/40 bg-sky-500/10 text-sky-200" },
  { key: "a_caminho", label: "A caminho", color: "#fbbf24", chip: "border-amber-500/40 bg-amber-500/10 text-amber-200" },
  { key: "em_execucao", label: "Em execução", color: "#a78bfa", chip: "border-violet-500/40 bg-violet-500/10 text-violet-200" },
  { key: "executada", label: "Executada", color: "#34d399", chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  { key: "faturada", label: "Faturada", color: "#22d3ee", chip: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" },
  { key: "cancelada", label: "Cancelada", color: "#71717a", chip: "border-border bg-muted/40 text-muted-foreground line-through" },
];

export const OS_STATUS_BY_KEY: Record<string, OsStatusMeta> = Object.fromEntries(
  OS_STATUS.map((s) => [s.key, s]),
);

export const OS_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  OS_STATUS.map((s) => [s.key, s.label]),
);

/** Status que contam como "concluída" (executada ou já faturada). */
export const OS_CONCLUIDA = new Set(["executada", "faturada"]);

/** Status em aberto/pendente (ainda vão acontecer). */
export const OS_PENDENTE = new Set(["agendada", "a_caminho", "em_execucao"]);
