import type Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/site/supabase-admin";

/**
 * Ferramentas que o Claude pode chamar durante a conversa.
 * Cada tool roda no servidor, sempre com escopo no tenant_id da dedetizadora.
 *
 * NOTA de schema: nomes de coluna conferidos contra o app de campo
 * (clients.nome/telefone/endereco, service_orders.client_id/scheduled_at/status).
 * Ajuste aqui se o schema do seu Supabase divergir.
 */

// Horários de atendimento oferecidos (slots fixos no MVP).
const SLOTS = ["08:00", "10:00", "13:00", "15:00", "17:00"];

export const toolDefs: Anthropic.Tool[] = [
  {
    name: "buscar_cliente",
    description:
      "Busca um cliente já cadastrado pelo telefone. Use no início para saber se a pessoa já é cliente e personalizar o atendimento.",
    input_schema: {
      type: "object",
      properties: {
        telefone: {
          type: "string",
          description: "Telefone do cliente, só dígitos (ex: 5561999999999).",
        },
      },
      required: ["telefone"],
    },
  },
  {
    name: "horarios_disponiveis",
    description:
      "Lista os horários livres para visita em uma data específica. Chame antes de confirmar um agendamento, para oferecer opções reais.",
    input_schema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          format: "date",
          description: "Data desejada no formato AAAA-MM-DD.",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "agendar_servico",
    description:
      "Agenda uma visita: cria o cliente se ainda não existir e cria a ordem de serviço. Só chame depois de confirmar com a pessoa o nome, endereço, tipo de praga, data e horário.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do cliente." },
        telefone: {
          type: "string",
          description: "Telefone do cliente, só dígitos (ex: 5561999999999).",
        },
        endereco: { type: "string", description: "Endereço completo da visita." },
        praga: {
          type: "string",
          description: "Praga/serviço (ex: baratas, cupim, ratos, dedetização geral).",
        },
        data: { type: "string", format: "date", description: "Data AAAA-MM-DD." },
        horario: { type: "string", description: "Horário HH:MM (um dos disponíveis)." },
      },
      required: ["nome", "telefone", "endereco", "praga", "data", "horario"],
    },
  },
];

type ToolInput = Record<string, any>;

/** Executa a tool chamada pelo Claude e retorna texto para devolver a ele. */
export async function executarTool(
  nome: string,
  input: ToolInput,
  tenantId: string,
): Promise<string> {
  switch (nome) {
    case "buscar_cliente":
      return buscarCliente(tenantId, input.telefone);
    case "horarios_disponiveis":
      return horariosDisponiveis(tenantId, input.data);
    case "agendar_servico":
      return agendarServico(tenantId, input);
    default:
      return `Ferramenta desconhecida: ${nome}`;
  }
}

async function buscarCliente(tenantId: string, telefone: string): Promise<string> {
  const tel = soDigitos(telefone);
  const { data } = await supabaseAdmin()
    .from("clients")
    .select("id, nome, endereco")
    .eq("tenant_id", tenantId)
    .ilike("telefone", `%${tel.slice(-8)}%`)
    .limit(1)
    .maybeSingle();

  if (!data) return "Cliente não encontrado. É um cadastro novo.";
  return `Cliente encontrado: ${data.nome}${data.endereco ? `, endereço: ${data.endereco}` : ""}.`;
}

async function horariosDisponiveis(tenantId: string, data: string): Promise<string> {
  const inicio = `${data}T00:00:00`;
  const fim = `${data}T23:59:59`;

  const { data: ocupadas } = await supabaseAdmin()
    .from("service_orders")
    .select("scheduled_at")
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", inicio)
    .lte("scheduled_at", fim);

  const horariosOcupados = new Set(
    (ocupadas ?? []).map((o: any) => (o.scheduled_at ?? "").slice(11, 16)),
  );
  const livres = SLOTS.filter((h) => !horariosOcupados.has(h));

  if (livres.length === 0) return `Sem horários livres em ${data}. Sugira outra data.`;
  return `Horários livres em ${data}: ${livres.join(", ")}.`;
}

async function agendarServico(tenantId: string, input: ToolInput): Promise<string> {
  const tel = soDigitos(input.telefone);

  // 1) acha ou cria o cliente
  let clientId: string | null = null;
  const { data: existente } = await supabaseAdmin()
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("telefone", `%${tel.slice(-8)}%`)
    .limit(1)
    .maybeSingle();

  if (existente) {
    clientId = existente.id;
  } else {
    const { data: novo, error } = await supabaseAdmin()
      .from("clients")
      .insert({
        tenant_id: tenantId,
        nome: input.nome,
        telefone: tel,
        endereco: input.endereco,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[bot] erro ao criar cliente:", error);
      return "Não consegui cadastrar o cliente agora. Peça desculpas e ofereça contato humano.";
    }
    clientId = novo.id;
  }

  // 2) cria a OS agendada
  const scheduledAt = `${input.data}T${input.horario}:00`;
  const { error: erroOs } = await supabaseAdmin().from("service_orders").insert({
    tenant_id: tenantId,
    client_id: clientId,
    scheduled_at: scheduledAt,
    status: "agendada",
    observacoes: `Agendado via WhatsApp. Praga/serviço: ${input.praga}. Endereço: ${input.endereco}.`,
  });

  if (erroOs) {
    console.error("[bot] erro ao criar OS:", erroOs);
    return "Não consegui finalizar o agendamento. Peça desculpas e ofereça contato humano.";
  }

  return `Agendamento criado com sucesso para ${input.data} às ${input.horario}. Confirme os detalhes com a pessoa.`;
}

function soDigitos(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}
