import "server-only";

const RESEND_API = "https://api.resend.com/emails";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envia e-mail via Resend. Sem RESEND_API_KEY, apenas loga (modo dev) e
 * resolve — não quebra o fluxo de convite.
 */
export async function sendEmail({ to, subject, html }: SendArgs) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Dedetech <onboarding@resend.dev>";

  if (!key) {
    console.info(`[email:dev] para=${to} assunto="${subject}" (Resend off)`);
    return { ok: true as const, skipped: true as const };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[email] falha no Resend:", detail);
    return { ok: false as const };
  }
  return { ok: true as const, skipped: false as const };
}

export function inviteEmailHtml(args: {
  empresa: string;
  acceptUrl: string;
}): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
    <h2 style="color:#0F766E">Você foi convidado para a ${args.empresa}</h2>
    <p>Use o botão abaixo para aceitar o convite e acessar o Dedetech.</p>
    <p style="margin:24px 0">
      <a href="${args.acceptUrl}"
         style="background:#0F766E;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
        Aceitar convite
      </a>
    </p>
    <p style="color:#666;font-size:13px">O convite expira em 7 dias.</p>
  </div>`;
}
