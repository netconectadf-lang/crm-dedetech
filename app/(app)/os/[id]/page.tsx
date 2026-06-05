import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Trash2, Wallet, Phone, MessageCircle, MapPin, Star } from "lucide-react";

import { gerarCobrancaDaOS } from "@/app/(app)/financeiro/actions";
import { enviarNPS } from "../nps-actions";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatPhone, formatBRL, onlyDigits } from "@/lib/format";
import { rotuloCliente, nomeExibicao } from "@/lib/clientes";
import { OS_STATUS_LABEL, OS_STATUS_TONE, type OsStatus, type ApplicationMethod } from "@/lib/os";
import { StatusStepper } from "@/components/os/status-stepper";
import { OsTimeline } from "@/components/os/os-timeline";
import { OsMapaLoader } from "@/components/os/os-mapa-loader";
import { Panel } from "@/components/dashboard/kpi-card";
import type { Field } from "@/components/app/resource-form";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { OsStatusButtons } from "@/components/os/os-status-buttons";
import { FinalizeButton } from "@/components/os/finalize-button";
import { AddOsProduct } from "@/components/os/add-os-product";
import { FichaForm } from "@/components/os/ficha-form";
import { atualizarOS, excluirOS, removerProdutoOS } from "../actions";
import { PageHeader } from "@/components/app/page-header";
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

export const metadata = { title: "OS" };

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
  client_id: string;
  unit_id: string | null;
  scheduled_at: string | null;
  tecnico_id: string | null;
  vehicle_id: string | null;
  pragas: string[];
  estruturas: string[];
  metodo: ApplicationMethod | null;
  metragem_m2: number | null;
  periodo_reentrada_horas: number | null;
  garantia_meses: number;
  observacoes: string | null;
  recomendacoes: string | null;
  proxima_revisao_em: string | null;
  created_at: string;
  chegada_em: string | null;
  saida_em: string | null;
  executada_em: string | null;
  lat: number | string | null;
  lng: number | string | null;
  km_rodado: number | null;
  tempo_execucao_min: number | null;
  custo_produtos: number | null;
  custo_combustivel: number | null;
  custo_mao_obra: number | null;
  custo_total: number | null;
  clients: {
    razao_social: string;
    nome_fantasia: string | null;
    telefone: string | null;
    email: string | null;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
    contato_responsavel: string | null;
  } | null;
  employees: { nome: string } | null;
};

