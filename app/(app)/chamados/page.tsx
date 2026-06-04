import Link from "next/link";
import { Inbox, Clock, ThumbsUp } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { atualizarStatusChamado } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
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

export const metadata = { title: "Chamados" };

const TIPO_LABEL: Record<string, string> = {
  visita_extra: "Visita extra",
  duvida: "Dúvida",
  reclamacao: "Reclamação",
  outro: "Outro",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  aberto: "secondary",
  em_andamento: "outline",
  resolvido: "default",
};
const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

const FILTROS = [
  { key: "", label: "Todos" },
  { key: "aberto", label: "Abertos" },
  { key: "em_andamento", label: "Em andamento" },
  { key: "resolvido", label: "Resolvidos" },
] as const;

type Req = {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  created_at: string;
  clients: { razao_social: string } | null;
};

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireRole(["owner", "comercial", "operacional"]);
  const { f } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_requests")
    .select("id, tipo, mensagem, status, created_at, clients(razao_social)")
    .order("created_at", { ascending: false });
  const reqs = (data as unknown as Req[] | null) ?? [];

  const abertos = reqs.filter((r) => r.status === "aberto").length;
  const emAndamento = reqs.filter((r) => r.status === "em_andamento").length;
  const resolvidos = reqs.filter((r) => r.status === "resolvido").length;

  const filtrados = f ? reqs.filter((r) => r.status === f) : reqs;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Chamados" description="Solicitações abertas pelos clientes no portal." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Inbox} label="Abertos" value={String(abertos)} hint={abertos > 0 ? "aguardando atendimento" : "tudo atendido"} tone={abertos > 0 ? "warning" : "default"} />
        <KpiCard icon={Clock} label="Em andamento" value={String(emAndamento)} tone={emAndamento > 0 ? "ok" : "default"} />
        <KpiCard icon={ThumbsUp} label="Resolvidos" value={String(resolvidos)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((flt) => (
          <Button key={flt.key} asChild size="sm" variant={(f ?? "") === flt.key ? "default" : "outline"}>
            <Link href={flt.key ? `/chamados?f=${flt.key}` : "/chamados"}>{flt.label}</Link>
          </Button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <EmptyState title="Nenhum chamado" description="As solicitações do portal aparecem aqui." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.clients?.razao_social ?? "—"}</TableCell>
                    <TableCell>{TIPO_LABEL[r.tipo] ?? r.tipo}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{r.mensagem}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{STATUS_LABEL[r.status] ?? r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {r.status !== "resolvido" && (
                        <div className="flex justify-end gap-1">
                          {r.status === "aberto" && (
                            <form action={atualizarStatusChamado.bind(null, r.id, "em_andamento")}>
                              <Button type="submit" variant="ghost" size="sm">Atender</Button>
                            </form>
                          )}
                          <form action={atualizarStatusChamado.bind(null, r.id, "resolvido")}>
                            <Button type="submit" variant="ghost" size="sm" className="text-emerald-300">Resolver</Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
