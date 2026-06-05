import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil, ArrowLeft, FileSignature, ClipboardList, Wallet, ArrowDownCircle, Building2, Phone, MapPin, MessageCircle, type LucideIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatPhone, onlyDigits } from "@/lib/format";
import { nomeExibicao } from "@/lib/clientes";
import { PERIODICITY_MONTHS, CONTRACT_STATUS_LABEL, type ContractPeriodicity, type ContractStatus } from "@/lib/contratos";
import { OS_STATUS_LABEL, OS_STATUS_TONE, type OsStatus } from "@/lib/os";
import type { Field } from "@/components/app/resource-form";
import { salvarUnidade, excluirUnidade } from "../actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { ConvidarPortal } from "@/components/app/convidar-portal";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const unidadeFields: Field[] = [
  { name: "apelido", label: "Apelido / identificação", required: true, full: true },
  { name: "cep", label: "CEP", type: "cep" },
  { name: "logradouro", label: "Logradouro" },
  { name: "numero", label: "Número" },
  { name: "complemento", label: "Complemento" },
  { name: "bairro", label: "Bairro" },
  { name: "cidade", label: "Cidade" },
  { name: "uf", label: "UF" },
  { name: "area_m2", label: "Área (m²)", type: "number" },
  { name: "tipo_ambiente", label: "Tipo de ambiente" },
];

type Unidade = {
  id: string;
  apelido: string;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  area_m2: number | null;
  tipo_ambiente: string | null;
};

type EventoLinha = { label: string; data: string; icon: LucideIcon; href?: string };

