import Link from "next/link";
import {
  Plus,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  CalendarDays,
  Wallet,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { rotuloCliente, nomeCurto } from "@/lib/clientes";
import {
  OS_STATUS_LABEL,
  OS_STATUS_TONE,
  OS_PENDENTE,
  type OsStatus,
} from "@/lib/os";
import type { Field } from "@/components/app/resource-form";
import { criarOS } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
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

export const metadata = { title: "Ordens de serviço" };

type ClienteOpcao = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  documento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  logradouro: string | null;
  numero: string | null;
};

type OS = {
  id: string;
  numero: number;
  status: OsStatus;
  scheduled_at: string | null;
  contract_id: string | null;
  quote_id: string | null;
  observacoes: string | null;
  clients: { razao_social: string; nome_fantasia: string | null; cidade: string | null; uf: string | null } | null;
  employees: { nome: string } | null;
};

// Rótulos curtos por palavra-chave (a ordem importa: a 1ª que casar vence).
const SERVICO_REGRAS: { re: RegExp; rotulo: string }[] = [
  { re: /bebedouro/i, rotulo: "Bebedouro" },
  { re: /caixa.?d.?[áa]gua|caixa de [áa]gua/i, rotulo: "Caixa d'água" },
  { re: /descupiniz|cupim/i, rotulo: "Descupinização" },
  { re: /desratiz|roedor|\brato/i, rotulo: "Desratização" },
  { re: /dedetiz|sanitiz|desinsetiz|praga/i, rotulo: "Dedetização" },
  { re: /vazamento/i, rotulo: "Vazamento" },
  { re: /entupi|desentup|\bralo/i, rotulo: "Desentupimento" },
];

/** Reduz um tipo de serviço a um rótulo curto pelo significado. */
function rotuloServico(s: string): string {
  for (const r of SERVICO_REGRAS) if (r.re.test(s)) return r.rotulo;
  return s.split(/\s*\/\s*/)[0].trim() || s; // fallback: parte antes da "/"
}

/** Extrai "Tipo de serviço: X" das observações (OS importadas do Trílogo). */
function tipoServicoDasObs(obs: string | null): string | null {
  const m = obs?.match(/Tipo de servi[çc]o:\s*(.+)/i);
  if (!m) return null;
  // Se vier como caminho (ex: "Facilities › Dedetização › ..."), fica só a última parte.
  const partes = m[1].split(/\s*[›»>→]\s*/).filter(Boolean);
  const bruto = (partes[partes.length - 1] ?? m[1]).trim();
  return bruto ? rotuloServico(bruto) : null;
}

