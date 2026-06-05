import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { consultarNFSe } from "@/lib/nfse";

/**
 * Webhook do Focus NFe (status da NFS-e). Valida o token (?token=) se configurado,
 * reconsulta a nota no provedor pela referência e atualiza o registro.
 */
export async function POST(req: NextRequest) {
  // fail-closed: sem o segredo configurado, recusa
  const expected = process.env.NFSE_WEBHOOK_TOKEN;
  if (!expected || new URL(req.url).searchParams.get("token") !== expected) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const ref = (body?.ref ?? body?.referencia) as string | undefined;
  if (!ref) return NextResponse.json({ ok: true });

  const r = await consultarNFSe(ref);
  if (!r.ok || r.skipped) return NextResponse.json({ ok: true });

  const db = createAdminClient();
  await db
    .from("nfse")
    .update({
      status: r.status ?? "processando",
      numero: r.numero ?? null,
      codigo_verificacao: r.codigoVerificacao ?? null,
      pdf_url: r.pdfUrl ?? null,
      xml_url: r.xmlUrl ?? null,
      mensagem: r.mensagem ?? null,
    })
    .eq("ref", ref);

  return NextResponse.json({ ok: true });
}
