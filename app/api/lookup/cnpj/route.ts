import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buscarCnpj } from "@/lib/lookups";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const cnpj = req.nextUrl.searchParams.get("cnpj") ?? "";
  const result = await buscarCnpj(cnpj);
  if (!result) return NextResponse.json({ erro: "CNPJ não encontrado" }, { status: 404 });
  return NextResponse.json(result);
}
