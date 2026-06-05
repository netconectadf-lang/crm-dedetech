import { Plus, Pencil, MessageCircle, Banknote } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatPhone, formatBRL, waLink } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarPrestador, excluirPrestador, lancarPagamentoPrestador } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { AjudaTela } from "@/components/app/ajuda-tela";
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

export const metadata = { title: "Prestadores de serviço" };

const fields: Field[] = [
  { name: "nome", label: "Nome / razão social", required: true, full: true },
  { name: "documento", label: "CPF / CNPJ" },
  { name: "tipo_servico", label: "Tipo de serviço", full: true },
  { name: "telefone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "cidade", label: "Cidade" },
  { name: "uf", label: "UF" },
  { name: "valor_padrao", label: "Valor de referência (R$)", type: "number" },
  { name: "observacoes", label: "Observações", type: "textarea", full: true },
  { name: "ativo", label: "Ativo", type: "switch" },
];

const pagamentoFields: Field[] = [
  { name: "valor", label: "Valor do pagamento (R$)", type: "number", required: true },
  { name: "vencimento", label: "Vencimento", type: "date", required: true },
  {
    name: "recorrencia",
    label: "Recorrência",
    type: "select",
    options: [
      { value: "mensal", label: "Mensal (recorrente)" },
      { value: "unica", label: "Única" },
      { value: "anual", label: "Anual" },
    ],
  },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

type Prestador = {
  id: string;
  nome: string;
  documento: string | null;
  tipo_servico: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  valor_padrao: number | null;
  ativo: boolean;
};

export default async function PrestadoresPage() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_providers")
    .select("*")
    .order("nome");
  const prestadores = (data as Prestador[] | null) ?? [];

  // vencimento padrão do pagamento = dia 5 do próximo mês
  const hoje = new Date();
  const vencPag = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 5).toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Prestadores de serviço"
        description="Empresas e autônomos terceirizados que você contrata."
        count={prestadores.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funcionam os Prestadores de serviço"
              descricao="Cadastro dos terceiros que você contrata para apoiar a operação (dedetização terceirizada, transporte, manutenção, etc.)."
              topicos={[
                {
                  titulo: "Para que serve",
                  itens: [
                    "Terceiros — quem não é seu funcionário, mas presta serviço para você.",
                    "Tipo de serviço — descreva o que o prestador faz (ex.: descupinização, transporte).",
                    "Valor de referência — quanto costuma cobrar, para consultar na hora de contratar.",
                  ],
                },
                {
                  titulo: "No dia a dia",
                  itens: [
                    "Novo prestador — cadastre nome/documento, contato e o tipo de serviço.",
                    "WhatsApp — fale com o prestador direto pelo ícone na lista.",
                    "Ativo/Inativo — desative quem você não usa mais sem perder o histórico.",
                  ],
                },
              ]}
              dica="Diferente de Funcionários (sua equipe CLT/PJ fixa), aqui ficam os parceiros externos contratados por demanda."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo prestador</Button>}
              title="Novo prestador"
              fields={fields}
              action={salvarPrestador.bind(null, null)}
            />
          </div>
        }
      />

      {prestadores.length === 0 ? (
        <EmptyState
          title="Nenhum prestador cadastrado"
          description="Cadastre as empresas e autônomos terceirizados que você contrata."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Valor ref.</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestadores.map((p) => (
                  <TableRow key={p.id} className={p.ativo ? undefined : "opacity-55"}>
                    <TableCell className="font-medium">
                      {p.nome}
                      {[p.cidade, p.uf].filter(Boolean).length > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {[p.cidade, p.uf].filter(Boolean).join("/")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{p.tipo_servico ?? "—"}</TableCell>
                    <TableCell>{formatCpfCnpj(p.documento)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.valor_padrao != null ? formatBRL(p.valor_padrao) : "—"}
                    </TableCell>
                    <TableCell>
                      {!p.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {waLink(p.telefone) && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title={`WhatsApp ${formatPhone(p.telefone)}`}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <a href={waLink(p.telefone)!} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="size-4" />
                            </a>
                          </Button>
                        )}
                        <ResourceDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Lançar pagamento no financeiro"
                              className="text-sky-400 hover:text-sky-300"
                            >
                              <Banknote className="size-4" />
                            </Button>
                          }
                          title={`Lançar pagamento — ${p.nome}`}
                          description="Cria uma conta a pagar no financeiro (pode ser recorrente mensal)."
                          fields={pagamentoFields}
                          defaultValues={{
                            valor: p.valor_padrao ?? undefined,
                            vencimento: vencPag,
                            recorrencia: "mensal",
                          }}
                          action={lancarPagamentoPrestador.bind(null, p.id)}
                          submitLabel="Lançar no financeiro"
                        />
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar prestador"
                          fields={fields}
                          defaultValues={p}
                          action={salvarPrestador.bind(null, p.id)}
                        />
                        <DeleteButton nome={p.nome} action={excluirPrestador.bind(null, p.id)} />
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
