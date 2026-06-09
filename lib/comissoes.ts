import type { SupabaseClient } from "@supabase/supabase-js";

export type ComissaoTipo = "vendedor" | "tecnico";
export type ComissaoStatus = "provisionada" | "liberada" | "paga" | "cancelada";

export const TIPO_LABEL: Record<ComissaoTipo, string> = {
  vendedor: "Vendedor",
  tecnico: "Técnico",
};

export const STATUS_LABEL: Record<ComissaoStatus, string> = {
  provisionada: "Aguardando pgto do cliente",
  liberada: "A pagar",
  paga: "Paga",
  cancelada: "Cancelada",
};

export const STATUS_TONE: Record<ComissaoStatus, string> = {
  provisionada: "bg-amber-500/15 text-amber-300",
  liberada: "bg-sky-500/15 text-sky-300",
  paga: "bg-emerald-500/15 text-emerald-300",
  cancelada: "bg-muted text-muted-foreground",
};

/** Valor da comissão: valor fixo (se houver) ou percentual sobre a base. */
export function calcularComissao(
  base: number,
  percentual?: number | null,
  valorFixo?: number | null,
): number {
  if (valorFixo != null) return Number(valorFixo);
  if (percentual != null) return (Number(base) * Number(percentual)) / 100;
  return 0;
}

/**
 * Libera as comissões "provisionadas" de uma conta a receber quando ela é paga:
 * recalcula o valor sobre o que foi efetivamente recebido e marca como "liberada".
 * Recebe o `supabase` pronto (sem dependência de auth/Next).
 */
export async function liberarComissoesDaAr(
  supabase: SupabaseClient,
  tenantId: string,
  arId: string,
  valorRecebido: number,
): Promise<void> {
  const { data } = await supabase
    .from("commissions")
    .select("id, percentual, valor_fixo")
    .eq("tenant_id", tenantId)
    .eq("ar_id", arId)
    .eq("status", "provisionada");
  const comissoes = (data as { id: string; percentual: number | null; valor_fixo: number | null }[] | null) ?? [];

  for (const c of comissoes) {
    const valor = calcularComissao(valorRecebido, c.percentual, c.valor_fixo);
    await supabase
      .from("commissions")
      .update({
        status: "liberada",
        liberada_em: new Date().toISOString(),
        base_valor: valorRecebido,
        valor,
      } as never)
      .eq("id", c.id)
      .eq("tenant_id", tenantId);
  }
}
