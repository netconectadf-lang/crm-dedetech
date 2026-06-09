"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ordenarPorProximidade } from "@/lib/geo";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional"];

/** Intervalo [início, fim) de um dia local "YYYY-MM-DD" em ISO. */
function intervaloDia(data: string): { ini: string; fim: string } {
  const ini = new Date(`${data}T00:00:00`);
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 1);
  return { ini: ini.toISOString(), fim: fim.toISOString() };
}

/** Atribui (ou remove) o técnico de uma OS. Zera a ordem de rota ao trocar. */
export async function atribuirTecnicoOS(osId: string, tecnicoId: string | null): Promise<void> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("service_orders")
    .update({ tecnico_id: tecnicoId, rota_seq: null } as never)
    .eq("id", osId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/roteiros");
}

/**
 * Otimiza a rota de um técnico num dia: ordena as visitas pela heurística do
 * vizinho mais próximo e grava `rota_seq` (1..n).
 */
export async function otimizarRotaTecnico(
  data: string,
  tecnicoId: string,
): Promise<{ ok: boolean; total: number }> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const { ini, fim } = intervaloDia(data);

  const { data: osData } = await supabase
    .from("service_orders")
    .select("id, lat, lng")
    .eq("tenant_id", ctx.tenantId)
    .eq("tecnico_id", tecnicoId)
    .gte("scheduled_at", ini)
    .lt("scheduled_at", fim);

  const pontos = ((osData as { id: string; lat: number | null; lng: number | null }[] | null) ?? [])
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({ id: o.id, lat: Number(o.lat), lng: Number(o.lng) }));

  if (!pontos.length) return { ok: false, total: 0 };

  const ordenados = ordenarPorProximidade(pontos);
  let seq = 1;
  for (const p of ordenados) {
    await supabase
      .from("service_orders")
      .update({ rota_seq: seq } as never)
      .eq("id", p.id)
      .eq("tenant_id", ctx.tenantId);
    seq++;
  }
  revalidatePath("/roteiros");
  return { ok: true, total: ordenados.length };
}
