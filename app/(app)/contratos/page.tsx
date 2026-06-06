import Link from "next/link";
import { Plus, ExternalLink, Wallet, FileSignature, ClipboardList, CalendarClock } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import {
  PERIODICITY_LABEL,
  PERIODICITY_MONTHS,
  CONTRACT_STATUS_LABEL,
  type ContractPeriodicity,
  type ContractStatus,
} from "@/lib/contratos";
import { rotuloCliente, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import { salvarContrato, excluirContrato } from "./actions";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { DeleteButton } from "@/components/app/delete-button";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Contratos" };

type Contrato = {
  id: string;
  titulo: string;
  periodicidade: ContractPeriodicity;
  valor: number;
  status: ContractStatus;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  clients: { razao_social: string } | null;
};

const STATUS_VARIANT: Record<ContractStatus, "default" | "secondary" | "outline" | "destructive"> = {
  ativo: "default",
  suspenso: "secondary",
  cancelado: "destructive",
  encerrado: "outline",
};

export default async function ContratosPage() {
  await requireRole(["owner", "comercial", "financeiro"]);
  const supabase = await createClient();

  const [{ data: contractsData }, { data: clientsData }] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, titulo, periodicidade, valor, status, vigencia_inicio, vigencia_fim, clients(razao_social)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select(CLIENTE_OPCAO_COLS).eq("ativo", true).order("razao_social"),
  ]);

  const contratos = (contractsData as Contrato[] | null) ?? [];
  const clients =
    (clientsData as ClienteOpcao[] | null) ?? [];

  const ativos = contratos.filter((c) => c.status === "ativo");
  const mrr = ativos.reduce(
    (s, c) => s + Number(c.valor) / PERIODICITY_MONTHS[c.periodicidade],
    0,
  );
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencendo = ativos.filter((c) => {
    if (!c.vigencia_fim) return false;
    const dias = Math.floor((new Date(`${c.vigencia_fim}T00:00:00`).getTime() - hoje.getTime()) / 86_400_000);
    return dias >= 0 && dias <= 30;
  }).length;

  const fields: Field[] = [
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((c) => ({ value: c.id, label: rotuloCliente(c) })),
    },
    { name: "titulo", label: "Título do contrato", required: true, full: true },
    {
      name: "periodicidade",
      label: "Periodicidade",
      type: "select",
      options: (Object.keys(PERIODICITY_LABEL) as ContractPeriodicity[]).map((k) => ({
        value: k,
        label: PERIODICITY_LABEL[k],
      })),
    },
    { name: "valor", label: "Valor por ciclo (R$)", type: "number" },
    { name: "vigencia_inicio", label: "Início da vigência", type: "date" },
    { name: "vigencia_fim", label: "Fim (opcional)", type: "date" },
    {
      name: "indice_reajuste",
      label: "Índice de reajuste",
      type: "select",
      options: [
        { value: "nenhum", label: "Sem reajuste" },
        { value: "igpm", label: "IGP-M" },
        { value: "ipca", label: "IPCA" },
      ],
    },
    { name: "dia_faturamento", label: "Dia de faturamento (1-28)", type: "number" },
    { name: "observacoes", label: "Observações", type: "textarea" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Contratos recorrentes"
        description="Planos de manutenção que geram visitas e cobranças periódicas."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funcionam os Contratos recorrentes"
              descricao="Planos de manutenção que se repetem sozinhos: o sistema gera as visitas e as cobranças no ritmo combinado."
              topicos={[
                {
                  titulo: "Como o contrato roda",
                  itens: [
                    "Periodicidade — de quanto em quanto tempo o serviço se repete (mensal, trimestral, etc.).",
                    "Dia de faturamento — o dia do mês em que a cobrança do ciclo é gerada.",
                    "Vigência — período de validade do contrato (início e, opcionalmente, fim).",
                    "Índice de reajuste — IGP-M ou IPCA para corrigir o valor ao longo do tempo.",
                  ],
                },
                {
                  titulo: "Os indicadores no topo",
                  itens: [
                    "Receita recorrente (MRR) — quanto os contratos ativos rendem por mês, em média.",
                    "Contratos ativos — planos em vigor gerando visitas e cobranças.",
                    "Vencendo (30d) — contratos prestes a encerrar; renove ou avise o cliente.",
                    "Total de contratos — todos, incluindo encerrados e cancelados.",
                  ],
                },
                {
                  titulo: "Status do contrato",
                  itens: [
                    "Ativo — em vigor, gerando visitas e cobranças.",
                    "Suspenso — pausado temporariamente, sem gerar nada.",
                    "Encerrado — chegou ao fim da vigência.",
                    "Cancelado — interrompido antes do prazo.",
                  ],
                },
              ]}
              dica="Cada ciclo do contrato gera uma OS para a equipe executar e a cobrança correspondente no Financeiro, sem retrabalho."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo contrato</Button>}
              title="Novo contrato"
              fields={fields}
              action={salvarContrato.bind(null, null)}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Receita recorrente (MRR)" value={formatBRL(mrr)} hint="contratos ativos" tone="emerald" />
        <KpiCard icon={FileSignature} label="Contratos ativos" value={String(ativos.length)} tone="violet" />
        <KpiCard icon={CalendarClock} label="Vencendo (30d)" value={String(vencendo)} hint={vencendo > 0 ? "renovar/avisar" : "nenhum"} tone={vencendo > 0 ? "warning" : "emerald"} />
        <KpiCard icon={ClipboardList} label="Total de contratos" value={String(contratos.length)} tone="sky" />
      </div>

      {contratos.length === 0 ? (
        <EmptyState title="Nenhum contrato" description="Crie o primeiro plano de manutenção." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.titulo}
                      {c.clients && (
                        <span className="block text-xs text-muted-foreground">
                          {c.clients.razao_social}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{PERIODICITY_LABEL[c.periodicidade]}</TableCell>
                    <TableCell className="tabular-nums">{formatBRL(c.valor)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.vigencia_inicio)}
                      {c.vigencia_fim ? ` → ${formatDate(c.vigencia_fim)}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status]}>
                        {CONTRACT_STATUS_LABEL[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/contratos/${c.id}`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                        <DeleteButton
                          nome={c.titulo}
                          action={excluirContrato.bind(null, c.id)}
                          successMessage="Contrato excluído com sucesso"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
