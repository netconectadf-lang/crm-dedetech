"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

/** Resposta pública do NPS (sem sessão), gated pelo token. */
export async function responderNPS(token: string, formData: FormData) {
  if (!(await rateLimit("nps", { limit: 10, windowSeconds: 60 }))) return;

  const score = Number(formData.get("score"));
  const comentario = String(formData.get("comentario") ?? "").slice(0, 1000);
  if (!Number.isInteger(score) || score < 0 || score > 10) return;

  const db = createAdminClient();
  const { data } = await db
    .from("nps_responses")
    .select("id, respondido_em")
    .eq("token", token)
    .maybeSingle();
  const row = data as { id: string; respondido_em: string | null } | null;
  if (!row || row.respondido_em) return;

  await db
    .from("nps_responses")
    .update({ score, comentario: comentario || null, respondido_em: new Date().toISOString() })
    .eq("id", row.id);

  revalidatePath(`/nps/${token}`);
}
