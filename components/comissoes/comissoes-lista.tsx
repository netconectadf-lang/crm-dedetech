"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, Trash2 } from "lucide-react";

import { marcarComissoesPagas, removerComissao } from "@/app/(app)/comissoes/actions";
import { formatBRL } from "@/lib/format";
import {
  TIPO_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ComissaoTipo,
  type ComissaoStatus,
} from "@/lib/comissoes";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ComissaoItem = {
  id: string;
  funcionario: string;
  tipo: ComissaoTipo;
  conta: string;
  cliente: string;
  base: number;
  percentual: number | null;
  valorFixo: number | null;
  valor: number;
  status: ComissaoStatus;
  data: string;
};

export function ComissoesLista({ itens }: { itens: ComissaoItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const liberadas = itens.filter((i) => i.status === "liberada");
  const [sel, setSel] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSel((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function pagar() {
    const ids = [...sel];
    if (!ids.length) return;
    start(async () => {
      const r = await marcarComissoesPagas(ids);
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? "Comissões baixadas.");
      setSel(new Set());
      router.refresh();
    });
  }
  function excluir(id: string) {
    start(async () => {
      await removerComissao(id);
      router.refresh();
    });
  }

  if (!itens.length) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhuma comissão neste filtro. Lance comissões nas contas a receber (botão “Comissões”).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {liberadas.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-500/25 bg-sky-500/5 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {sel.size} de {liberadas.length} comissão(ões) a pagar selecionada(s)
          </span>
          <Button size="sm" disabled={pending || sel.size === 0} onClick={pagar}>
            <BadgeCheck className="size-4" /> Marcar como paga
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Funcionário</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Conta / cliente</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                {i.status === "liberada" && (
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input"
                    checked={sel.has(i.id)}
                    onChange={() => toggle(i.id)}
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{i.funcionario}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{TIPO_LABEL[i.tipo]}</TableCell>
              <TableCell>
                {i.conta}
                <span className="block text-xs text-muted-foreground">{i.cliente}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                {formatBRL(i.base)}
                <span className="block text-xs">
                  {i.valorFixo != null ? "fixo" : i.percentual != null ? `${i.percentual}%` : ""}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">{formatBRL(i.valor)}</TableCell>
              <TableCell>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_TONE[i.status]}`}>
                  {STATUS_LABEL[i.status]}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {i.status !== "paga" && (
                  <Button variant="ghost" size="icon" className="text-destructive" disabled={pending} onClick={() => excluir(i.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
