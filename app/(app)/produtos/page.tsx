import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarProduto, excluirProduto } from "./actions";
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

export const metadata = { title: "Produtos" };

const CATEGORIAS = [
  "inseticida",
  "raticida",
  "cupinicida",
  "formicida",
  "larvicida",
  "sanitizante",
].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

type Produto = {
  id: string;
  nome_comercial: string;
  registro_anvisa: string | null;
  categoria: string | null;
  preco_venda: number;
  ativo: boolean;
};

export default async function ProdutosPage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();

  const [{ data: prods }, { data: sups }] = await Promise.all([
    supabase.from("products").select("*").order("nome_comercial"),
    supabase.from("suppliers").select("id, razao_social").eq("ativo", true).order("razao_social"),
  ]);

  const produtos = (prods as Produto[] | null) ?? [];
  const fornecedores =
    (sups as { id: string; razao_social: string }[] | null) ?? [];

  const fields: Field[] = [
    { name: "nome_comercial", label: "Nome comercial", required: true, full: true },
    { name: "registro_anvisa", label: "Registro ANVISA", required: true },
    { name: "codigo_interno", label: "Código interno" },
    { name: "principio_ativo", label: "Princípio ativo" },
    { name: "grupo_quimico", label: "Grupo químico" },
    { name: "fabricante", label: "Fabricante" },
    { name: "categoria", label: "Categoria", type: "select", options: CATEGORIAS },
    { name: "classe_toxicologica", label: "Classe toxicológica" },
    {
      name: "tipo",
      label: "Tipo",
      type: "select",
      options: [
        { value: "concentrado", label: "Concentrado" },
        { value: "pronto_uso", label: "Pronto uso" },
      ],
    },
    { name: "unidade_medida", label: "Unidade (L, kg…)" },
    { name: "fator_diluicao", label: "Fator de diluição", type: "number" },
    { name: "dose_m2", label: "Dose por m²", type: "number" },
    { name: "estoque_minimo", label: "Estoque mínimo", type: "number" },
    { name: "preco_custo", label: "Preço de custo (R$)", type: "number" },
    { name: "preco_venda", label: "Preço de venda (R$)", type: "number" },
    {
      name: "fornecedor_id",
      label: "Fornecedor",
      type: "select",
      options: [
        { value: "none", label: "Sem fornecedor" },
        ...fornecedores.map((f) => ({ value: f.id, label: f.razao_social })),
      ],
    },
    { name: "antidoto", label: "Antídoto / primeiros socorros", type: "textarea" },
    { name: "ativo", label: "Ativo", type: "switch" },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Produtos / saneantes"
        description="Saneantes com registro ANVISA, diluição e dose por m²."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Novo produto</Button>}
            title="Novo produto"
            fields={fields}
            action={salvarProduto.bind(null, null)}
          />
        }
      />

      {produtos.length === 0 ? (
        <EmptyState title="Nenhum produto" description="Cadastre os saneantes utilizados." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Registro ANVISA</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço venda</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome_comercial}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.registro_anvisa ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">{p.categoria ?? "—"}</TableCell>
                    <TableCell>{formatBRL(p.preco_venda)}</TableCell>
                    <TableCell>
                      {!p.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar produto"
                          fields={fields}
                          defaultValues={p}
                          action={salvarProduto.bind(null, p.id)}
                        />
                        <DeleteButton nome={p.nome_comercial} action={excluirProduto.bind(null, p.id)} />
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
