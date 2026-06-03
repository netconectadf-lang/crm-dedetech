import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PortalContext = {
  userId: string;
  clientId: string;
  tenantId: string;
  clientName: string;
};

/**
 * Resolve o acesso do portal: o usuário logado tem um vínculo em
 * client_portal_users? Usa o admin client (o usuário do portal não é membro
 * do tenant, então não enxerga nada via RLS). Retorna null se não tem acesso.
 */
export async function getPortalContext(): Promise<PortalContext | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("client_portal_users")
    .select("client_id, tenant_id, clients(razao_social, nome_fantasia)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  const row = data as unknown as {
    client_id: string;
    tenant_id: string;
    clients: { razao_social: string; nome_fantasia: string | null } | null;
  };
  return {
    userId: user.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    clientName: row.clients?.nome_fantasia || row.clients?.razao_social || "Cliente",
  };
}

/** Existe vínculo de portal para o usuário atual? (para roteamento) */
export async function hasPortalAccess(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_portal_users")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}
