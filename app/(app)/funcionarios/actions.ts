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

const folhaSchema = z.object({
  vencimento: z.string().min(1, "Informe o vencimento"),
  recorrencia: z.enum(["unica", "mensal", "anual"]),
});

/**
 * Lança a folha do mês: cria uma conta a pagar do salário de TODOS os
 * funcionários ativos com salário. Não duplica se já lançou no mesmo mês.
 */
export async function lancarFolha(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(["owner", "rh", "financeiro"]);
  const parsed = folhaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { vencimento, recorrencia } = parsed.data;
  const supabase = await createClient();

  const { data: empData } = await supabase
    .from("employees")
    .select("nome, salario")
    .eq("tenant_id", ctx.tenantId)
    .eq("ativo", true)
    .gt("salario", 0);
  const emps = (empData as { nome: string; salario: number }[] | null) ?? [];
  if (!emps.length) return { error: "Nenhum funcionário ativo com salário." };

  // dedup: salários já lançados com vencimento no mesmo mês
  const mesIni = `${vencimento.slice(0, 7)}-01`;
  const [y, m] = vencimento.slice(0, 7).split("-").map(Number);
  const mesFim = new Date(y, m, 0).toISOString().slice(0, 10);
  const { data: jaData } = await supabase
    .from("accounts_payable")
    .select("descricao")
    .eq("tenant_id", ctx.tenantId)
    .ilike("descricao", "Salário — %")
    .gte("vencimento", mesIni)
    .lte("vencimento", mesFim);
  const jaLancados = new Set(
    ((jaData as { descricao: string }[] | null) ?? []).map((r) => r.descricao),
  );

  const novos = emps
    .filter((e) => !jaLancados.has(`Salário — ${e.nome}`))
    .map((e) => ({
      tenant_id: ctx.tenantId,
      descricao: `Salário — ${e.nome}`,
      valor: e.salario,
      vencimento,
      recorrencia,
    }));
  if (!novos.length) return { error: "A folha desse mês já foi lançada." };

  const { error } = await supabase.from("accounts_payable").insert(novos as never);
  if (error) return { error: "Não foi possível lançar a folha." };

  revalidatePath("/financeiro/pagar");
  redirect("/financeiro/pagar");
}
