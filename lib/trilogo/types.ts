/** Status de um chamado (ticket) no Trílogo. */
export const TRILOGO_STATUS = {
  Open: 1,
  SendedToSupplier: 2,
  Archived: 3,
  Canceled: 4,
  Executed: 5,
  Inspected: 6,
  InExecution: 7,
} as const;

export const TRILOGO_STATUS_LABEL: Record<number, string> = {
  1: "Aberto",
  2: "Enviado ao prestador",
  3: "Arquivado",
  4: "Cancelado",
  5: "Executado",
  6: "Vistoriado",
  7: "Em execução",
};

/** Prioridade do chamado (1 baixa, 2 média, 3 alta — escala do Trílogo). */
export const TRILOGO_PRIORITY_LABEL: Record<number, string> = {
  1: "Baixa",
  2: "Média",
  3: "Alta",
};

/** Empresa/unidade dona do chamado no Trílogo. */
export type TrilogoCompany = {
  id: number;
  name: string | null;
};

/** Subconjunto dos campos do chamado que a integração usa. */
export type TrilogoTicket = {
  id: number;
  description: string | null;
  type: number | null;
  status: number;
  priority: number | null;
  address: string | null;
  companyName: string | null;
  companyGroup: string | null;
  company: TrilogoCompany | null;
  buildingServiceType: { id: number; name: string | null; path?: string | null } | null;
  department: { id: number; name: string | null; fullAddress?: string | null } | null;
  assignee: { id: number; name: string | null; email?: string | null } | null;
  deadlineDate: string | null;
  creationDate: string | null;
  creationDateTime: string | null;
  attachment: { id: number; permalink: string | null } | null;
};

/** Resposta do login. */
export type TrilogoSession = {
  accessToken: string;
  expiration: string | null;
  supplierName: string | null;
};

/** Resultado de uma sincronização. */
export type SyncResult = {
  ok: boolean;
  criados: number;
  atualizados: number;
  pulados: number;
  semMapeamento: number;
  erros: number;
  mensagem?: string;
  naoMapeadas: { companyId: number; nome: string }[];
};
