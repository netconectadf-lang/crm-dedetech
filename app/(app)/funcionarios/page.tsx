import { Plus, Pencil, MessageCircle, Banknote, HandCoins } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatPhone, waLink } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarFuncionario, excluirFuncionario, lancarSalario, lancarFolha } from "./actions";
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
  { name: "jornada_horas", label: "Jornada diária (h)", type: "number" },
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

const salarioFields: Field[] = [
  { name: "valor", label: "Valor do salário (R$)", type: "number", required: true },
  { name: "vencimento", label: "Vencimento", type: "date", required: true },
  {
    name: "recorrencia",
    label: "Recorrência",
    type: "select",
    options: [
      { value: "mensal", label: "Mensal" },
      { value: "unica", label: "Única" },
      { value: "anual", label: "Anual" },
    ],
  },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

const folhaFields: Field[] = [
  { name: "vencimento", label: "Vencimento das contas", type: "date", required: true },
  {
    name: "recorrencia",
    label: "Recorrência",
    type: "select",
    options: [
      { value: "mensal", label: "Mensal" },
      { value: "unica", label: "Única" },
      { value: "anual", label: "Anual" },
    ],
  },
];

type Funcionario = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  cargo: string | null;
  salario: number | null;
  responsavel_tecnico: boolean;
  ativo: boolean;
};

export default async function FuncionariosPage() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").order("nome");
  const funcionarios = (data as Funcionario[] | null) ?? [];

  // vencimento padrão do salário = dia 5 do próximo mês
  const hoje = new Date();
  const vencSalario = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 5)
    .toISOString()
    .slice(0, 10);
  const comSalario = funcionarios.filter(
    (f) => f.ativo && f.salario != null && Number(f.salario) > 0,
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Funcionários"
        description="Equipe, cargos e responsável técnico."
        count={funcionarios.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona a tela de Funcionários"
              descricao="Cadastre sua equipe, leia documentos por foto e lance os salários no financeiro."
              topicos={[
                {
                  titulo: "Cadastrar (com leitura de documento)",
                  itens: [
                    "Clique em 'Novo funcionário'.",
                    "No topo do formulário, use 'Ler documento (CNH/RG)' e envie uma foto ou PDF — o sistema preenche nome, CPF, RG e nascimento automaticamente.",
                    "O salário NÃO é preenchido pela leitura: digite à mão.",
                    "Confira tudo e salve.",
                  ],
                },
                {
                  titulo: "Lançar salário no financeiro",
                  itens: [
                    "Na linha do funcionário, clique no ícone azul de cédula (💵).",
                    "O valor já vem do salário cadastrado; confira o vencimento e a recorrência (Mensal por padrão).",
                    "Clique em 'Lançar no financeiro' — vira uma conta a pagar em Financeiro → A pagar.",
                  ],
                },
                {
                  titulo: "Lançar a folha do mês inteira",
                  itens: [
                    "Clique em 'Lançar folha do mês' aqui no topo.",
                    "Escolha o vencimento e a recorrência e confirme.",
                    "O sistema cria uma conta a pagar para CADA funcionário ativo com salário.",
                    "Proteção: se a folha daquele mês já foi lançada, ele não duplica.",
                  ],
                },
                {
                  titulo: "Outros atalhos",
                  itens: [
                    "Ícone verde de WhatsApp: abre conversa direta com o funcionário (se tiver telefone).",
                    "Lápis: editar. Lixeira: excluir.",
                    "RT = responsável técnico.",
                  ],
                },
              ]}
              dica="Cadastre o salário no funcionário para liberar o lançamento no financeiro (individual ou folha inteira)."
            />
            {comSalario > 0 && (
              <ResourceDialog
                trigger={
                  <Button variant="outline">
                    <HandCoins className="size-4" /> Lançar folha do mês
                  </Button>
                }
                title="Lançar folha do mês"
                description={`Cria uma conta a pagar para os ${comSalario} funcionário(s) ativo(s) com salário. Não duplica se já lançou neste mês.`}
                fields={folhaFields}
                defaultValues={{ vencimento: vencSalario, recorrencia: "mensal" }}
                action={lancarFolha}
                submitLabel="Lançar folha"
              />
            )}
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo funcionário</Button>}
              title="Novo funcionário"
              description="Envie a CNH/RG e o sistema lê e preenche os dados (menos o salário)."
              fields={fields}
              action={salvarFuncionario.bind(null, null)}
              docOcr
            />
          </div>
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
                        {waLink(f.telefone) && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title={`WhatsApp ${formatPhone(f.telefone)}`}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <a href={waLink(f.telefone)!} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="size-4" />
                            </a>
                          </Button>
                        )}
                        {f.salario != null && Number(f.salario) > 0 && (
                          <ResourceDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Lançar salário no financeiro"
                                className="text-sky-400 hover:text-sky-300"
                              >
                                <Banknote className="size-4" />
                              </Button>
                            }
                            title={`Lançar salário — ${f.nome}`}
                            description="Cria uma conta a pagar no financeiro com o valor do salário."
                            fields={salarioFields}
                            defaultValues={{
                              valor: f.salario,
                              vencimento: vencSalario,
                              recorrencia: "mensal",
                            }}
                            action={lancarSalario.bind(null, f.id)}
                            submitLabel="Lançar no financeiro"
                          />
                        )}
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar funcionário"
                          fields={fields}
                          defaultValues={f}
                          action={salvarFuncionario.bind(null, f.id)}
                        />
                        <DeleteButton
                          nome={f.nome}
                          action={excluirFuncionario.bind(null, f.id)}
                          successMessage="Funcionário excluído com sucesso"
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
