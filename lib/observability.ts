import "server-only";

import * as Sentry from "@sentry/nextjs";

/**
 * Reporta um erro ao Sentry sem nunca lançar (no-op se o DSN não estiver
 * configurado). Use nos `catch` de integrações que ENGOLEM o erro (webhooks,
 * envios de WhatsApp/Telegram, chamadas ao Asaas) — do contrário a falha some
 * e ninguém fica sabendo. Também loga no console para o `vercel logs`.
 *
 * @param origem  rótulo curto do ponto de falha, ex.: "webhook-asaas"
 * @param err     o erro capturado
 * @param extra   contexto adicional (tenantId, paymentId, número, etc.)
 */
export function reportarErro(
  origem: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  console.error(`[${origem}]`, err, extra ?? "");
  try {
    Sentry.captureException(err, { tags: { origem }, extra });
  } catch {
    // nunca deixar a observabilidade derrubar o fluxo principal
  }
}
