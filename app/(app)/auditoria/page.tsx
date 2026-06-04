import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Atividade" };

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive"> =
  {
    INSERT: "default",
    UPDATE: "secondary",
    DELETE: "destructive",
  };

const ACTION_LABEL: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
};

export default async function AuditoriaPage() {
  const ctx = await requireRole(["owner", "financeiro"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, entity, entity_id, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  const logs =
    (data as
      | {
          id: number;
          action: string;
          entity: string;
          entity_id: string | null;
          created_at: string;
        }[]
      | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Atividade recente"
        description="Registro de alterações na empresa (últimos 100 eventos)."
        count={logs.length}
      />

      <Card>
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[l.action] ?? "outline"}>
                        {ACTION_LABEL[l.action] ?? l.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.entity}
                      {l.entity_id ? `#${l.entity_id.slice(0, 8)}` : ""}
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
