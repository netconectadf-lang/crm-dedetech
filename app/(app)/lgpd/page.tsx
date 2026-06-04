import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { LgpdRequestForm } from "@/components/app/lgpd-request-form";
import { resolveLgpdRequest } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "LGPD" };

const TIPO_LABEL: Record<string, string> = {
  access: "Acesso",
  portability: "Portabilidade",
  erasure: "Exclusão",
  rectification: "Retificação",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  done: "Concluída",
  rejected: "Rejeitada",
};

export default async function LgpdPage() {
  const ctx = await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("lgpd_requests")
    .select("id, tipo, status, titular_email, detalhe, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  const requests =
    (data as
      | {
          id: string;
          tipo: string;
          status: string;
          titular_email: string;
          detalhe: string | null;
          created_at: string;
        }[]
      | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="LGPD"
        description="Registre e acompanhe solicitações de titulares de dados."
        count={requests.length}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova solicitação</CardTitle>
          <CardDescription>
            Direitos do titular (acesso, portabilidade, exclusão, retificação).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LgpdRequestForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Solicitações ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma solicitação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titular</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.titular_email}</TableCell>
                    <TableCell>{TIPO_LABEL[r.tipo] ?? r.tipo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "done" ? "default" : "secondary"}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status !== "done" && (
                        <form action={resolveLgpdRequest.bind(null, r.id, true)}>
                          <Button type="submit" variant="ghost" size="sm">
                            Concluir
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
