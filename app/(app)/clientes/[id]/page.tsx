import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil, ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Field } from "@/components/app/resource-form";
import { salvarUnidade, excluirUnidade } from "../actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
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

  const { data } = await supabase
    .from("client_units")
    .select("*")
    .eq("client_id", id)
    .order("apelido");
  const unidades = (data as Unidade[] | null) ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
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
