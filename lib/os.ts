export type OsStatus =
  | "agendada"
  | "a_caminho"
  | "em_execucao"
  | "executada"
  | "faturada"
  | "cancelada";

export type ApplicationMethod =
  | "pulverizacao"
  | "polvilhamento"
  | "gel"
  | "isca"
  | "atomizacao"
  | "termonebulizacao"
  | "injecao"
  | "outro";

export const OS_STATUS_LABEL: Record<OsStatus, string> = {
  agendada: "Agendada",
  a_caminho: "A caminho",
  em_execucao: "Em execução",
  executada: "Executada",
  faturada: "Faturada",
  cancelada: "Cancelada",
};

export const OS_STATUS_TONE: Record<OsStatus, string> = {
  agendada: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  a_caminho: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  em_execucao: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  executada: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  faturada: "bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-500/25",
  cancelada: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25",
};

/** Próximo(s) status possível(is) a partir do atual. */
export const NEXT_STATUS: Record<OsStatus, OsStatus[]> = {
  agendada: ["a_caminho", "em_execucao", "cancelada"],
  a_caminho: ["em_execucao", "cancelada"],
  em_execucao: ["cancelada"], // 'executada' acontece via finalizar a ficha
  executada: ["faturada"],
  faturada: [],
  cancelada: [],
};

/** Fluxo linear de status (cancelada fica fora do trilho). */
export const OS_FLOW: OsStatus[] = [
  "agendada",
  "a_caminho",
  "em_execucao",
  "executada",
  "faturada",
];

/** Status que ainda exigem ação operacional (não concluídos/cancelados). */
export const OS_PENDENTE: OsStatus[] = ["agendada", "a_caminho", "em_execucao"];

export const METHOD_LABEL: Record<ApplicationMethod, string> = {
  pulverizacao: "Pulverização",
  polvilhamento: "Polvilhamento",
  gel: "Gel",
  isca: "Isca",
  atomizacao: "Atomização",
  termonebulizacao: "Termonebulização",
  injecao: "Injeção",
  outro: "Outro",
};
