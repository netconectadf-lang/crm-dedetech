import { NextResponse, type NextRequest } from "next/server";

import { syncTrilogo } from "@/lib/trilogo/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// tenant da A7 Dedetizadora (único que usa o Trílogo por ora)
const A7_TENANT = "3aa56352-4ce8-4835-a85b-8ee0f0dd7c0e";

/**
 * Disparo agendado da sincronização Trílogo -> OS.
 * Protegido por CRON_SECRET (o Vercel Cron envia "Authorization: Bearer <secret>";
 * disparadores externos podem usar ?secret=<secret>).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    const qs = request.nextUrl.searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const tenantId = process.env.TRILOGO_TENANT_ID ?? A7_TENANT;
  const result = await syncTrilogo(tenantId, "cron");

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
