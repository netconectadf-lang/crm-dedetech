import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { MOVEMENT_LABEL, type MovementType } from "@/lib/estoque";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
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

export const metadata = { title: "Movimentações" };

type Movement = {
  id: string;
  tipo: MovementType;
  quantidade: number;
  motivo: string | null;
  created_at: string;
  products: { nome_comercial: string } | null;
  stock_batches: { lote: string | null } | null;
};

const VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  entrada: "default",
  saida: "secondary",
  perda: "destructive",
  ajuste: "outline",
  transferencia: "outline",
};

export default async function MovimentacoesPage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("stock_movements")
    .select("id, tipo, quantidade, motivo, created_at, products(nome_comercial), stock_batches(lote)")
    .order("created_at", { ascending: false })
    .limit(200);

  const movs = (data as Movement[] | null) ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/estoque"><ArrowLeft className="size-4" /> Estoque</Link>
      </Button>
      <PageHeader title="Movimentações" description="Histórico (últimas 200)." />

      {movs.length === 0 ? (
        <EmptyState title="Sem movimentações" />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movs.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={VARIANT[m.tipo] ?? "outline"}>
                        {MOVEMENT_LABEL[m.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.products?.nome_comercial ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {m.stock_batches?.lote ?? "—"}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${Number(m.quantidade) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {Number(m.quantidade) > 0 ? "+" : ""}
                      {m.quantidade}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.motivo ?? "—"}
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
