"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { faturamentoNoMes, ymdLocal, type ContractPeriodicity } from "@/lib/contratos";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "financeiro"];

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

type ContratoRow = {
  id: string;
  titulo: string | null;
  client_id: string;
  valor: number;
  dia_faturamento: number;
  periodicidade: ContractPeriodicity;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  status: string;
};

export type FaturamentoLoteResult = { error?: string; message?: string; gerados?: number; pulados?: number };

/**
 * Gera, em lote, as contas a receber dos contratos selecionados para o mês de
 * referência (ano/mês 1-12). Recalcula valor/data/descrição no servidor e evita
 * duplicar (não recria se já houver AR do mesmo contrato com o mesmo vencimento).
 */
export async function gerarFaturamentoEmLote(
  contractIds: string[],
  ano: number,
  mes: number,
): Promise<FaturamentoLoteResult> {
  const ctx = await requireRole(ROLES);
  if (!contractIds.length) return { error: "Selecione ao menos um contrato." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("id, titulo, client_id, valor, dia_faturamento, periodicidade, vigencia_inicio, vigencia_fim, status")
    .in("id", contractIds)
    .eq("tenant_id", ctx.tenantId);
  const contratos = (data as ContratoRow[] | null) ?? [];

  let gerados = 0;
  let pulados = 0;

  for (const c of contratos) {
    if (c.status !== "ativo") { pulados++; continue; }
    const dt = faturamentoNoMes(c.vigencia_inicio, c.dia_faturamento, c.periodicidade, ano, mes, c.vigencia_fim);
    if (!dt) { pulados++; continue; }
    const vencimento = ymdLocal(dt);

    // evita duplicar: já existe AR (não cancelada) deste contrato neste vencimento?
    const { data: existente } = await supabase
      .from("accounts_receivable")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .eq("contract_id", c.id)
      .eq("vencimento", vencimento)
      .neq("status", "cancelado")
      .maybeSingle();
    if (existente) { pulados++; continue; }

    const descricao = `${c.titulo ?? "Contrato"} — ${MESES[mes - 1]}/${ano}`;
    const { error } = await supabase.from("accounts_receivable").insert({
      tenant_id: ctx.tenantId,
      client_id: c.client_id,
      contract_id: c.id,
      descricao,
      valor: Number(c.valor),
      vencimento,
    } as never);
    if (error) { pulados++; continue; }
    gerados++;
  }

  revalidatePath("/financeiro/faturamento");
  revalidatePath("/financeiro/receber");
  return {
    message: `${gerados} cobrança(s) gerada(s)${pulados ? `, ${pulados} ignorada(s)` : ""}.`,
    gerados,
    pulados,
  };
}
