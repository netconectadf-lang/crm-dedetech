import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarFuncionario, excluirFuncionario } from "./actions";
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

export const metadata = { title: "Funcionários" };

const fields: Field[] = [
  { name: "nome", label: "Nome completo", required: true, full: true },
  { name: "cpf", label: "CPF" },
  { name: "rg", label: "RG" },
  { name: "nascimento", label: "Nascimento", type: "date" },
  { name: "telefone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "cargo", label: "Cargo" },
  { name: "departamento", label: "Departamento" },
  { name: "salario", label: "Salário (R$)", type: "number" },
  { name: "data_admissao", label: "Admissão", type: "date" },
  {
    name: "tipo_contrato",
    label: "Tipo de contrato",
    type: "select",
    options: [
      { value: "clt", label: "CLT" },
      { value: "pj", label: "PJ" },
      { value: "estagio", label: "Estágio" },
      { value: "temporario", label: "Temporário" },
    ],
  },
  { name: "registro_conselho", label: "Registro no conselho (RT)" },
  { name: "vencimento_anuidade", label: "Venc. anuidade", type: "date" },
  { name: "responsavel_tecnico", label: "É responsável técnico (RT)", type: "switch" },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Funcionario = {
  id: string;
  nome: string;
  cpf: string | null;
  cargo: string | null;
  responsavel_tecnico: boolean;
  ativo: boolean;
};

export default async function FuncionariosPage() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").order("nome");
  const funcionarios = (data as Funcionario[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Funcionários"
        description="Equipe, cargos e responsável técnico."
        count={funcionarios.length}
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Novo funcionário</Button>}
            title="Novo funcionário"
            fields={fields}
            action={salvarFuncionario.bind(null, null)}
          />
        }
      />

      {funcionarios.length === 0 ? (
        <EmptyState title="Nenhum funcionário" description="Cadastre sua equipe." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.id} className={f.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-medium">
                      {f.nome}
                      {f.responsavel_tecnico && (
                        <Badge variant="secondary" className="ml-2">RT</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatCpfCnpj(f.cpf)}</TableCell>
                    <TableCell>{f.cargo ?? "—"}</TableCell>
                    <TableCell>
                      {!f.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar funcionário"
                          fields={fields}
                          defaultValues={f}
                          action={salvarFuncionario.bind(null, f.id)}
                        />
                        <DeleteButton nome={f.nome} action={excluirFuncionario.bind(null, f.id)} />
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
