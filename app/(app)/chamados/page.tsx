import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { atualizarStatusChamado } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
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

type Req = {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  created_at: string;
  clients: { razao_social: string } | null;
};

export default async function ChamadosPage() {
  await requireRole(["owner", "comercial", "operacional"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_requests")
    .select("id, tipo, mensagem, status, created_at, clients(razao_social)")
    .order("created_at", { ascending: false });
  const reqs = (data as unknown as Req[] | null) ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader title="Chamados" description="Solicitações abertas pelos clientes no portal." />

      {reqs.length === 0 ? (
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
                {reqs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.clients?.razao_social ?? "—"}</TableCell>
                    <TableCell>{TIPO_LABEL[r.tipo] ?? r.tipo}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{r.mensagem}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {r.status !== "resolvido" && (
                        <div className="flex justify-end gap-1">
                          {r.status === "aberto" && (
                            <form action={atualizarStatusChamado.bind(null, r.id, "em_andamento")}>
                              <Button type="submit" variant="ghost" size="sm">Atender</Button>
                            </form>
                          )}
                          <form action={atualizarStatusChamado.bind(null, r.id, "resolvido")}>
                            <Button type="submit" variant="ghost" size="sm" className="text-emerald-700">Resolver</Button>
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
