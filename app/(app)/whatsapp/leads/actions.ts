"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "operacional"];

const leadSchema = z.object({
  nome: z.string().optional(),
  telefone: z.string().min(8, "Telefone inválido"),
});

/** Cria um cliente PF a partir de um lead identificado no WhatsApp. */
export async function criarClienteDoLead(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos" };

  const digits = parsed.data.telefone.replace(/\D/g, "");
  // guarda no padrão dos clientes (DDD+número, sem o 55)
  const local = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  const nome = parsed.data.nome?.trim() || `WhatsApp ${local}`;

  const supabase = await createClient();
  const { data: existe } = await supabase
    .from("clients")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("telefone", local)
    .maybeSingle();
  if (existe) return { error: "Já existe cliente com esse telefone." };

  const { error } = await supabase.from("clients").insert({
    tenant_id: ctx.tenantId,
    tipo: "PF",
    razao_social: nome,
    telefone: local,
    origem: "WhatsApp",
    ativo: true,
  } as never);
  if (error) return { error: "Não foi possível criar o cliente." };

  revalidatePath("/clientes");
  return { message: `Cliente "${nome}" criado.` };
}