function fmtData(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "comercial", "operacional"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clients")
    .select("id, razao_social, nome_fantasia, documento, telefone, email, contato_responsavel, logradouro, numero, bairro, cidade, uf")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) notFound();
  const c = cliente as {
    razao_social: string;
    nome_fantasia: string | null;
    documento: string | null;
    telefone: string | null;
    email: string | null;
    contato_responsavel: string | null;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
  };

  const [{ data: unitData }, { data: contractData }, { data: osData }, { data: arData }] =
    await Promise.all([
      supabase.from("client_units").select("*").eq("client_id", id).order("apelido"),
      supabase.from("contracts").select("id, titulo, valor, periodicidade, status").eq("client_id", id),
      supabase.from("service_orders").select("id, numero, status, scheduled_at").eq("client_id", id).order("scheduled_at", { ascending: false, nullsFirst: false }).limit(5),
      supabase.from("accounts_receivable").select("valor, valor_pago, status").eq("client_id", id),
    ]);

  const unidades = (unitData as Unidade[] | null) ?? [];
  const contratos = (contractData as { id: string; titulo: string; valor: number; periodicidade: ContractPeriodicity; status: ContractStatus }[] | null) ?? [];
  const ultimasOs = (osData as { id: string; numero: number; status: OsStatus; scheduled_at: string | null }[] | null) ?? [];
  const ar = (arData as { valor: number; valor_pago: number; status: string }[] | null) ?? [];

  const contratosAtivos = contratos.filter((k) => k.status === "ativo");
  const mrrCliente = contratosAtivos.reduce((s, k) => s + Number(k.valor) / PERIODICITY_MONTHS[k.periodicidade], 0);

  const waDigits = c.telefone ? onlyDigits(c.telefone) : "";
  const waLink = waDigits
    ? `https://wa.me/${waDigits.startsWith("55") ? waDigits : `55${waDigits}`}`
    : null;
  const endereco = [
    [c.logradouro, c.numero].filter(Boolean).join(", "),
    c.bairro,
    [c.cidade, c.uf].filter(Boolean).join("/"),
  ]
    .filter(Boolean)
    .join(" · ");
  const aReceber = ar
    .filter((k) => k.status === "a_vencer" || k.status === "parcial")
    .reduce((s, k) => s + (Number(k.valor) - Number(k.valor_pago)), 0);
  const totalFaturado = ar.reduce((s, k) => s + Number(k.valor_pago), 0);

  // Linha do tempo: histórico recente montado a partir das últimas OS (com data
  // de agendamento) — ordenado do mais recente para o mais antigo.
  const eventos: EventoLinha[] = (ultimasOs.filter((o) => o.scheduled_at) as { id: string; numero: number; status: OsStatus; scheduled_at: string }[])
    .map((o) => ({
      label: `OS #${o.numero} · ${OS_STATUS_LABEL[o.status]}`,
      data: o.scheduled_at,
      icon: ClipboardList,
      href: `/os/${o.id}`,
    }))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
        <Link href="/clientes">
          <ArrowLeft className="size-4" /> Clientes
        </Link>
      </Button>

      <PageHeader
        title={c.razao_social}
        description="Unidades / locais de atendimento deste cliente."
        action={
          <ResourceDialog
            trigger={
              <Button>
                <Plus className="size-4" /> Nova unidade
              </Button>
            }
            title="Nova unidade"
            fields={unidadeFields}
            action={salvarUnidade.bind(null, id, null)}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={FileSignature} label="Contratos ativos" value={String(contratosAtivos.length)} />
        <KpiCard icon={Wallet} label="MRR do cliente" value={formatBRL(mrrCliente)} tone={mrrCliente > 0 ? "ok" : "default"} />
        <KpiCard icon={ClipboardList} label="Últimas OS" value={String(ultimasOs.length)} href="/os" />
        <KpiCard icon={ArrowDownCircle} label="A receber" value={formatBRL(aReceber)} href="/financeiro/receber" tone={aReceber > 0 ? "warning" : "default"} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-5 lg:col-span-2">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Últimas ordens de serviço">
              {ultimasOs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma OS para este cliente.</p>
              ) : (
                <ul className="space-y-2">
                  {ultimasOs.map((o) => (
                    <li key={o.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                      <Link href={`/os/${o.id}`} className="font-medium hover:text-primary">
                        OS #{o.numero}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {o.scheduled_at ? new Date(o.scheduled_at).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </Link>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${OS_STATUS_TONE[o.status]}`}>
                        {OS_STATUS_LABEL[o.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Contratos">
              {contratos.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhum contrato.</p>
              ) : (
                <ul className="space-y-2">
                  {contratos.map((k) => (
                    <li key={k.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                      <Link href={`/contratos/${k.id}`} className="font-medium hover:text-primary">
                        {k.titulo}
                        <span className="ml-2 font-normal tabular-nums text-muted-foreground">{formatBRL(k.valor)}</span>
                      </Link>
                      <Badge variant={k.status === "ativo" ? "default" : k.status === "cancelado" ? "destructive" : "secondary"}>
                        {CONTRACT_STATUS_LABEL[k.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {unidades.length === 0 ? (
            <EmptyState
              title="Nenhuma unidade"
              description="Cadastre os locais onde o serviço é prestado."
            />
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Unidades / locais de atendimento</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apelido</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidades.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.apelido}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[u.logradouro, u.numero, u.bairro, u.cidade && `${u.cidade}/${u.uf}`]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </TableCell>
                        <TableCell>{u.area_m2 ? `${u.area_m2} m²` : "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <ResourceDialog
                              trigger={
                                <Button variant="ghost" size="icon">
                                  <Pencil className="size-4" />
                                </Button>
                              }
                              title="Editar unidade"
                              fields={unidadeFields}
                              defaultValues={u}
                              action={salvarUnidade.bind(null, id, u.id)}
                            />
                            <DeleteButton
                              nome={u.apelido}
                              action={excluirUnidade.bind(null, id, u.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: contato, resumo e linha do tempo */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Building2 className="size-4 shrink-0 text-primary" /> {nomeExibicao(c)}
              </p>
              {c.nome_fantasia && c.nome_fantasia.trim() && (
                <p className="text-muted-foreground">Razão social: {c.razao_social}</p>
              )}
              {c.documento && <p className="text-muted-foreground">Doc.: {c.documento}</p>}
              {c.contato_responsavel && (
                <p className="text-muted-foreground">Resp.: {c.contato_responsavel}</p>
              )}
              {c.telefone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 shrink-0 text-primary" /> {formatPhone(c.telefone)}
                </p>
              )}
              {endereco && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {endereco}
                </p>
              )}
              {waLink && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" /> Chamar no WhatsApp
                  </a>
                </Button>
              )}
              <ConvidarPortal clientId={id} />
              <p className="text-xs text-muted-foreground">
                Dê acesso self-service ao Portal do Cliente (histórico, agenda,
                financeiro e chamados).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Ordens de serviço</span>
                  <span className="tabular-nums">{ultimasOs.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Contratos ativos</span>
                  <span className="tabular-nums">{contratosAtivos.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">MRR</span>
                  <span className="tabular-nums">{formatBRL(mrrCliente)}</span>
                </li>
                <li className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Total faturado</span>
                  <span className="tabular-nums">{formatBRL(totalFaturado)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Em aberto</span>
                  <span className={`tabular-nums ${aReceber > 0 ? "text-amber-300" : ""}`}>{formatBRL(aReceber)}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Linha do tempo</CardTitle></CardHeader>
            <CardContent>
              {eventos.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Sem histórico recente.</p>
              ) : (
                <ol className="relative space-y-4">
                  {eventos.map((e, i) => {
                    const Icon = e.icon;
                    const ultimo = i === eventos.length - 1;
                    return (
                      <li key={`${e.label}-${i}`} className="relative flex gap-3">
                        {!ultimo && <span className="absolute left-[11px] top-6 h-full w-px bg-border" aria-hidden />}
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 pb-1">
                          {e.href ? (
                            <Link href={e.href} className="text-sm font-medium leading-tight hover:text-primary">
                              {e.label}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium leading-tight">{e.label}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{fmtData(e.data)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
