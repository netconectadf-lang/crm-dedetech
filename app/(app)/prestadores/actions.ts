"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { prestadorSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "rh"];

export async function salvarPrestador(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "service_providers",
    schema: prestadorSchema,
    formData,
    roles: ROLES,
    path: "/prestadores",
    id,
  });
}

export async function excluirPrestador(id: string) {
  await deleteRecord("service_providers", id, ROLES, "/prestadores");
}

const pagamentoSchema = z.object({
  valor: z.coerce.number().min(0.01, "Informe o valor do pagamento"),
  vencimento: z.string().min(1, "Informe o vencimento"),
  recorrencia: z.enum(["unica", "mensal", "anual"]),
  observacoes: z.string().optional(),
});

/** Lança o pagamento do prestador como conta a pagar (pode ser recorrente mensal). */
export async function lancarPagamentoPrestador(
  prestadorId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner", "rh", "financeiro"]);
  const parsed = pagamentoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: p } = await supabase
    .from("service_providers")
    .select("nome")
    .eq("id", prestadorId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const nome = (p as { nome: string } | null)?.nome;
  if (!nome) return { error: "Prestador não encontrado." };

  const { error } = await supabase.from("accounts_payable").insert({
    tenant_id: ctx.tenantId,
    descricao: `Prestador — ${nome}`,
    valor: parsed.data.valor,
    vencimento: parsed.data.vencimento,
    recorrencia: parsed.data.recorrencia,
    observacoes: parsed.data.observacoes || null,
  } as never);
  if (error) return { error: "Não foi possível lançar o pagamento." };

  revalidatePath("/financeiro/pagar");
  redirect("/financeiro/pagar");
}
