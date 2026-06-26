import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, BOT_MODEL } from "@/lib/site/anthropic";
import { toolDefs, executarTool } from "@/lib/site/bot/tools";
import { carregarHistorico, salvarHistorico, type Msg } from "@/lib/site/bot/conversa";
import { site } from "@/lib/site/site";

const MAX_ITERACOES = 5; // trava de segurança do loop de tool use

function systemPrompt(): string {
  return [
    `Você é o atendente virtual da ${site.name}, uma empresa de dedetização e controle de pragas.`,
    "Seu objetivo é atender clientes no WhatsApp: tirar dúvidas rápidas e AGENDAR visitas.",
    "",
    "Como agir:",
    "- Seja simpático, objetivo e use português do Brasil. Mensagens curtas (é WhatsApp).",
    "- Para agendar, você precisa: nome, endereço completo, tipo de praga, data e horário.",
    "- Use 'horarios_disponiveis' para oferecer horários reais antes de confirmar.",
    "- Use 'buscar_cliente' no começo para ver se a pessoa já é cliente.",
    "- Só chame 'agendar_servico' depois de confirmar TODOS os dados com a pessoa.",
    "- Após agendar, confirme data, horário e endereço numa mensagem só.",
    "- Se não souber algo ou o cliente pedir, ofereça falar com um atendente humano.",
    "- Nunca invente preços fechados; diga que o valor é confirmado na visita/orçamento.",
  ].join("\n");
}

/**
 * Processa UMA mensagem recebida do cliente e devolve o texto de resposta.
 * Carrega o histórico, roda o loop de tool use e persiste a conversa.
 */
export async function responder(
  tenantId: string,
  telefone: string,
  textoCliente: string,
): Promise<string> {
  const historico = await carregarHistorico(tenantId, telefone);
  const messages: Msg[] = [...historico, { role: "user", content: textoCliente }];

  let respostaFinal = "";

  for (let i = 0; i < MAX_ITERACOES; i++) {
    const resp = await anthropic().messages.create({
      model: BOT_MODEL,
      max_tokens: 1024,
      system: systemPrompt(),
      tools: toolDefs,
      messages,
    });

    // guarda o turno do assistente (preserva blocos tool_use)
    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of resp.content) {
        if (block.type === "tool_use") {
          const out = await executarTool(
            block.name,
            block.input as Record<string, any>,
            tenantId,
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: out,
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue; // volta pro modelo com os resultados
    }

    // sem tool: junta o texto e encerra
    respostaFinal = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    break;
  }

  if (!respostaFinal) {
    respostaFinal =
      "Desculpe, tive um problema para responder agora. Pode repetir, por favor?";
  }

  await salvarHistorico(tenantId, telefone, messages);
  return respostaFinal;
}
