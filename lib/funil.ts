export type DealStage =
  | "lead"
  | "contato"
  | "diagnostico"
  | "orcamento"
  | "negociacao"
  | "ganho"
  | "perdido";

export type LeadOrigin =
  | "indicacao"
  | "google"
  | "instagram"
  | "site"
  | "passagem"
  | "outro";

export type LossReason =
  | "preco"
  | "prazo"
  | "concorrente"
  | "sem_retorno"
  | "outro";

export type QuoteStatus =
  | "rascunho"
  | "enviado"
  | "aceito"
  | "recusado"
  | "expirado";

export const STAGES: { key: DealStage; label: string; tone: string }[] = [
  { key: "lead", label: "Lead", tone: "bg-muted text-muted-foreground ring-1 ring-inset ring-border" },
  { key: "contato", label: "Contato", tone: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/25" },
  { key: "diagnostico", label: "Diagnóstico", tone: "bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/25" },
  { key: "orcamento", label: "Orçamento", tone: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25" },
  { key: "negociacao", label: "Negociação", tone: "bg-purple-500/15 text-purple-300 ring-1 ring-inset ring-purple-500/25" },
  { key: "ganho", label: "Ganho", tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25" },
  { key: "perdido", label: "Perdido", tone: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25" },
];

export const STAGE_LABEL: Record<DealStage, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label]),
) as Record<DealStage, string>;

export const STAGE_TONE: Record<DealStage, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.tone]),
) as Record<DealStage, string>;

/** Trilha do negócio (perdido fica fora do trilho). */
export const DEAL_FLOW: DealStage[] = [
  "lead",
  "contato",
  "diagnostico",
  "orcamento",
  "negociacao",
  "ganho",
];

export const ORIGIN_LABEL: Record<LeadOrigin, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  site: "Site",
  passagem: "Passagem",
  outro: "Outro",
};

export const LOSS_LABEL: Record<LossReason, string> = {
  preco: "Preço",
  prazo: "Prazo",
  concorrente: "Concorrente",
  sem_retorno: "Sem retorno",
  outro: "Outro",
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
  expirado: "Expirado",
};

export const QUOTE_STATUS_TONE: Record<QuoteStatus, string> = {
  rascunho: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  enviado: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  aceito: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  recusado: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25",
  expirado: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
};
