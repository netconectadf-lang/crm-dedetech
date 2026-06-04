"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import type { AppRole } from "@/lib/types";

const FIELD: AppRole[] = ["owner", "operacional", "tecnico"];
const VALIDADES = [30, 60, 90, 120];

/** Salva a assinatura do cliente (data URL do canvas) no Storage e vincula à OS. */
export async function salvarAssinatura(
  osId: string,
  dataUrl: string,
): Promise<{ error?: string; message?: string }> {
  const ctx = await requireRole(FIELD);

  if (!dataUrl.startsWith("data:image/png;base64,")) {
    return { error: "Assinatura inválida." };
  }
  const bytes = Buffer.from(dataUrl.split(",")[1] ?? "", "base64");
  if (bytes.length === 0) return { error: "Assinatura em branco." };
  if (bytes.length > 700_000) return { error: "Assinatura muito grande." };

  const admin = createAdminClient();
  const path = `${ctx.tenantId}/${osId}.png`;
  const { error: upErr } = await admin.storage
    .from("assinaturas")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (upErr) return { error: "Falha ao salvar a assinatura." };

  const { data: pub } = admin.storage.from("assinaturas").getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const sb = await createClient();
  const { error } = await sb
    .from("service_orders")
    .update({ assinatura_cliente_url: url })
    .eq("id", osId)
    .eq("tenant_id", ctx.tenantId);
  if (error) return { error: "Falha ao vincular a assinatura à OS." };

  revalidatePath(`/os/${osId}/certificado`);
  return { message: "Assinatura registrada." };
}

/** Define a validade do serviço (próxima revisão) em N dias a partir da execução. */
export async function definirValidade(osId: string, dias: number): Promise<void> {
  const ctx = await requireRole(FIELD);
  if (!VALIDADES.includes(dias)) return;

  const sb = await createClient();
  const { data } = await sb
    .from("service_orders")
    .select("executada_em")
    .eq("id", osId)
    .maybeSingle();
  const exec = (data as { executada_em: string | null } | null)?.executada_em;

  const base = exec ? new Date(exec) : new Date();
  base.setDate(base.getDate() + dias);

  await sb
    .from("service_orders")
    .update({ proxima_revisao_em: base.toISOString().slice(0, 10) })
    .eq("id", osId)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath(`/os/${osId}/certificado`);
}
