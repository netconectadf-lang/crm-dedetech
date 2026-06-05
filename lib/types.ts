/** Papéis dentro de uma empresa (espelha o enum app_role do banco). */
export type AppRole =
  | "owner"
  | "financeiro"
  | "comercial"
  | "operacional"
  | "rh"
  | "tecnico"
  | "cliente";

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Master",
  financeiro: "Financeiro",
  comercial: "Comercial",
  operacional: "Operacional",
  rh: "RH",
  tecnico: "Técnico",
  cliente: "Cliente",
};

/** Papéis que um owner pode atribuir a um membro da equipe. */
export const ASSIGNABLE_ROLES: AppRole[] = [
  "owner",
  "financeiro",
  "comercial",
  "operacional",
  "rh",
  "tecnico",
];

/** Contexto de autenticação resolvido no servidor. */
export type AuthContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  tenantId: string | null;
  role: AppRole | null;
};
