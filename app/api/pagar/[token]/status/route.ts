import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Status público de uma cobrança pelo token — usado pela página /pagar p/ atualizar ao vivo. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ status: null }, { status: 400 });
  const admin = createAdminClient();
  const { data } = await admin
    .from("charges")
    .select("status")
    .eq("pay_token", token)
    .maybeSingle();
  return NextResponse.json({ status: (data as { status: string } | null)?.status ?? null });
}
