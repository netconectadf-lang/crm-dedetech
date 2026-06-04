import Link from "next/link";
import { FileDown, Eye } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { UploadPedido } from "@/components/compras/upload-pedido";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { DeleteButton } from "@/components/app/delete-button";
import { excluirPedido } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Compras / Pedidos" };

type Pedido = {
  id: string;
  numero_pedido: string | null;
  fornecedor_nome: string | null;
  emitido_em: string | null;
  valor_total: number;
  parcelas: number;
  status: "rascunho" | "confirmado" | "cancelado";
  created_at: string;
};

const STATUS: Record<Pedido["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  confirmado: { label: "Confirmado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

export default async function ComprasPage() {
  await requireRole(["owner", "operacional", "financeiro"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("purchase_orders")
    .select(
      "id, numero_pedido, fornecedor_nome, emitido_em, valor_total, parcelas, status, created_at",
    )
    .order("created_at", { ascending: false });
  const pedidos = (data as Pedido[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Compras / Pedidos"
        description="Importe o PDF do pedido do fornecedor — atualiza produtos, estoque e contas a pagar."
        count={pedidos.length}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileDown className="size-4" /> Importar pedido (PDF)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UploadPedido />
          <p className="mt-3 text-xs text-muted-foreground">
            Aceita o modelo de pedido do fornecedor (ex.: SERDI / VELO). Você
            confere os itens e ajusta o prazo de pagamento antes de confirmar.
          </p>
        </CardContent>
      </Card>

      {pedidos.length === 0 ? (
        <EmptyState
          title="Nenhum pedido importado"
          description="Envie o PDF do pedido para dar entrada automática."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">
                      #{p.numero_pedido ?? "s/n"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.fornecedor_nome ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(p.emitido_em)}</TableCell>
                    <TableCell>
                      {formatBRL(p.valor_total)}
                      {p.parcelas > 1 && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {p.parcelas}x
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS[p.status].variant}>
                        {STATUS[p.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            href={`/compras/${p.id}`}
                            aria-label="Abrir pedido"
                          >
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        {p.status === "rascunho" && (
                          <DeleteButton
                            nome={`pedido #${p.numero_pedido ?? "s/n"}`}
                            action={excluirPedido.bind(null, p.id)}
                          />
                        )}
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
