"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { enviarNpsDaOS } from "@/lib/nps/enviar";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional", "comercial"];

/** Cria a pesquisa NPS da OS e envia o link ao cliente (inerte sem provider). */
export async function enviarNPS(osId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await enviarNpsDaOS(supabase, ctx.tenantId, osId, { auto: false });
  revalidatePath(`/os/${osId}`);
}
