import { NextResponse, type NextRequest } from "next/server";

import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Campo = { name: string; label: string; type?: string };

/**
 * Lê um documento (CNH/RG/foto) com a visão do Claude e devolve os valores
 * dos campos pedidos. Não inventa dados; só preenche o que conseguir ler.
 * Usado pelo autofill do formulário (ex.: cadastro de funcionário).
 */
export async function POST(request: NextRequest) {
  await requireRole(["owner", "rh", "comercial", "operacional"]);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Leitura por IA não configurada (ANTHROPIC_API_KEY ausente)." },
      { status: 503 },
    );
  }

  let body: { imageBase64?: string; mimeType?: string; campos?: Campo[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const { imageBase64, mimeType, campos } = body;
  if (!imageBase64 || !mimeType || !campos?.length) {
    return NextResponse.json({ error: "Documento ou campos ausentes." }, { status: 400 });
  }

  const lista = campos
    .map((c) => `- ${c.name} (${c.label}${c.type === "date" ? ", formato AAAA-MM-DD" : ""})`)
    .join("\n");

  const prompt = `Você é um extrator de dados de documentos brasileiros (CNH, RG, etc.).
Leia o documento na imagem e devolva SOMENTE um JSON com os campos abaixo que você conseguir ler com confiança.
Campos possíveis (use exatamente essas chaves):
${lista}

Regras:
- Datas no formato AAAA-MM-DD.
- CPF e RG apenas com dígitos (sem pontos/traços).
- Não invente: se não tiver certeza de um campo, omita-o.
- Responda APENAS o JSON, sem texto fora dele. Ex: {"nome":"...","cpf":"..."}`;

  const isPdf = mimeType === "application/pdf";
  const docBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } }
    : { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: [docBlock, { type: "text", text: prompt }] }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[ocr] Anthropic falhou:", detail);
      return NextResponse.json({ error: "Não consegui ler o documento." }, { status: 502 });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const texto = data.content?.find((c) => c.type === "text")?.text ?? "";
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ valores: {} });
    const valores = JSON.parse(m[0]) as Record<string, unknown>;

    // só devolve chaves pedidas e com valor string não-vazio
    const nomes = new Set(campos.map((c) => c.name));
    const limpos: Record<string, string> = {};
    for (const [k, v] of Object.entries(valores)) {
      if (nomes.has(k) && v != null && String(v).trim()) limpos[k] = String(v).trim();
    }
    return NextResponse.json({ valores: limpos });
  } catch (e) {
    console.error("[ocr] erro:", e);
    return NextResponse.json({ error: "Erro ao processar o documento." }, { status: 500 });
  }
}
