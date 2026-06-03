import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
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
  const result =
    args.canal === "whatsapp"
      ? await sendWhatsApp(args.destino, args.corpo)
      : await sendMail(args.destino, args.assunto ?? "Dedetech", args.corpo);

  const db = createAdminClient();
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
