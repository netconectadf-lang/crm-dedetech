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

  // Promotor (nota alta) → convida para avaliar no Google (best-effort).
  if (score >= 9) {
    await pedirReviewGoogle(token).catch(() => {});
  }

  revalidatePath(`/nps/${token}`);
}

/**
 * Envia ao cliente promotor (NPS 9-10) o link de avaliação do Google da empresa.
 * Best-effort e tolerante: se a coluna google_review_url ainda não existir, ou
 * não estiver preenchida, ou o cliente não tiver contato, simplesmente não faz
 * nada. Dedup por messages (related_kind=nps_review).
 */
async function pedirReviewGoogle(token: string): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { dispatch } = await import("@/lib/notify/dispatch");
  const { nomeExibicao } = await import("@/lib/clientes");
  const { onlyDigits } = await import("@/lib/format");
  const db = createAdminClient();

  const { data: npsData } = await db
    .from("nps_responses")
    .select("id, tenant_id, client_id, clients:client_id(razao_social, nome_fantasia, telefone, email)")
    .eq("token", token)
    .maybeSingle();
  const nps = npsData as {
    id: string;
    tenant_id: string;
    client_id: string | null;
    clients:
      | { razao_social: string; nome_fantasia: string | null; telefone: string | null; email: string | null }
      | { razao_social: string; nome_fantasia: string | null; telefone: string | null; email: string | null }[]
      | null;
  } | null;
  if (!nps) return;

  // Link de avaliação (coluna pode não existir até a migration rodar → try).
  let reviewUrl = "";
  let empresa = "nossa equipe";
  try {
    const { data: t } = await db
      .from("tenants")
      .select("google_review_url, razao_social, nome_fantasia")
      .eq("id", nps.tenant_id)
      .maybeSingle();
    const tt = t as { google_review_url: string | null; razao_social: string; nome_fantasia: string | null } | null;
    reviewUrl = tt?.google_review_url?.trim() || "";
    empresa = tt?.nome_fantasia?.trim() || tt?.razao_social || "nossa equipe";
  } catch {
    return; // coluna ainda não existe
  }
  if (!reviewUrl) return;

  const cli = Array.isArray(nps.clients) ? nps.clients[0] : nps.clients;
  const tel = cli?.telefone ? onlyDigits(cli.telefone) : "";
  const email = cli?.email?.trim() || "";
  if (!tel && !email) return;

  // dedup
  const { data: msg } = await db
    .from("messages")
    .select("id")
    .eq("tenant_id", nps.tenant_id)
    .eq("related_kind", "nps_review")
    .eq("related_id", nps.id)
    .in("status", ["sent", "skipped"])
    .limit(1);
  if (((msg as { id: string }[] | null) ?? []).length > 0) return;

  const nome = nomeExibicao(cli);
  const canal: "whatsapp" | "email" = tel ? "whatsapp" : "email";
  const corpo =
    `Que ótimo saber que você gostou, ${nome}! 🌟 Sua opinião ajuda muito. ` +
    `Se puder deixar uma avaliação para a ${empresa} no Google, ficaremos gratos:\n${reviewUrl}`;

  await dispatch({
    tenantId: nps.tenant_id,
    canal,
    destino: tel ? cli!.telefone! : email,
    assunto: canal === "email" ? `Avalie a ${empresa} no Google` : undefined,
    corpo,
    related_kind: "nps_review",
    related_id: nps.id,
  });
}
