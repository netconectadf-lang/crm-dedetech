import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { BANK_TYPE_LABEL, type BankAccountType, type FinanceStatus } from "@/lib/financeiro";
import type { Field } from "@/components/app/resource-form";
import { salvarBanco, excluirBanco, salvarCentro, excluirCentro } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Financeiro" };

type Conta = { valor: number; valor_pago: number; status: FinanceStatus; pago_em: string | null };

const bankFields: Field[] = [
  { name: "nome", label: "Nome", required: true, full: true },
  { name: "tipo", label: "Tipo", type: "select", options: (Object.keys(BANK_TYPE_LABEL) as BankAccountType[]).map((k) => ({ value: k, label: BANK_TYPE_LABEL[k] })) },
  { name: "banco", label: "Banco" },
  { name: "saldo_inicial", label: "Saldo inicial (R$)", type: "number" },
  { name: "ativo", label: "Ativa", type: "switch" },
];
const centroFields: Field[] = [
  { name: "nome", label: "Nome", required: true, full: true },
  { name: "ativo", label: "Ativo", type: "switch" },
];

export default async function FinanceiroPage() {
  await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();
  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [{ data: arData }, { data: apData }, { data: banksData }, { data: ccData }] =
    await Promise.all([
      supabase.from("accounts_receivable").select("valor, valor_pago, status, pago_em"),
      supabase.from("accounts_payable").select("valor, valor_pago, status, pago_em"),
      supabase.from("bank_accounts").select("id, nome, tipo, banco, saldo_inicial, ativo").order("nome"),
      supabase.from("cost_centers").select("id, nome, ativo").order("nome"),
    ]);

  const ar = (arData as Conta[] | null) ?? [];
  const ap = (apData as Conta[] | null) ?? [];
  const banks = (banksData as { id: string; nome: string; tipo: BankAccountType; banco: string | null; saldo_inicial: number; ativo: boolean }[] | null) ?? [];
  const centros = (ccData as { id: string; nome: string; ativo: boolean }[] | null) ?? [];

  const aberto = (c: Conta) => c.status === "a_vencer" || c.status === "parcial";
  const aReceber = ar.filter(aberto).reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const aPagar = ap.filter(aberto).reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const saldoContas = banks.reduce((s, b) => s + Number(b.saldo_inicial), 0);

  const noMes = (c: Conta) => c.status === "quitado" && c.pago_em != null && c.pago_em.slice(0, 10) >= mesInicio;
  const recebidoMes = ar.filter(noMes).reduce((s, c) => s + Number(c.valor_pago), 0);
  const pagoMes = ap.filter(noMes).reduce((s, c) => s + Number(c.valor_pago), 0);
  const resultadoMes = recebidoMes - pagoMes;

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader title="Financeiro" description="Visão geral, contas e DRE do mês." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/financeiro/receber">
          <Card className="transition-colors hover:border-emerald-300">
            <CardContent className="pt-6">
              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <ArrowDownCircle className="size-3.5 text-emerald-600" /> A receber
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(aReceber)}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/financeiro/pagar">
          <Card className="transition-colors hover:border-rose-300">
            <CardContent className="pt-6">
              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <ArrowUpCircle className="size-3.5 text-rose-600" /> A pagar
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(aPagar)}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo em contas</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatBRL(saldoContas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado do mês</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${resultadoMes < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatBRL(resultadoMes)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Recebido {formatBRL(recebidoMes)} · Pago {formatBRL(pagoMes)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Contas bancárias</CardTitle>
            <ResourceDialog
              trigger={<Button size="sm"><Plus className="size-4" /> Nova</Button>}
              title="Nova conta bancária"
              fields={bankFields}
              action={salvarBanco.bind(null, null)}
            />
          </CardHeader>
          <CardContent>
            {banks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma conta.</p>
            ) : (
              <ul className="divide-y">
                {banks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2">
                    <span>
                      <span className="font-medium">{b.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{BANK_TYPE_LABEL[b.tipo]}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-sm">{formatBRL(b.saldo_inicial)}</span>
                      <ResourceDialog
                        trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                        title="Editar conta"
                        fields={bankFields}
                        defaultValues={b}
                        action={salvarBanco.bind(null, b.id)}
                      />
                      <DeleteButton nome={b.nome} action={excluirBanco.bind(null, b.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Centros de custo</CardTitle>
            <ResourceDialog
              trigger={<Button size="sm"><Plus className="size-4" /> Novo</Button>}
              title="Novo centro de custo"
              fields={centroFields}
              action={salvarCentro.bind(null, null)}
            />
          </CardHeader>
          <CardContent>
            {centros.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum centro.</p>
            ) : (
              <ul className="divide-y">
                {centros.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{c.nome}</span>
                    <div className="flex items-center gap-2">
                      <ResourceDialog
                        trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                        title="Editar centro"
                        fields={centroFields}
                        defaultValues={c}
                        action={salvarCentro.bind(null, c.id)}
                      />
                      <DeleteButton nome={c.nome} action={excluirCentro.bind(null, c.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
