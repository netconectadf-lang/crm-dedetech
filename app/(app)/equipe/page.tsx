import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS, type AppRole } from "@/lib/types";
import { InviteForm } from "@/components/app/invite-form";
import { revokeInvitation } from "./actions";
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

export const metadata = { title: "Equipe" };

export default async function EquipePage() {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const { data: membersRaw } = await supabase
    .from("memberships")
    .select("id, role, user_id, created_at, profiles(full_name)")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at");

  const members =
    (membersRaw as
      | {
          id: string;
          role: AppRole;
          user_id: string;
          profiles: { full_name: string | null } | null;
        }[]
      | null) ?? [];

  const { data: invitesRaw } = await supabase
    .from("invitations")
    .select("id, email, role, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const invites =
    (invitesRaw as
      | { id: string; email: string; role: AppRole }[]
      | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Equipe"
        description="Convide pessoas e defina o papel de cada uma na empresa."
        count={members.length}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar membro</CardTitle>
          <CardDescription>
            A pessoa recebe um e-mail com o link de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Membros ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.profiles?.full_name ?? "—"}
                    {m.user_id === ctx.userId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (você)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Convites pendentes ({invites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[inv.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={revokeInvitation.bind(null, inv.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                        >
                          Revogar
                        </Button>
                      </form>
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
