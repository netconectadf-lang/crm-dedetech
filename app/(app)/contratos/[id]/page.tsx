import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Trash2, ClipboardList } from "lucide-react";

import { criarOSDoContrato } from "@/app/(app)/os/actions";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import {
  PERIODICITY_LABEL,
  PERIODICITY_MONTHS,
  CONTRACT_STATUS_LABEL,
  INDEX_LABEL,
  proximasVisitas,
  type ContractPeriodicity,
  type ContractStatus,
  type AdjustmentIndex,
} from "@/lib/contratos";
import { rotuloCliente, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import { ResourceForm } from "@/components/app/resource-form";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { ContractStatusActions } from "@/components/contratos/contract-status-actions";
import { AddContractItem } from "@/components/contratos/add-contract-item";
import {
  salvarContrato,
  excluirContrato,
  removerItemContrato,
  adicionarAditivo,
} from "../actions";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Contrato" };

type Contract = {
  id: string;
  client_id: string;
  titulo: string;
  periodicidade: ContractPeriodicity;
  valor: number;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  indice_reajuste: AdjustmentIndex;
  dia_faturamento: number;
  status: ContractStatus;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  clients: { razao_social: string } | null;
};

export default async function ContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "comercial"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: cData } = await supabase
    .from("contracts")
    .select("*, clients(razao_social)")
    .eq("id", id)
    .maybeSingle();
  if (!cData) notFound();
  const c = cData as Contract;

  const [{ data: itemsData }, { data: amendData }, { data: servData }, { data: unitData }, { data: clientsData }] =
    await Promise.all([
      supabase.from("contract_items").select("id, descricao, quantidade, valor").eq("contract_id", id).order("created_at"),
      supabase.from("contract_amendments").select("id, data, descricao, valor_novo").eq("contract_id", id).order("data", { ascending: false }),
      supabase.from("services").select("id, nome, preco_base").eq("ativo", true).order("nome"),
      supabase.from("client_units").select("id, apelido").eq("client_id", c.client_id).order("apelido"),
      supabase.from("clients").select(CLIENTE_OPCAO_COLS).eq("ativo", true).order("razao_social"),
    ]);

  const items = (itemsData as { id: string; descricao: string; quantidade: number; valor: number }[] | null) ?? [];
  const aditivos = (amendData as { id: string; data: string; descricao: string; valor_novo: number | null }[] | null) ?? [];
  const servicos = (servData as { id: string; nome: string; preco_base: number }[] | null) ?? [];
  const unidades = (unitData as { id: string; apelido: string }[] | null) ?? [];
  const clients = (clientsData as ClienteOpcao[] | null) ?? [];

  const visitas =
    c.status === "ativo"
      ? proximasVisitas(c.vigencia_inicio, c.dia_faturamento, c.periodicidade, 6)
      : [];
  const mrr = Number(c.valor) / PERIODICITY_MONTHS[c.periodicidade];

  const editFields: Field[] = [
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((cl) => ({ value: cl.id, label: rotuloCliente(cl) })),
    },
    { name: "titulo", label: "Título", required: true, full: true },
    {
      name: "periodicidade",
      label: "Periodicidade",
      type: "select",
      options: (Object.keys(PERIODICITY_LABEL) as ContractPeriodicity[]).map((k) => ({ value: k, label: PERIODICITY_LABEL[k] })),
    },
    { name: "valor", label: "Valor por ciclo (R$)", type: "number" },
    { name: "vigencia_inicio", label: "Início", type: "date" },
    { name: "vigencia_fim", label: "Fim (opcional)", type: "date" },
    {
      name: "indice_reajuste",
      label: "Reajuste",
      type: "select",
      options: (Object.keys(INDEX_LABEL) as AdjustmentIndex[]).map((k) => ({ value: k, label: INDEX_LABEL[k] })),
    },
    { name: "dia_faturamento", label: "Dia de faturamento", type: "number" },
    { name: "observacoes", label: "Observações", type: "textarea" },
  ];

  const aditivoFields: Field[] = [
    { name: "data", label: "Data", type: "date" },
    { name: "valor_novo", label: "Novo valor (opcional)", type: "number" },
    { name: "descricao", label: "Descrição do aditivo", type: "textarea" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/contratos"><ArrowLeft className="size-4" /> Contratos</Link>
      </Button>

      <PageHeader
        title={c.titulo}
        description={c.clients ? c.clients.razao_social : undefined}
        action={
          <div className="flex gap-2">
            <ResourceDialog
              trigger={<Button variant="outline">Editar</Button>}
              title="Editar contrato"
              fields={editFields}
              defaultValues={c}
              action={salvarContrato.bind(null, c.id)}
            />
            <DeleteButton nome={c.titulo} action={excluirContrato.bind(null, c.id)} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge>{CONTRACT_STATUS_LABEL[c.status]}</Badge>
        {c.status === "cancelado" && c.motivo_cancelamento && (
          <span className="text-sm text-muted-foreground">
            Motivo: {c.motivo_cancelamento}
          </span>
        )}
        <ContractStatusActions contractId={c.id} status={c.status} />
        {c.status === "ativo" && (
          <form action={criarOSDoContrato.bind(null, c.id)}>
            <Button type="submit" variant="outline">
              <ClipboardList className="size-4" /> Gerar visita (OS)
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Periodicidade:</span> {PERIODICITY_LABEL[c.periodicidade]}</p>
            <p><span className="text-muted-foreground">Valor/ciclo:</span> <span className="tabular-nums">{formatBRL(c.valor)}</span></p>
            <p><span className="text-muted-foreground">MRR:</span> <span className="tabular-nums">{formatBRL(mrr)}</span></p>
            <p><span className="text-muted-foreground">Reajuste:</span> {INDEX_LABEL[c.indice_reajuste]}</p>
            <p><span className="text-muted-foreground">Dia faturamento:</span> {c.dia_faturamento}</p>
            <p><span className="text-muted-foreground">Vigência:</span> {formatDate(c.vigencia_inicio)}{c.vigencia_fim ? ` → ${formatDate(c.vigencia_fim)}` : ""}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> Próximas visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {c.status === "ativo" ? "—" : "Contrato inativo."}
              </p>
            ) : (
              <ul className="space-y-1 text-sm tabular-nums">
                {visitas.map((d, i) => (
                  <li key={i}>{d.toLocaleDateString("pt-BR")}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Use <span className="text-foreground">Gerar visita (OS)</span> acima para
              abrir a próxima ordem de serviço.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Rentabilidade</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Receita/ciclo:</span> <span className="tabular-nums">{formatBRL(c.valor)}</span></p>
            <p><span className="text-muted-foreground">Receita/mês (MRR):</span> <span className="tabular-nums">{formatBRL(mrr)}</span></p>
            <p className="text-xs text-muted-foreground">
              Em breve: custo real (produto + combustível + mão de obra) puxado das
              OS executadas para apurar a margem.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Serviços cobertos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AddContractItem key={items.length} contractId={c.id} servicos={servicos} unidades={unidades} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-4 text-center text-muted-foreground">Nenhum serviço.</TableCell></TableRow>
              ) : (
                items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.descricao}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(i.valor)}</TableCell>
                    <TableCell className="text-right">
                      <form action={removerItemContrato.bind(null, i.id)}>
                        <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Aditivos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ResourceForm
            fields={aditivoFields}
            action={adicionarAditivo.bind(null, c.id)}
            submitLabel="Registrar aditivo"
          />
          {aditivos.length > 0 && (
            <ul className="divide-y text-sm">
              {aditivos.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="text-muted-foreground">{formatDate(a.data)} · </span>
                    {a.descricao}
                  </span>
                  {a.valor_novo != null && (
                    <span className="tabular-nums">{formatBRL(a.valor_novo)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
