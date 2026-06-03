import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { OS_STATUS_LABEL, OS_STATUS_TONE, type OsStatus } from "@/lib/os";
import type { Field } from "@/components/app/resource-form";
import { criarOS } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
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

export const metadata = { title: "Ordens de serviço" };

type OS = {
  id: string;
  numero: number;
  status: OsStatus;
  scheduled_at: string | null;
  clients: { razao_social: string } | null;
  employees: { nome: string } | null;
};

export default async function OsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("service_orders")
    .select("id, numero, status, scheduled_at, clients(razao_social), employees(nome)")
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  if (status) query = query.eq("status", status);

  const [{ data: osData }, { data: clientsData }, { data: tecData }, { data: vehData }] =
    await Promise.all([
      query,
      supabase.from("clients").select("id, razao_social").eq("ativo", true).order("razao_social"),
      supabase.from("employees").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("vehicles").select("id, placa, modelo").eq("ativo", true).order("placa"),
    ]);

  const oss = (osData as OS[] | null) ?? [];
  const clients = (clientsData as { id: string; razao_social: string }[] | null) ?? [];
  const tecnicos = (tecData as { id: string; nome: string }[] | null) ?? [];
  const veiculos = (vehData as { id: string; placa: string; modelo: string | null }[] | null) ?? [];

  const fields: Field[] = [
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((c) => ({ value: c.id, label: c.razao_social })),
    },
    { name: "scheduled_at", label: "Agendamento", type: "date" },
    {
      name: "tecnico_id",
      label: "Técnico",
      type: "select",
      options: [{ value: "none", label: "—" }, ...tecnicos.map((t) => ({ value: t.id, label: t.nome }))],
    },
    {
      name: "vehicle_id",
      label: "Veículo",
      type: "select",
      options: [
        { value: "none", label: "—" },
        ...veiculos.map((v) => ({ value: v.id, label: `${v.placa}${v.modelo ? ` · ${v.modelo}` : ""}` })),
      ],
    },
  ];

  const filtros: { key: string; label: string }[] = [
    { key: "", label: "Todas" },
    ...(["agendada", "a_caminho", "em_execucao", "executada", "faturada"] as OsStatus[]).map(
      (s) => ({ key: s, label: OS_STATUS_LABEL[s] }),
    ),
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Ordens de serviço"
        description="Agende, execute e finalize os atendimentos."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Nova OS</Button>}
            title="Nova ordem de serviço"
            fields={fields}
            action={criarOS}
            submitLabel="Criar OS"
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Button
            key={f.key}
            asChild
            size="sm"
            variant={(status ?? "") === f.key ? "default" : "outline"}
          >
            <Link href={f.key ? `/os?status=${f.key}` : "/os"}>{f.label}</Link>
          </Button>
        ))}
      </div>

      {oss.length === 0 ? (
        <EmptyState title="Nenhuma OS" description="Crie a primeira ordem de serviço." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oss.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">#{o.numero}</TableCell>
                    <TableCell>{o.clients?.razao_social ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.scheduled_at
                        ? new Date(o.scheduled_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>{o.employees?.nome ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${OS_STATUS_TONE[o.status]}`}>
                        {OS_STATUS_LABEL[o.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/os/${o.id}`}><ExternalLink className="size-4" /></Link>
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
