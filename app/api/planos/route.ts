import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { corsHeaders } from "@/lib/site-cors";

export const dynamic = "force-dynamic";

// Planos públicos para a vitrine. Leitura simples (RLS já permite select de ativos).
export async function GET(request: NextRequest) {
  const cors = corsHeaders(request.headers.get("origin"));
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("platform_plans")
    .select("slug,nome,preco_centavos,periodo,publico_alvo,features,destaque,cta_label,cta_tipo,ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Falha ao carregar planos" },
      { status: 500, headers: cors },
    );
  }

  return NextResponse.json(
    { plans: data ?? [] },
    {
      headers: {
        ...cors,
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
