import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resumoCertificado } from "@/lib/nfse-gov/store";

export type PassoOnboarding = {
  key: string;
  label: string;
  desc: string;
  href: string;
  done: boolean;
};

export type OnboardingStatus = {
  passos: PassoOnboarding[];
  feitos: number;
  total: number;
};

/** Detecta automaticamente o progresso de configuração inicial do tenant. */
export async function getOnboardingStatus(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<OnboardingStatus> {
  const cnt = (q: PromiseLike<{ count: number | null }>) => q;
  const [clientes, equipe, produtos, oss, wpp, tRes, cert] = await Promise.all([
    cnt(supabase.from("clients").select("id", { count: "exact", head: true }).eq("ativo", true)),
    cnt(supabase.from("employees").select("id", { count: "exact", head: true }).eq("ativo", true)),
    cnt(supabase.from("products").select("id", { count: "exact", head: true }).eq("ativo", true)),
    cnt(supabase.from("service_orders").select("id", { count: "exact", head: true })),
    cnt(supabase.from("messages").select("id", { count: "exact", head: true }).eq("canal", "whatsapp").eq("status", "sent")),
    supabase
      .from("tenants")
      .select("cnpj, nfse_codigo_municipio, nfse_cod_trib_nacional, nfse_aliquota_iss")
      .eq("id", tenantId)
      .maybeSingle(),
    resumoCertificado(tenantId),
  ]);

  const t = (tRes.data ?? {}) as {
    cnpj?: string | null;
    nfse_codigo_municipio?: string | null;
    nfse_cod_trib_nacional?: string | null;
    nfse_aliquota_iss?: number | null;
  };

  const nfseOk =
    !!cert && !!t.cnpj && !!t.nfse_codigo_municipio && !!t.nfse_cod_trib_nacional && t.nfse_aliquota_iss != null;

  const passos: PassoOnboarding[] = [
    {
      key: "empresa",
      label: "Configure os dados da empresa",
      desc: "CNPJ, endereço e logo — usados em documentos e na NFS-e.",
      href: "/configuracoes",
      done: !!t.cnpj,
    },
    {
      key: "cliente",
      label: "Cadastre o primeiro cliente",
      desc: "Seus clientes residenciais, comerciais ou industriais.",
      href: "/clientes",
      done: (clientes.count ?? 0) > 0,
    },
    {
      key: "equipe",
      label: "Cadastre sua equipe",
      desc: "Técnicos e responsável técnico (RT).",
      href: "/funcionarios",
      done: (equipe.count ?? 0) > 0,
    },
    {
      key: "produtos",
      label: "Cadastre os produtos (saneantes)",
      desc: "Com registro ANVISA — entram na ficha e no certificado.",
      href: "/produtos",
      done: (produtos.count ?? 0) > 0,
    },
    {
      key: "os",
      label: "Crie a primeira ordem de serviço",
      desc: "Agende, execute e finalize um atendimento.",
      href: "/os",
      done: (oss.count ?? 0) > 0,
    },
    {
      key: "whatsapp",
      label: "Conecte o WhatsApp",
      desc: "Para NPS e lembretes automáticos aos clientes.",
      href: "/integracoes/whatsapp",
      done: (wpp.count ?? 0) > 0,
    },
    {
      key: "nfse",
      label: "Configure a NFS-e",
      desc: "Certificado A1 + dados fiscais para emitir notas.",
      href: "/integracoes/nfse",
      done: nfseOk,
    },
  ];

  return { passos, feitos: passos.filter((p) => p.done).length, total: passos.length };
}
