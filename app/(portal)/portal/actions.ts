"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getPortalContext } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SaveState } from "@/lib/crud-helpers";

const schema = z.object({
  tipo: z.enum(["visita_extra", "duvida", "reclamacao", "outro"]),
  mensagem: z.string().min(3, "Descreva sua solicitação"),
});

export async function abrirChamado(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const portal = await getPortalContext();
  if (!portal) return { error: "Sessão inválida." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("client_requests").insert({
    tenant_id: portal.tenantId,
    client_id: portal.clientId,
    tipo: parsed.data.tipo,
    mensagem: parsed.data.mensagem,
  });
  if (error) return { error: "Não foi possível enviar." };

  revalidatePath("/portal");
  return { message: "Solicitação enviada! Em breve entraremos em contato." };
}
