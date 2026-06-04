import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { ConferenciaForm } from "@/components/compras/conferencia-form";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Conferir pedido" };

type Order = {
  id: string;
  numero_pedido: string | null;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
  emitido_em: string | null;
  valor_total: number;
  parcelas: number;
  status: "rascunho" | "confirmado" | "cancelado";
};

type Item = {
  id: string;
  codigo_fornecedor: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  product_id: string | null;
  criar_novo: boolean;
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["owner", "operacional", "financeiro"]);
  const supabase = await createClient();

  const { data: orderData } = await supabase
    .from("purchase_orders")
    .select(
      "id, numero_pedido, fornecedor_nome, fornecedor_cnpj, emitido_em, valor_total, parcelas, status",
    )
    .eq("id", id)
    .maybeSingle();
  const order = orderData as Order | null;
  if (!order) notFound();

  const [{ data: itemData }, { data: prodData }] = await Promise.all([
    supabase
      .from("purchase_order_items")
      .select(
        "id, codigo_fornecedor, descricao, quantidade, valor_unitario, valor_total, product_id, criar_novo",
      )
      .eq("purchase_order_id", id)
      .order("ordem"),
    supabase
      .from("products")
      .select("id, nome_comercial")
      .eq("ativo", true)
      .order("nome_comercial"),
  ]);
  const itens = (itemData as Item[] | null) ?? [];
  const produtos =
    (prodData as { id: string; nome_comercial: string }[] | null) ?? [];

  const hoje = new Date().toISOString().slice(0, 10);
  const confirmado = order.status === "confirmado";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/compras">
            <ArrowLeft className="size-4" /> Pedidos
          </Link>
        </Button>
        <PageHeader
          title={`Pedido #${order.numero_pedido ?? "s/n"}`}
          description={`${order.fornecedor_nome ?? "Fornecedor"} · emitido ${formatDate(order.emitido_em)} · ${formatBRL(order.valor_total)}`}
          action={
            confirmado ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="size-3.5" /> Confirmado
              </Badge>
            ) : undefined
          }
        />
      </div>

      {confirmado ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6 text-sm">
            <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> Pedido já lançado no sistema.
            </p>
            <p className="text-muted-foreground">
              Produtos e estoque atualizados; {order.parcelas} parcela(s) em{" "}
              <Link href="/financeiro/pagar" className="underline">
                Contas a pagar
              </Link>
              . {itens.length} itens.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ConferenciaForm
          orderId={order.id}
          valorTotal={order.valor_total}
          itens={itens}
          produtos={produtos}
          hoje={hoje}
        />
      )}
    </main>
  );
}
