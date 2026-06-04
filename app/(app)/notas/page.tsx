import Link from "next/link";
import {
  ScrollText,
  CircleCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileDown,
  Settings,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { resumoCertificado } from "@/lib/nfse-gov/store";
import { sincronizarNota } from "./actions";
import { CancelarNota } from "@/components/notas/cancelar-nota";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
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

export const metadata = { title: "Notas fiscais (NFS-e)" };

type Nfse = {
  id: string;
  numero: string | null;
  status: string;
  valor_servicos: number;
  discriminacao: string | null;
  chave_acesso: string | null;
  mensagem: string | null;
  created_at: string;
  clients: { razao_social: string } | null;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  processando: { label: "Processando", tone: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25" },
  autorizada: { label: "Autorizada", tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25" },
  cancelada: { label: "Cancelada", tone: "bg-muted text-muted-foreground ring-1 ring-inset ring-border" },
  erro: { label: "Erro", tone: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25" },
};

export default async function NotasPage() {
  const ctx = await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const [{ data: notasData }, { data: tData }, cert] = await Promise.all([
    supabase
      .from("nfse")
      .select("id, numero, status, valor_servicos, discriminacao, chave_acesso, mensagem, created_at, clients(razao_social)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("tenants")
      .select("cnpj, nfse_codigo_municipio, nfse_cod_trib_nacional, nfse_aliquota_iss")
      .eq("id", ctx.tenantId)
      .maybeSingle(),
    resumoCertificado(ctx.tenantId),
  ]);

  const notas = (notasData as Nfse[] | null) ?? [];
  const t = tData as Record<string, unknown> | null;

  const configOk =
    !!cert &&
    !!t?.cnpj && !!t?.nfse_codigo_municipio &&
    !!t?.nfse_cod_trib_nacional && t?.nfse_aliquota_iss != null;

  const autorizadas = notas.filter((n) => n.status === "autorizada").length;
  const processando = notas.filter((n) => n.status === "processando").length;
  const comErro = notas.filter((n) => n.status === "erro").length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Notas fiscais (NFS-e)"
        description="Emissão de NFS-e dos serviços prestados pelo Sistema Nacional NFS-e (gov.br)."
        count={notas.length}
      />

      {!configOk && (
        <Card className="border-warning/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <div className="text-sm">
                <p className="font-medium">NFS-e ainda não está pronta para emitir</p>
                <p className="text-muted-foreground">
                  Falta {cert ? "" : "o certificado digital A1 e "}
                  os dados fiscais (CNPJ, código do município, código de tributação nacional, alíquota do ISS).
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/integracoes/nfse"><Settings className="size-4" /> Configurar</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={ScrollText} label="Notas emitidas" value={String(notas.length)} />
        <KpiCard icon={CircleCheck} label="Autorizadas" value={String(autorizadas)} tone={autorizadas > 0 ? "ok" : "default"} />
        <KpiCard icon={Clock} label="Processando" value={String(processando)} tone={processando > 0 ? "warning" : "default"} />
        <KpiCard icon={AlertTriangle} label="Com erro" value={String(comErro)} tone={comErro > 0 ? "danger" : "default"} />
      </div>

      {notas.length === 0 ? (
        <EmptyState
          title="Nenhuma NFS-e emitida"
          description="Emita a partir de uma cobrança em Financeiro › A receber."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº / Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((n) => {
                  const st = STATUS[n.status] ?? STATUS.processando;
                  return (
                    <TableRow key={n.id}>
                      <TableCell>
                        <span className="font-medium tabular-nums">{n.numero ? `#${n.numero}` : "—"}</span>
                        <span className="block text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        {n.clients?.razao_social ?? "—"}
                        {n.status === "erro" && n.mensagem && (
                          <span className="block max-w-xs truncate text-xs text-destructive">{n.mensagem}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(n.valor_servicos)}</TableCell>
                      <TableCell>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {n.status === "autorizada" && n.chave_acesso && (
                            <Button asChild variant="ghost" size="sm" title="Baixar DANFSe (PDF)">
                              <a href={`/api/notas/${n.id}/danfse`} target="_blank" rel="noopener noreferrer">
                                <FileDown className="size-4" />
                              </a>
                            </Button>
                          )}
                          {n.status === "processando" && (
                            <form action={sincronizarNota.bind(null, n.id)}>
                              <Button type="submit" variant="ghost" size="sm" title="Atualizar status"><RefreshCw className="size-4" /></Button>
                            </form>
                          )}
                          {n.status === "autorizada" && <CancelarNota id={n.id} />}
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
