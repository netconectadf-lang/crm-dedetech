"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { deviceSchema, readingSchema } from "@/lib/validators/mip";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional", "tecnico"];

export async function salvarDispositivo(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = deviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  // client_id derivado da unidade
  const { data: unit } = await supabase
    .from("client_units")
    .select("client_id")
    .eq("id", parsed.data.unit_id)
    .maybeSingle();
  const client_id = (unit as { client_id: string } | null)?.client_id ?? null;
  const payload = { ...parsed.data, client_id };

  if (id) {
    const { error } = await supabase
      .from("mip_devices")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
    if (error) return { error: "Não foi possível salvar." };
  } else {
    const { error } = await supabase
      .from("mip_devices")
      .insert({ ...payload, tenant_id: ctx.tenantId });
    if (error) return { error: "Não foi possível criar o dispositivo." };
  }
  revalidatePath("/mip");
  return { message: "Dispositivo salvo." };
}

export async function excluirDispositivo(id: string) {
  await deleteRecord("mip_devices", id, ROLES, "/mip");
}

export async function registrarLeitura(
  deviceId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = readingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("mip_readings").insert({
    ...parsed.data,
    tenant_id: ctx.tenantId,
    device_id: deviceId,
    created_by: ctx.userId,
  } as never);
  if (error) return { error: "Não foi possível registrar a leitura." };
  revalidatePath(`/mip/${deviceId}`);
  return { message: "Leitura registrada." };
}
