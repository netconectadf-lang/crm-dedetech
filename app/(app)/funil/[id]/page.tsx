import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, FileText, MessageCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatPhone, onlyDigits } from "@/lib/format";
import { nomeExibicao, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import {
  STAGE_LABEL,
  STAGE_TONE,
  ORIGIN_LABEL,
  LOSS_LABEL,
  QUOTE_STATUS_LABEL,
  type DealStage,
  type LeadOrigin,
  type LossReason,
  type QuoteStatus,
} from "@/lib/funil";
import type { Field } from "@/components/app/resource-form";
import { TaskList, type Task } from "@/components/funil/task-list";
import { StageActions } from "@/components/funil/stage-actions";
import { StageStepper } from "@/components/funil/stage-stepper";
import { atualizarDeal, excluirDeal } from "../actions";
import { criarOrcamento } from "../quote-actions";
import { PageHeader } from "@/components/app/page-header";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Negócio" };

type Deal = {
  id: string;
  nome_contato: string;
  telefone: string | null;
  email: string | null;
  origem: LeadOrigin;
  stage: DealStage;
  valor_estimado: number;
  descricao: string | null;
  motivo_perda: LossReason | null;
  client_id: string | null;
  clients: { razao_social: string } | null;
};

type QuoteRow = {
  id: string;
  numero: number;
  status: QuoteStatus;
  desconto: number;
  quote_items: { subtotal: number }[];
};

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "comercial"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: dealData } = await supabase
    .from("deals")
    .select("*, clients(razao_social)")
    .eq("id", id)
    .maybeSingle();
  if (!dealData) notFound();
  const deal = dealData as Deal;

  const [{ data: tasksData }, { data: quotesData }, { data: clientsData }] =
    await Promise.all([
      supabase
        .from("deal_tasks")
        .select("id, titulo, due_at, done")
        .eq("deal_id", id)
        .order("done")
        .order("due_at", { nullsFirst: false }),
      supabase
        .from("quotes")
        .select("id, numero, status, desconto, quote_items(subtotal)")
        .eq("deal_id", id)
        .order("numero", { ascending: false }),
      supabase.from("clients").select(CLIENTE_OPCAO_COLS).eq("ativo", true).order("razao_social"),
    ]);

  const tasks = (tasksData as Task[] | null) ?? [];
  const quotes = (quotesData as QuoteRow[] | null) ?? [];
  const clients = (clientsData as ClienteOpcao[] | null) ?? [];

  const quoteTotal = (q: QuoteRow) =>
    q.quote_items.reduce((s, i) => s + Number(i.subtotal), 0) - Number(q.desconto);

  const waDigits = deal.telefone ? onlyDigits(deal.telefone) : "";
  const waLink = waDigits
    ? `https://wa.me/${waDigits.startsWith("55") ? waDigits : `55${waDigits}`}?text=${encodeURIComponent(
        `Olá ${deal.nome_contato}!`,
      )}`
    : null;

  const leadFields: Field[] = [
    { name: "nome_contato", label: "Nome do contato", required: true, full: true },
    { name: "telefone", label: "Telefone" },
    { name: "email", label: "E-mail", type: "email" },
    {
      name: "origem",
      label: "Origem",
      type: "select",
      options: (Object.keys(ORIGIN_LABEL) as LeadOrigin[]).map((k) => ({
        value: k,
        label: ORIGIN_LABEL[k],
      })),
    },
    { name: "valor_estimado", label: "Valor estimado (R$)", type: "number" },
    {
      name: "client_id",
      label: "Cliente vinculado",
      type: "select",
      options: [
        { value: "none", label: "Sem vínculo" },
        ...clients.map((c) => ({ value: c.id, label: nomeExibicao(c) })),
      ],
    },
    { name: "descricao", label: "Observações", type: "textarea" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/funil">
          <ArrowLeft className="size-4" /> Funil
        </Link>
      </Button>

      <PageHeader
        title={deal.nome_contato}
        description={
          deal.clients ? `Cliente: ${deal.clients.razao_social}` : "Lead avulso"
        }
        action={
          <div className="flex gap-2">
            <ResourceDialog
              trigger={<Button variant="outline">Editar</Button>}
              title="Editar negócio"
              fields={leadFields}
              defaultValues={deal}
              action={atualizarDeal.bind(null, deal.id)}
            />
            <DeleteButton nome={deal.nome_contato} action={excluirDeal.bind(null, deal.id)} />
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <StageStepper stage={deal.stage} />
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STAGE_TONE[deal.stage]}`}>
              {STAGE_LABEL[deal.stage]}
            </span>
            {deal.stage === "perdido" && deal.motivo_perda && (
              <Badge variant="outline" className="text-rose-300">
                Perda: {LOSS_LABEL[deal.motivo_perda]}
              </Badge>
            )}
            <StageActions dealId={deal.id} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Telefone:</span> {formatPhone(deal.telefone)}</p>
            <p><span className="text-muted-foreground">E-mail:</span> {deal.email ?? "—"}</p>
            <p><span className="text-muted-foreground">Origem:</span> {ORIGIN_LABEL[deal.origem]}</p>
            <p><span className="text-muted-foreground">Valor estimado:</span> <span className="tabular-nums">{formatBRL(deal.valor_estimado)}</span></p>
            {deal.descricao && (
              <p className="pt-2 text-muted-foreground">{deal.descricao}</p>
            )}
            {waLink && (
              <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Chamar no WhatsApp
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Orçamentos</CardTitle>
            <form action={criarOrcamento.bind(null, deal.id)}>
              <Button type="submit" size="sm">
                <Plus className="size-4" /> Novo orçamento
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum orçamento ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2">
                    <Link
                      href={`/funil/${deal.id}/orcamento/${q.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      Orçamento #{q.numero}
                    </Link>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{QUOTE_STATUS_LABEL[q.status]}</Badge>
                      <span className="text-sm font-medium tabular-nums">
                        {formatBRL(quoteTotal(q))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarefas & follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList dealId={deal.id} tasks={tasks} />
        </CardContent>
      </Card>
    </main>
  );
}
