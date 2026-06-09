"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { contatoSchema, normalizarTelefone } from "@/lib/validators/whatsapp";
import { findContacts } from "@/lib/whatsapp/evolution";
import type { AppRole } from "@/lib/types";

type DbClient = Awaited<ReturnType<typeof createClient>>;

const ROLES: AppRole[] = ["owner", "comercial", "financeiro"];
const PATH = "/whatsapp/contatos";

export type ImportResult = { inseridos: number; ignorados: number; erro?: string };

type NovoContato = {
  nome: string;
  telefone: string;
  variavel_1?: string | null;
  origem: "csv" | "cliente" | "whatsapp";
  client_id?: string | null;
};

/** Insere contatos novos, pulando telefones que já existem na empresa. */
async function inserir(
  supabase: DbClient,
  tenantId: string,
  brutos: NovoContato[],
): Promise<ImportResult> {
  // normaliza + valida + dedup interno por telefone
  const mapa = new Map<string, NovoContato>();
  for (const c of brutos) {
    const tel = normalizarTelefone(c.telefone);
    if (tel.length < 12 || tel.length > 13) continue;
    if (!mapa.has(tel)) mapa.set(tel, { ...c, telefone: tel, nome: c.nome?.trim() || tel });
  }
  const candidatos = [...mapa.values()];
  if (candidatos.length === 0) return { inseridos: 0, ignorados: 0, erro: "Nenhum telefone válido." };

  const tels = candidatos.map((c) => c.telefone);
  const { data: existentes } = await supabase
    .from("wa_contatos")
    .select("telefone")
    .in("telefone", tels);
  const jaTem = new Set(((existentes as { telefone: string }[] | null) ?? []).map((e) => e.telefone));

  const novos = candidatos.filter((c) => !jaTem.has(c.telefone));
  if (novos.length === 0) return { inseridos: 0, ignorados: candidatos.length };

  const { error } = await supabase.from("wa_contatos").insert(
    novos.map((c) => ({
      tenant_id: tenantId,
      nome: c.nome,
      telefone: c.telefone,
      variavel_1: c.variavel_1 ?? null,
      origem: c.origem,
      client_id: c.client_id ?? null,
    })),
  );
  if (error) return { inseridos: 0, ignorados: 0, erro: "Falha ao salvar contatos." };

  revalidatePath(PATH);
  return { inseridos: novos.length, ignorados: candidatos.length - novos.length };
}

/** Importa de lista colada/CSV: cada item { nome, telefone, variavel_1 }. */
export async function importarLista(
  itens: { nome?: string; telefone: string; variavel_1?: string }[],
): Promise<ImportResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  return inserir(
    supabase,
    ctx.tenantId,
    (itens ?? []).map((i) => ({
      nome: i.nome ?? "",
      telefone: i.telefone,
      variavel_1: i.variavel_1,
      origem: "csv",
    })),
  );
}

/** Importa os clientes do CRM (ativos, com telefone) como contatos. */
export async function importarClientes(): Promise<ImportResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, razao_social, nome_fantasia, telefone")
    .eq("ativo", true)
    .not("telefone", "is", null);
  const clientes = (data as { id: string; razao_social: string; nome_fantasia: string | null; telefone: string | null }[] | null) ?? [];
  return inserir(
    supabase,
    ctx.tenantId,
    clientes
      .filter((c) => c.telefone)
      .map((c) => ({
        nome: c.nome_fantasia || c.razao_social,
        telefone: c.telefone as string,
        origem: "cliente" as const,
        client_id: c.id,
      })),
  );
}

/** Importa os contatos salvos no WhatsApp conectado (Evolution). */
export async function importarDoWhatsapp(): Promise<ImportResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const contatos = await findContacts();
  if (contatos.length === 0) return { inseridos: 0, ignorados: 0, erro: "Nenhum contato retornado pelo WhatsApp." };
  return inserir(
    supabase,
    ctx.tenantId,
    contatos.map((c) => ({ nome: c.nome, telefone: c.telefone, origem: "whatsapp" as const })),
  );
}

/** Cadastro/edição manual de um contato. */
export async function salvarContato(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({ table: "wa_contatos", schema: contatoSchema, formData, roles: ROLES, path: PATH, id });
}

export async function excluirContato(id: string): Promise<void> {
  await deleteRecord("wa_contatos", id, ROLES, PATH);
}

export async function definirStatusContato(id: string, status: string): Promise<void> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase.from("wa_contatos").update({ status }).eq("id", id).eq("tenant_id", ctx.tenantId);
  revalidatePath(PATH);
}

/** Telefone no padrão dos clientes: DDD+número, sem o 55. */
function telefoneLocal(tel: string): string {
  const d = (tel ?? "").replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d.slice(2) : d;
}

export type ConverterResult = { criados: number; ignorados: number; erro?: string };

/**
 * Converte contatos selecionados (wa_contatos) em clientes (PF), em lote.
 * Deduplica por telefone (não recria quem já é cliente) e vincula o contato
 * ao cliente (wa_contatos.client_id).
 */
export async function converterContatosEmClientes(ids: string[]): Promise<ConverterResult> {
  const ctx = await requireRole(ROLES);
  if (!ids.length) return { criados: 0, ignorados: 0, erro: "Selecione ao menos um contato." };
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("wa_contatos")
    .select("id, nome, telefone")
    .eq("tenant_id", ctx.tenantId)
    .in("id", ids);
  const contatos = (raw as { id: string; nome: string; telefone: string }[] | null) ?? [];
  if (!contatos.length) return { criados: 0, ignorados: 0, erro: "Contatos não encontrados." };

  const comLocal = contatos
    .map((c) => ({ ...c, local: telefoneLocal(c.telefone) }))
    .filter((c) => c.local.length >= 10);

  // clientes que já existem (por telefone) → não recriar
  const locais = [...new Set(comLocal.map((c) => c.local))];
  const { data: existentes } = await supabase
    .from("clients")
    .select("id, telefone")
    .eq("tenant_id", ctx.tenantId)
    .in("telefone", locais);
  const mapa = new Map<string, string>(
    ((existentes as { id: string; telefone: string }[] | null) ?? []).map((e) => [e.telefone, e.id]),
  );

  // monta os novos (dedup também dentro do lote)
  const vistos = new Set<string>();
  const novos = comLocal
    .filter((c) => {
      if (mapa.has(c.local) || vistos.has(c.local)) return false;
      vistos.add(c.local);
      return true;
    })
    .map((c) => ({
      tenant_id: ctx.tenantId,
      tipo: "PF",
      razao_social: c.nome?.trim() || `WhatsApp ${c.local}`,
      telefone: c.local,
      origem: "WhatsApp",
      ativo: true,
    }));

  let criados = 0;
  if (novos.length) {
    const { data: ins, error } = await supabase
      .from("clients")
      .insert(novos as never)
      .select("id, telefone");
    if (error) return { criados: 0, ignorados: 0, erro: "Falha ao criar clientes." };
    const inseridos = (ins as { id: string; telefone: string }[] | null) ?? [];
    criados = inseridos.length;
    for (const i of inseridos) mapa.set(i.telefone, i.id);
  }

  // vincula cada contato ao seu cliente (novo ou já existente)
  for (const c of comLocal) {
    const clientId = mapa.get(c.local);
    if (clientId) {
      await supabase
        .from("wa_contatos")
        .update({ client_id: clientId, origem: "cliente" })
        .eq("id", c.id)
        .eq("tenant_id", ctx.tenantId);
    }
  }

  revalidatePath(PATH);
  revalidatePath("/clientes");
  return { criados, ignorados: comLocal.length - criados };
}
