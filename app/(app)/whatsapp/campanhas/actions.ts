"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { campanhaSchema, normalizarTelefone } from "@/lib/validators/whatsapp";
import { descobrirRedes } from "@/lib/clientes";
import {
  enviarProximoDisparo,
  sincronizarContadores,
  type DisparoResult,
} from "@/lib/whatsapp/campanha-core";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "financeiro"];
const LISTA = "/whatsapp/campanhas";

/** Cria a campanha (rascunho) e leva para a tela de detalhe. */
export async function criarCampanha(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = campanhaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wa_campanhas")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível criar a campanha." };

  redirect(`${LISTA}/${(data as { id: string }).id}`);
}

/** Vincula (ou troca) o script da campanha. */
export async function vincularScript(
  campanhaId: string,
  scriptId: string,
): Promise<{ error?: string }> {
  const ctx = await requireRole(ROLES);
  if (!scriptId) return { error: "Selecione um script." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("wa_campanhas")
    .update({ script_id: scriptId })
    .eq("id", campanhaId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível vincular o script." };
  revalidatePath(`${LISTA}/${campanhaId}`);
  return {};
}

/** Edita o texto (corpo) de um script. Atenção: afeta futuras campanhas que usem o mesmo script. */
export async function salvarCorpoScript(
  scriptId: string,
  corpo: string,
): Promise<{ error?: string }> {
  const ctx = await requireRole(ROLES);
  if (!corpo?.trim()) return { error: "A mensagem não pode ficar vazia." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("wa_scripts")
    .update({ corpo: corpo.trim() })
    .eq("id", scriptId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Não foi possível salvar a mensagem." };
  revalidatePath(LISTA);
  return {};
}

/**
 * Cria uma campanha JÁ com os contatos selecionados (ex.: filtro frio + escorpião
 * na tela de contatos). Exclui opt_out/descartado e leva direto pra campanha.
 */
export async function criarCampanhaComContatos(
  nome: string,
  contatoIds: string[],
): Promise<{ error?: string }> {
  const ctx = await requireRole(ROLES);
  if (!nome?.trim()) return { error: "Dê um nome à campanha." };
  if (!contatoIds?.length) return { error: "Nenhum contato selecionado." };

  const supabase = await createClient();
  const { data: camp, error: e1 } = await supabase
    .from("wa_campanhas")
    .insert({ tenant_id: ctx.tenantId, nome: nome.trim(), status: "rascunho" })
    .select("id")
    .single();
  if (e1 || !camp) return { error: "Não foi possível criar a campanha." };
  const campanhaId = (camp as { id: string }).id;

  // dentre os selecionados, só os elegíveis (exclui não-perturbe e descartados)
  const { data: contatos } = await supabase
    .from("wa_contatos")
    .select("id, nome, telefone")
    .eq("tenant_id", ctx.tenantId)
    .in("id", contatoIds)
    .not("status", "in", "(opt_out,descartado)");
  const lista = (contatos as { id: string; nome: string; telefone: string }[] | null) ?? [];

  if (lista.length > 0) {
    await supabase.from("wa_disparos").insert(
      lista.map((c) => ({
        tenant_id: ctx.tenantId,
        campanha_id: campanhaId,
        contato_id: c.id,
        telefone: c.telefone,
        nome: c.nome,
        status: "pendente",
      })),
    );
    await supabase
      .from("wa_campanhas")
      .update({ total_contatos: lista.length })
      .eq("id", campanhaId)
      .eq("tenant_id", ctx.tenantId);
  }

  redirect(`${LISTA}/${campanhaId}`);
}

/**
 * Cria uma campanha com TODOS os contatos que casam com o FILTRO (etiquetas de
 * temperatura/praga + status + busca) — sem o teto de 500 da tela. Pagina o banco.
 */
export async function criarCampanhaPorFiltro(
  nome: string,
  filtros: { temp?: string; praga?: string; status?: string; rec?: string; busca?: string },
): Promise<{ error?: string }> {
  const ctx = await requireRole(ROLES);
  if (!nome?.trim()) return { error: "Dê um nome à campanha." };
  const supabase = await createClient();

  const tags = [filtros.temp, filtros.praga, filtros.rec].filter(Boolean) as string[];
  const aplicar = () => {
    let q = supabase
      .from("wa_contatos")
      .select("id, nome, telefone")
      .eq("tenant_id", ctx.tenantId)
      .not("status", "in", "(opt_out,descartado)");
    if (tags.length) q = q.contains("tags", tags);
    if (filtros.status) q = q.eq("status", filtros.status);
    if (filtros.busca) q = q.or(`nome.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%`);
    return q;
  };

  // busca todos, paginando de 1000 em 1000
  const todos: { id: string; nome: string; telefone: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await aplicar().range(from, from + 999);
    if (error) return { error: "Erro ao buscar os contatos do filtro." };
    const pagina = (data as { id: string; nome: string; telefone: string }[] | null) ?? [];
    todos.push(...pagina);
    if (pagina.length < 1000) break;
  }
  if (!todos.length) return { error: "Nenhum contato elegível nesse filtro." };

  const { data: camp, error: e1 } = await supabase
    .from("wa_campanhas")
    .insert({ tenant_id: ctx.tenantId, nome: nome.trim(), status: "rascunho" })
    .select("id")
    .single();
  if (e1 || !camp) return { error: "Não foi possível criar a campanha." };
  const campanhaId = (camp as { id: string }).id;

  for (let i = 0; i < todos.length; i += 500) {
    await supabase.from("wa_disparos").insert(
      todos.slice(i, i + 500).map((c) => ({
        tenant_id: ctx.tenantId,
        campanha_id: campanhaId,
        contato_id: c.id,
        telefone: c.telefone,
        nome: c.nome,
        status: "pendente",
      })),
    );
  }
  await supabase
    .from("wa_campanhas")
    .update({ total_contatos: todos.length })
    .eq("id", campanhaId)
    .eq("tenant_id", ctx.tenantId);

  redirect(`${LISTA}/${campanhaId}`);
}

/** Adiciona à campanha os contatos que casam com o filtro de etiquetas (temperatura/praga/recência) + status. */
export async function adicionarContatosPorFiltro(
  campanhaId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const temp = String(formData.get("temp") ?? "").trim();
  const praga = String(formData.get("praga") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const rec = String(formData.get("rec") ?? "").trim();

  const tags = [temp, praga, rec].filter(Boolean);
  const aplicar = () => {
    let q = supabase
      .from("wa_contatos")
      .select("id, nome, telefone")
      .eq("tenant_id", ctx.tenantId)
      .not("status", "in", "(opt_out,descartado)");
    if (tags.length) q = q.contains("tags", tags);
    if (status) q = q.eq("status", status);
    return q;
  };

  const todos: { id: string; nome: string; telefone: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await aplicar().range(from, from + 999);
    if (error) return { error: "Erro ao buscar os contatos do filtro." };
    const pg = (data as { id: string; nome: string; telefone: string }[] | null) ?? [];
    todos.push(...pg);
    if (pg.length < 1000) break;
  }
  if (!todos.length) return { error: "Nenhum contato elegível nesse filtro." };

  const { data: jaData } = await supabase.from("wa_disparos").select("telefone").eq("campanha_id", campanhaId);
  const ja = new Set(((jaData as { telefone: string }[] | null) ?? []).map((d) => d.telefone));
  const novos = todos.filter((c) => !ja.has(c.telefone));
  if (!novos.length) return { error: "Todos os contatos desse filtro já estão na campanha." };

  for (let i = 0; i < novos.length; i += 500) {
    await supabase.from("wa_disparos").insert(
      novos.slice(i, i + 500).map((c) => ({
        tenant_id: ctx.tenantId,
        campanha_id: campanhaId,
        contato_id: c.id,
        telefone: c.telefone,
        nome: c.nome,
        status: "pendente",
      })),
    );
  }
  const { count } = await supabase
    .from("wa_disparos")
    .select("id", { count: "exact", head: true })
    .eq("campanha_id", campanhaId);
  await supabase
    .from("wa_campanhas")
    .update({ total_contatos: count ?? 0 })
    .eq("id", campanhaId)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath(`${LISTA}/${campanhaId}`);
  return { message: `${novos.length} contato(s) adicionado(s) à campanha.` };
}

/** Monta a lista de destinatários (cria disparos pendentes para contatos elegíveis). */
export async function montarDestinatarios(campanhaId: string): Promise<void> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  // contatos elegíveis (exclui não-perturbe e descartados)
  const { data: contatos } = await supabase
    .from("wa_contatos")
    .select("id, nome, telefone")
    .not("status", "in", "(opt_out,descartado)");
  const lista = (contatos as { id: string; nome: string; telefone: string }[] | null) ?? [];

  // já incluídos nesta campanha
  const { data: jaTem } = await supabase
    .from("wa_disparos")
    .select("contato_id")
    .eq("campanha_id", campanhaId);
  const incluidos = new Set(((jaTem as { contato_id: string | null }[] | null) ?? []).map((d) => d.contato_id));

  const novos = lista.filter((c) => !incluidos.has(c.id));
  if (novos.length > 0) {
    await supabase.from("wa_disparos").insert(
      novos.map((c) => ({
        tenant_id: ctx.tenantId,
        campanha_id: campanhaId,
        contato_id: c.id,
        telefone: c.telefone,
        nome: c.nome,
        status: "pendente",
      })),
    );
  }

  // total = todos os disparos da campanha
  const { count } = await supabase
    .from("wa_disparos")
    .select("id", { count: "exact", head: true })
    .eq("campanha_id", campanhaId);
  await supabase
    .from("wa_campanhas")
    .update({ total_contatos: count ?? 0 })
    .eq("id", campanhaId)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath(`${LISTA}/${campanhaId}`);
}

/**
 * Adiciona CLIENTES do CRM como destinatários da campanha (com filtros), criando
 * disparos pendentes direto — sem precisar importar como contatos antes.
 */
export async function adicionarClientesNaCampanha(
  campanhaId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const segmento = String(formData.get("segmento") ?? "").trim();
  const rede = String(formData.get("rede") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const somenteAtivos = formData.get("somente_ativos") !== "false";

  let q = supabase
    .from("clients")
    .select("id, razao_social, nome_fantasia, telefone, segmento, uf, cidade")
    .eq("tenant_id", ctx.tenantId)
    .not("telefone", "is", null);
  if (somenteAtivos) q = q.eq("ativo", true);
  if (segmento) q = q.eq("segmento", segmento);
  if (uf) q = q.eq("uf", uf);
  if (cidade) q = q.ilike("cidade", `%${cidade}%`);

  const { data } = await q;
  let clientes =
    (data as {
      razao_social: string;
      nome_fantasia: string | null;
      telefone: string | null;
    }[] | null) ?? [];

  // filtro de rede (derivada do nome)
  if (rede) {
    const { redeDe } = descobrirRedes(clientes);
    clientes = clientes.filter((c) => {
      const r = redeDe(c.razao_social, c.nome_fantasia);
      return rede === "__sem" ? r == null : r === rede;
    });
  }

  // normaliza telefone + dedup interno
  const porTel = new Map<string, { telefone: string; nome: string }>();
  for (const c of clientes) {
    const tel = normalizarTelefone(c.telefone ?? "");
    if (tel.length < 12 || tel.length > 13) continue;
    if (!porTel.has(tel)) {
      porTel.set(tel, { telefone: tel, nome: c.nome_fantasia?.trim() || c.razao_social });
    }
  }

  // dedup contra quem já está na campanha (por telefone)
  const { data: jaData } = await supabase
    .from("wa_disparos")
    .select("telefone")
    .eq("campanha_id", campanhaId);
  const jaTel = new Set(((jaData as { telefone: string }[] | null) ?? []).map((d) => d.telefone));

  const novos = [...porTel.values()]
    .filter((c) => !jaTel.has(c.telefone))
    .map((c) => ({
      tenant_id: ctx.tenantId,
      campanha_id: campanhaId,
      contato_id: null,
      telefone: c.telefone,
      nome: c.nome,
      status: "pendente",
    }));

  if (!novos.length) {
    return { error: "Nenhum cliente novo nesse filtro (já incluídos ou sem telefone válido)." };
  }

  const { error } = await supabase.from("wa_disparos").insert(novos as never);
  if (error) return { error: "Não foi possível adicionar os clientes." };

  const { count } = await supabase
    .from("wa_disparos")
    .select("id", { count: "exact", head: true })
    .eq("campanha_id", campanhaId);
  await supabase
    .from("wa_campanhas")
    .update({ total_contatos: count ?? 0 })
    .eq("id", campanhaId)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath(`${LISTA}/${campanhaId}`);
  return { message: `${novos.length} cliente(s) adicionado(s) à campanha.` };
}

/** Remove os destinatários ainda pendentes (reset antes de iniciar). */
export async function limparPendentes(campanhaId: string): Promise<void> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("wa_disparos")
    .delete()
    .eq("campanha_id", campanhaId)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pendente");
  await sincronizarContadores(supabase, campanhaId, ctx.tenantId);
  revalidatePath(`${LISTA}/${campanhaId}`);
}

/**
 * Envia a PRÓXIMA mensagem pendente da campanha (fluxo com a aba aberta).
 * O núcleo está em lib/whatsapp/campanha-core (reusado pelo cron que drena
 * campanhas em "enviando" mesmo com a aba fechada). Intervalo anti-ban é
 * controlado pelo cliente entre chamadas.
 */
export async function dispararProxima(campanhaId: string): Promise<DisparoResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const r = await enviarProximoDisparo(supabase, ctx.tenantId, campanhaId);
  revalidatePath(`${LISTA}/${campanhaId}`);
  return r;
}

export async function excluirCampanha(id: string): Promise<void> {
  await deleteRecord("wa_campanhas", id, ROLES, LISTA);
}
