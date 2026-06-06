import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatPhone } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarFornecedor, excluirFornecedor } from "./actions";
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

export const metadata = { title: "Fornecedores" };

const CATEGORIAS = [
  { value: "saneante", label: "Saneantes" },
  { value: "epi", label: "EPI" },
  { value: "combustivel", label: "Combustível" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
];

const fields: Field[] = [
  { name: "razao_social", label: "Razão social", required: true, full: true },
  { name: "nome_fantasia", label: "Nome fantasia" },
  { name: "cnpj", label: "CNPJ", type: "cnpj" },
  { name: "telefone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "categoria", label: "Categoria", type: "select", options: CATEGORIAS },
  { name: "cidade", label: "Cidade" },
  { name: "uf", label: "UF" },
  { name: "observacoes", label: "Observações", type: "textarea" },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Fornecedor = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  categoria: string | null;
  ativo: boolean;
};

export default async function FornecedoresPage() {
  await requireRole(["owner", "operacional", "financeiro"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .order("razao_social");
  const fornecedores = (data as Fornecedor[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Fornecedores"
        description="Fornecedores de saneantes, EPI, combustível e serviços."
        count={fornecedores.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona o cadastro de Fornecedores"
              descricao="Quem fornece para a sua operação: saneantes, EPI, combustível e serviços."
              topicos={[
                {
                  titulo: "Cadastrar fornecedor",
                  itens: [
                    "Clique em 'Novo fornecedor'.",
                    "Preencha o CNPJ para puxar a razão social e os dados automaticamente.",
                    "Categoria — classifique como Saneantes, EPI, Combustível, Serviços ou Outros.",
                    "Telefone, e-mail e cidade/UF para contato e logística.",
                  ],
                },
                {
                  titulo: "Organizar a lista",
                  itens: [
                    "A tabela mostra fornecedor, CNPJ, telefone e categoria.",
                    "Ativo — desligue para esconder fornecedores que você não usa mais (ficam marcados como 'inativo').",
                    "Lápis: editar. Lixeira: excluir.",
                  ],
                },
              ]}
              dica="Categorizar os fornecedores ajuda a organizar as compras e a comparar preços por tipo de insumo."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo fornecedor</Button>}
              title="Novo fornecedor"
              description="Preencha o CNPJ para puxar os dados."
              fields={fields}
              action={salvarFornecedor.bind(null, null)}
            />
          </div>
        }
      />

      {fornecedores.length === 0 ? (
        <EmptyState title="Nenhum fornecedor" description="Cadastre seus fornecedores." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map((f) => (
                  <TableRow key={f.id} className={f.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-medium">
                      {f.razao_social}
                      {f.nome_fantasia && (
                        <span className="block text-xs text-muted-foreground">
                          {f.nome_fantasia}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatCpfCnpj(f.cnpj)}</TableCell>
                    <TableCell>{formatPhone(f.telefone)}</TableCell>
                    <TableCell className="capitalize">{f.categoria ?? "—"}</TableCell>
                    <TableCell>
                      {!f.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar fornecedor"
                          fields={fields}
                          defaultValues={f}
                          action={salvarFornecedor.bind(null, f.id)}
                        />
                        <DeleteButton
                          nome={f.razao_social}
                          action={excluirFornecedor.bind(null, f.id)}
                          successMessage="Fornecedor excluído com sucesso"
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
