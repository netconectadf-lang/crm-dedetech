import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL } from "@/lib/format";
import { extractPdfText } from "@/lib/compras/extract-pdf";
import { importarPedidoDoTexto } from "@/lib/compras/importar";
import {
  enviarTelegram,
  baixarArquivoTelegram,
  parseDespesa,
} from "@/lib/telegram";
import { resolverIntegracao, registrarChat, statusChat } from "@/lib/telegram/tenant";

/**
 * Webhook multi-empresa do Telegram. A empresa é identificada pelo
 * `secret_token` do bot. Lança despesas (texto) e importa pedidos (PDF).
 * Acesso da equipe é self-service: 1ª mensagem entra como "pendente" e o dono
 * aprova no painel (Integrações).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const ctx = await resolverIntegracao(secret);
  if (!ctx) return NextResponse.json({ ok: true }); // bot desconhecido

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const doc = msg?.document;
  const text = String(msg?.text ?? "").trim();
  if (!chatId || (!text && !doc)) return NextResponse.json({ ok: true });

  const nome =
    msg?.chat?.title ?? msg?.from?.first_name ?? msg?.chat?.first_name ?? null;
  const reply = (t: string) => enviarTelegram(chatId, t, ctx.botToken);

  // /start ou /id: registra como pendente e mostra o status
  if (text === "/start" || text === "/id") {
    await registrarChat(ctx.tenantId, chatId, nome);
    const st = await statusChat(ctx.tenantId, chatId);
    await reply(
      st === "aprovado"
        ? "✅ Você está liberado!\n• A pagar: `gasolina 150`\n• A receber: `recebi 200 limpeza`\n• Compra: envie o pedido em PDF para importar."
        : `👋 Seu acesso foi solicitado (id \`${chatId}\`). Aguarde o administrador aprovar no painel (Integrações).`,
    );
    return NextResponse.json({ ok: true });
  }

  const st = await statusChat(ctx.tenantId, chatId);
  if (st !== "aprovado") {
    await registrarChat(ctx.tenantId, chatId, nome);
    await reply(
      st === "bloqueado"
        ? "⛔ Seu acesso está bloqueado."
        : `⌛ Acesso pendente de aprovação (id \`${chatId}\`). Avise o administrador.`,
    );
    return NextResponse.json({ ok: true });
  }

  const db = createAdminClient();

  // ─── PDF de pedido de compra ───────────────────────────────────────
  if (doc) {
    const nomeArq = String(doc.file_name ?? "");
    const ehPdf = doc.mime_type === "application/pdf" || /\.pdf$/i.test(nomeArq);
    if (!ehPdf) {
      await reply("📎 Envie o pedido em PDF.");
      return NextResponse.json({ ok: true });
    }
    try {
      const buf = await baixarArquivoTelegram(doc.file_id, ctx.botToken);
      if (!buf) throw new Error("Não consegui baixar o arquivo.");
      const texto = await extractPdfText(buf);
      const res = await importarPedidoDoTexto({ db, tenantId: ctx.tenantId, texto, origem: "telegram" });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
      const link = `${base}/compras/${res.orderId}`;
      await reply(
        res.jaConfirmado
          ? `ℹ️ O pedido *#${res.numeroPedido ?? "s/n"}* já foi lançado.\n${link}`
          : `📦 Pedido *#${res.numeroPedido ?? "s/n"}* lido!\n${res.totalItens} itens · ${formatBRL(res.valorTotal)}\n\nConfira e ajuste o prazo:\n${link}`,
      );
    } catch (e) {
      await reply(`❌ ${e instanceof Error ? e.message : "Falha ao ler o pedido."}`);
    }
    return NextResponse.json({ ok: true });
  }

  // ─── Lançamento (texto livre): "recebi ..." = a receber; senão = despesa ─
  const ehReceita = /^\s*recebi(?:mento)?\b/i.test(text);
  const textoLimpo = ehReceita ? text.replace(/^\s*recebi(?:mento)?\b/i, "").trim() : text;
  const desp = parseDespesa(textoLimpo);
  if (!desp) {
    await reply(
      "Não entendi 🤔. Mande *descrição valor*:\n`gasolina 150` (a pagar)\n`recebi 200 limpeza` (a receber)",
    );
    return NextResponse.json({ ok: true });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const autor =
    [msg?.from?.first_name, msg?.from?.last_name].filter(Boolean).join(" ").trim() ||
    nome ||
    null;

  if (ehReceita) {
    const descricao = desp.descricao === "Despesa" ? "Recebimento" : desp.descricao;
    const { error } = await db.from("accounts_receivable").insert({
      tenant_id: ctx.tenantId,
      descricao,
      valor: desp.valor,
      vencimento: hoje,
      status: "a_vencer",
      created_by_nome: autor,
    });
    if (error) {
      await reply("❌ Não consegui lançar. Tente de novo.");
      return NextResponse.json({ ok: true });
    }
    await reply(
      `✅ Recebimento lançado em *A receber*:\n*${descricao}* — ${formatBRL(desp.valor)}\nVencimento: hoje.`,
    );
    return NextResponse.json({ ok: true });
  }

  const { error } = await db.from("accounts_payable").insert({
    tenant_id: ctx.tenantId,
    descricao: desp.descricao,
    valor: desp.valor,
    vencimento: hoje,
    status: "a_vencer",
    created_by_nome: autor,
  });
  if (error) {
    await reply("❌ Não consegui lançar. Tente de novo.");
    return NextResponse.json({ ok: true });
  }

  await reply(
    `✅ Despesa lançada em *A pagar*:\n*${desp.descricao}* — ${formatBRL(desp.valor)}\nVencimento: hoje.`,
  );
  return NextResponse.json({ ok: true });
}
