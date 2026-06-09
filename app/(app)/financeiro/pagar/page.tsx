import Link from "next/link";
import { Plus, ArrowLeft, Check, Ban, ArrowUpCircle, AlertTriangle, ClipboardList } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { effectiveStatus, categoriaDespesa, PAYMENT_LABEL, RECURRENCE_LABEL, type FinanceStatus, type PaymentMethod, type Recurrence } from "@/lib/financeiro";
import { nomeCurto } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import { salvarPagar, pagar, cancelarPagar, excluirPagar } from "../actions";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
  created_at: string;
  created_by: string | null;
  created_by_nome: string | null;
  suppliers: { razao_social: string } | null;
};

const FILTROS = [
  { key: "", label: "Todas" },
  { key: "a_vencer", label: "A vencer" },
  { key: "vencido", label: "Vencidas" },
  { key: "parcial", label: "Parciais" },
  { key: "quitado", label: "Pagas" },
] as const;

export default async function PagarPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; nova?: string }>;
}) {
  await requireRole(["owner", "financeiro"]);
  const { f, nova } = await searchParams;
  const supabase = await createClient();

  const [{ data: apData }, { data: supData }, { data: ccData }, { data: banksData }] =
    await Promise.all([
      supabase
        .from("accounts_payable")
        .select("id, descricao, valor, valor_pago, vencimento, status, recorrencia, created_at, created_by, created_by_nome, suppliers(razao_social)")
        .order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id, razao_social").eq("ativo", true).order("razao_social"),
      supabase.from("cost_centers").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("bank_accounts").select("id, nome").eq("ativo", true).order("nome"),
    ]);

  const contas = (apData as AP[] | null) ?? [];

  // nome de quem cadastrou cada conta (admin client p/ ler profiles sem barrar no RLS)
  const criadorIds = [...new Set(contas.map((c) => c.created_by).filter(Boolean))] as string[];
  const { data: profsData } = criadorIds.length
    ? await createAdminClient().from("profiles").select("id, full_name").in("id", criadorIds)
    : { data: [] };
  const nomePorId = new Map<string, string>();
  for (const p of (profsData as { id: string; full_name: string | null }[] | null) ?? []) {
    if (p.full_name) nomePorId.set(p.id, p.full_name);
  }

  const suppliers = (supData as { id: string; razao_social: string }[] | null) ?? [];
  const centros = (ccData as { id: string; nome: string }[] | null) ?? [];
  const banks = (banksData as { id: string; nome: string }[] | null) ?? [];

  const abertas = contas.filter((c) => c.status === "a_vencer" || c.status === "parcial");
  const emAberto = abertas.reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const vencido = abertas
    .filter((c) => effectiveStatus(c).key === "vencido")
    .reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);

  const filtradas = f ? contas.filter((c) => effectiveStatus(c).key === f) : contas;

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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/financeiro"><ArrowLeft className="size-4" /> Financeiro</Link>
      </Button>
      <PageHeader
        title="Contas a pagar"
        description="Despesas, fornecedores e recorrências."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona Contas a pagar"
              descricao="Controle as despesas da empresa: fornecedores, recorrências e vencimentos — e registre os pagamentos."
              topicos={[
                {
                  titulo: "Criar uma despesa",
                  itens: [
                    "Nova conta — informe descrição, valor e vencimento.",
                    "Fornecedor e Centro de custo — opcionais, ajudam nos relatórios.",
                    "Recorrência — única, mensal ou anual, para contas que se repetem.",
                  ],
                },
                {
                  titulo: "Pagar e cancelar",
                  itens: [
                    "Pagar — registra o valor pago e a conta bancária; baixa parcial deixa a conta como Parcial.",
                    "Cancelar (proibido) — cancela a despesa em aberto.",
                    "Lixeira — exclui a conta.",
                  ],
                },
                {
                  titulo: "Status e filtros",
                  itens: [
                    "A vencer / Vencidas / Parciais / Pagas — use os botões para filtrar.",
                    "Em aberto e Vencido aparecem nos cards do topo.",
                    "Salários e folha lançados em Funcionários caem aqui automaticamente.",
                  ],
                },
              ]}
              dica="Acompanhe o card 'Vencido' em vermelho: são as despesas atrasadas que exigem pagamento imediato."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Nova conta</Button>}
              title="Nova conta a pagar"
              fields={createFields}
              action={salvarPagar.bind(null, null)}
              autoOpen={nova === "1"}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={ArrowUpCircle} label="Em aberto" value={formatBRL(emAberto)} hint={`${abertas.length} contas`} />
        <KpiCard icon={AlertTriangle} label="Vencido" value={formatBRL(vencido)} tone={vencido > 0 ? "danger" : "default"} hint={vencido > 0 ? "ação necessária" : "em dia"} />
        <KpiCard icon={ClipboardList} label="Total de contas" value={String(contas.length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((flt) => (
          <Button key={flt.key} asChild size="sm" variant={(f ?? "") === flt.key ? "default" : "outline"}>
            <Link href={flt.key ? `/financeiro/pagar?f=${flt.key}` : "/financeiro/pagar"}>{flt.label}</Link>
          </Button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <EmptyState title="Nada a pagar" description="Cadastre despesas e contas recorrentes." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((c) => {
                  const st = effectiveStatus(c);
                  const cat = categoriaDespesa(c.descricao);
                  const aberto = c.status === "a_vencer" || c.status === "parcial";
                  const autorNome = c.created_by_nome ?? (c.created_by ? nomePorId.get(c.created_by) ?? null : null);
                  const viaTelegram = !!c.created_by_nome;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${cat.tone}`}>
                          {cat.label}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium" title={c.descricao}>
                        {cat.curto}
                      </TableCell>
                      <TableCell
                        className="max-w-[160px] truncate text-sm text-muted-foreground"
                        title={c.suppliers?.razao_social ?? ""}
                      >
                        {c.suppliers ? nomeCurto(c.suppliers.razao_social) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(c.valor)}</TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                      </TableCell>
                      <TableCell className="max-w-[160px] text-sm text-muted-foreground">
                        {autorNome ? (
                          <span className="flex flex-col">
                            <span className="truncate" title={autorNome}>{nomeCurto(autorNome)}</span>
                            <span className={`text-[10px] ${viaTelegram ? "text-sky-400/80" : "text-muted-foreground/60"}`}>
                              {viaTelegram ? "via Telegram" : "no sistema"}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {aberto && (
                            <>
                              <ResourceDialog
                                trigger={<Button variant="ghost" size="sm" className="text-emerald-300"><Check className="size-4" /> Pagar</Button>}
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
