"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileStack } from "lucide-react";

import {
  gerarFaturamentoEmLote,
  type FaturamentoLoteOpts,
} from "@/app/(app)/financeiro/faturamento/actions";
import { formatBRL, formatDate } from "@/lib/format";
import {
  aniversariosCompletos,
  valorReajustado,
  INDEX_LABEL,
  type AdjustmentIndex,
} from "@/lib/contratos";
import type { ChargeTipo } from "@/lib/asaas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  indice: AdjustmentIndex;
  vigenciaInicio: string; // YYYY-MM-DD
  jaFaturado: boolean;
};

type CobrancaOpcao = "nao" | ChargeTipo;

const COBRANCA_LABEL: Record<CobrancaOpcao, string> = {
  nao: "Não gerar cobrança",
  pix: "Gerar PIX",
  boleto: "Gerar boleto",
  cartao: "Gerar link de cartão",
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
  const [igpm, setIgpm] = useState("");
  const [ipca, setIpca] = useState("");
  const [cobranca, setCobranca] = useState<CobrancaOpcao>("nao");

  const igpmPct = Number(igpm.replace(",", ".")) || 0;
  const ipcaPct = Number(ipca.replace(",", ".")) || 0;

  const pendentes = itens.filter((i) => !i.jaFaturado);
  const temReajuste = itens.some((i) => i.indice === "igpm" || i.indice === "ipca");

  // valor final de cada item já com o reajuste anual aplicado (preview = servidor)
  const valorFinal = useMemo(() => {
    const pctDe = (ix: AdjustmentIndex) =>
      ix === "igpm" ? igpmPct : ix === "ipca" ? ipcaPct : 0;
    const map = new Map<string, number>();
    for (const i of itens) {
      const ciclos = aniversariosCompletos(i.vigenciaInicio, new Date(`${i.vencimento}T00:00:00`));
      map.set(i.id, valorReajustado(i.valor, ciclos, pctDe(i.indice)));
    }
    return map;
  }, [itens, igpmPct, ipcaPct]);

  const totalSel = itens
    .filter((i) => sel.has(i.id))
    .reduce((s, i) => s + (valorFinal.get(i.id) ?? i.valor), 0);

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
    const opts: FaturamentoLoteOpts = {
      reajuste: { igpm: igpmPct, ipca: ipcaPct },
      cobranca: cobranca === "nao" ? null : cobranca,
    };
    start(async () => {
      const r = await gerarFaturamentoEmLote(ids, ano, mes, opts);
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
      {/* opções: reajuste + cobrança automática */}
      <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-3">
        {temReajuste ? (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">IGP-M acumulado (% a.a.)</span>
              <Input
                inputMode="decimal"
                placeholder="ex.: 3,89"
                value={igpm}
                onChange={(e) => setIgpm(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">IPCA acumulado (% a.a.)</span>
              <Input
                inputMode="decimal"
                placeholder="ex.: 4,50"
                value={ipca}
                onChange={(e) => setIpca(e.target.value)}
              />
            </label>
          </>
        ) : (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Nenhum contrato deste mês usa reajuste por índice.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Cobrança automática</span>
          <select
            value={cobranca}
            onChange={(e) => setCobranca(e.target.value as CobrancaOpcao)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            style={{ colorScheme: "dark" }}
          >
            {(Object.keys(COBRANCA_LABEL) as CobrancaOpcao[]).map((k) => (
              <option key={k} value={k}>
                {COBRANCA_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

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
          {itens.map((i) => {
            const final = valorFinal.get(i.id) ?? i.valor;
            const reajustado = final !== i.valor;
            return (
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
                  <span className="block text-xs text-muted-foreground">
                    {i.titulo}
                    {i.indice !== "nenhum" && (
                      <span className="ml-1.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                        {INDEX_LABEL[i.indice]}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(i.vencimento)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {reajustado ? (
                    <span className="flex flex-col items-end leading-tight">
                      <span className="text-xs text-muted-foreground line-through">{formatBRL(i.valor)}</span>
                      <span className="font-medium text-emerald-300">{formatBRL(final)}</span>
                    </span>
                  ) : (
                    formatBRL(i.valor)
                  )}
                </TableCell>
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
            );
          })}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-sm text-muted-foreground">
          {sel.size} selecionado(s) · total <strong className="text-foreground">{formatBRL(totalSel)}</strong>
          {cobranca !== "nao" && (
            <span className="ml-1">· {COBRANCA_LABEL[cobranca].toLowerCase()}</span>
          )}
        </span>
        <Button onClick={faturar} disabled={pending || sel.size === 0}>
          <FileStack className="size-4" />
          {pending ? "Gerando…" : `Faturar ${sel.size} selecionado(s)`}
        </Button>
      </div>
    </div>
  );
}
