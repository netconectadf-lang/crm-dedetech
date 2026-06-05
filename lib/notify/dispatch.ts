import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { systemFromAddress } from "@/lib/email";
import { sendWhatsApp, sendMail, type SendResult } from "@/lib/notify";

type DispatchArgs = {
  tenantId: string;
  canal: "whatsapp" | "email";
  destino: string;
  assunto?: string;
  corpo: string;
  related_kind?: string;
  related_id?: string;
};

/** Envia pela canal escolhido E registra em `messages` (log + status). */
export async function dispatch(args: DispatchArgs): Promise<SendResult> {
  const db = createAdminClient();

  let result: SendResult;
  if (args.canal === "whatsapp") {
    result = await sendWhatsApp(args.destino, args.corpo);
  } else {
    // E-mail por empresa (Modelo A): sai do domínio do sistema, mas com o NOME
    // da empresa e respostas indo pro e-mail dela (config editável por tenant).
    const { data: t } = await db
      .from("tenants")
      .select("razao_social, nome_fantasia, email_remetente_nome, email_responder_para")
      .eq("id", args.tenantId)
      .maybeSingle();
    const tt = t as {
      razao_social: string;
      nome_fantasia: string | null;
      email_remetente_nome: string | null;
      email_responder_para: string | null;
    } | null;
    const nome =
      tt?.email_remetente_nome?.trim() ||
      tt?.nome_fantasia?.trim() ||
      tt?.razao_social ||
      "Dedetech";
    const from = `${nome} <${systemFromAddress()}>`;
    const replyTo = tt?.email_responder_para?.trim() || undefined;
    result = await sendMail(args.destino, args.assunto ?? nome, args.corpo, { from, replyTo });
  }

  await db.from("messages").insert({
    tenant_id: args.tenantId,
    canal: args.canal,
    destino: args.destino,
    assunto: args.assunto ?? null,
    corpo: args.corpo,
    related_kind: args.related_kind ?? null,
    related_id: args.related_id ?? null,
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
    provider_message_id: result.providerId ?? null,
    erro: result.error ?? null,
  });

  return result;
}
