import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil, ArrowLeft, FileSignature, ClipboardList, Wallet, ArrowDownCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { PERIODICITY_MONTHS, CONTRACT_STATUS_LABEL, type ContractPeriodicity, type ContractStatus } from "@/lib/contratos";
import { OS_STATUS_LABEL, OS_STATUS_TONE, type OsStatus } from "@/lib/os";
import type { Field } from "@/components/app/resource-form";
import { salvarUnidade, excluirUnidade } from "../actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { ConvidarPortal } from "@/components/app/convidar-portal";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
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

const unidadeFields: Field[] = [
  { name: "apelido", label: "Apelido / identificação", required: true, full: true },
  { name: "cep", label: "CEP", type: "cep" },
  { name: "logradouro", label: "Logradouro" },
  { name: "numero", label: "Número" },
  { name: "complemento", label: "Complemento" },
  { name: "bairro", label: "Bairro" },
  { name: "cidade", label: "Cidade" },
  { name: "uf", label: "UF" },
  { name: "area_m2", label: "Área (m²)", type: "number" },
  { name: "tipo_ambiente", label: "Tipo de ambiente" },
];

type Unidade = {
  id: string;
  apelido: string;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  area_m2: number | null;
  tipo_ambiente: string | null;
};

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "comercial", "operacional"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clients")
    .select("id, razao_social, nome_fantasia")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) notFound();
  const c = cliente as { razao_social: string; nome_fantasia: string | null };

  const [{ data: unitData }, { data: contractData }, { data: osData }, { data: arData }] =
    await Promise.all([
      supabase.from("client_units").select("*").eq("client_id", id).order("apelido"),
      supabase.from("contracts").select("id, titulo, valor, periodicidade, status").eq("client_id", id),
      supabase.from("service_orders").select("id, numero, status, scheduled_at").eq("client_id", id).order("scheduled_at", { ascending: false, nullsFirst: false }).limit(5),
      supabase.from("accounts_receivable").select("valor, valor_pago, status").eq("client_id", id),
    ]);

  const unidades = (unitData as Unidade[] | null) ?? [];
  const contratos = (contractData as { id: string; titulo: string; valor: number; periodicidade: ContractPeriodicity; status: ContractStatus }[] | null) ?? [];
  const ultimasOs = (osData as { id: string; numero: number; status: OsStatus; scheduled_at: string | null }[] | null) ?? [];
  const ar = (arData as { valor: number; valor_pago: number; status: string }[] | null) ?? [];

  const contratosAtivos = contratos.filter((k) => k.status === "ativo");
  const mrrCliente = contratosAtivos.reduce((s, k) => s + Number(k.valor) / PERIODICITY_MONTHS[k.periodicidade], 0);
  const aReceber = ar
    .filter((k) => k.status === "a_vencer" || k.status === "parcial")
    .reduce((s, k) => s + (Number(k.valor) - Number(k.valor_pago)), 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
        <Link href="/clientes">
          <ArrowLeft className="size-4" /> Clientes
        </Link>
      </Button>

      <PageHeader
        title={c.razao_social}
        description="Unidades / locais de atendimento deste cliente."
        action={
          <ResourceDialog
            trigger={
              <Button>
                <Plus className="size-4" /> Nova unidade
              </Button>
            }
            title="Nova unidade"
            fields={unidadeFields}
            action={salvarUnidade.bind(null, id, null)}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={FileSignature} label="Contratos ativos" value={String(contratosAtivos.length)} />
        <KpiCard icon={Wallet} label="MRR do cliente" value={formatBRL(mrrCliente)} tone={mrrCliente > 0 ? "ok" : "default"} />
        <KpiCard icon={ClipboardList} label="Últimas OS" value={String(ultimasOs.length)} href="/os" />
        <KpiCard icon={ArrowDownCircle} label="A receber" value={formatBRL(aReceber)} href="/financeiro/receber" tone={aReceber > 0 ? "warning" : "default"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Últimas ordens de serviço">
          {ultimasOs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma OS para este cliente.</p>
          ) : (
            <ul className="space-y-2">
              {ultimasOs.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <Link href={`/os/${o.id}`} className="font-medium hover:text-primary">
                    OS #{o.numero}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {o.scheduled_at ? new Date(o.scheduled_at).toLocaleDateString("pt-BR") : "—"}
                    </span>
                  </Link>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${OS_STATUS_TONE[o.status]}`}>
                    {OS_STATUS_LABEL[o.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Contratos">
          {contratos.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum contrato.</p>
          ) : (
            <ul className="space-y-2">
              {contratos.map((k) => (
                <li key={k.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <Link href={`/contratos/${k.id}`} className="font-medium hover:text-primary">
                    {k.titulo}
                    <span className="ml-2 font-normal tabular-nums text-muted-foreground">{formatBRL(k.valor)}</span>
                  </Link>
                  <Badge variant={k.status === "ativo" ? "default" : k.status === "cancelado" ? "destructive" : "secondary"}>
                    {CONTRACT_STATUS_LABEL[k.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="font-medium">Portal do Cliente</p>
            <p className="text-sm text-muted-foreground">
              Dê acesso self-service (histórico, agenda, financeiro e chamados).
            </p>
          </div>
          <ConvidarPortal clientId={id} />
        </CardContent>
      </Card>

      {unidades.length === 0 ? (
        <EmptyState
          title="Nenhuma unidade"
          description="Cadastre os locais onde o serviço é prestado."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apelido</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.apelido}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[u.logradouro, u.numero, u.bairro, u.cidade && `${u.cidade}/${u.uf}`]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell>{u.area_m2 ? `${u.area_m2} m²` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                          title="Editar unidade"
                          fields={unidadeFields}
                          defaultValues={u}
                          action={salvarUnidade.bind(null, id, u.id)}
                        />
                        <DeleteButton
                          nome={u.apelido}
                          action={excluirUnidade.bind(null, id, u.id)}
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
