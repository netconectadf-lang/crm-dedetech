import Link from "next/link";
import { Plus, ArrowLeft, Check, Ban, ArrowDownCircle, AlertTriangle, ClipboardList } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { effectiveStatus, PAYMENT_LABEL, type FinanceStatus, type PaymentMethod } from "@/lib/financeiro";
import { nomeExibicao, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import { salvarReceber, receber, cancelarReceber, excluirReceber } from "../actions";
import { CobrarButtons } from "@/components/financeiro/cobrar-buttons";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmitirNotaButton } from "@/components/notas/emitir-nota";
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

const FILTROS = [
  { key: "", label: "Todas" },
  { key: "a_vencer", label: "A vencer" },
  { key: "vencido", label: "Vencidas" },
  { key: "parcial", label: "Parciais" },
  { key: "quitado", label: "Quitadas" },
] as const;

export default async function ReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; nova?: string }>;
}) {
  await requireRole(["owner", "financeiro"]);
  const { f, nova } = await searchParams;
  const supabase = await createClient();

  const [{ data: arData }, { data: clientsData }, { data: banksData }] =
    await Promise.all([
      supabase
        .from("accounts_receivable")
        .select("id, descricao, valor, valor_pago, vencimento, status, forma_pagamento, clients(razao_social)")
        .order("vencimento"),
      supabase.from("clients").select(CLIENTE_OPCAO_COLS).eq("ativo", true).order("razao_social"),
      supabase.from("bank_accounts").select("id, nome").eq("ativo", true).order("nome"),
    ]);

  const contas = (arData as AR[] | null) ?? [];
  const clients = (clientsData as ClienteOpcao[] | null) ?? [];
  const banks = (banksData as { id: string; nome: string }[] | null) ?? [];

  // Última cobrança (fatura/PIX) gerada por conta — pra mostrar o link na linha
  const arIds = contas.map((c) => c.id);
  const { data: chargesData } = arIds.length
    ? await supabase
        .from("charges")
        .select("ar_id, invoice_url, pix_payload, created_at")
        .in("ar_id", arIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const faturaPorAr = new Map<string, { invoiceUrl: string | null; pixPayload: string | null }>();
  for (const ch of (chargesData as { ar_id: string; invoice_url: string | null; pix_payload: string | null }[] | null) ?? []) {
    if (ch.invoice_url && !faturaPorAr.has(ch.ar_id)) {
      faturaPorAr.set(ch.ar_id, { invoiceUrl: ch.invoice_url, pixPayload: ch.pix_payload });
    }
  }

  const abertas = contas.filter((c) => c.status === "a_vencer" || c.status === "parcial");
  const emAberto = abertas.reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);
  const vencido = abertas
    .filter((c) => effectiveStatus(c).key === "vencido")
    .reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0);

  const filtradas = f ? contas.filter((c) => effectiveStatus(c).key === f) : contas;

  const createFields: Field[] = [
    { name: "client_id", label: "Cliente", type: "select", options: [{ value: "none", label: "—" }, ...clients.map((c) => ({ value: c.id, label: nomeExibicao(c) }))] },
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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/financeiro"><ArrowLeft className="size-4" /> Financeiro</Link>
      </Button>
      <PageHeader
        title="Contas a receber"
        description="Cobranças de clientes, OS e contratos."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona Contas a receber"
              descricao="Controle as cobranças dos clientes: o que está a vencer, vencido, parcial ou quitado — e registre os recebimentos."
              topicos={[
                {
                  titulo: "Criar uma cobrança",
                  itens: [
                    "Nova conta — informe cliente, descrição, valor e vencimento.",
                    "Forma de pagamento — opcional (PIX, boleto, cartão…).",
                    "Cobranças também são geradas automaticamente a partir de OS e contratos.",
                  ],
                },
                {
                  titulo: "Receber e cobrar",
                  itens: [
                    "Receber — registra o valor recebido e a conta bancária; baixa parcial deixa a conta como Parcial.",
                    "PIX / Boleto / Cartão — geram a cobrança no Asaas e enviam o link ao cliente (conecte a conta em Integrações ▸ Pagamentos).",
                    "Emitir nota — gera a nota fiscal daquela conta.",
                    "Cancelar (proibido) — cancela a cobrança em aberto.",
                  ],
                },
                {
                  titulo: "Status e filtros",
                  itens: [
                    "A vencer / Vencidas / Parciais / Quitadas — use os botões para filtrar.",
                    "Em aberto e Vencido aparecem nos cards do topo.",
                  ],
                },
              ]}
              dica="Acompanhe o card 'Vencido' em vermelho: são as cobranças que passaram do prazo e precisam de ação."
            />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Nova conta</Button>}
              title="Nova conta a receber"
              fields={createFields}
              action={salvarReceber.bind(null, null)}
              autoOpen={nova === "1"}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={ArrowDownCircle} label="Em aberto" value={formatBRL(emAberto)} hint={`${abertas.length} contas`} />
        <KpiCard icon={AlertTriangle} label="Vencido" value={formatBRL(vencido)} tone={vencido > 0 ? "danger" : "default"} hint={vencido > 0 ? "ação necessária" : "em dia"} />
        <KpiCard icon={ClipboardList} label="Total de contas" value={String(contas.length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((flt) => (
          <Button key={flt.key} asChild size="sm" variant={(f ?? "") === flt.key ? "default" : "outline"}>
            <Link href={flt.key ? `/financeiro/receber?f=${flt.key}` : "/financeiro/receber"}>{flt.label}</Link>
          </Button>
        ))}
      </div>

      {filtradas.length === 0 ? (
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
                {filtradas.map((c) => {
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
                              <CobrarButtons arId={c.id} existing={faturaPorAr.get(c.id)} />
                              <ResourceDialog
                                trigger={<Button variant="ghost" size="sm" className="text-emerald-300"><Check className="size-4" /> Receber</Button>}
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
                          <EmitirNotaButton arId={c.id} />
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
