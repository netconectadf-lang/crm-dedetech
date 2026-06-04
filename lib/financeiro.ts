export type FinanceStatus = "a_vencer" | "parcial" | "quitado" | "cancelado";
export type PaymentMethod =
  | "pix"
  | "boleto"
  | "dinheiro"
  | "cartao"
  | "transferencia"
  | "outro";
export type Recurrence = "unica" | "mensal" | "anual";
export type BankAccountType = "corrente" | "poupanca" | "caixa" | "cartao";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  unica: "Única",
  mensal: "Mensal",
  anual: "Anual",
};

export const BANK_TYPE_LABEL: Record<BankAccountType, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  caixa: "Caixa físico",
  cartao: "Cartão de crédito",
};

export type EffectiveStatus = {
  key: "a_vencer" | "vencido" | "parcial" | "quitado" | "cancelado";
  label: string;
  tone: string;
};

/** Status efetivo: calcula 'vencido' por data (não é armazenado). */
export function effectiveStatus(row: {
  status: FinanceStatus;
  vencimento: string;
}): EffectiveStatus {
  if (row.status === "cancelado")
    return { key: "cancelado", label: "Cancelado", tone: "bg-muted text-muted-foreground" };
  if (row.status === "quitado")
    return { key: "quitado", label: "Quitado", tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25" };

  const vencido = new Date(`${row.vencimento}T23:59:59`) < new Date();
  if (row.status === "parcial")
    return {
      key: "parcial",
      label: vencido ? "Parcial (vencido)" : "Parcial",
      tone: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
    };
  return vencido
    ? { key: "vencido", label: "Vencido", tone: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25" }
    : { key: "a_vencer", label: "A vencer", tone: "bg-muted text-muted-foreground ring-1 ring-inset ring-border" };
}
