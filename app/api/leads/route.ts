import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { corsHeaders } from "@/lib/site-cors";

export const dynamic = "force-dynamic";

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(160),
  telefone: z.string().trim().max(40).optional().or(z.literal("")),
  empresa: z.string().trim().max(160).optional().or(z.literal("")),
  mensagem: z.string().trim().max(2000).optional().or(z.literal("")),
  plano_interesse: z.string().trim().max(60).optional().or(z.literal("")),
  origem: z.string().trim().max(60).optional(),
  // honeypot anti-bot: precisa vir vazio
  website: z.string().max(0).optional(),
});

// Throttle leve por IP (best-effort; reinicia a cada cold start).
const hits = new Map<string, number[]>();
function rateLimited(ip: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request.headers.get("origin"));
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429, headers: cors },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400, headers: cors });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 422, headers: cors },
    );
  }

  // honeypot preenchido => finge sucesso e descarta
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { headers: cors });
  }

  const { nome, email, telefone, empresa, mensagem, plano_interesse, origem } =
    parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("platform_leads").insert({
    nome,
    email,
    telefone: telefone || null,
    empresa: empresa || null,
    mensagem: mensagem || null,
    plano_interesse: plano_interesse || null,
    origem: origem || "site",
    meta: { ip, ua: request.headers.get("user-agent") ?? null },
  });

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível registrar. Tente novamente." },
      { status: 500, headers: cors },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: cors });
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
