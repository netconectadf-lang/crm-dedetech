import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, Trash2, FileSignature, ClipboardList } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, type QuoteStatus } from "@/lib/funil";
import type { Field } from "@/components/app/resource-form";
import { AddItemForm } from "@/components/funil/add-item-form";
import { CopyLink } from "@/components/funil/copy-link";
import { ResourceForm } from "@/components/app/resource-form";
import {
  salvarDadosOrcamento,
  removerItem,
  marcarEnviado,
  excluirOrcamento,
} from "../../../quote-actions";
import { criarContratoDoOrcamento } from "@/app/(app)/contratos/actions";
import { criarOSDoOrcamento } from "@/app/(app)/os/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Orçamento" };

type Quote = {
  id: string;
  numero: number;
  status: QuoteStatus;
  validade: string | null;
  desconto: number;
  observacoes: string | null;
  public_token: string;
};
type Item = {
  id: string;
  descricao: string;
  quantidade: number;
  preco_unit: number;
  subtotal: number;
};

async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function OrcamentoPage({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  await requireRole(["owner", "comercial"]);
  const { id: dealId, quoteId } = await params;
  const supabase = await createClient();

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("id, numero, status, validade, desconto, observacoes, public_token")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quoteData) notFound();
  const quote = quoteData as Quote;

  const [{ data: itemsData }, { data: servicosData }, { data: produtosData }] =
    await Promise.all([
      supabase
        .from("quote_items")
        .select("id, descricao, quantidade, preco_unit, subtotal")
        .eq("quote_id", quoteId)
        .order("created_at"),
      supabase.from("services").select("id, nome, preco_base").eq("ativo", true).order("nome"),
      supabase.from("products").select("id, nome_comercial, preco_venda").eq("ativo", true).order("nome_comercial"),
    ]);

  const items = (itemsData as Item[] | null) ?? [];
  const servicos =
    (servicosData as { id: string; nome: string; preco_base: number }[] | null) ?? [];
  const produtos =
    (produtosData as { id: string; nome_comercial: string; preco_venda: number }[] | null) ?? [];

  const subtotal = items.reduce((s, i) => s + Number(i.subtotal), 0);
  const total = subtotal - Number(quote.desconto);
  const publicUrl = `${await appOrigin()}/proposta/${quote.public_token}`;

  const dadosFields: Field[] = [
    { name: "validade", label: "Validade", type: "date" },
    { name: "desconto", label: "Desconto (R$)", type: "number" },
    { name: "observacoes", label: "Observações", type: "textarea" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={`/funil/${dealId}`}>
          <ArrowLeft className="size-4" /> Voltar ao negócio
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Orçamento #{quote.numero}</h1>
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${QUOTE_STATUS_TONE[quote.status]}`}>
            {QUOTE_STATUS_LABEL[quote.status]}
          </span>
          <span className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-primary">
            {formatBRL(total)}
          </span>
        </div>
        <div className="flex gap-2">
          <form action={marcarEnviado.bind(null, quote.id)}>
            <Button type="submit" variant="outline">
              <Send className="size-4" /> Marcar enviado
            </Button>
          </form>
          {quote.status === "aceito" && (
            <>
              <form action={criarContratoDoOrcamento.bind(null, quote.id)}>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <FileSignature className="size-4" /> Gerar contrato
                </Button>
              </form>
              <form action={criarOSDoOrcamento.bind(null, quote.id)}>
                <Button type="submit" variant="outline">
                  <ClipboardList className="size-4" /> Gerar OS avulsa
                </Button>
              </form>
            </>
          )}
          <form action={excluirOrcamento.bind(null, quote.id, dealId)}>
            <Button type="submit" variant="ghost" className="text-destructive">
              <Trash2 className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddItemForm
            key={items.length}
            quoteId={quote.id}
            servicos={servicos}
            produtos={produtos}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço un.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhum item. Adicione serviços ou produtos acima.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.descricao}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(i.preco_unit)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(i.subtotal)}</TableCell>
                    <TableCell className="text-right">
                      <form action={removerItem.bind(null, i.id)}>
                        <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span className="tabular-nums">- {formatBRL(quote.desconto)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatBRL(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceForm
              fields={dadosFields}
              action={salvarDadosOrcamento.bind(null, quote.id)}
              defaultValues={quote}
              submitLabel="Salvar"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link de aprovação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Envie este link ao cliente. Ele pode aceitar ou recusar online.
            </p>
            <CopyLink url={publicUrl} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
