"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { salvarMapeamentos } from "@/app/(app)/integracoes/trilogo/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SaveState } from "@/lib/crud-helpers";

export type ClienteOpcao = { id: string; label: string };
export type LinhaMapa = {
  companyId: number;
  nome: string;
  defaultClientId: string;
  tipo: "vinculado" | "sugerido" | "novo";
};

const TAG: Record<LinhaMapa["tipo"], { label: string; tone: string }> = {
  vinculado: {
    label: "Vinculado",
    tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  },
  sugerido: {
    label: "Sugerido",
    tone: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  },
  novo: {
    label: "Sem casar",
    tone: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  },
};

export function TrilogoMapa({
  clientes,
  linhas,
}: {
  clientes: ClienteOpcao[];
  linhas: LinhaMapa[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    salvarMapeamentos,
    null,
  );

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {linhas.length} unidade(s) no Trílogo. As <strong>sugeridas</strong> foram
          casadas pelo código da unidade — confira e salve.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar vínculos"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unidade no Trílogo</TableHead>
            <TableHead>Cliente no CRM</TableHead>
            <TableHead className="w-28">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => {
            const tag = TAG[l.tipo];
            return (
              <TableRow key={l.companyId}>
                <TableCell className="font-medium">
                  {l.nome}
                  <span className="block font-mono text-xs text-muted-foreground">
                    #{l.companyId}
                  </span>
                </TableCell>
                <TableCell>
                  <select
                    name={`map_${l.companyId}`}
                    defaultValue={l.defaultClientId}
                    className="w-full max-w-md rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— não vincular —</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tag.tone}`}>
                    {tag.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar vínculos"}
        </Button>
      </div>
    </form>
  );
}
