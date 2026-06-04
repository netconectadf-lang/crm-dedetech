import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Field } from "@/components/app/resource-form";
import { salvarConta, excluirConta } from "./actions";
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

export const metadata = { title: "Plano de Contas" };

const fields: Field[] = [
  { name: "codigo", label: "Código" },
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    options: [
      { value: "receita", label: "Receita" },
      { value: "despesa", label: "Despesa" },
    ],
  },
  { name: "nome", label: "Nome da conta", required: true, full: true },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Conta = {
  id: string;
  codigo: string | null;
  nome: string;
  tipo: "receita" | "despesa";
  ativo: boolean;
};

export default async function PlanoDeContasPage() {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .order("codigo", { nullsFirst: false })
    .order("nome");
  const contas = (data as Conta[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Plano de contas"
        description="Classificação de receitas e despesas."
        count={contas.length}
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Nova conta</Button>}
            title="Nova conta"
            fields={fields}
            action={salvarConta.bind(null, null)}
          />
        }
      />

      {contas.length === 0 ? (
        <EmptyState title="Nenhuma conta" description="Monte seu plano de contas." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((c) => (
                  <TableRow key={c.id} className={c.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-mono text-sm">{c.codigo ?? "—"}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <Badge variant={c.tipo === "receita" ? "default" : "secondary"}>
                        {c.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!c.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar conta"
                          fields={fields}
                          defaultValues={c}
                          action={salvarConta.bind(null, c.id)}
                        />
                        <DeleteButton nome={c.nome} action={excluirConta.bind(null, c.id)} />
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
