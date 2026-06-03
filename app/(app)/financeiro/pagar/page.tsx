import Link from "next/link";
import { Plus, ArrowLeft, Check, Ban } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { effectiveStatus, PAYMENT_LABEL, RECURRENCE_LABEL, type FinanceStatus, type PaymentMethod, type Recurrence } from "@/lib/financeiro";
import type { Field } from "@/components/app/resource-form";
import { salvarPagar, pagar, cancelarPagar, excluirPagar } from "../actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
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

export const metadata = { title: "Contas a pagar" };

type AP = {
  id: string;
  descricao: string;
  valor: number;
  valor_pago: number;
  vencimento: string;
  status: FinanceStatus;
  recorrencia: Recurrence;
  suppliers: { razao_social: string } | null;
};

export default async function PagarPage() {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const [{ data: apData }, { data: supData }, { data: ccData }, { data: banksData }] =
    await Promise.all([
      supabase
        .from("accounts_payable")
        .select("id, descricao, valor, valor_pago, vencimento, status, recorrencia, suppliers(razao_social)")
        .order("vencimento"),
      supabase.from("suppliers").select("id, razao_social").eq("ativo", true).order("razao_social"),
      supabase.from("cost_centers").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("bank_accounts").select("id, nome").eq("ativo", true).order("nome"),
    ]);

  const contas = (apData as AP[] | null) ?? [];
  const suppliers = (supData as { id: string; razao_social: string }[] | null) ?? [];
  const centros = (ccData as { id: string; nome: string }[] | null) ?? [];
  const banks = (banksData as { id: string; nome: string }[] | null) ?? [];

  const abertas = contas.filter((c) => c.status === "a_vencer" || c.status === "parcial");
  const emAberto = abertas.reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const vencido = abertas
    .filter((c) => effectiveStatus(c).key === "vencido")
    .reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);

  const createFields: Field[] = [
    { name: "supplier_id", label: "Fornecedor", type: "select", options: [{ value: "none", label: "—" }, ...suppliers.map((s) => ({ value: s.id, label: s.razao_social }))] },
    { name: "cost_center_id", label: "Centro de custo", type: "select", options: [{ value: "none", label: "—" }, ...centros.map((c) => ({ value: c.id, label: c.nome }))] },
    { name: "descricao", label: "Descrição", required: true, full: true },
    { name: "valor", label: "Valor (R$)", type: "number", required: true },
    { name: "vencimento", label: "Vencimento", type: "date", required: true },
    { name: "forma_pagamento", label: "Forma", type: "select", options: [{ value: "none", label: "—" }, ...(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((k) => ({ value: k, label: PAYMENT_LABEL[k] }))] },
    { name: "recorrencia", label: "Recorrência", type: "select", options: (Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((k) => ({ value: k, label: RECURRENCE_LABEL[k] })) },
    { name: "observacoes", label: "Observações", type: "textarea" },
  ];
  const baixaFields: Field[] = [
    { name: "valor", label: "Valor pago (R$)", type: "number", required: true },
    { name: "bank_account_id", label: "Conta bancária", type: "select", options: [{ value: "none", label: "—" }, ...banks.map((b) => ({ value: b.id, label: b.nome }))] },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/financeiro"><ArrowLeft className="size-4" /> Financeiro</Link>
      </Button>
      <PageHeader
        title="Contas a pagar"
        description="Despesas, fornecedores e recorrências."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Nova conta</Button>}
            title="Nova conta a pagar"
            fields={createFields}
            action={salvarPagar.bind(null, null)}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Em aberto</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(emAberto)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Vencido</p><p className="mt-1 text-2xl font-semibold tabular-nums text-rose-600">{formatBRL(vencido)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Contas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{contas.length}</p></CardContent></Card>
      </div>

      {contas.length === 0 ? (
        <EmptyState title="Nada a pagar" description="Cadastre despesas e contas recorrentes." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((c) => {
                  const st = effectiveStatus(c);
                  const aberto = c.status === "a_vencer" || c.status === "parcial";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell>{c.suppliers?.razao_social ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(c.valor)}</TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {aberto && (
                            <>
                              <ResourceDialog
                                trigger={<Button variant="ghost" size="sm" className="text-emerald-700"><Check className="size-4" /> Pagar</Button>}
                                title="Registrar pagamento"
                                description={`Saldo: ${formatBRL(Number(c.valor) - Number(c.valor_pago))}`}
                                fields={baixaFields}
                                action={pagar.bind(null, c.id)}
                                submitLabel="Confirmar"
                              />
                              <form action={cancelarPagar.bind(null, c.id)}>
                                <Button type="submit" variant="ghost" size="icon" title="Cancelar"><Ban className="size-4" /></Button>
                              </form>
                            </>
                          )}
                          <DeleteButton nome={c.descricao} action={excluirPagar.bind(null, c.id)} />
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
