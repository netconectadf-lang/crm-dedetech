"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { dispatch } from "@/lib/notify/dispatch";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional", "comercial"];

async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Cria a pesquisa NPS da OS e envia o link ao cliente (inerte sem provider). */
export async function enviarNPS(osId: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const { data: osData } = await supabase
    .from("service_orders")
    .select("id, numero, client_id, clients(razao_social, telefone, email)")
    .eq("id", osId)
    .maybeSingle();
  const os = osData as unknown as {
    id: string;
    numero: number;
    client_id: string;
    clients: { razao_social: string; telefone: string | null; email: string | null } | null;
  } | null;
  if (!os) return;

  const { data: created } = await supabase
    .from("nps_responses")
    .insert({ tenant_id: ctx.tenantId, os_id: os.id, client_id: os.client_id })
    .select("token")
    .single();
  const token = (created as { token: string } | null)?.token;
  if (!token) return;

  const link = `${await appOrigin()}/nps/${token}`;
  const corpo = `Olá! Como foi nosso atendimento (OS #${os.numero})? Avalie em: ${link}`;

  if (os.clients?.telefone) {
    await dispatch({ tenantId: ctx.tenantId, canal: "whatsapp", destino: os.clients.telefone, corpo, related_kind: "nps", related_id: os.id });
  } else if (os.clients?.email) {
    await dispatch({ tenantId: ctx.tenantId, canal: "email", destino: os.clients.email, assunto: "Avalie seu atendimento", corpo, related_kind: "nps", related_id: os.id });
  }

  revalidatePath(`/os/${osId}`);
}
