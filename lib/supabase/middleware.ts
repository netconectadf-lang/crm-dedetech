import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

/** Rotas públicas (não exigem sessão). */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/recuperar",
  "/convite",
  "/auth",
  "/proposta",
  "/nps",
  "/pagar",
  "/api/pagar",
  "/api/cobranca",
  "/api/webhooks",
  "/api/integrations",
  "/api/cron",
  "/api/planos",
  "/api/leads",
  "/api/whatsapp",
  "/manifest",
  "/robots",
  "/sitemap",
  "/llms.txt",
  // ─── Landing pública (route group app/(site)) ───
  "/precos",
  "/funcionalidades",
  "/para-quem",
  "/contato",
  "/comecar",
  "/blog",
  "/app/privacidade",
];

/**
 * Atualiza a sessão do Supabase em toda requisição e protege as rotas do app.
 * Deve ser chamado pelo middleware raiz.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não rodar código entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
