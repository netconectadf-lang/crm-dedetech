import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { signIn, listTickets } from "./client";
import { observacoesDoChamado, trilogoStatusToOs, deveAtualizarStatus } from "./match";
import { TRILOGO_STATUS, type SyncResult } from "./types";
import type { OsStatus } from "@/lib/os";

const PANEL_BASE = "https://bluefit.trilogo.app";

/**
 * Sincroniza os chamados do Trílogo para a empresa informada.
 *  - Chamado ABERTO ainda não importado  -> cria OS "agendada" (dedup por id).
 *  - Chamado já importado                 -> ESPELHA o status (quando dão baixa
 *    lá, a OS aqui vira executada/cancelada; só avança, nunca toca em faturada).
 *
 * A operação fica no Trílogo; o CRM reflete o andamento. Roda com o admin
 * client (service role) — pensado para o cron e para o "Sincronizar agora".
 */
export async function syncTrilogo(
  tenantId: string,
  origem: "cron" | "manual" = "cron",
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();

  const result: SyncResult = {
    ok: false,
    criados: 0,
    atualizados: 0,
    pulados: 0,
    semMapeamento: 0,
    erros: 0,
    naoMapeadas: [],
  };

  try {
    const { accessToken } = await signIn();
    const todos = await listTickets(accessToken, { limit: 1000 });

    // De-para: id da unidade Trílogo -> cliente do CRM.
    const { data: clientesData } = await supabase
      .from("clients")
      .select("id, trilogo_company_id")
      .eq("tenant_id", tenantId)
      .not("trilogo_company_id", "is", null);
    const clientePorCompany = new Map<number, string>();
    for (const c of (clientesData ?? []) as { id: string; trilogo_company_id: number }[]) {
      clientePorCompany.set(c.trilogo_company_id, c.id);
    }

    // OS já importadas: external_ref -> { id, status }.
    const { data: osData } = await supabase
      .from("service_orders")
      .select("id, external_ref, status")
      .eq("tenant_id", tenantId)
      .eq("source", "trilogo")
      .not("external_ref", "is", null);
    const osPorRef = new Map<string, { id: string; status: OsStatus }>();
    for (const o of (osData ?? []) as { id: string; external_ref: string; status: OsStatus }[]) {
      osPorRef.set(o.external_ref, { id: o.id, status: o.status });
    }

    const naoMapeadas = new Map<number, string>();

    for (const t of todos) {
      const ref = String(t.id);
      const existente = osPorRef.get(ref);

      // Já importado -> espelha o status do chamado.
      if (existente) {
        const target = trilogoStatusToOs(t.status);
        if (target && deveAtualizarStatus(existente.status, target)) {
          const patch: Record<string, unknown> = { status: target };
          if (target === "executada") patch.executada_em = new Date().toISOString();
          const { error } = await supabase
            .from("service_orders")
            .update(patch)
            .eq("id", existente.id);
          if (error) result.erros += 1;
          else result.atualizados += 1;
        } else {
          result.pulados += 1;
        }
        continue;
      }

      // Não importado -> só cria se estiver ABERTO.
      if (t.status !== TRILOGO_STATUS.Open) continue;

      const companyId = t.company?.id;
      const clientId = companyId != null ? clientePorCompany.get(companyId) : undefined;
      if (!clientId) {
        result.semMapeamento += 1;
        if (companyId != null) naoMapeadas.set(companyId, t.companyName ?? `Unidade ${companyId}`);
        continue;
      }

      const { error } = await supabase.from("service_orders").insert({
        tenant_id: tenantId,
        client_id: clientId,
        status: "agendada",
        source: "trilogo",
        external_ref: ref,
        external_url: `${PANEL_BASE}/tickets/${t.id}`,
        observacoes: observacoesDoChamado(t),
      });
      if (error) {
        if (error.code === "23505") result.pulados += 1;
        else result.erros += 1;
        continue;
      }
      result.criados += 1;
    }

    result.naoMapeadas = [...naoMapeadas.entries()].map(([companyId, nome]) => ({
      companyId,
      nome,
    }));
    result.ok = result.erros === 0;
    result.mensagem = `${result.criados} criada(s), ${result.atualizados} atualizada(s), ${result.semMapeamento} sem unidade casada.`;
  } catch (e) {
    result.ok = false;
    result.erros += 1;
    result.mensagem = e instanceof Error ? e.message : "Erro desconhecido no sync.";
  }

  // Registra a execução (best-effort). `atualizados` vai no detalhe (sem coluna própria).
  await supabase.from("trilogo_sync_runs").insert({
    tenant_id: tenantId,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    ok: result.ok,
    origem,
    criados: result.criados,
    pulados: result.pulados,
    sem_mapeamento: result.semMapeamento,
    erros: result.erros,
    mensagem: result.mensagem,
    detalhe: {
      atualizados: result.atualizados,
      ...(result.naoMapeadas.length ? { naoMapeadas: result.naoMapeadas } : {}),
    },
  });

  return result;
}
