"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { onlyDigits } from "@/lib/format";
import { emitirNfse, consultarNfse, cancelarNfse } from "@/lib/nfse-gov";
import { carregarCertificado, carregarConfigFiscal } from "@/lib/nfse-gov/store";
import type { DadosEmissao } from "@/lib/nfse-gov";
import type { AppRole } from "@/lib/types";

const FISCAL: AppRole[] = ["owner", "financeiro"];

type SaveState = { error?: string; message?: string };

/** Emite uma NFS-e a partir de uma cobrança (accounts_receivable). Manual, 1 clique. */
export async function emitirNotaDaCobranca(arId: string): Promise<SaveState> {
  const ctx = await requireRole(FISCAL);
  const supabase = await createClient();

  // 1. certificado da empresa
  const certificado = await carregarCertificado(ctx.tenantId);
  if (!certificado) {
    return { error: "Configure o certificado digital A1 em Integrações → NFS-e Nacional." };
  }

  // 2. parâmetros fiscais
  const cfg = await carregarConfigFiscal(ctx.tenantId);
  const faltando: string[] = [];
  if (!cfg?.cnpj) faltando.push("CNPJ da empresa");
  if (!cfg?.codigoMunicipio) faltando.push("código do município (IBGE)");
  if (!cfg?.codTribNacional) faltando.push("código de tributação nacional");
  if (cfg?.aliquotaIss == null) faltando.push("alíquota do ISS");
  if (faltando.length) {
    return { error: `Complete os dados fiscais em Integrações → NFS-e Nacional: ${faltando.join(", ")}.` };
  }

  // 3. cobrança já tem nota válida?
  const { data: existente } = await supabase
    .from("nfse")
    .select("id, status")
    .eq("ar_id", arId)
    .in("status", ["processando", "autorizada"])
    .maybeSingle();
  if (existente) return { error: "Já existe uma NFS-e para esta cobrança." };

  const { data: arData } = await supabase
    .from("accounts_receivable")
    .select("id, valor, descricao, client_id, os_id, status")
    .eq("id", arId)
    .maybeSingle();
  const ar = arData as {
    id: string; valor: number; descricao: string; client_id: string | null; os_id: string | null; status: string;
  } | null;
  if (!ar) return { error: "Cobrança não encontrada." };
  if (ar.status === "cancelado") return { error: "Cobrança cancelada." };
  if (!ar.client_id) return { error: "Cobrança sem cliente vinculado." };

  const { data: cliData } = await supabase
    .from("clients")
    .select("razao_social, documento, email, logradouro, numero, bairro, cidade, uf, cep, codigo_ibge")
    .eq("id", ar.client_id)
    .maybeSingle();
  const cli = cliData as {
    razao_social: string; documento: string | null; email: string | null;
    logradouro: string | null; numero: string | null; bairro: string | null;
    cidade: string | null; uf: string | null; cep: string | null; codigo_ibge: string | null;
  } | null;
  if (!cli?.documento) return { error: "Cliente sem CPF/CNPJ — necessário para a NFS-e." };

  // 4. reserva atômica do número da DPS
  const { data: numero, error: numErr } = await supabase.rpc("nfse_reservar_numero", {
    p_tenant: ctx.tenantId,
  });
  if (numErr || numero == null) return { error: "Não foi possível reservar o número da nota." };

  const discriminacao = `Serviço de controle de pragas. ${ar.descricao ?? ""}`.trim();

  const dados: DadosEmissao = {
    ambiente: cfg!.ambiente,
    serie: cfg!.serie,
    numero: Number(numero),
    dataCompetencia: new Date().toISOString().slice(0, 10),
    municipioEmissor: cfg!.codigoMunicipio!,
    prestador: {
      cnpj: cfg!.cnpj!,
      inscricaoMunicipal: cfg!.inscricaoMunicipal ?? undefined,
      opSimplesNacional: cfg!.opSimplesNacional,
      regimeEspecial: cfg!.regimeEspecial,
    },
    tomador: {
      documento: cli.documento,
      nome: cli.razao_social,
      email: cli.email ?? undefined,
      endereco: cli.codigo_ibge
        ? {
            codMunicipio: cli.codigo_ibge,
            cep: onlyDigits(cli.cep ?? ""),
            logradouro: cli.logradouro ?? "",
            numero: cli.numero ?? "S/N",
            bairro: cli.bairro ?? "",
          }
        : undefined,
    },
    servico: {
      codTribNacional: cfg!.codTribNacional!,
      descricao: discriminacao,
      codMunicipioPrestacao: cfg!.codigoMunicipio!,
    },
    valores: {
      valorServico: Number(ar.valor),
      aliquotaIss: Number(cfg!.aliquotaIss),
      retISSQN: cfg!.issRetido ? 2 : 1,
    },
  };

  // 5. registra (processando) e emite
  const { data: nota } = await supabase
    .from("nfse")
    .insert({
      tenant_id: ctx.tenantId, ar_id: ar.id, os_id: ar.os_id, client_id: ar.client_id,
      ref: `dps-${ctx.tenantId.slice(0, 8)}-${numero}`,
      status: "processando", valor_servicos: Number(ar.valor), discriminacao,
      ambiente: cfg!.ambiente, created_by: ctx.userId,
    })
    .select("id")
    .single();

  const r = await emitirNfse(dados, certificado);

  await supabase
    .from("nfse")
    .update(
      r.ok
        ? { status: r.status ?? "processando", chave_acesso: r.chaveAcesso ?? null, id_dps: r.idDps ?? null, numero: r.numero ?? String(numero), xml: r.xmlNfse ?? null, mensagem: r.mensagem ?? null }
        : { status: "erro", id_dps: r.idDps ?? null, mensagem: r.error ?? "Erro ao emitir." },
    )
    .eq("id", (nota as { id: string }).id)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath("/notas");
  revalidatePath("/financeiro/receber");
  return r.ok ? { message: "NFS-e emitida e enviada para autorização." } : { error: r.error ?? "Erro ao emitir." };
}

/** Reconsulta o status da nota no Ambiente Nacional pela chave de acesso. */
export async function sincronizarNota(id: string): Promise<void> {
  const ctx = await requireRole(FISCAL);
  const supabase = await createClient();
  const { data } = await supabase
    .from("nfse")
    .select("chave_acesso, ambiente")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const nota = data as { chave_acesso: string | null; ambiente: number | null } | null;
  if (!nota?.chave_acesso) return;

  const certificado = await carregarCertificado(ctx.tenantId);
  if (!certificado) return;

  const r = await consultarNfse(nota.chave_acesso, certificado, (nota.ambiente ?? 2) as 1 | 2);
  if (r.ok) {
    await supabase
      .from("nfse")
      .update({ status: r.status ?? "processando", xml: r.xmlNfse ?? null })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
  }
  revalidatePath("/notas");
}

/** Cancela a NFS-e (evento de cancelamento — fase 3). */
export async function cancelarNota(id: string, _justificativa: string): Promise<SaveState> {
  await requireRole(FISCAL);
  const r = await cancelarNfse();
  return r.ok ? { message: "NFS-e cancelada." } : { error: r.error ?? "Não foi possível cancelar." };
}
