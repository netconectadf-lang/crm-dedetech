import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appOrigin } from "@/lib/app-url";
import { gerarCobrancaCore } from "@/lib/cobranca-core";
import type { ChargeTipo } from "@/lib/asaas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES_OK = ["owner", "financeiro", "operacional"];

/**
 * Gera cobrança a partir do APP mobile. Autentica pelo access token do Supabase
 * (Authorization: Bearer <token>) — o app NÃO tem a chave do Asaas. Cria/reaproveita
 * a conta a receber da OS e devolve o link da página de pagamento + PIX.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });

  const admin = createAdminClient();
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Sessão inválida." }, { status: 401 });

  let body: { osId?: string; arId?: string; valor?: number; tipo?: ChargeTipo; vencimento?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  const tipo: ChargeTipo = body.tipo === "boleto" || body.tipo === "cartao" ? body.tipo : "pix";

  // tenant + permissão
  const { data: prof } = await admin.from("profiles").select("active_tenant_id").eq("id", user.id).maybeSingle();
  let tenantId = (prof as { active_tenant_id: string | null } | null)?.active_tenant_id ?? null;
  if (!tenantId) {
    const { data: m } = await admin.from("memberships").select("tenant_id").eq("user_id", user.id).limit(1).maybeSingle();
    tenantId = (m as { tenant_id: string } | null)?.tenant_id ?? null;
  }
  if (!tenantId) return NextResponse.json({ ok: false, error: "Usuário sem empresa vinculada." }, { status: 403 });

  const { data: mem } = await admin
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const role = (mem as { role: string } | null)?.role;
  if (!role || !ROLES_OK.includes(role)) {
    return NextResponse.json({ ok: false, error: "Sem permissão para gerar cobrança." }, { status: 403 });
  }

  // descobre/cria a conta a receber
  let arId = body.arId ?? null;
  if (!arId && body.osId) {
    const { data: osData } = await admin
      .from("service_orders")
      .select("id, numero, status, client_id, contract_id")
      .eq("id", body.osId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    const os = osData as {
      id: string;
      numero: number;
      status: string;
      client_id: string;
      contract_id: string | null;
    } | null;
    if (!os) return NextResponse.json({ ok: false, error: "OS não encontrada." }, { status: 404 });

    const valor = Number(body.valor);
    if (!valor || valor <= 0) return NextResponse.json({ ok: false, error: "Informe um valor válido." });

    const { data: arExist } = await admin
      .from("accounts_receivable")
      .select("id")
      .eq("os_id", os.id)
      .neq("status", "cancelado")
      .maybeSingle();
    arId = (arExist as { id: string } | null)?.id ?? null;

    if (!arId) {
      const venc =
        body.vencimento ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return d.toISOString().slice(0, 10);
        })();
      const { data: novo, error } = await admin
        .from("accounts_receivable")
        .insert({
          tenant_id: tenantId,
          client_id: os.client_id,
          os_id: os.id,
          contract_id: os.contract_id,
          descricao: `OS #${os.numero}`,
          valor,
          vencimento: venc,
        } as never)
        .select("id")
        .single();
      if (error || !novo) return NextResponse.json({ ok: false, error: "Não foi possível criar a conta a receber." });
      arId = (novo as { id: string }).id;
    }
    if (os.status !== "faturada") {
      await admin.from("service_orders").update({ status: "faturada" } as never).eq("id", os.id).eq("tenant_id", tenantId);
    }
  }

  if (!arId) return NextResponse.json({ ok: false, error: "Informe a OS ou a conta a receber." }, { status: 400 });

  const r = await gerarCobrancaCore(admin, tenantId, arId, tipo, await appOrigin());
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
