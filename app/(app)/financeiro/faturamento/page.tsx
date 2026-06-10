import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  faturamentoNoMes,
  ymdLocal,
  type ContractPeriodicity,
  type AdjustmentIndex,
} from "@/lib/contratos";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaturamentoLote, type ItemFaturamento } from "@/components/financeiro/faturamento-lote";

export const metadata = { title: "Faturamento em lote" };

const MESES_LONGOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type ContratoRow = {
  id: string;
  titulo: string | null;
  valor: number;
  dia_faturamento: number;
  periodicidade: ContractPeriodicity;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  indice_reajuste: AdjustmentIndex | null;
  client_id: string;
  clients: { razao_social: string } | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();
  const { m } = await searchParams;

  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth() + 1; // 1-12
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [a, mm] = m.split("-").map(Number);
    if (a >= 2000 && mm >= 1 && mm <= 12) { ano = a; mes = mm; }
  }

  const { data: contratosData } = await supabase
    .from("contracts")
    .select("id, titulo, valor, dia_faturamento, periodicidade, vigencia_inicio, vigencia_fim, indice_reajuste, client_id, clients(razao_social)")
    .eq("status", "ativo");
  const contratos = (contratosData as unknown as ContratoRow[] | null) ?? [];

  // contratos com faturamento devido no mês de referência
  const candidatos = contratos
    .map((c) => {
      const dt = faturamentoNoMes(c.vigencia_inicio, c.dia_faturamento, c.periodicidade, ano, mes, c.vigencia_fim);
      return dt ? { c, vencimento: ymdLocal(dt) } : null;
    })
    .filter((x): x is { c: ContratoRow; vencimento: string } => x !== null);

  // marca os que já foram faturados (AR existente do contrato no mesmo vencimento)
  const ids = candidatos.map((x) => x.c.id);
  const { data: arsData } = ids.length
    ? await supabase
        .from("accounts_receivable")
        .select("contract_id, vencimento")
        .in("contract_id", ids)
        .neq("status", "cancelado")
    : { data: [] };
  const faturados = new Set(
    ((arsData as { contract_id: string; vencimento: string }[] | null) ?? []).map(
      (a) => `${a.contract_id}|${a.vencimento}`,
    ),
  );

  const itens: ItemFaturamento[] = candidatos
    .map((x) => ({
      id: x.c.id,
      cliente: x.c.clients?.razao_social ?? "—",
      titulo: x.c.titulo ?? "Contrato",
      valor: Number(x.c.valor),
      vencimento: x.vencimento,
      indice: x.c.indice_reajuste ?? "nenhum",
      vigenciaInicio: x.c.vigencia_inicio,
      jaFaturado: faturados.has(`${x.c.id}|${x.vencimento}`),
    }))
    .sort((a, b) => a.cliente.localeCompare(b.cliente));

  const prev = mes === 1 ? `${ano - 1}-12` : `${ano}-${pad(mes - 1)}`;
  const next = mes === 12 ? `${ano + 1}-01` : `${ano}-${pad(mes + 1)}`;
  const aFaturar = itens.filter((i) => !i.jaFaturado).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/financeiro"><ArrowLeft className="size-4" /> Financeiro</Link>
      </Button>

      <PageHeader
        title="Faturamento em lote"
        description="Gere de uma vez as cobranças dos contratos com faturamento no mês."
      />

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/financeiro/faturamento?m=${prev}`}><ChevronLeft className="size-4" /> Mês anterior</Link>
        </Button>
        <span className="text-sm font-semibold">
          {MESES_LONGOS[mes - 1]} / {ano}
          <span className="ml-2 font-normal text-muted-foreground">· {aFaturar} a faturar</span>
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/financeiro/faturamento?m=${next}`}>Próximo mês <ChevronRight className="size-4" /></Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FaturamentoLote itens={itens} ano={ano} mes={mes} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        As cobranças entram em <strong>Contas a receber</strong>. Depois você pode gerar o PIX/boleto
        e emitir a NFS-e normalmente. Contratos já faturados no mês aparecem como “Faturado” e não são duplicados.
      </p>
    </main>
  );
}
