import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Field } from "@/components/app/resource-form";
import { salvarEstrutura, excluirEstrutura } from "./actions";
import { AjudaTela } from "@/components/app/ajuda-tela";
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

export const metadata = { title: "Estruturas" };

const fields: Field[] = [
  { name: "nome", label: "Nome da estrutura / área", required: true, full: true },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Estrutura = { id: string; nome: string; ativo: boolean };

export default async function EstruturasPage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();
  const { data } = await supabase.from("estruturas").select("*").order("nome");
  const estruturas = (data as Estrutura[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Estruturas / áreas"
        description="Áreas e estruturas tratadas, selecionáveis na ficha da OS."
        count={estruturas.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona o catálogo de Estruturas / áreas"
              descricao="A lista de áreas e estruturas tratadas que aparece para marcar na ficha da ordem de serviço."
              topicos={[
                {
                  titulo: "Cadastrar áreas",
                  itens: [
                    "Clique em 'Nova estrutura' e digite o nome da área (ex.: Cozinha, Depósito, Pátio, Caixa d'água).",
                    "Cadastre os tipos de ambiente que sua equipe costuma tratar.",
                    "Lápis: editar o nome. Lixeira: excluir.",
                  ],
                },
                {
                  titulo: "Uso na ordem de serviço",
                  itens: [
                    "Na OS, o técnico marca quais estruturas/áreas foram tratadas a partir desta lista.",
                    "Nomes padronizados deixam os laudos e o histórico do cliente mais claros.",
                    "Ativo — desligue áreas que não usa para tirá-las da seleção (ficam 'inativo').",
                  ],
                },
              ]}
              dica="Cadastre áreas genéricas que servem para vários clientes; assim a mesma lista atende toda a operação."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Nova estrutura</Button>}
              title="Nova estrutura"
              fields={fields}
              action={salvarEstrutura.bind(null, null)}
            />
          </div>
        }
      />

      {estruturas.length === 0 ? (
        <EmptyState title="Nenhuma estrutura" description="Cadastre as áreas/estruturas tratadas." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estrutura / área</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estruturas.map((e) => (
                  <TableRow key={e.id} className={e.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>
                      {!e.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar estrutura"
                          fields={fields}
                          defaultValues={e}
                          action={salvarEstrutura.bind(null, e.id)}
                        />
                        <DeleteButton nome={e.nome} action={excluirEstrutura.bind(null, e.id)} />
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
