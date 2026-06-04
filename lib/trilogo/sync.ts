import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { signIn, listOpenTickets } from "./client";
import { observacoesDoChamado } from "./match";
import type { SyncResult } from "./types";

const PANEL_BASE = "https://bluefit.trilogo.app";

/**
 * Sincroniza os chamados ABERTOS do Trílogo para a empresa informada.
 * Cada chamado novo vira uma OS "agendada" (a equipe atribui técnico/data).
 * Idempotente: usa (tenant, source='trilogo', external_ref=id) para dedup.
 *
 * Roda com o admin client (service role) — pensado para o cron e para o
 * botão "Sincronizar agora", ambos fora de um contexto com sessão.
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
    pulados: 0,
    semMapeamento: 0,
    erros: 0,
    naoMapeadas: [],
  };

  try {
    const { accessToken } = await signIn();
    const abertos = await listOpenTickets(accessToken);

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

    // OS já importadas (dedup).
    const { data: existentesData } = await supabase
      .from("service_orders")
      .select("external_ref")
      .eq("tenant_id", tenantId)
      .eq("source", "trilogo")
      .not("external_ref", "is", null);
    const jaImportados = new Set(
      ((existentesData ?? []) as { external_ref: string }[]).map((r) => r.external_ref),
    );

    const naoMapeadas = new Map<number, string>();

    for (const t of abertos) {
      const ref = String(t.id);
      if (jaImportados.has(ref)) {
        result.pulados += 1;
        continue;
      }
      const companyId = t.company?.id;
      const clientId = companyId != null ? clientePorCompany.get(companyId) : undefined;
      if (!clientId) {
        result.semMapeamento += 1;
        if (companyId != null) {
          naoMapeadas.set(companyId, t.companyName ?? `Unidade ${companyId}`);
        }
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
        // Conflito de unique (corrida) = já existe; demais = erro real.
        if (error.code === "23505") {
          result.pulados += 1;
        } else {
          result.erros += 1;
        }
        continue;
      }
      result.criados += 1;
    }

    result.naoMapeadas = [...naoMapeadas.entries()].map(([companyId, nome]) => ({
      companyId,
      nome,
    }));
    result.ok = result.erros === 0;
    result.mensagem = `${result.criados} criada(s), ${result.pulados} já existia(m), ${result.semMapeamento} sem unidade casada.`;
  } catch (e) {
    result.ok = false;
    result.erros += 1;
    result.mensagem = e instanceof Error ? e.message : "Erro desconhecido no sync.";
  }

  // Registra a execução (best-effort).
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
    detalhe: result.naoMapeadas.length ? { naoMapeadas: result.naoMapeadas } : null,
  });

  return result;
}
