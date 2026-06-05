import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, History, AlertTriangle, Ban, CalendarDays, Boxes, Pencil } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

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
  editarLote,
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
  fabricante: string | null;
  nf_entrada: string | null;
  data_entrada: string | null;
  qtd_atual: number;
  products: { nome_comercial: string } | null;
};

export default async function EstoquePage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();

  const [{ data: batchesData }, { data: prodData }] = await Promise.all([
    supabase
      .from("stock_batches")
      .select("id, product_id, lote, validade, fabricante, nf_entrada, data_entrada, qtd_atual, products(nome_comercial)")
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
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
        <KpiCard icon={AlertTriangle} label="Produtos críticos" value={String(criticos.length)} hint={criticos.length ? "abaixo do mínimo" : "níveis ok"} tone={criticos.length ? "danger" : "cyan"} />
        <KpiCard icon={Ban} label="Lotes vencidos" value={String(vencidos.length)} hint={vencidos.length ? "descartar" : "nenhum"} tone={vencidos.length ? "danger" : "cyan"} />
        <KpiCard icon={CalendarDays} label="A vencer (90d)" value={String(aVencer.length)} hint={aVencer.length ? "girar primeiro" : "tranquilo"} tone={aVencer.length ? "warning" : "cyan"} />
        <KpiCard icon={Boxes} label="Lotes em estoque" value={String(comSaldo.length)} tone="violet" />
      </div>

      {criticos.length > 0 && (
        <Card className="border-rose-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-300">
              <AlertTriangle className="size-4" /> Produtos abaixo do estoque mínimo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {criticos.map((p) => (
              <span key={p.id} className="rounded-md bg-rose-500/10 px-2 py-1 text-rose-300">
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
                          <ResourceDialog
                            trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                            title="Editar lote"
                            description="Ajuste validade, lote, fabricante e NF. (A quantidade muda por entrada/saída/inventário.)"
                            fields={[
                              { name: "lote", label: "Lote" },
                              { name: "validade", label: "Validade", type: "date" },
                              { name: "fabricante", label: "Fabricante" },
                              { name: "nf_entrada", label: "NF de entrada" },
                              { name: "data_entrada", label: "Data de entrada", type: "date" },
                            ]}
                            defaultValues={{
                              lote: b.lote ?? "",
                              validade: b.validade ?? "",
                              fabricante: b.fabricante ?? "",
                              nf_entrada: b.nf_entrada ?? "",
                              data_entrada: b.data_entrada ?? "",
                            }}
                            action={editarLote.bind(null, b.id)}
                            submitLabel="Salvar"
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
