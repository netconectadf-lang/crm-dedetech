"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { syncTrilogo } from "@/lib/trilogo/sync";
import type { SaveState } from "@/lib/crud-helpers";

const PATH = "/integracoes/trilogo";

/**
 * Salva o de-para: cada par "unidade Trílogo (companyId) -> cliente do CRM".
 * Os campos vêm como map_<companyId>=<clientId|"">.
 */
export async function salvarMapeamentos(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const pares: { companyId: number; clientId: string | null }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("map_")) continue;
    const companyId = Number(key.slice(4));
    if (!Number.isFinite(companyId)) continue;
    const clientId = String(value || "").trim();
    pares.push({ companyId, clientId: clientId || null });
  }

  let vinculados = 0;
  for (const { companyId, clientId } of pares) {
    // Solta qualquer cliente que estivesse com esse companyId (mantém o índice único).
    await supabase
      .from("clients")
      .update({ trilogo_company_id: null })
      .eq("tenant_id", ctx.tenantId)
      .eq("trilogo_company_id", companyId);

    if (clientId) {
      const { error } = await supabase
        .from("clients")
        .update({ trilogo_company_id: companyId })
        .eq("tenant_id", ctx.tenantId)
        .eq("id", clientId);
      if (!error) vinculados += 1;
    }
  }

  revalidatePath(PATH);
  return { message: `${vinculados} unidade(s) vinculada(s).` };
}

/** Dispara a sincronização manual dos chamados abertos. */
export async function sincronizarAgora(): Promise<void> {
  const ctx = await requireRole(["owner"]);
  await syncTrilogo(ctx.tenantId, "manual");
  revalidatePath(PATH);
}
