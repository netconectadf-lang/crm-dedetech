"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "operacional", "financeiro"];

export async function atualizarStatusChamado(
  id: string,
  status: "aberto" | "em_andamento" | "resolvido",
) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("client_requests")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/chamados");
}
