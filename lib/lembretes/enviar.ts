import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { dispatch } from "@/lib/notify/dispatch";
import { nomeExibicao } from "@/lib/clientes";
import { onlyDigits } from "@/lib/format";

/** Quantos dias antes avisar. */
const DIAS_REVISAO = 3;
const DIAS_RENOVACAO = 7;

type Cli = { razao_social: string; nome_fantasia: string | null; telefone: string | null };
type ItemEnviado = { tipo: "revisao" | "renovacao" | "aniversario"; cliente: string; destino: string; status: string };

export type LembretesResultado = {
  ok: boolean;
  dryRun: boolean;
  revisoesEncontradas: number;
  renovacoesEncontradas: number;
  aniversariantesEncontrados: number;
  enviados: ItemEnviado[];
  pulados: number; // já avisados antes ou sem telefone
};

function dataStr(offsetDias: number): string {
  return new Date(Date.now() + offsetDias * 86_400_000).toISOString().slice(0, 10);
}
function fmt(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

/**
 * Lembretes automáticos por WhatsApp ao cliente:
 *  - Revisão chegando (OS com proxima_revisao_em em até DIAS_REVISAO dias)
 *  - Contrato a vencer (contrato ativo com vigencia_fim em até DIAS_RENOVACAO dias)
 * Não reenvia o mesmo lembrete (checa a tabela messages por related_kind+related_id).
 * dryRun = não envia, só lista quem receberia.
 */
export async function enviarLembretes(
  tenantId: string,
  opts: { dryRun?: boolean } = {},
): Promise<LembretesResultado> {
  const dryRun = !!opts.dryRun;
  const db = createAdminClient();
  const hoje = dataStr(0);

  // nome da empresa (para assinar a mensagem)
  const { data: tData } = await db
    .from("tenants")
    .select("razao_social, nome_fantasia")
    .eq("id", tenantId)
    .maybeSingle();
  const empresa =
    (tData as { razao_social: string; nome_fantasia: string | null } | null)?.nome_fantasia?.trim() ||
    (tData as { razao_social: string } | null)?.razao_social ||
    "nossa equipe";

  const [{ data: revData }, { data: contraData }] = await Promise.all([
    db
      .from("service_orders")
      .select("id, numero, proxima_revisao_em, clients(razao_social, nome_fantasia, telefone)")
      .eq("tenant_id", tenantId)
      .not("proxima_revisao_em", "is", null)
      .gte("proxima_revisao_em", hoje)
      .lte("proxima_revisao_em", dataStr(DIAS_REVISAO)),
    db
      .from("contracts")
      .select("id, titulo, vigencia_fim, clients(razao_social, nome_fantasia, telefone)")
      .eq("tenant_id", tenantId)
      .eq("status", "ativo")
      .not("vigencia_fim", "is", null)
      .gte("vigencia_fim", hoje)
      .lte("vigencia_fim", dataStr(DIAS_RENOVACAO)),
  ]);

  type Rev = { id: string; numero: number; proxima_revisao_em: string; clients: Cli | Cli[] | null };
  type Con = { id: string; titulo: string | null; vigencia_fim: string; clients: Cli | Cli[] | null };
  const revisoes = (revData as Rev[] | null) ?? [];
  const contratos = (contraData as Con[] | null) ?? [];
  const cliOf = (c: Cli | Cli[] | null) => (Array.isArray(c) ? c[0] : c) ?? null;

  const enviados: ItemEnviado[] = [];
  let pulados = 0;

  // já avisado? (procura uma message enviada/simulada para o mesmo item)
  async function jaAvisado(kind: string, id: string): Promise<boolean> {
    const { data } = await db
      .from("messages")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("related_kind", kind)
      .eq("related_id", id)
      .in("status", ["sent", "skipped"])
      .limit(1);
    return ((data as { id: string }[] | null) ?? []).length > 0;
  }

  async function processar(
    kind: "lembrete_revisao" | "lembrete_renovacao" | "lembrete_aniversario",
    id: string,
    cli: Cli | null,
    corpo: string,
  ) {
    const nome = nomeExibicao(cli);
    const tel = cli?.telefone ? onlyDigits(cli.telefone) : "";
    if (!tel) {
      pulados++;
      return;
    }
    if (await jaAvisado(kind, id)) {
      pulados++;
      return;
    }
    const tipo =
      kind === "lembrete_revisao" ? "revisao" : kind === "lembrete_renovacao" ? "renovacao" : "aniversario";
    if (dryRun) {
      enviados.push({ tipo, cliente: nome, destino: cli!.telefone!, status: "simulado" });
      return;
    }
    const r = await dispatch({
      tenantId,
      canal: "whatsapp",
      destino: cli!.telefone!,
      corpo,
      related_kind: kind,
      related_id: id,
    });
    enviados.push({ tipo, cliente: nome, destino: cli!.telefone!, status: r.ok ? "enviado" : "falha" });
  }

  for (const r of revisoes) {
    const cli = cliOf(r.clients);
    const nome = nomeExibicao(cli);
    const corpo =
      `Olá, ${nome}! 👋 Aqui é da ${empresa}.\n\n` +
      `Está chegando a data da *revisão* do seu controle de pragas (${fmt(r.proxima_revisao_em)}). ` +
      `Para manter seu ambiente protegido, podemos já agendar?\n\n` +
      `É só responder esta mensagem que combinamos o melhor dia. 🐜🛡️`;
    await processar("lembrete_revisao", r.id, cli, corpo);
  }

  for (const c of contratos) {
    const cli = cliOf(c.clients);
    const nome = nomeExibicao(cli);
    const corpo =
      `Olá, ${nome}! Aqui é da ${empresa}.\n\n` +
      `Seu contrato de controle de pragas vence em *${fmt(c.vigencia_fim)}*. ` +
      `Deseja renovar e seguir com a proteção do seu ambiente sem interrupção?\n\n` +
      `Estamos à disposição para combinar a renovação. 🛡️`;
    await processar("lembrete_renovacao", c.id, cli, corpo);
  }

  // Aniversariantes do dia (clientes ativos com data_nascimento = hoje, mês+dia).
  // Query separada e tolerante: a coluna pode não existir até a migration rodar.
  let aniversariantes = 0;
  const hojeMMDD = hoje.slice(5, 10);
  const anoAtual = hoje.slice(0, 4);
  try {
    const { data: cliData } = await db
      .from("clients")
      .select("id, razao_social, nome_fantasia, telefone, data_nascimento")
      .eq("tenant_id", tenantId)
      .eq("ativo", true)
      .not("data_nascimento", "is", null)
      .not("telefone", "is", null);
    const aniversariantesHoje = (
      (cliData as { id: string; razao_social: string; nome_fantasia: string | null; telefone: string | null; data_nascimento: string | null }[] | null) ?? []
    ).filter((c) => (c.data_nascimento ?? "").slice(5, 10) === hojeMMDD);
    aniversariantes = aniversariantesHoje.length;
    for (const c of aniversariantesHoje) {
      const cli: Cli = { razao_social: c.razao_social, nome_fantasia: c.nome_fantasia, telefone: c.telefone };
      const nome = nomeExibicao(cli);
      const corpo =
        `🎉 Feliz aniversário, ${nome}! 🎂\n\n` +
        `A ${empresa} deseja a você um dia maravilhoso! Conte sempre com a gente para manter ` +
        `seu ambiente protegido e saudável. Um abraço! 🐜🛡️`;
      // related_id por ano: não repete no mesmo ano, mas envia de novo no próximo aniversário.
      await processar("lembrete_aniversario", `${c.id}:${anoAtual}`, cli, corpo);
    }
  } catch {
    // coluna data_nascimento ainda não existe — ignora até a migration rodar
  }

  return {
    ok: true,
    dryRun,
    revisoesEncontradas: revisoes.length,
    renovacoesEncontradas: contratos.length,
    aniversariantesEncontrados: aniversariantes,
    enviados,
    pulados,
  };
}
