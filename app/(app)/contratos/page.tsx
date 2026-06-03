import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";

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
import type { Field } from "@/components/app/resource-form";
import { salvarContrato } from "./actions";
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
  await requireRole(["owner", "comercial"]);
  const supabase = await createClient();

  const [{ data: contractsData }, { data: clientsData }] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, titulo, periodicidade, valor, status, vigencia_inicio, vigencia_fim, clients(razao_social)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, razao_social").eq("ativo", true).order("razao_social"),
  ]);

  const contratos = (contractsData as Contrato[] | null) ?? [];
  const clients =
    (clientsData as { id: string; razao_social: string }[] | null) ?? [];

  const ativos = contratos.filter((c) => c.status === "ativo");
  const mrr = ativos.reduce(
    (s, c) => s + Number(c.valor) / PERIODICITY_MONTHS[c.periodicidade],
    0,
  );

  const fields: Field[] = [
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((c) => ({ value: c.id, label: c.razao_social })),
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

  const kpis = [
    { label: "Receita recorrente (MRR)", value: formatBRL(mrr) },
    { label: "Contratos ativos", value: String(ativos.length) },
    { label: "Total de contratos", value: String(contratos.length) },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Contratos recorrentes"
        description="Planos de manutenção que geram visitas e cobranças periódicas."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Novo contrato</Button>}
            title="Novo contrato"
            fields={fields}
            action={salvarContrato.bind(null, null)}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
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
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/contratos/${c.id}`}>
                          <ExternalLink className="size-4" />
                        </Link>
                      </Button>
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