export default async function OsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { status } = await searchParams;
  const supabase = await createClient();

  const hoje = new Date().toISOString().slice(0, 10);
  const semanaDate = new Date();
  semanaDate.setDate(semanaDate.getDate() + 7);
  const semana = semanaDate.toISOString().slice(0, 10);

  let query = supabase
    .from("service_orders")
    .select("id, numero, status, scheduled_at, contract_id, quote_id, observacoes, clients(razao_social, nome_fantasia, cidade, uf), employees(nome)")
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  if (status) query = query.eq("status", status);

  const [{ data: osData }, { data: allOs }, { data: clientsData }, { data: tecData }, { data: vehData }] =
    await Promise.all([
      query,
      supabase.from("service_orders").select("status, scheduled_at"),
      supabase.from("clients").select("id, razao_social, nome_fantasia, documento, bairro, cidade, uf, logradouro, numero").eq("ativo", true).order("razao_social"),
      supabase.from("employees").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("vehicles").select("id, placa, modelo").eq("ativo", true).order("placa"),
    ]);

  const oss = (osData as OS[] | null) ?? [];

  // Tipo de serviço de cada OS: via o contrato ou orçamento que a originou.
  const contractIds = [...new Set(oss.map((o) => o.contract_id).filter(Boolean) as string[])];
  const quoteIds = [...new Set(oss.map((o) => o.quote_id).filter(Boolean) as string[])];
  const [{ data: ciData }, { data: qiData }] = await Promise.all([
    contractIds.length
      ? supabase.from("contract_items").select("contract_id, descricao").in("contract_id", contractIds)
      : Promise.resolve({ data: [] as { contract_id: string; descricao: string }[] }),
    quoteIds.length
      ? supabase.from("quote_items").select("quote_id, descricao").eq("kind", "servico").in("quote_id", quoteIds)
      : Promise.resolve({ data: [] as { quote_id: string; descricao: string }[] }),
  ]);
  const servContrato = new Map<string, string[]>();
  for (const it of (ciData as { contract_id: string; descricao: string }[] | null) ?? []) {
    const arr = servContrato.get(it.contract_id) ?? [];
    arr.push(it.descricao);
    servContrato.set(it.contract_id, arr);
  }
  const servQuote = new Map<string, string[]>();
  for (const it of (qiData as { quote_id: string; descricao: string }[] | null) ?? []) {
    const arr = servQuote.get(it.quote_id) ?? [];
    arr.push(it.descricao);
    servQuote.set(it.quote_id, arr);
  }
  const tipoServico = (o: OS): string => {
    const descs = o.contract_id
      ? servContrato.get(o.contract_id)
      : o.quote_id
        ? servQuote.get(o.quote_id)
        : undefined;
    if (descs && descs.length > 0) {
      return descs.length > 1 ? `${descs[0]} +${descs.length - 1}` : descs[0];
    }
    // Fallback: OS sem contrato/orçamento (ex: importadas do Trílogo) trazem o
    // tipo de serviço nas observações.
    return tipoServicoDasObs(o.observacoes) ?? "—";
  };

  const all = (allOs as { status: OsStatus; scheduled_at: string | null }[] | null) ?? [];
  const clients = (clientsData as ClienteOpcao[] | null) ?? [];
  const tecnicos = (tecData as { id: string; nome: string }[] | null) ?? [];
  const veiculos = (vehData as { id: string; placa: string; modelo: string | null }[] | null) ?? [];

  // KPIs operacionais
  const dia = (o: { scheduled_at: string | null }) => o.scheduled_at?.slice(0, 10);
  const pendente = (s: OsStatus) => OS_PENDENTE.includes(s);
  const kpiHoje = all.filter((o) => pendente(o.status) && dia(o) === hoje).length;
  const kpiAtrasadas = all.filter((o) => pendente(o.status) && dia(o) && dia(o)! < hoje).length;
  const kpiSemana = all.filter(
    (o) => pendente(o.status) && dia(o) && dia(o)! >= hoje && dia(o)! <= semana,
  ).length;
  const kpiFaturar = all.filter((o) => o.status === "executada").length;

  const fields: Field[] = [
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((c) => ({ value: c.id, label: rotuloCliente(c) })),
    },
    { name: "scheduled_at", label: "Agendamento", type: "date" },
    {
      name: "tecnico_id",
      label: "Técnico",
      type: "select",
      options: [{ value: "none", label: "—" }, ...tecnicos.map((t) => ({ value: t.id, label: t.nome }))],
    },
    {
      name: "vehicle_id",
      label: "Veículo",
      type: "select",
      options: [
        { value: "none", label: "—" },
        ...veiculos.map((v) => ({ value: v.id, label: `${v.placa}${v.modelo ? ` · ${v.modelo}` : ""}` })),
      ],
    },
  ];

  const filtros: { key: string; label: string }[] = [
    { key: "", label: "Todas" },
    ...(["agendada", "a_caminho", "em_execucao", "executada", "faturada"] as OsStatus[]).map(
      (s) => ({ key: s, label: OS_STATUS_LABEL[s] }),
    ),
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Ordens de serviço"
        description="Agende, execute e finalize os atendimentos."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Nova OS</Button>}
            title="Nova ordem de serviço"
            fields={fields}
            action={criarOS}
            submitLabel="Criar OS"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label="OS de hoje"
          value={String(kpiHoje)}
          hint="agendadas para hoje"
          href="/os"
          tone={kpiHoje > 0 ? "ok" : "default"}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Atrasadas"
          value={String(kpiAtrasadas)}
          hint={kpiAtrasadas > 0 ? "passaram da data" : "nenhuma"}
          tone={kpiAtrasadas > 0 ? "danger" : "default"}
        />
        <KpiCard
          icon={CalendarDays}
          label="Próximos 7 dias"
          value={String(kpiSemana)}
          hint="na agenda"
        />
        <KpiCard
          icon={Wallet}
          label="A faturar"
          value={String(kpiFaturar)}
          hint={kpiFaturar > 0 ? "executadas, sem cobrança" : "em dia"}
          href="/os?status=executada"
          tone={kpiFaturar > 0 ? "warning" : "default"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Button
            key={f.key}
            asChild
            size="sm"
            variant={(status ?? "") === f.key ? "default" : "outline"}
          >
            <Link href={f.key ? `/os?status=${f.key}` : "/os"}>{f.label}</Link>
          </Button>
        ))}
      </div>

      {oss.length === 0 ? (
        <EmptyState title="Nenhuma OS" description="Crie a primeira ordem de serviço." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oss.map((o) => {
                  const atrasada =
                    pendente(o.status) &&
                    !!o.scheduled_at &&
                    o.scheduled_at.slice(0, 10) < hoje;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium tabular-nums">#{o.numero}</TableCell>
                      <TableCell className="font-medium">
                        {o.clients?.nome_fantasia?.trim() || nomeCurto(o.clients?.razao_social)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.clients?.cidade ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.clients?.uf ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="block max-w-[14rem] truncate" title={tipoServico(o)}>
                          {tipoServico(o)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {o.scheduled_at ? (
                          <span
                            className={
                              atrasada
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            {new Date(o.scheduled_at).toLocaleDateString("pt-BR")}
                            {atrasada && (
                              <span className="ml-2 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive ring-1 ring-inset ring-destructive/25">
                                Atrasada
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{o.employees?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${OS_STATUS_TONE[o.status]}`}>
                          {OS_STATUS_LABEL[o.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/os/${o.id}`}><ExternalLink className="size-4" /></Link>
                        </Button>
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
