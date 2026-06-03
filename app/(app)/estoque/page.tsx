import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, History, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { expiryStatus, EXPIRY_BADGE } from "@/lib/estoque";
import type { Field } from "@/components/app/resource-form";
import {
  registrarEntrada,
  registrarSaida,
  registrarPerda,
  ajustarInventario,
  excluirLote,
} from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
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

export const metadata = { title: "Estoque" };

type Batch = {
  id: string;
  product_id: string;
  lote: string | null;
  validade: string | null;
  qtd_atual: number;
  products: { nome_comercial: string } | null;
};

export default async function EstoquePage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();

  const [{ data: batchesData }, { data: prodData }] = await Promise.all([
    supabase
      .from("stock_batches")
      .select("id, product_id, lote, validade, qtd_atual, products(nome_comercial)")
      .order("validade", { ascending: true, nullsFirst: false }),
    supabase
      .from("products")
      .select("id, nome_comercial, estoque_minimo")
      .eq("ativo", true)
      .order("nome_comercial"),
  ]);

  const batches = (batchesData as Batch[] | null) ?? [];
  const produtos =
    (prodData as { id: string; nome_comercial: string; estoque_minimo: number }[] | null) ?? [];

  // saldo por produto + críticos
  const saldoPorProduto = new Map<string, number>();
  for (const b of batches) {
    saldoPorProduto.set(
      b.product_id,
      (saldoPorProduto.get(b.product_id) ?? 0) + Number(b.qtd_atual),
    );
  }
  const criticos = produtos.filter(
    (p) => (saldoPorProduto.get(p.id) ?? 0) < Number(p.estoque_minimo),
  );

  // alertas de vencimento
  const comSaldo = batches.filter((b) => Number(b.qtd_atual) > 0);
  const vencidos = comSaldo.filter((b) => expiryStatus(b.validade).tone === "vencido");
  const aVencer = comSaldo.filter((b) => {
    const t = expiryStatus(b.validade).tone;
    return t === "critico" || t === "atencao";
  });

  const prodOptions = produtos.map((p) => ({ value: p.id, label: p.nome_comercial }));

  const entradaFields: Field[] = [
    { name: "product_id", label: "Produto", type: "select", required: true, options: prodOptions },
    { name: "lote", label: "Lote" },
    { name: "validade", label: "Validade", type: "date" },
    { name: "fabricante", label: "Fabricante" },
    { name: "nf_entrada", label: "NF de entrada" },
    { name: "qtd_entrada", label: "Quantidade", type: "number", required: true },
  ];
  const saidaFields: Field[] = [
    { name: "product_id", label: "Produto", type: "select", required: true, options: prodOptions },
    { name: "quantidade", label: "Quantidade", type: "number", required: true },
    { name: "motivo", label: "Motivo / destino", full: true },
  ];

  const kpis = [
    { label: "Produtos críticos", value: criticos.length, tone: criticos.length > 0 },
    { label: "Lotes vencidos", value: vencidos.length, tone: vencidos.length > 0 },
    { label: "A vencer (90d)", value: aVencer.length, tone: aVencer.length > 0 },
    { label: "Lotes em estoque", value: comSaldo.length, tone: false },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Estoque"
        description="Lotes, validade e movimentações (saída por FEFO)."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/estoque/movimentacoes"><History className="size-4" /> Movimentações</Link>
            </Button>
            <ResourceDialog
              trigger={<Button variant="outline"><ArrowUpFromLine className="size-4" /> Saída</Button>}
              title="Registrar saída (FEFO)"
              description="O sistema consome o lote de validade mais próxima (não vencido)."
              fields={saidaFields}
              action={registrarSaida}
              submitLabel="Registrar saída"
            />
            <ResourceDialog
              trigger={<Button><ArrowDownToLine className="size-4" /> Entrada</Button>}
              title="Nova entrada (lote)"
              fields={entradaFields}
              action={registrarEntrada}
              submitLabel="Registrar entrada"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${k.tone ? "text-rose-600" : ""}`}>
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {criticos.length > 0 && (
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-700">
              <AlertTriangle className="size-4" /> Produtos abaixo do estoque mínimo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {criticos.map((p) => (
              <span key={p.id} className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">
                {p.nome_comercial} ({saldoPorProduto.get(p.id) ?? 0}/{p.estoque_minimo})
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {batches.length === 0 ? (
        <EmptyState title="Estoque vazio" description="Registre uma entrada para criar o primeiro lote." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const exp = expiryStatus(b.validade);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.products?.nome_comercial ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{b.lote ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${EXPIRY_BADGE[exp.tone]}`}>
                          {b.validade ? `${formatDate(b.validade)} · ${exp.label}` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{b.qtd_atual}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ResourceDialog
                            trigger={<Button variant="ghost" size="sm">Perda</Button>}
                            title="Registrar perda"
                            fields={[
                              { name: "quantidade", label: "Quantidade", type: "number", required: true },
                              { name: "motivo", label: "Motivo", required: true, full: true },
                            ]}
                            action={registrarPerda.bind(null, b.id, b.product_id)}
                            submitLabel="Registrar"
                          />
                          <ResourceDialog
                            trigger={<Button variant="ghost" size="sm">Inventário</Button>}
                            title="Ajuste de inventário"
                            description={`Saldo atual no sistema: ${b.qtd_atual}`}
                            fields={[
                              { name: "contado", label: "Quantidade contada", type: "number", required: true },
                              { name: "motivo", label: "Observação", full: true },
                            ]}
                            action={ajustarInventario.bind(null, b.id, b.product_id, Number(b.qtd_atual))}
                            submitLabel="Ajustar"
                          />
                          <DeleteButton nome={`lote ${b.lote ?? ""}`} action={excluirLote.bind(null, b.id)} />
                        </div>
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
