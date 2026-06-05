"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { campanhaSchema, normalizarTelefone } from "@/lib/validators/whatsapp";
import { descobrirRedes } from "@/lib/clientes";
import { renderScript } from "@/lib/whatsapp/render";
import { sendText } from "@/lib/whatsapp/evolution";
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
  await sincronizarContadores(campanhaId, ctx.tenantId);
  revalidatePath(`${LISTA}/${campanhaId}`);
}

async function sincronizarContadores(campanhaId: string, tenantId: string) {
  const supabase = await createClient();
  const counts = await Promise.all(
    ["enviado", "falha", "pendente"].map((s) =>
      supabase
        .from("wa_disparos")
        .select("id", { count: "exact", head: true })
        .eq("campanha_id", campanhaId)
        .eq("status", s),
    ),
  );
  const [enviados, falhas, pendentes] = counts.map((c) => c.count ?? 0);
  await supabase
    .from("wa_campanhas")
    .update({
      enviados,
      falhas,
      total_contatos: enviados + falhas + pendentes,
    })
    .eq("id", campanhaId)
    .eq("tenant_id", tenantId);
  return { enviados, falhas, pendentes };
}

export type DisparoResult = {
  enviado: boolean;
  restantes: number;
  concluido: boolean;
  erro?: string;
};

/**
 * Envia a PRÓXIMA mensagem pendente da campanha. O intervalo anti-ban é
 * controlado pelo cliente (espera entre chamadas), mantendo cada execução
 * curta e segura contra timeout de função.
 */
export async function dispararProxima(campanhaId: string): Promise<DisparoResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const { data: campRaw } = await supabase
    .from("wa_campanhas")
    .select("id, script_id, status")
    .eq("id", campanhaId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const camp = campRaw as { id: string; script_id: string | null; status: string } | null;
  if (!camp) return { enviado: false, restantes: 0, concluido: true, erro: "Campanha não encontrada." };
  if (!camp.script_id) return { enviado: false, restantes: 0, concluido: true, erro: "Campanha sem script." };

  const [{ data: scriptRaw }, { data: tenantRaw }] = await Promise.all([
    supabase.from("wa_scripts").select("corpo").eq("id", camp.script_id).maybeSingle(),
    supabase.from("tenants").select("razao_social, nome_fantasia").eq("id", ctx.tenantId).maybeSingle(),
  ]);
  const corpo = (scriptRaw as { corpo: string } | null)?.corpo;
  if (!corpo) return { enviado: false, restantes: 0, concluido: true, erro: "Script não encontrado." };
  const tnt = tenantRaw as { razao_social: string; nome_fantasia: string | null } | null;
  const empresa = tnt?.nome_fantasia || tnt?.razao_social || "";

  const { data: dispRaw } = await supabase
    .from("wa_disparos")
    .select("id, telefone, nome, contato_id")
    .eq("campanha_id", campanhaId)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const disp = dispRaw as { id: string; telefone: string; nome: string | null; contato_id: string | null } | null;

  if (!disp) {
    await supabase
      .from("wa_campanhas")
      .update({ status: "concluida", concluida_em: new Date().toISOString() })
      .eq("id", campanhaId)
      .eq("tenant_id", ctx.tenantId);
    return { enviado: false, restantes: 0, concluido: true };
  }

  // marca campanha como enviando na primeira mensagem
  if (camp.status !== "enviando") {
    await supabase
      .from("wa_campanhas")
      .update({ status: "enviando", iniciada_em: new Date().toISOString() })
      .eq("id", campanhaId)
      .eq("tenant_id", ctx.tenantId);
  }

  // variáveis do contato
  let v1: string | null = null;
  let v2: string | null = null;
  let v3: string | null = null;
  if (disp.contato_id) {
    const { data: c } = await supabase
      .from("wa_contatos")
      .select("variavel_1, variavel_2, variavel_3")
      .eq("id", disp.contato_id)
      .maybeSingle();
    const cc = c as { variavel_1: string | null; variavel_2: string | null; variavel_3: string | null } | null;
    v1 = cc?.variavel_1 ?? null;
    v2 = cc?.variavel_2 ?? null;
    v3 = cc?.variavel_3 ?? null;
  }

  const msg = renderScript(corpo, {
    nome: disp.nome,
    empresa,
    variavel_1: v1,
    variavel_2: v2,
    variavel_3: v3,
  });

  const r = await sendText(disp.telefone, msg);

  await supabase
    .from("wa_disparos")
    .update({
      status: r.ok ? "enviado" : "falha",
      mensagem_enviada: msg,
      erro: r.ok ? null : r.error ?? "Falha no envio",
      provider_message_id: r.providerId ?? null,
      enviado_em: new Date().toISOString(),
    })
    .eq("id", disp.id)
    .eq("tenant_id", ctx.tenantId);

  const { pendentes } = await sincronizarContadores(campanhaId, ctx.tenantId);
  const concluido = pendentes === 0;
  if (concluido) {
    await supabase
      .from("wa_campanhas")
      .update({ status: "concluida", concluida_em: new Date().toISOString() })
      .eq("id", campanhaId)
      .eq("tenant_id", ctx.tenantId);
  }
  revalidatePath(`${LISTA}/${campanhaId}`);
  return { enviado: r.ok, restantes: pendentes, concluido, erro: r.ok ? undefined : r.error };
}

export async function excluirCampanha(id: string): Promise<void> {
  await deleteRecord("wa_campanhas", id, ROLES, LISTA);
}
