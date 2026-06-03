import Link from "next/link";
import { Plus, ArrowLeft, Check, Ban } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { effectiveStatus, PAYMENT_LABEL, type FinanceStatus, type PaymentMethod } from "@/lib/financeiro";
import type { Field } from "@/components/app/resource-form";
import { salvarReceber, receber, cancelarReceber, excluirReceber } from "../actions";
import { gerarCobranca } from "../charge-actions";
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

export const metadata = { title: "Contas a receber" };

type AR = {
  id: string;
  descricao: string;
  valor: number;
  valor_pago: number;
  vencimento: string;
  status: FinanceStatus;
  forma_pagamento: PaymentMethod | null;
  clients: { razao_social: string } | null;
};

export default async function ReceberPage() {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const [{ data: arData }, { data: clientsData }, { data: banksData }] =
    await Promise.all([
      supabase
        .from("accounts_receivable")
        .select("id, descricao, valor, valor_pago, vencimento, status, forma_pagamento, clients(razao_social)")
        .order("vencimento"),
      supabase.from("clients").select("id, razao_social").eq("ativo", true).order("razao_social"),
      supabase.from("bank_accounts").select("id, nome").eq("ativo", true).order("nome"),
    ]);

  const contas = (arData as AR[] | null) ?? [];
  const clients = (clientsData as { id: string; razao_social: string }[] | null) ?? [];
  const banks = (banksData as { id: string; nome: string }[] | null) ?? [];

  const abertas = contas.filter((c) => c.status === "a_vencer" || c.status === "parcial");
  const emAberto = abertas.reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const vencido = abertas
    .filter((c) => effectiveStatus(c).key === "vencido")
    .reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);

  const createFields: Field[] = [
    { name: "client_id", label: "Cliente", type: "select", options: [{ value: "none", label: "—" }, ...clients.map((c) => ({ value: c.id, label: c.razao_social }))] },
    { name: "descricao", label: "Descrição", required: true, full: true },
    { name: "valor", label: "Valor (R$)", type: "number", required: true },
    { name: "vencimento", label: "Vencimento", type: "date", required: true },
    {
      name: "forma_pagamento",
      label: "Forma de pagamento",
      type: "select",
      options: [{ value: "none", label: "—" }, ...(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((k) => ({ value: k, label: PAYMENT_LABEL[k] }))],
    },
    { name: "observacoes", label: "Observações", type: "textarea" },
  ];
  const baixaFields: Field[] = [
    { name: "valor", label: "Valor recebido (R$)", type: "number", required: true },
    { name: "bank_account_id", label: "Conta bancária", type: "select", options: [{ value: "none", label: "—" }, ...banks.map((b) => ({ value: b.id, label: b.nome }))] },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/financeiro"><ArrowLeft className="size-4" /> Financeiro</Link>
      </Button>
      <PageHeader
        title="Contas a receber"
        description="Cobranças de clientes, OS e contratos."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Nova conta</Button>}
            title="Nova conta a receber"
            fields={createFields}
            action={salvarReceber.bind(null, null)}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Em aberto</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(emAberto)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Vencido</p><p className="mt-1 text-2xl font-semibold tabular-nums text-rose-600">{formatBRL(vencido)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Contas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{contas.length}</p></CardContent></Card>
      </div>

      {contas.length === 0 ? (
        <EmptyState title="Nada a receber" description="Cadastre cobranças ou gere a partir de uma OS." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
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
                      <TableCell>{c.clients?.razao_social ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(c.valor)}
                        {Number(c.valor_pago) > 0 && Number(c.valor_pago) < Number(c.valor) && (
                          <span className="block text-xs text-muted-foreground">pago {formatBRL(c.valor_pago)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {aberto && (
                            <>
                              <form action={gerarCobranca.bind(null, c.id, "pix")}>
                                <Button type="submit" variant="ghost" size="sm" title="Gerar cobrança PIX">PIX</Button>
                              </form>
                              <form action={gerarCobranca.bind(null, c.id, "boleto")}>
                                <Button type="submit" variant="ghost" size="sm" title="Gerar boleto">Boleto</Button>
                              </form>
                              <ResourceDialog
                                trigger={<Button variant="ghost" size="sm" className="text-emerald-700"><Check className="size-4" /> Receber</Button>}
                                title="Registrar recebimento"
                                description={`Saldo: ${formatBRL(Number(c.valor) - Number(c.valor_pago))}`}
                                fields={baixaFields}
                                action={receber.bind(null, c.id)}
                                submitLabel="Confirmar"
                              />
                              <form action={cancelarReceber.bind(null, c.id)}>
                                <Button type="submit" variant="ghost" size="icon" title="Cancelar"><Ban className="size-4" /></Button>
                              </form>
                            </>
                          )}
                          <DeleteButton nome={c.descricao} action={excluirReceber.bind(null, c.id)} />
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
