"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
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
