import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { OS_STATUS_LABEL, OS_STATUS_TONE, METHOD_LABEL, type OsStatus, type ApplicationMethod } from "@/lib/os";
import type { Field } from "@/components/app/resource-form";
import { ResourceForm } from "@/components/app/resource-form";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { OsStatusButtons } from "@/components/os/os-status-buttons";
import { FinalizeButton } from "@/components/os/finalize-button";
import { AddOsProduct } from "@/components/os/add-os-product";
import { atualizarOS, excluirOS, salvarFicha, removerProdutoOS } from "../actions";
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

export const metadata = { title: "OS" };

type OS = {
  id: string;
  numero: number;
  status: OsStatus;
  client_id: string;
  unit_id: string | null;
  scheduled_at: string | null;
  tecnico_id: string | null;
  vehicle_id: string | null;
  pragas: string[];
  metodo: ApplicationMethod | null;
  metragem_m2: number | null;
  periodo_reentrada_horas: number | null;
  garantia_meses: number;
  observacoes: string | null;
  recomendacoes: string | null;
  proxima_revisao_em: string | null;
  clients: { razao_social: string } | null;
  employees: { nome: string } | null;
};

export default async function OsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: osData } = await supabase
    .from("service_orders")
    .select("*, clients(razao_social), employees(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!osData) notFound();
  const os = osData as OS;

  const [{ data: prodLines }, { data: prodList }, { data: unitList }, { data: clientList }, { data: tecList }, { data: vehList }] =
    await Promise.all([
      supabase.from("service_order_products").select("id, quantidade, diluicao, products(nome_comercial)").eq("os_id", id),
      supabase.from("products").select("id, nome_comercial").eq("ativo", true).order("nome_comercial"),
      supabase.from("client_units").select("id, apelido").eq("client_id", os.client_id).order("apelido"),
      supabase.from("clients").select("id, razao_social").eq("ativo", true).order("razao_social"),
      supabase.from("employees").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("vehicles").select("id, placa").eq("ativo", true).order("placa"),
    ]);

  const linhas = (prodLines as { id: string; quantidade: number; diluicao: string | null; products: { nome_comercial: string } | null }[] | null) ?? [];
  const produtos = (prodList as { id: string; nome_comercial: string }[] | null) ?? [];
  const unidades = (unitList as { id: string; apelido: string }[] | null) ?? [];
  const clients = (clientList as { id: string; razao_social: string }[] | null) ?? [];
  const tecnicos = (tecList as { id: string; nome: string }[] | null) ?? [];
  const veiculos = (vehList as { id: string; placa: string }[] | null) ?? [];

  const finalizada = os.status === "executada" || os.status === "faturada";
  const podeFinalizar = ["agendada", "a_caminho", "em_execucao"].includes(os.status);

  const editFields: Field[] = [
    { name: "client_id", label: "Cliente", type: "select", required: true, options: clients.map((c) => ({ value: c.id, label: c.razao_social })) },
    { name: "unit_id", label: "Unidade", type: "select", options: [{ value: "none", label: "—" }, ...unidades.map((u) => ({ value: u.id, label: u.apelido }))] },
    { name: "scheduled_at", label: "Agendamento", type: "date" },
    { name: "tecnico_id", label: "Técnico", type: "select", options: [{ value: "none", label: "—" }, ...tecnicos.map((t) => ({ value: t.id, label: t.nome }))] },
    { name: "vehicle_id", label: "Veículo", type: "select", options: [{ value: "none", label: "—" }, ...veiculos.map((v) => ({ value: v.id, label: v.placa }))] },
  ];

  const fichaFields: Field[] = [
    { name: "pragas", label: "Pragas combatidas (separe por vírgula)", full: true },
    {
      name: "metodo",
      label: "Método de aplicação",
      type: "select",
      options: (Object.keys(METHOD_LABEL) as ApplicationMethod[]).map((m) => ({ value: m, label: METHOD_LABEL[m] })),
    },
    { name: "metragem_m2", label: "Metragem total (m²)", type: "number" },
    { name: "periodo_reentrada_horas", label: "Período de reentrada (horas)", type: "number" },
    { name: "garantia_meses", label: "Garantia (meses)", type: "number" },
    { name: "observacoes", label: "Observações técnicas", type: "textarea" },
    { name: "recomendacoes", label: "Recomendações ao cliente", type: "textarea" },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/os"><ArrowLeft className="size-4" /> Ordens de serviço</Link>
      </Button>

      <PageHeader
        title={`OS #${os.numero}`}
        description={os.clients?.razao_social}
        action={
          <div className="flex gap-2">
            {finalizada && (
              <Button asChild variant="outline">
                <Link href={`/os/${os.id}/certificado`}><FileText className="size-4" /> Certificado</Link>
              </Button>
            )}
            <ResourceDialog
              trigger={<Button variant="outline">Editar</Button>}
              title="Editar OS"
              fields={editFields}
              defaultValues={os}
              action={atualizarOS.bind(null, os.id)}
            />
            <DeleteButton nome={`OS #${os.numero}`} action={excluirOS.bind(null, os.id)} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${OS_STATUS_TONE[os.status]}`}>
          {OS_STATUS_LABEL[os.status]}
        </span>
        {os.employees && <Badge variant="outline">Téc.: {os.employees.nome}</Badge>}
        {os.proxima_revisao_em && (
          <Badge variant="outline">Revisão de garantia: {formatDate(os.proxima_revisao_em)}</Badge>
        )}
        <OsStatusButtons id={os.id} status={os.status} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ficha de visita</CardTitle></CardHeader>
        <CardContent>
          <ResourceForm
            fields={fichaFields}
            action={salvarFicha.bind(null, os.id)}
            defaultValues={{ ...os, pragas: os.pragas?.join(", ") }}
            submitLabel="Salvar ficha"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Produtos utilizados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!finalizada && <AddOsProduct osId={os.id} produtos={produtos} />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Diluição</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-4 text-center text-muted-foreground">Nenhum produto.</TableCell></TableRow>
              ) : (
                linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.products?.nome_comercial ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.quantidade}</TableCell>
                    <TableCell>{l.diluicao ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {!finalizada && (
                        <form action={removerProdutoOS.bind(null, l.id, os.id)}>
                          <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {podeFinalizar && (
            <div className="border-t pt-4">
              <FinalizeButton osId={os.id} />
              <p className="mt-2 text-xs text-muted-foreground">
                Finalizar dá baixa nos produtos por FEFO, marca como executada e
                libera o certificado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
