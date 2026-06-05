"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getColaboradorContext } from "@/lib/colaborador";
import { absenceSchema } from "@/lib/validators/rh";
import type { SaveState } from "@/lib/crud-helpers";

/** O próprio colaborador bate o ponto (entrada/saída) com geolocalização. */
export async function baterPontoColaborador(
  tipo: "entrada" | "saida",
  lat: number | null,
  lng: number | null,
): Promise<{ ok: boolean }> {
  const ctx = await getColaboradorContext();
  if (!ctx) return { ok: false };
  const admin = createAdminClient();
  const { error } = await admin.from("time_entries").insert({
    tenant_id: ctx.tenantId,
    employee_id: ctx.employeeId,
    tipo,
    lat,
    lng,
    created_by: ctx.userId,
  });
  revalidatePath("/colaborador");
  return { ok: !error };
}

/** O colaborador solicita férias/ausência — entra como 'solicitada' p/ o RH aprovar. */
export async function pedirAusenciaColaborador(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await getColaboradorContext();
  if (!ctx) return { error: "Sessão inválida — entre novamente." };
  const parsed = absenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const admin = createAdminClient();
  const { error } = await admin.from("absences").insert({
    ...parsed.data,
    tenant_id: ctx.tenantId,
    employee_id: ctx.employeeId,
    status: "solicitada",
  } as never);
  if (error) return { error: "Não foi possível enviar a solicitação." };

  revalidatePath("/colaborador");
  return { message: "Solicitação enviada ao RH." };
}
