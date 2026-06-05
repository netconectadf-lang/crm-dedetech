"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { absenceSchema, epiSchema, examSchema, trainingSchema } from "@/lib/validators/rh";
import type { AppRole } from "@/lib/types";
import type { AbsenceStatus } from "@/lib/rh";

const ROLES: AppRole[] = ["owner", "rh"];
// Técnico pode bater o próprio ponto; gestão registra os demais.
const PONTO_ROLES: AppRole[] = ["owner", "rh", "operacional", "tecnico"];

export async function registrarPonto(
  employeeId: string,
  tipo: "entrada" | "saida",
  lat: number | null,
  lng: number | null,
) {
  const ctx = await requireRole(PONTO_ROLES);
  const supabase = await createClient();
  await supabase.from("time_entries").insert({
    tenant_id: ctx.tenantId,
    employee_id: employeeId,
    tipo,
    lat,
    lng,
    created_by: ctx.userId,
  });
  revalidatePath(`/rh/${employeeId}`);
}

export async function solicitarAusencia(
  employeeId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = absenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("absences")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, employee_id: employeeId } as never);
  if (error) return { error: "Não foi possível registrar a ausência." };
  revalidatePath(`/rh/${employeeId}`);
  return { message: "Ausência registrada." };
}

export async function decidirAusencia(
  id: string,
  employeeId: string,
  status: AbsenceStatus,
) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("absences")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath(`/rh/${employeeId}`);
  revalidatePath("/rh");
}

export async function salvarEPI(
  employeeId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = epiSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("epi_deliveries")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, employee_id: employeeId } as never);
  if (error) return { error: "Não foi possível registrar o EPI." };
  revalidatePath(`/rh/${employeeId}`);
  return { message: "EPI registrado." };
}

export async function salvarASO(
  employeeId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = examSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("occupational_exams")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, employee_id: employeeId } as never);
  if (error) return { error: "Não foi possível registrar o exame." };
  revalidatePath(`/rh/${employeeId}`);
  return { message: "Exame (ASO) registrado." };
}

export async function salvarTreinamento(
  employeeId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = trainingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("trainings")
    .insert({ ...parsed.data, tenant_id: ctx.tenantId, employee_id: employeeId } as never);
  if (error) return { error: "Não foi possível registrar o treinamento." };
  revalidatePath(`/rh/${employeeId}`);
  return { message: "Treinamento registrado." };
}

export async function excluirTreinamento(id: string, employeeId: string) {
  await deleteRecord("trainings", id, ROLES, `/rh/${employeeId}`);
}

export async function excluirAusencia(id: string) {
  await deleteRecord("absences", id, ROLES, "/rh");
}

/** Cria o login do colaborador (Portal do Colaborador) e vincula ao funcionário. */
export async function criarAcessoColaborador(
  employeeId: string,
  _prev: SaveState,
  _formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("nome, email, user_id")
    .eq("id", employeeId)
    .maybeSingle();
  const e = emp as { nome: string; email: string | null; user_id: string | null } | null;
  if (!e) return { error: "Funcionário não encontrado." };
  if (e.user_id) return { error: "Este funcionário já tem acesso ao portal." };
  if (!e.email) return { error: "Cadastre um e-mail no funcionário antes de criar o acesso." };

  const admin = createAdminClient();
  const senha = "Dt" + randomBytes(12).toString("base64url");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: e.email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: e.nome },
  });
  if (createErr || !created?.user) {
    return { error: "Não foi possível criar o acesso (e-mail já em uso?)." };
  }

  const { error: linkErr } = await admin
    .from("employees")
    .update({ user_id: created.user.id })
    .eq("id", employeeId)
    .eq("tenant_id", ctx.tenantId);
  if (linkErr) return { error: "Acesso criado, mas falhou ao vincular ao funcionário." };

  revalidatePath(`/rh/${employeeId}`);
  return {
    message: `Acesso criado — e-mail: ${e.email} · senha: ${senha} (repasse ao colaborador).`,
  };
}
