"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileStack } from "lucide-react";

import { gerarFaturamentoEmLote } from "@/app/(app)/financeiro/faturamento/actions";
import { formatBRL, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ItemFaturamento = {
  id: string; // contract_id
  cliente: string;
  titulo: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  jaFaturado: boolean;
};

export function FaturamentoLote({
  itens,
  ano,
  mes,
}: {
  itens: ItemFaturamento[];
  ano: number;
  mes: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<Set<string>>(
    () => new Set(itens.filter((i) => !i.jaFaturado).map((i) => i.id)),
  );

  const pendentes = itens.filter((i) => !i.jaFaturado);
  const totalSel = itens
    .filter((i) => sel.has(i.id))
    .reduce((s, i) => s + Number(i.valor), 0);

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleTodos() {
    setSel((prev) =>
      prev.size === pendentes.length ? new Set() : new Set(pendentes.map((i) => i.id)),
    );
  }

  function faturar() {
    const ids = [...sel];
    if (!ids.length) return;
    start(async () => {
      const r = await gerarFaturamentoEmLote(ids, ano, mes);
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? "Faturamento gerado.");
      router.refresh();
    });
  }

  if (!itens.length) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum contrato com faturamento devido neste mês.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Selecionar todos"
                className="size-4 rounded border-input"
                checked={pendentes.length > 0 && sel.size === pendentes.length}
                onChange={toggleTodos}
              />
            </TableHead>
            <TableHead>Cliente / contrato</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((i) => (
            <TableRow key={i.id} className={i.jaFaturado ? "opacity-60" : ""}>
              <TableCell>
                <input
                  type="checkbox"
                  className="size-4 rounded border-input disabled:opacity-50"
                  checked={sel.has(i.id)}
                  disabled={i.jaFaturado}
                  onChange={() => toggle(i.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {i.cliente}
                <span className="block text-xs text-muted-foreground">{i.titulo}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(i.vencimento)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatBRL(i.valor)}</TableCell>
              <TableCell>
                {i.jaFaturado ? (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    Faturado
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                    A faturar
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-sm text-muted-foreground">
          {sel.size} selecionado(s) · total <strong className="text-foreground">{formatBRL(totalSel)}</strong>
        </span>
        <Button onClick={faturar} disabled={pending || sel.size === 0}>
          <FileStack className="size-4" />
          {pending ? "Gerando…" : `Faturar ${sel.size} selecionado(s)`}
        </Button>
      </div>
    </div>
  );
}
