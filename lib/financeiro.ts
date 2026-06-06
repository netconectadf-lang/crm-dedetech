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

const TIPO_TONE = {
  salario: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25",
  prestador: "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/25",
  compra: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  combustivel: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  alimentacao: "bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-500/25",
  despesa: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
} as const;

export type DespesaTipo = { label: string; tone: string; curto: string };

/** Deriva categoria + cor + descrição abreviada de uma conta a pagar pelo texto. */
export function categoriaDespesa(descricao: string): DespesaTipo {
  const d = (descricao ?? "").trim();
  const b = d.toLowerCase();
  const duasPalavras = (s: string) => s.trim().split(/\s+/).slice(0, 2).join(" ");
  const depoisDoTraco = () => d.split(/—|-/)[1]?.trim() || d;

  if (b.startsWith("salario") || b.startsWith("salário")) {
    return { label: "Salário", tone: TIPO_TONE.salario, curto: duasPalavras(depoisDoTraco()) };
  }
  if (b.startsWith("prestador")) {
    return { label: "Prestador", tone: TIPO_TONE.prestador, curto: duasPalavras(depoisDoTraco()) };
  }
  if (b.startsWith("pedido") || b.includes("compra")) {
    const num = d.match(/#\s*([\w-]+)/)?.[1];
    const parcela = d.match(/parcela\s*([\d/]+)/i)?.[1];
    const curto = `Pedido${num ? ` #${num}` : ""}${parcela ? ` · ${parcela}` : ""}`;
    return { label: "Compra", tone: TIPO_TONE.compra, curto };
  }
  if (/combust|gasolina|diesel|etanol|alcool|álcool/.test(b)) {
    return { label: "Combustível", tone: TIPO_TONE.combustivel, curto: d };
  }
  if (/almoco|almoço|refei|lanche|aliment|jantar|comida|cafe|café/.test(b)) {
    return { label: "Alimentação", tone: TIPO_TONE.alimentacao, curto: d };
  }
  return { label: "Despesa", tone: TIPO_TONE.despesa, curto: d };
}
