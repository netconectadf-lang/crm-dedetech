import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PERIODICITY_MONTHS, type ContractPeriodicity } from "@/lib/contratos";
import { effectiveStatus, type FinanceStatus } from "@/lib/financeiro";
import { isCritical, type MipReadingStatus } from "@/lib/mip";
import { STAGES, type DealStage } from "@/lib/funil";
import { OS_PENDENTE } from "@/lib/os";
import { nomeExibicao } from "@/lib/clientes";

export type DashboardMetrics = {
  mrr: number;
  contratosAtivos: number;
  aReceber: number;
  vencidoReceber: number;
  aPagar: number;
  recebidoMes: number;
  pagoMes: number;
  resultadoMes: number;
  funil: { stage: DealStage; count: number; valor: number }[];
  conversao: number;
  ganhos: number;
  trend: { mes: string; recebido: number; pago: number }[];
  osHoje: number;
  osPorStatus: Record<string, number>;
  osTrend: number[];
  clientesTrend: number[];
  proximasOs: {
    id: string;
    numero: number;
    status: string;
    scheduled_at: string | null;
    cliente: string | null;
    cidade: string | null;
  }[];
  estoqueCritico: number;
  mipCritico: number;
  clientesAtivos: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [
    { data: contractsData },
    { data: arData },
    { data: apData },
    { data: dealsData },
    { data: osData },
    { data: prodData },
    { data: batchData },
    { data: mipReadData },
    { count: clientesAtivos },
    { data: proximasOsData },
    { data: clientesCreatedData },
  ] = await Promise.all([
    supabase.from("contracts").select("valor, periodicidade, status").eq("status", "ativo"),
    supabase.from("accounts_receivable").select("valor, valor_pago, status, vencimento, pago_em"),
    supabase.from("accounts_payable").select("valor, valor_pago, status, pago_em"),
    supabase.from("deals").select("stage, valor_estimado"),
    supabase.from("service_orders").select("status, scheduled_at, created_at"),
    supabase.from("products").select("id, estoque_minimo").eq("ativo", true),
    supabase.from("stock_batches").select("product_id, qtd_atual"),
    supabase.from("mip_readings").select("device_id, status, lida_em").order("lida_em", { ascending: false }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase
      .from("service_orders")
      .select("id, numero, status, scheduled_at, clients(razao_social, nome_fantasia, cidade)")
      .in("status", OS_PENDENTE)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase.from("clients").select("created_at").eq("ativo", true),
  ]);

  // MRR
  const contracts = (contractsData as { valor: number; periodicidade: ContractPeriodicity }[] | null) ?? [];
  const mrr = contracts.reduce((s, c) => s + Number(c.valor) / PERIODICITY_MONTHS[c.periodicidade], 0);

  // financeiro
  const ar = (arData as { valor: number; valor_pago: number; status: FinanceStatus; vencimento: string; pago_em: string | null }[] | null) ?? [];
  const ap = (apData as { valor: number; valor_pago: number; status: FinanceStatus; pago_em: string | null }[] | null) ?? [];
  const aberto = (c: { status: FinanceStatus }) => c.status === "a_vencer" || c.status === "parcial";
  const aReceber = ar.filter(aberto).reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const vencidoReceber = ar
    .filter((c) => aberto(c) && effectiveStatus(c).key === "vencido")
    .reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const aPagar = ap.filter(aberto).reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const noMes = (c: { status: FinanceStatus; pago_em: string | null }) =>
    c.status === "quitado" && c.pago_em != null && c.pago_em.slice(0, 10) >= mesInicio;
  const recebidoMes = ar.filter(noMes).reduce((s, c) => s + Number(c.valor_pago), 0);
  const pagoMes = ap.filter(noMes).reduce((s, c) => s + Number(c.valor_pago), 0);

  // Tendência de caixa dos últimos 6 meses (a partir do que já foi buscado)
  const base = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      mes: d
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", ""),
    };
  });
  const trendMap = new Map(
    months.map((m) => [m.key, { mes: m.mes, recebido: 0, pago: 0 }]),
  );
  for (const c of ar) {
    if (!c.pago_em) continue;
    const b = trendMap.get(c.pago_em.slice(0, 7));
    if (b) b.recebido += Number(c.valor_pago);
  }
  for (const c of ap) {
    if (!c.pago_em) continue;
    const b = trendMap.get(c.pago_em.slice(0, 7));
    if (b) b.pago += Number(c.valor_pago);
  }
  const trend = months.map((m) => trendMap.get(m.key)!);

  // funil
  const deals = (dealsData as { stage: DealStage; valor_estimado: number }[] | null) ?? [];
  const funil = STAGES.map((s) => {
    const ds = deals.filter((d) => d.stage === s.key);
    return { stage: s.key, count: ds.length, valor: ds.reduce((a, d) => a + Number(d.valor_estimado), 0) };
  });
  const ganhos = deals.filter((d) => d.stage === "ganho").length;
  const fechados = ganhos + deals.filter((d) => d.stage === "perdido").length;
  const conversao = fechados > 0 ? Math.round((ganhos / fechados) * 100) : 0;

  // OS
  const oss = (osData as { status: string; scheduled_at: string | null; created_at: string | null }[] | null) ?? [];
  const osPorStatus: Record<string, number> = {};
  for (const o of oss) osPorStatus[o.status] = (osPorStatus[o.status] ?? 0) + 1;
  const osHoje = oss.filter((o) => o.scheduled_at?.slice(0, 10) === hoje).length;

  // Séries mensais (6 meses) para sparklines, reusando os meses do fluxo de caixa.
  const serieMensal = (datas: (string | null)[]) => {
    const cont = new Map(months.map((m) => [m.key, 0]));
    for (const d of datas) {
      const k = d ? d.slice(0, 7) : "";
      if (cont.has(k)) cont.set(k, (cont.get(k) ?? 0) + 1);
    }
    return months.map((m) => cont.get(m.key) ?? 0);
  };
  const osTrend = serieMensal(oss.map((o) => o.created_at));
  const clientesTrend = serieMensal(
    ((clientesCreatedData as { created_at: string | null }[] | null) ?? []).map((c) => c.created_at),
  );

  type ProxCliente = { razao_social: string | null; nome_fantasia: string | null; cidade: string | null };
  type ProxRaw = {
    id: string;
    numero: number;
    status: string;
    scheduled_at: string | null;
    clients: ProxCliente | ProxCliente[] | null;
  };
  const proximasOs = ((proximasOsData as ProxRaw[] | null) ?? []).map((o) => {
    const c = Array.isArray(o.clients) ? o.clients[0] : o.clients;
    return {
      id: o.id,
      numero: o.numero,
      status: o.status,
      scheduled_at: o.scheduled_at,
      cliente: nomeExibicao(c),
      cidade: c?.cidade ?? null,
    };
  });

  // estoque crítico
  const produtos = (prodData as { id: string; estoque_minimo: number }[] | null) ?? [];
  const batches = (batchData as { product_id: string; qtd_atual: number }[] | null) ?? [];
  const saldo = new Map<string, number>();
  for (const b of batches) saldo.set(b.product_id, (saldo.get(b.product_id) ?? 0) + Number(b.qtd_atual));
  const estoqueCritico = produtos.filter((p) => (saldo.get(p.id) ?? 0) < Number(p.estoque_minimo)).length;

  // MIP crítico (última leitura por dispositivo)
  const reads = (mipReadData as { device_id: string; status: MipReadingStatus; lida_em: string }[] | null) ?? [];
  const lastByDevice = new Map<string, MipReadingStatus>();
  for (const r of reads) if (!lastByDevice.has(r.device_id)) lastByDevice.set(r.device_id, r.status);
  let mipCritico = 0;
  for (const st of lastByDevice.values()) if (isCritical(st)) mipCritico++;

  return {
    mrr,
    contratosAtivos: contracts.length,
    aReceber,
    vencidoReceber,
    aPagar,
    recebidoMes,
    pagoMes,
    resultadoMes: recebidoMes - pagoMes,
    funil,
    conversao,
    ganhos,
    trend,
    osHoje,
    osPorStatus,
    osTrend,
    clientesTrend,
    proximasOs,
    estoqueCritico,
    mipCritico,
    clientesAtivos: clientesAtivos ?? 0,
  };
}
