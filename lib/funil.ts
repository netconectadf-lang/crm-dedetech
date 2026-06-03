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
  { key: "lead", label: "Lead", tone: "bg-slate-100 text-slate-700" },
  { key: "contato", label: "Contato", tone: "bg-sky-100 text-sky-700" },
  { key: "diagnostico", label: "Diagnóstico", tone: "bg-indigo-100 text-indigo-700" },
  { key: "orcamento", label: "Orçamento", tone: "bg-amber-100 text-amber-700" },
  { key: "negociacao", label: "Negociação", tone: "bg-purple-100 text-purple-700" },
  { key: "ganho", label: "Ganho", tone: "bg-emerald-100 text-emerald-700" },
  { key: "perdido", label: "Perdido", tone: "bg-rose-100 text-rose-700" },
];

export const STAGE_LABEL: Record<DealStage, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label]),
) as Record<DealStage, string>;

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
