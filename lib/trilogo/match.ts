import { OS_FLOW, type OsStatus } from "@/lib/os";
import type { TrilogoTicket } from "./types";

/**
 * Status do chamado no Trílogo -> status correspondente da OS no CRM.
 * (Open/Sended = a fazer; InExecution = em execução; Executed/Inspected/Archived
 * = baixa/concluído; Canceled = cancelado.)
 */
export function trilogoStatusToOs(status: number): OsStatus | null {
  switch (status) {
    case 1:
    case 2:
      return "agendada";
    case 7:
      return "em_execucao";
    case 5:
    case 6:
    case 3:
      return "executada";
    case 4:
      return "cancelada";
    default:
      return null;
  }
}

/**
 * Decide se o status da OS deve ser atualizado pelo espelhamento do Trílogo.
 * Regras: nunca mexe em 'faturada' (faturamento é local); 'cancelada' sempre
 * reflete; não "ressuscita" OS cancelada; fora isso só AVANÇA no fluxo (nunca volta).
 */
export function deveAtualizarStatus(current: OsStatus, target: OsStatus): boolean {
  if (current === target) return false;
  if (current === "faturada") return false;
  if (target === "cancelada") return true;
  if (current === "cancelada") return false;
  return OS_FLOW.indexOf(target) > OS_FLOW.indexOf(current);
}

/**
 * Extrai o código da unidade Bluefit do nome.
 * Trílogo:  "DF - BSB - PARK DESIGN - 0867"            -> "0867"
 * CRM:      "BLUEFIT - DF - BSB - GUARA - 0070"        -> "0070"
 * O código (3+ dígitos no final) é a chave única e estável da unidade.
 */
export function extractUnitCode(name: string | null | undefined): string | null {
  if (!name) return null;
  const m = name.trim().match(/(\d{3,})\s*$/);
  return m ? m[1] : null;
}

/** Cliente do CRM no formato mínimo para o de-para. */
export type ClienteParaMapa = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cidade: string | null;
  uf: string | null;
  trilogo_company_id: number | null;
};

/** Unidade do Trílogo no formato mínimo para o de-para. */
export type UnidadeTrilogo = { companyId: number; nome: string };

export type SugestaoMapa = {
  unidade: UnidadeTrilogo;
  /** Cliente já vinculado (trilogo_company_id == companyId), se houver. */
  vinculadoId: string | null;
  /** Sugestão automática por código (quando ainda não vinculado). */
  sugestaoId: string | null;
};

/**
 * Cruza unidades do Trílogo com clientes do CRM.
 * Prioriza o vínculo já salvo; senão sugere por código da unidade.
 */
export function montarSugestoes(
  unidades: UnidadeTrilogo[],
  clientes: ClienteParaMapa[],
): SugestaoMapa[] {
  const porCodigo = new Map<string, ClienteParaMapa>();
  for (const c of clientes) {
    const code = extractUnitCode(c.nome_fantasia) ?? extractUnitCode(c.razao_social);
    if (code && !porCodigo.has(code)) porCodigo.set(code, c);
  }
  const vinculadoPorCompany = new Map<number, string>();
  for (const c of clientes) {
    if (c.trilogo_company_id != null) vinculadoPorCompany.set(c.trilogo_company_id, c.id);
  }

  return unidades.map((unidade) => {
    const vinculadoId = vinculadoPorCompany.get(unidade.companyId) ?? null;
    const code = extractUnitCode(unidade.nome);
    const sugestao = code ? porCodigo.get(code) : undefined;
    return {
      unidade,
      vinculadoId,
      sugestaoId: vinculadoId ? null : (sugestao?.id ?? null),
    };
  });
}

/** Monta o texto de observações da OS a partir do chamado. */
export function observacoesDoChamado(t: TrilogoTicket): string {
  const linhas: string[] = [];
  linhas.push(`Chamado Trílogo #${t.id}${t.creationDate ? ` · aberto em ${t.creationDate}` : ""}`);
  const tipo = t.buildingServiceType?.name;
  if (tipo) linhas.push(`Tipo de serviço: ${tipo}`);
  if (t.address) linhas.push(`Local: ${t.address}`);
  const prio = t.priority;
  if (prio != null) {
    const lbl = prio === 3 ? "Alta" : prio === 2 ? "Média" : "Baixa";
    linhas.push(`Prioridade: ${lbl}`);
  }
  if (t.assignee?.name) linhas.push(`Solicitante: ${t.assignee.name}`);
  if (t.description) {
    linhas.push("");
    linhas.push(t.description.trim());
  }
  return linhas.join("\n");
}
