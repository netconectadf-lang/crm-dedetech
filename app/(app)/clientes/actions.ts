"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { clientSchema, clientUnitSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "operacional"];

/**
 * Cria (ou recupera) o acesso do cliente ao Portal: gera um usuário confirmado
 * vinculado ao client_id e devolve as credenciais p/ a empresa repassar.
 * (Quando houver SMTP, trocar por convite/magic link por e-mail.)
 */
export async function convidarPortal(
  clientId: string,
  _prev: SaveState,
  _formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner", "comercial"]);
  const supabase = await createClient();
  const { data: cli } = await supabase
    .from("clients")
    .select("razao_social, email")
    .eq("id", clientId)
    .maybeSingle();
  const cliente = cli as { razao_social: string; email: string | null } | null;
  if (!cliente?.email) {
    return { error: "Cadastre um e-mail no cliente antes de convidar." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("client_portal_users")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (existing) return { error: "Este cliente já tem acesso ao portal." };

  const senha = "Dt" + Math.random().toString(36).slice(2, 10);
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: cliente.email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: cliente.razao_social },
  });
  if (createErr || !created?.user) {
    return { error: "Não foi possível criar o acesso (e-mail já em uso?)." };
  }

  const { error: linkErr } = await admin.from("client_portal_users").insert({
    tenant_id: ctx.tenantId,
    client_id: clientId,
    user_id: created.user.id,
  });
  if (linkErr) return { error: "Acesso criado, mas falhou ao vincular." };

  return {
    message: `Acesso criado — e-mail: ${cliente.email} · senha: ${senha} (repasse ao cliente).`,
  };
}

export async function salvarCliente(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "clients",
    schema: clientSchema,
    formData,
    roles: ROLES,
    path: "/clientes",
    id,
  });
}

export async function excluirCliente(id: string) {
  await deleteRecord("clients", id, ROLES, "/clientes");
}

// ─── Unidades ────────────────────────────────────────────────────────
export async function salvarUnidade(
  clientId: string,
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  // injeta o client_id (não vem do form)
  formData.set("client_id", clientId);
  return saveRecord({
    table: "client_units",
    schema: clientUnitSchema,
    formData,
    roles: ROLES,
    path: `/clientes/${clientId}`,
    id,
  });
}

export async function excluirUnidade(clientId: string, id: string) {
  await deleteRecord("client_units", id, ROLES, `/clientes/${clientId}`);
}
