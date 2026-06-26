import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente Anthropic (server-side). Lê ANTHROPIC_API_KEY do ambiente.
 * LAZY de propósito: `new Anthropic()` lança erro se a key não existir, então
 * só instanciamos no primeiro uso — assim o build passa sem a env definida.
 */
let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

// Modelo do bot: Haiku 4.5 — barato e de sobra para agendamento/dúvidas.
export const BOT_MODEL = "claude-haiku-4-5";
