"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { employeeSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "rh"];

export async function salvarFuncionario(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "employees",
    schema: employeeSchema,
    formData,
    roles: ROLES,
    path: "/funcionarios",
    id,
  });
}

export async function excluirFuncionario(id: string) {
  await deleteRecord("employees", id, ROLES, "/funcionarios");
}

const salarioSchema = z.object({
  valor: z.coerce.number().min(0.01, "Informe o valor do salário"),
  vencimento: z.string().min(1, "Informe o vencimento"),
  recorrencia: z.enum(["unica", "mensal", "anual"]),
  observacoes: z.string().optional(),
});

/** Lança o salário do funcionário como conta a pagar no financeiro. */
export async function lancarSalario(
  employeeId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner", "rh", "financeiro"]);
  const parsed = salarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("nome")
    .eq("id", employeeId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const nome = (emp as { nome: string } | null)?.nome;
  if (!nome) return { error: "Funcionário não encontrado." };

  const { error } = await supabase.from("accounts_payable").insert({
    tenant_id: ctx.tenantId,
    descricao: `Salário — ${nome}`,
    valor: parsed.data.valor,
    vencimento: parsed.data.vencimento,
    recorrencia: parsed.data.recorrencia,
    observacoes: parsed.data.observacoes || null,
  } as never);
  if (error) return { error: "Não foi possível lançar o salário." };

  revalidatePath("/financeiro/pagar");
  redirect("/financeiro/pagar");
}
