export type MovementType =
  | "entrada"
  | "saida"
  | "perda"
  | "ajuste"
  | "transferencia";

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  perda: "Perda",
  ajuste: "Ajuste",
  transferencia: "Transferência",
};

export type ExpiryTone = "vencido" | "critico" | "atencao" | "ok" | "none";

/** Classifica a validade de um lote para alertas (30/60/90 dias). */
export function expiryStatus(validade: string | null): {
  tone: ExpiryTone;
  label: string;
  days: number | null;
} {
  if (!validade) return { tone: "none", label: "Sem validade", days: null };
  const hoje = new Date();
  const v = new Date(`${validade}T00:00:00`);
  const days = Math.ceil((v.getTime() - hoje.getTime()) / 86_400_000);
  if (days < 0) return { tone: "vencido", label: "Vencido", days };
  if (days <= 30) return { tone: "critico", label: `${days}d`, days };
  if (days <= 90) return { tone: "atencao", label: `${days}d`, days };
  return { tone: "ok", label: `${days}d`, days };
}

export const EXPIRY_BADGE: Record<ExpiryTone, string> = {
  vencido: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25",
  critico: "bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-500/25",
  atencao: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  ok: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  none: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};
