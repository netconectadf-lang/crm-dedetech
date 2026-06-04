import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { baixarDanfse } from "@/lib/nfse-gov";
import { carregarCertificado } from "@/lib/nfse-gov/store";

/** Baixa o DANFSe (PDF) de uma NFS-e autorizada, gerado pelo Ambiente Nacional. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireRole(["owner", "financeiro"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("nfse")
    .select("chave_acesso, ambiente, numero, status")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const nota = data as
    | { chave_acesso: string | null; ambiente: number | null; numero: string | null; status: string }
    | null;

  if (!nota) return new Response("Nota não encontrada.", { status: 404 });
  if (!nota.chave_acesso) return new Response("Nota ainda sem chave de acesso.", { status: 409 });

  const cert = await carregarCertificado(ctx.tenantId);
  if (!cert) return new Response("Certificado digital não configurado.", { status: 400 });

  const pdf = await baixarDanfse(nota.chave_acesso, cert, (nota.ambiente ?? 2) as 1 | 2);
  if (!pdf) return new Response("Não foi possível obter o DANFSe no Ambiente Nacional.", { status: 502 });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="danfse-${nota.numero ?? nota.chave_acesso}.pdf"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
