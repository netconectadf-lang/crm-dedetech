import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Field } from "@/components/app/resource-form";
import { salvarPraga, excluirPraga } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
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

export const metadata = { title: "Pragas" };

const fields: Field[] = [
  { name: "nome", label: "Nome da praga", required: true, full: true },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Praga = { id: string; nome: string; ativo: boolean };

export default async function PragasPage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();
  const { data } = await supabase.from("pragas").select("*").order("nome");
  const pragas = (data as Praga[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Pragas"
        description="Lista de pragas selecionáveis na ficha da ordem de serviço."
        count={pragas.length}
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Nova praga</Button>}
            title="Nova praga"
            fields={fields}
            action={salvarPraga.bind(null, null)}
          />
        }
      />

      {pragas.length === 0 ? (
        <EmptyState title="Nenhuma praga" description="Cadastre as pragas combatidas." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Praga</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pragas.map((p) => (
                  <TableRow key={p.id} className={p.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>
                      {!p.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar praga"
                          fields={fields}
                          defaultValues={p}
                          action={salvarPraga.bind(null, p.id)}
                        />
                        <DeleteButton nome={p.nome} action={excluirPraga.bind(null, p.id)} />
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
