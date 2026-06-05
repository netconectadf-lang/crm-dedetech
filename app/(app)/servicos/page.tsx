import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarServico, excluirServico } from "./actions";
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

export const metadata = { title: "Serviços" };

const UNIDADES = [
  { value: "visita", label: "Por visita" },
  { value: "m2", label: "Por m²" },
  { value: "ponto", label: "Por ponto" },
  { value: "hora", label: "Por hora" },
];

const fields: Field[] = [
  { name: "nome", label: "Nome do serviço", required: true, full: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "praga_alvo_padrao", label: "Praga-alvo padrão" },
  { name: "metodo_padrao", label: "Método padrão" },
  { name: "preco_base", label: "Preço base (R$)", type: "number" },
  { name: "garantia_padrao_meses", label: "Garantia (meses)", type: "number" },
  { name: "unidade_cobranca", label: "Unidade de cobrança", type: "select", options: UNIDADES },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Servico = {
  id: string;
  nome: string;
  preco_base: number;
  garantia_padrao_meses: number;
  unidade_cobranca: string;
  ativo: boolean;
};

export default async function ServicosPage() {
  await requireRole(["owner", "comercial", "operacional"]);
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("*").order("nome");
  const servicos = (data as Servico[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Catálogo de serviços"
        description="Serviços oferecidos, com preço e garantia padrão."
        count={servicos.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona o Catálogo de serviços"
              descricao="Cadastre os serviços que sua empresa oferece, com preço base e garantia, para usá-los nos orçamentos e ordens de serviço."
              topicos={[
                {
                  titulo: "Cadastrar um serviço",
                  itens: [
                    "Clique em 'Novo serviço' e informe o nome (obrigatório).",
                    "Praga-alvo e método padrão — usados como sugestão ao montar a OS.",
                    "Preço base — valor de referência cobrado pelo serviço.",
                    "Garantia (meses) — período de cobertura padrão oferecido ao cliente.",
                  ],
                },
                {
                  titulo: "Unidade de cobrança",
                  itens: [
                    "Define como o serviço é precificado: por visita, por m², por ponto ou por hora.",
                    "Escolha conforme a forma como você cobra na prática.",
                  ],
                },
                {
                  titulo: "Gerenciar a lista",
                  itens: [
                    "Lápis — editar nome, preço, garantia e demais dados.",
                    "Lixeira — excluir o serviço do catálogo.",
                    "Ativo — desative serviços que não oferece mais sem precisar apagá-los.",
                  ],
                },
              ]}
              dica="Mantenha preço base e garantia atualizados: eles entram automaticamente nos orçamentos e ordens de serviço."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo serviço</Button>}
              title="Novo serviço"
              fields={fields}
              action={salvarServico.bind(null, null)}
            />
          </div>
        }
      />

      {servicos.length === 0 ? (
        <EmptyState title="Nenhum serviço" description="Cadastre o catálogo de serviços." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Preço base</TableHead>
                  <TableHead>Garantia</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((s) => (
                  <TableRow key={s.id} className={s.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell>{formatBRL(s.preco_base)}</TableCell>
                    <TableCell>
                      {s.garantia_padrao_meses > 0
                        ? `${s.garantia_padrao_meses} meses`
                        : "—"}
                    </TableCell>
                    <TableCell className="capitalize">{s.unidade_cobranca}</TableCell>
                    <TableCell>
                      {!s.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar serviço"
                          fields={fields}
                          defaultValues={s}
                          action={salvarServico.bind(null, s.id)}
                        />
                        <DeleteButton nome={s.nome} action={excluirServico.bind(null, s.id)} />
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
