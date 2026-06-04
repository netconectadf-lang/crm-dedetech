"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { confirmarPedidoAction } from "@/app/(app)/compras/actions";
import type { SaveState } from "@/lib/crud-helpers";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type Produto = { id: string; nome_comercial: string };

export function ConferenciaForm({
  orderId,
  valorTotal,
  itens,
  produtos,
  hoje,
}: {
  orderId: string;
  valorTotal: number;
  itens: Item[];
  produtos: Produto[];
  hoje: string;
}) {
  const [mapa, setMapa] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      itens.map((i) => [i.id, i.product_id ?? "novo"] as const),
    ),
  );
  const [parcelas, setParcelas] = useState(1);

  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    confirmarPedidoAction.bind(null, orderId),
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const itensJson = useMemo(
    () => JSON.stringify(itens.map((i) => ({ id: i.id, value: mapa[i.id] }))),
    [itens, mapa],
  );

  const novos = itens.filter((i) => mapa[i.id] === "novo").length;
  const valorParcela = parcelas > 0 ? valorTotal / parcelas : valorTotal;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="itens" value={itensJson} readOnly />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Itens do pedido ({itens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cód.</TableHead>
                <TableHead>Descrição (no pedido)</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Produto no sistema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((i) => {
                const novo = mapa[i.id] === "novo";
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">
                      {i.codigo_fornecedor ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{i.descricao}</TableCell>
                    <TableCell className="text-right">{i.quantidade}</TableCell>
                    <TableCell className="text-right">
                      {formatBRL(i.valor_unitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatBRL(i.valor_total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={mapa[i.id]}
                          onChange={(e) =>
                            setMapa((m) => ({ ...m, [i.id]: e.target.value }))
                          }
                          className="h-9 w-full max-w-[16rem] rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
                        >
                          <option value="novo">➕ Criar novo produto</option>
                          {produtos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome_comercial}
                            </option>
                          ))}
                        </select>
                        {novo ? (
                          <PackagePlus className="size-4 shrink-0 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            {novos > 0
              ? `${novos} item(ns) serão cadastrados como produto novo. Os demais terão o estoque atualizado.`
              : "Todos os itens casaram com produtos existentes."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="parcelas">Parcelas</Label>
            <Input
              id="parcelas"
              name="parcelas"
              type="number"
              min={1}
              max={36}
              value={parcelas}
              onChange={(e) =>
                setParcelas(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="primeiro_vencimento">1º vencimento</Label>
            <Input
              id="primeiro_vencimento"
              name="primeiro_vencimento"
              type="date"
              defaultValue={hoje}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="intervalo_dias">Intervalo (dias)</Label>
            <Input
              id="intervalo_dias"
              name="intervalo_dias"
              type="number"
              min={0}
              max={180}
              defaultValue={30}
            />
          </div>
          <div className="grid content-end gap-2">
            <Label className="flex items-center gap-2 text-sm font-normal">
              {/* fallback: desmarcado some do FormData → garante "" (false) */}
              <input type="hidden" name="atualizar_custo" value="" readOnly />
              <input
                type="checkbox"
                name="atualizar_custo"
                value="true"
                defaultChecked
                className="size-4 accent-[var(--color-primary)]"
              />
              Atualizar preço de custo
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Total{" "}
          <strong className="text-foreground">{formatBRL(valorTotal)}</strong>
          {parcelas > 1 && (
            <>
              {" "}
              · {parcelas}x de{" "}
              <strong className="text-foreground">
                {formatBRL(valorParcela)}
              </strong>
            </>
          )}
        </p>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Lançando…" : "Confirmar e lançar no sistema"}
        </Button>
      </div>
    </form>
  );
}
