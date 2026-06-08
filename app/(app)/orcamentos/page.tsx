import Link from "next/link";
import { Plus, ExternalLink, FileText, Check, Clock, Send } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, type QuoteStatus } from "@/lib/funil";
import { nomeExibicao, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import { criarOrcamentoAvulso } from "./actions";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { KpiCard } from "@/components/dashboard/kpi-card";
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

export const metadata = { title: "Orçamentos" };

type Quote = {
  id: string;
  numero: number;
  status: QuoteStatus;
  desconto: number;
  deal_id: string | null;
  clients: { razao_social: string } | null;
  deals: { nome_contato: string; clients: { razao_social: string } | null } | null;
  quote_items: { subtotal: number }[];
};

export default async function OrcamentosPage() {
  await requireRole(["owner", "comercial", "financeiro"]);
  const supabase = await createClient();

  const [{ data: qData }, { data: clientsData }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, numero, status, desconto, deal_id, clients(razao_social), deals(nome_contato, clients(razao_social)), quote_items(subtotal)")
      .order("numero", { ascending: false }),
    supabase.from("clients").select(CLIENTE_OPCAO_COLS).eq("ativo", true).order("razao_social"),
  ]);

  const quotes = (qData as unknown as Quote[] | null) ?? [];
  const clients = (clientsData as ClienteOpcao[] | null) ?? [];

  const total = (q: Quote) =>
    q.quote_items.reduce((s, i) => s + Number(i.subtotal), 0) - Number(q.desconto);
  const cliente = (q: Quote) =>
    q.clients?.razao_social ?? q.deals?.clients?.razao_social ?? q.deals?.nome_contato ?? "—";

  const rascunho = quotes.filter((q) => q.status === "rascunho").length;
  const enviado = quotes.filter((q) => q.status === "enviado").length;
  const aceito = quotes.filter((q) => q.status === "aceito").length;

  const novoFields: Field[] = [
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((c) => ({ value: c.id, label: nomeExibicao(c) })),
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Orçamentos"
        description="Propostas avulsas e do funil. Um aceite pode virar OS ou contrato."
        count={quotes.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funcionam os Orçamentos"
              descricao="Propostas de serviço com itens e valores. Quando o cliente aceita, viram OS ou contrato."
              topicos={[
                {
                  titulo: "Tipos de orçamento",
                  itens: [
                    "Avulso — criado direto aqui, escolhendo o cliente e os itens.",
                    "Do funil — gerado a partir de uma oportunidade no funil comercial.",
                    "Itens — serviços e produtos com quantidade e valor; o total considera o desconto.",
                  ],
                },
                {
                  titulo: "O status da proposta",
                  itens: [
                    "Rascunho — em elaboração, ainda não foi enviado.",
                    "Enviado — já foi para o cliente; aguardando resposta.",
                    "Aceito — cliente aprovou; pode virar OS ou contrato.",
                  ],
                },
                {
                  titulo: "Do aceite ao serviço",
                  itens: [
                    "Enviar ao cliente — gere o link/proposta para o cliente avaliar.",
                    "Virar OS — aceite pontual gera uma ordem de serviço.",
                    "Virar contrato — aceite recorrente gera um plano de manutenção.",
                  ],
                },
              ]}
              dica="Capriche na descrição dos itens: é o que o cliente lê na proposta e o que vira o tipo de serviço da OS."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo orçamento</Button>}
              title="Novo orçamento (avulso)"
              description="Escolha o cliente. Você adiciona os itens na próxima tela."
              fields={novoFields}
              action={criarOrcamentoAvulso}
              submitLabel="Criar orçamento"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Clock} label="Rascunhos" value={String(rascunho)} />
        <KpiCard icon={Send} label="Enviados" value={String(enviado)} tone={enviado > 0 ? "warning" : "default"} />
        <KpiCard icon={Check} label="Aceitos" value={String(aceito)} tone={aceito > 0 ? "ok" : "default"} />
      </div>

      {quotes.length === 0 ? (
        <EmptyState title="Nenhum orçamento" description="Crie um orçamento avulso ou gere pelo funil." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const href = q.deal_id ? `/funil/${q.deal_id}/orcamento/${q.id}` : `/orcamentos/${q.id}`;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium tabular-nums">
                        <span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />#{q.numero}</span>
                      </TableCell>
                      <TableCell>{cliente(q)}</TableCell>
                      <TableCell>
                        <Badge variant={q.deal_id ? "outline" : "secondary"}>{q.deal_id ? "Funil" : "Avulso"}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(total(q))}</TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${QUOTE_STATUS_TONE[q.status]}`}>
                          {QUOTE_STATUS_LABEL[q.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={href}><ExternalLink className="size-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