export default async function OsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: osData } = await supabase
    .from("service_orders")
    .select(
      "*, clients(razao_social, nome_fantasia, telefone, email, logradouro, numero, bairro, cidade, uf, contato_responsavel), employees(nome)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!osData) notFound();
  const os = osData as OS;

  const [{ data: prodLines }, { data: prodList }, { data: unitList }, { data: clientList }, { data: tecList }, { data: vehList }, { data: arData }, { data: pragaData }, { data: estruturaData }] =
    await Promise.all([
      supabase.from("service_order_products").select("id, quantidade, diluicao, products(nome_comercial)").eq("os_id", id),
      supabase.from("products").select("id, nome_comercial").eq("ativo", true).order("nome_comercial"),
      supabase.from("client_units").select("id, apelido").eq("client_id", os.client_id).order("apelido"),
      supabase.from("clients").select("id, razao_social, nome_fantasia, documento, bairro, cidade, uf, logradouro, numero").eq("ativo", true).order("razao_social"),
      supabase.from("employees").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("vehicles").select("id, placa").eq("ativo", true).order("placa"),
      supabase.from("accounts_receivable").select("valor").eq("os_id", id).neq("status", "cancelado"),
      supabase.from("pragas").select("nome").eq("ativo", true).order("nome"),
      supabase.from("estruturas").select("nome").eq("ativo", true).order("nome"),
    ]);

  const linhas = (prodLines as { id: string; quantidade: number; diluicao: string | null; products: { nome_comercial: string } | null }[] | null) ?? [];
  const produtos = (prodList as { id: string; nome_comercial: string }[] | null) ?? [];
  const unidades = (unitList as { id: string; apelido: string }[] | null) ?? [];
  const clients = (clientList as ClienteOpcao[] | null) ?? [];
  const tecnicos = (tecList as { id: string; nome: string }[] | null) ?? [];
  const veiculos = (vehList as { id: string; placa: string }[] | null) ?? [];
  const pragaOptions = ((pragaData as { nome: string }[] | null) ?? []).map((p) => p.nome);
  const estruturaOptions = ((estruturaData as { nome: string }[] | null) ?? []).map((e) => e.nome);

  const finalizada = os.status === "executada" || os.status === "faturada";
  const podeFinalizar = ["agendada", "a_caminho", "em_execucao"].includes(os.status);

  const ar = (arData as { valor: number }[] | null) ?? [];
  const receita = ar.reduce((s, a) => s + Number(a.valor), 0);
  const custoTotal = Number(os.custo_total ?? 0);
  const margem = receita - custoTotal;
  const markup = custoTotal > 0 ? Math.round((margem / custoTotal) * 100) : null;

  const editFields: Field[] = [
    { name: "client_id", label: "Cliente", type: "select", required: true, options: clients.map((c) => ({ value: c.id, label: rotuloCliente(c) })) },
    { name: "unit_id", label: "Unidade", type: "select", options: [{ value: "none", label: "—" }, ...unidades.map((u) => ({ value: u.id, label: u.apelido }))] },
    { name: "scheduled_at", label: "Agendamento", type: "date" },
    { name: "tecnico_id", label: "Técnico", type: "select", options: [{ value: "none", label: "—" }, ...tecnicos.map((t) => ({ value: t.id, label: t.nome }))] },
    { name: "vehicle_id", label: "Veículo", type: "select", options: [{ value: "none", label: "—" }, ...veiculos.map((v) => ({ value: v.id, label: v.placa }))] },
  ];

  const cli = os.clients;
  const waDigits = cli?.telefone ? onlyDigits(cli.telefone) : "";
  const waLink = waDigits
    ? `https://wa.me/${waDigits.startsWith("55") ? waDigits : `55${waDigits}`}?text=${encodeURIComponent(
        `Olá! Sobre a OS #${os.numero} da ${cli?.razao_social ?? ""}.`,
      )}`
    : null;
  const endereco = cli
    ? [
        [cli.logradouro, cli.numero].filter(Boolean).join(", "),
        cli.bairro,
        [cli.cidade, cli.uf].filter(Boolean).join("/"),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const latNum = Number(os.lat);
  const lngNum = Number(os.lng);
  const temMapa = Number.isFinite(latNum) && Number.isFinite(lngNum) && (latNum !== 0 || lngNum !== 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/os"><ArrowLeft className="size-4" /> Ordens de serviço</Link>
      </Button>

      <PageHeader
        title={`OS #${os.numero}`}
        description={nomeExibicao(os.clients)}
        action={
          <div className="flex gap-2">
            {finalizada && (
              <Button asChild variant="outline">
                <Link href={`/os/${os.id}/certificado`}><FileText className="size-4" /> Certificado</Link>
              </Button>
            )}
            {os.status === "executada" && (
              <form action={gerarCobrancaDaOS.bind(null, os.id)}>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Wallet className="size-4" /> Gerar cobrança
                </Button>
              </form>
            )}
            {finalizada && (
              <form action={enviarNPS.bind(null, os.id)}>
                <Button type="submit" variant="outline">
                  <Star className="size-4" /> Enviar NPS
                </Button>
              </form>
            )}
            <ResourceDialog
              trigger={<Button variant="outline">Editar</Button>}
              title="Editar OS"
              fields={editFields}
              defaultValues={os}
              action={atualizarOS.bind(null, os.id)}
            />
            <DeleteButton nome={`OS #${os.numero}`} action={excluirOS.bind(null, os.id)} />
          </div>
        }
      />

      {os.observacoes && (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Relato / observações
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{os.observacoes}</p>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <StatusStepper status={os.status} />
              <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${OS_STATUS_TONE[os.status]}`}>
                  {OS_STATUS_LABEL[os.status]}
                </span>
                {os.employees && <Badge variant="outline">Téc.: {os.employees.nome}</Badge>}
                {os.proxima_revisao_em && (
                  <Badge variant="outline">Revisão: {formatDate(os.proxima_revisao_em)}</Badge>
                )}
                <OsStatusButtons id={os.id} status={os.status} />
              </div>
            </CardContent>
          </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ficha de visita</CardTitle></CardHeader>
        <CardContent>
          <FichaForm
            osId={os.id}
            initial={{
              pragas: os.pragas ?? [],
              estruturas: os.estruturas ?? [],
              metodo: os.metodo,
              metragem_m2: os.metragem_m2,
              periodo_reentrada_horas: os.periodo_reentrada_horas,
              garantia_meses: os.garantia_meses,
              km_rodado: os.km_rodado,
              tempo_execucao_min: os.tempo_execucao_min,
              observacoes: os.observacoes,
              recomendacoes: os.recomendacoes,
            }}
            pragaOptions={pragaOptions}
            estruturaOptions={estruturaOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Produtos utilizados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!finalizada && <AddOsProduct osId={os.id} produtos={produtos} />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Diluição</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-4 text-center text-muted-foreground">Nenhum produto.</TableCell></TableRow>
              ) : (
                linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.products?.nome_comercial ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.quantidade}</TableCell>
                    <TableCell>{l.diluicao ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {!finalizada && (
                        <form action={removerProdutoOS.bind(null, l.id, os.id)}>
                          <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {podeFinalizar && (
            <div className="border-t pt-4">
              <FinalizeButton osId={os.id} />
              <p className="mt-2 text-xs text-muted-foreground">
                Finalizar dá baixa nos produtos por FEFO, apura o custo da OS,
                marca como executada e libera o certificado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {finalizada && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Custo da OS">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Produtos</span>
                <span className="tabular-nums">{formatBRL(os.custo_produtos)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">
                  Combustível{os.km_rodado ? ` · ${os.km_rodado} km` : ""}
                </span>
                <span className="tabular-nums">{formatBRL(os.custo_combustivel)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">
                  Mão de obra{os.tempo_execucao_min ? ` · ${os.tempo_execucao_min} min` : ""}
                </span>
                <span className="tabular-nums">{formatBRL(os.custo_mao_obra)}</span>
              </li>
              <li className="flex justify-between border-t pt-2 font-semibold">
                <span>Custo total</span>
                <span className="tabular-nums">{formatBRL(custoTotal)}</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Snapshot do momento da execução. Combustível e mão de obra dependem
              do consumo do veículo, preço do litro e custo/hora (Configurações).
            </p>
          </Panel>

          <Panel title="Margem">
            {receita > 0 ? (
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Receita (cobrança)</span>
                  <span className="tabular-nums">{formatBRL(receita)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Custo total</span>
                  <span className="tabular-nums">− {formatBRL(custoTotal)}</span>
                </li>
                <li className="flex items-center justify-between border-t pt-2 font-semibold">
                  <span>Margem</span>
                  <span className={`tabular-nums ${margem >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatBRL(margem)}
                    {markup != null && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {markup >= 0 ? "+" : ""}{markup}%
                      </span>
                    )}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                Gere a cobrança desta OS para ver a margem (receita − custo).
              </p>
            )}
          </Panel>
        </div>
      )}
        </div>

        {/* Sidebar: contato, linha do tempo e localização */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Contato do cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{nomeExibicao(cli)}</p>
              {cli?.contato_responsavel && (
                <p className="text-muted-foreground">Resp.: {cli.contato_responsavel}</p>
              )}
              {cli?.telefone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 shrink-0 text-primary" /> {formatPhone(cli.telefone)}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Linha do tempo</CardTitle></CardHeader>
            <CardContent>
              <OsTimeline
                createdAt={os.created_at}
                scheduledAt={os.scheduled_at}
                chegadaEm={os.chegada_em}
                saidaEm={os.saida_em}
                executadaEm={os.executada_em}
                proximaRevisaoEm={os.proxima_revisao_em}
              />
            </CardContent>
          </Card>

          {temMapa && (
            <Card>
              <CardHeader><CardTitle className="text-base">Localização</CardTitle></CardHeader>
              <CardContent>
                <OsMapaLoader lat={latNum} lng={lngNum} label={`OS #${os.numero}`} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
