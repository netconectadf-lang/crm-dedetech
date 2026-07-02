import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  primeiraVisita,
  avancarPeriodo,
  ymdLocal,
  type ContractPeriodicity,
} from "@/lib/contratos";
import { reportarErro } from "@/lib/observability";

// Cria a OS alguns dias ANTES da visita para aparecer na agenda/roteiro.
const LEAD_DIAS = 7;
const MAX_POR_CONTRATO = 24; // trava anti-runaway em contratos muito atrasados

export type RecorrenciaResultado = {
  ok: boolean;
  dryRun: boolean;
  contratosAtivos: number;
  osCriadas: { contrato: string; cliente: string; data: string }[];
};

type Contrato = {
  id: string;
  client_id: string;
  titulo: string | null;
  periodicidade: ContractPeriodicity;
  dia_faturamento: number;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  proxima_visita_em: string | null;
  clients: { razao_social: string | null } | { razao_social: string | null }[] | null;
};

/**
 * Gera automaticamente a próxima OS dos contratos ATIVOS conforme a
 * periodicidade (mensal, bimestral…), sem duplicar. Mantém `proxima_visita_em`
 * apontando para a próxima visita futura. Idempotente: se já existe OS do
 * contrato naquela data, não recria. dryRun = não escreve, só lista.
 */
export async function gerarOsRecorrentes(
  db: SupabaseClient,
  tenantId: string,
  opts: { dryRun?: boolean; hoje?: Date } = {},
): Promise<RecorrenciaResultado> {
  const dryRun = !!opts.dryRun;
  const hoje = opts.hoje ?? new Date();
  const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const limite = new Date(hojeZero.getTime() + LEAD_DIAS * 86_400_000);

  const { data } = await db
    .from("contracts")
    .select(
      "id, client_id, titulo, periodicidade, dia_faturamento, vigencia_inicio, vigencia_fim, proxima_visita_em, clients:client_id(razao_social)",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "ativo");
  const contratos = (data as Contrato[] | null) ?? [];

  const osCriadas: { contrato: string; cliente: string; data: string }[] = [];

  for (const c of contratos) {
    try {
      const cli = Array.isArray(c.clients) ? c.clients[0] : c.clients;
      const nomeCliente = cli?.razao_social ?? "";
      const fim = c.vigencia_fim ? new Date(`${c.vigencia_fim}T00:00:00`) : null;

      // ponteiro = próxima visita mantida, ou a 1ª visita do contrato.
      let cursor = c.proxima_visita_em
        ? new Date(`${c.proxima_visita_em}T00:00:00`)
        : primeiraVisita(c.vigencia_inicio, c.dia_faturamento);

      let guard = 0;
      // cria OS para toda visita já vencida/próxima (dentro do LEAD), avançando.
      while (cursor <= limite && guard < MAX_POR_CONTRATO) {
        guard++;
        if (fim && cursor > fim) break; // fora da vigência → para
        const ymd = ymdLocal(cursor);

        // dedup: já existe OS deste contrato agendada nesse dia?
        const { count } = await db
          .from("service_orders")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("contract_id", c.id)
          .gte("scheduled_at", `${ymd}T00:00:00`)
          .lt("scheduled_at", `${ymd}T23:59:59`);

        if (!count) {
          if (!dryRun) {
            await db.from("service_orders").insert({
              tenant_id: tenantId,
              client_id: c.client_id,
              contract_id: c.id,
              scheduled_at: `${ymd}T12:00:00`,
            } as never);
          }
          osCriadas.push({ contrato: c.titulo ?? c.id, cliente: nomeCliente, data: ymd });
        }
        cursor = avancarPeriodo(cursor, c.periodicidade, c.dia_faturamento);
      }

      // guarda a próxima visita FUTURA (fora do LEAD) como ponteiro.
      if (!dryRun && (!fim || cursor <= fim)) {
        await db
          .from("contracts")
          .update({ proxima_visita_em: ymdLocal(cursor) } as never)
          .eq("id", c.id)
          .eq("tenant_id", tenantId);
      }
    } catch (err) {
      reportarErro("recorrencia-os", err, { contrato: c.id });
    }
  }

  return { ok: true, dryRun, contratosAtivos: contratos.length, osCriadas };
}
