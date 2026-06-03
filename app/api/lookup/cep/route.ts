import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buscarCep } from "@/lib/lookups";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const cep = req.nextUrl.searchParams.get("cep") ?? "";
  const result = await buscarCep(cep);
  if (!result) return NextResponse.json({ erro: "CEP não encontrado" }, { status: 404 });
  return NextResponse.json(result);
}
