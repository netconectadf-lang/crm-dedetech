import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback de OAuth e confirmação de e-mail.
 * Troca o code por sessão e, se o usuário ainda não tem empresa mas tem uma
 * empresa pendente no metadata (signup), provisiona o tenant.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=callback`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=callback`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    const hasTenant = (profile as { active_tenant_id: string | null } | null)
      ?.active_tenant_id;
    const pendingEmpresa = user.user_metadata?.pending_empresa as
      | string
      | undefined;

    if (!hasTenant && pendingEmpresa) {
      await supabase.rpc("provision_tenant", {
        p_razao_social: pendingEmpresa,
        p_cnpj: (user.user_metadata?.pending_cnpj as string) ?? null,
      });
      await supabase.auth.refreshSession();
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
