"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { appOrigin } from "@/lib/app-url";
import { gerarCobrancaCore } from "@/lib/cobranca-core";
import type { ChargeTipo } from "@/lib/asaas";
import {
  faturamentoNoMes,
  ymdLocal,
  aniversariosCompletos,
  valorReajustado,
  INDEX_LABEL,
  type ContractPeriodicity,
  type AdjustmentIndex,
} from "@/lib/contratos";
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
  indice_reajuste: AdjustmentIndex | null;
  status: string;
};

/** Índices acumulados (% a.a.) informados pelo usuário, por tipo. */
export type ReajusteInput = { igpm: number; ipca: number };

export type FaturamentoLoteOpts = {
  /** índices acumulados p/ aplicar reajuste anual nos contratos que o usam */
  reajuste?: ReajusteInput;
  /** se definido, já gera a cobrança (PIX/boleto) de cada conta criada */
  cobranca?: ChargeTipo | null;
};

export type FaturamentoLoteResult = {
  error?: string;
  message?: string;
  gerados?: number;
  pulados?: number;
  cobrancas?: number;
};

/** Percentual de reajuste aplicável a um contrato conforme seu índice. */
function percentualDoIndice(indice: AdjustmentIndex | null, r?: ReajusteInput): number {
  if (!r) return 0;
  if (indice === "igpm") return r.igpm || 0;
  if (indice === "ipca") return r.ipca || 0;
  return 0;
}

/**
 * Gera, em lote, as contas a receber dos contratos selecionados para o mês de
 * referência (ano/mês 1-12). Recalcula valor/data/descrição no servidor, aplica
 * reajuste anual (IGP-M/IPCA) quando configurado e evita duplicar. Opcionalmente
 * já dispara a cobrança (PIX/boleto) de cada conta criada.
 */
export async function gerarFaturamentoEmLote(
  contractIds: string[],
  ano: number,
  mes: number,
  opts: FaturamentoLoteOpts = {},
): Promise<FaturamentoLoteResult> {
  const ctx = await requireRole(ROLES);
  if (!contractIds.length) return { error: "Selecione ao menos um contrato." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, titulo, client_id, valor, dia_faturamento, periodicidade, vigencia_inicio, vigencia_fim, indice_reajuste, status",
    )
    .in("id", contractIds)
    .eq("tenant_id", ctx.tenantId);
  const contratos = (data as ContratoRow[] | null) ?? [];

  let gerados = 0;
  let pulados = 0;
  const novosArIds: string[] = [];

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

    // reajuste anual composto por aniversário completo, conforme o índice
    const pct = percentualDoIndice(c.indice_reajuste, opts.reajuste);
    const ciclos = aniversariosCompletos(c.vigencia_inicio, dt);
    const valor = valorReajustado(Number(c.valor), ciclos, pct);
    const reajustado = valor !== Number(c.valor);

    const sufixo = reajustado
      ? ` (reaj. ${INDEX_LABEL[c.indice_reajuste ?? "nenhum"]} +${pct}%)`
      : "";
    const descricao = `${c.titulo ?? "Contrato"} — ${MESES[mes - 1]}/${ano}${sufixo}`;

    const { data: novo, error } = await supabase
      .from("accounts_receivable")
      .insert({
        tenant_id: ctx.tenantId,
        client_id: c.client_id,
        contract_id: c.id,
        descricao,
        valor,
        vencimento,
      } as never)
      .select("id")
      .single();
    if (error || !novo) { pulados++; continue; }
    gerados++;
    novosArIds.push((novo as { id: string }).id);
  }

  // item 4: gera a cobrança de cada conta recém-criada, se solicitado
  let cobrancas = 0;
  if (opts.cobranca && novosArIds.length) {
    const origin = await appOrigin();
    for (const arId of novosArIds) {
      const r = await gerarCobrancaCore(supabase, ctx.tenantId, arId, opts.cobranca, origin);
      if (r.ok) cobrancas++;
    }
  }

  revalidatePath("/financeiro/faturamento");
  revalidatePath("/financeiro/receber");
  return {
    message:
      `${gerados} cobrança(s) gerada(s)` +
      (cobrancas ? `, ${cobrancas} com link de pagamento` : "") +
      (pulados ? `, ${pulados} ignorada(s)` : "") +
      ".",
    gerados,
    pulados,
    cobrancas,
  };
}
