import Link from "next/link";
import { Clock, HandCoins, BadgeCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { ComissoesLista, type ComissaoItem } from "@/components/comissoes/comissoes-lista";
import type { ComissaoStatus, ComissaoTipo } from "@/lib/comissoes";

export const metadata = { title: "Comissões" };

type Row = {
  id: string;
  tipo: ComissaoTipo;
  percentual: number | null;
  valor_fixo: number | null;
  base_valor: number;
  valor: number;
  status: ComissaoStatus;
  created_at: string;
  employees: { nome: string } | null;
  accounts_receivable: { descricao: string; clients: { razao_social: string } | null } | null;
};

const FILTROS = [
  { key: "", label: "Todas" },
  { key: "provisionada", label: "Aguardando" },
  { key: "liberada", label: "A pagar" },
  { key: "paga", label: "Pagas" },
] as const;

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();
  const { f } = await searchParams;

  const { data } = await supabase
    .from("commissions")
    .select(
      "id, tipo, percentual, valor_fixo, base_valor, valor, status, created_at, employees:employee_id(nome), accounts_receivable:ar_id(descricao, clients(razao_social))",
    )
    .order("created_at", { ascending: false });
  const rows = (data as unknown as Row[] | null) ?? [];

  const totalProvisionado = rows.filter((r) => r.status === "provisionada").reduce((s, r) => s + Number(r.valor), 0);
  const totalAPagar = rows.filter((r) => r.status === "liberada").reduce((s, r) => s + Number(r.valor), 0);
  const totalPago = rows.filter((r) => r.status === "paga").reduce((s, r) => s + Number(r.valor), 0);

  const filtradas = f ? rows.filter((r) => r.status === f) : rows;
  const itens: ComissaoItem[] = filtradas.map((r) => ({
    id: r.id,
    funcionario: r.employees?.nome ?? "—",
    tipo: r.tipo,
    conta: r.accounts_receivable?.descricao ?? "—",
    cliente: r.accounts_receivable?.clients?.razao_social ?? "—",
    base: Number(r.base_valor),
    percentual: r.percentual,
    valorFixo: r.valor_fixo,
    valor: Number(r.valor),
    status: r.status,
    data: r.created_at,
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Comissões"
        description="Comissões de vendedores e técnicos, liberadas quando o cliente paga."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Clock} label="Aguardando pgto do cliente" value={formatBRL(totalProvisionado)} tone="amber" />
        <KpiCard icon={HandCoins} label="A pagar (liberado)" value={formatBRL(totalAPagar)} tone="sky" />
        <KpiCard icon={BadgeCheck} label="Pagas" value={formatBRL(totalPago)} tone="emerald" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((flt) => (
          <Button key={flt.key} asChild size="sm" variant={(f ?? "") === flt.key ? "default" : "outline"}>
            <Link href={flt.key ? `/comissoes?f=${flt.key}` : "/comissoes"}>{flt.label}</Link>
          </Button>
        ))}
      </div>

      <ComissoesLista itens={itens} />
    </main>
  );
}
