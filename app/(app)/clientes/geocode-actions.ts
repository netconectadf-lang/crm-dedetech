"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { geocodeEndereco, sleep } from "@/lib/geocoding";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional", "comercial"];
const LOTE = 8; // clientes por chamada (Nominatim ~1 req/s → ~9s, dentro do timeout)

type ClienteGeo = {
  id: string;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
};

export type GeocodeLoteResult = {
  processados: number;
  ok: number;
  restantes: number;
};

/**
 * Geocodifica um lote de clientes pendentes (sem lat/lng, com cidade e que
 * ainda não falharam). Salva lat/lng no cliente e propaga para as OS desse
 * cliente que estiverem sem coordenadas. Retorna o progresso para o cliente
 * (browser) chamar de novo até `restantes` chegar a zero.
 */
export async function geocodificarClientesLote(): Promise<GeocodeLoteResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("id, logradouro, numero, bairro, cidade, uf, cep")
    .eq("tenant_id", ctx.tenantId)
    .is("lat", null)
    .eq("geo_falhou", false)
    .not("cidade", "is", null)
    .limit(LOTE);
  const pendentes = (data as ClienteGeo[] | null) ?? [];

  let ok = 0;
  for (let i = 0; i < pendentes.length; i++) {
    const c = pendentes[i];
    if (i > 0) await sleep(1100); // respeita o rate limit do Nominatim
    const geo = await geocodeEndereco(c);
    if (!geo) {
      await supabase.from("clients").update({ geo_falhou: true } as never).eq("id", c.id).eq("tenant_id", ctx.tenantId);
      continue;
    }
    await supabase
      .from("clients")
      .update({ lat: geo.lat, lng: geo.lng, geo_falhou: false } as never)
      .eq("id", c.id)
      .eq("tenant_id", ctx.tenantId);
    // propaga para as OS desse cliente que estão sem coordenadas
    await supabase
      .from("service_orders")
      .update({ lat: geo.lat, lng: geo.lng } as never)
      .eq("client_id", c.id)
      .eq("tenant_id", ctx.tenantId)
      .is("lat", null);
    ok++;
  }

  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .is("lat", null)
    .eq("geo_falhou", false)
    .not("cidade", "is", null);

  revalidatePath("/roteiros");
  revalidatePath("/mapa");
  return { processados: pendentes.length, ok, restantes: count ?? 0 };
}
