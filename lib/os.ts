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
  agendada: "bg-slate-100 text-slate-700",
  a_caminho: "bg-sky-100 text-sky-700",
  em_execucao: "bg-amber-100 text-amber-700",
  executada: "bg-emerald-100 text-emerald-700",
  faturada: "bg-teal-100 text-teal-700",
  cancelada: "bg-rose-100 text-rose-700",
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
