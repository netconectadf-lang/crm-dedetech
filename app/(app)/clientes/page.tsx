import Link from "next/link";
import { Plus, Pencil, MapPin } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatPhone } from "@/lib/format";
import { clienteFields } from "./fields";
import { salvarCliente, excluirCliente } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Clientes" };

type Cliente = {
  id: string;
  tipo: "PF" | "PJ";
  documento: string | null;
  razao_social: string;
  nome_fantasia: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  segmento: string | null;
  ativo: boolean;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["owner", "comercial", "operacional"]);
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .order("razao_social");
  if (q) query = query.ilike("razao_social", `%${q}%`);

  const { data } = await query;
  const clientes = (data as Cliente[] | null) ?? [];

  const novoBtn = (
    <ResourceDialog
      trigger={
        <Button>
          <Plus className="size-4" /> Novo cliente
        </Button>
      }
      title="Novo cliente"
      description="Preencha o CNPJ para puxar os dados automaticamente."
      fields={clienteFields}
      action={salvarCliente.bind(null, null)}
    />
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Clientes"
        description="Pessoas e empresas atendidas."
        action={novoBtn}
      />

      <form className="max-w-sm">
        <Input name="q" placeholder="Buscar por nome…" defaultValue={q ?? ""} />
      </form>

      {clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente"
          description={q ? "Nada encontrado para a busca." : "Cadastre o primeiro cliente."}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.razao_social}
                      {c.nome_fantasia && (
                        <span className="block text-xs text-muted-foreground">
                          {c.nome_fantasia}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatCpfCnpj(c.documento)}</TableCell>
                    <TableCell>{formatPhone(c.telefone)}</TableCell>
                    <TableCell>
                      {c.cidade ? `${c.cidade}${c.uf ? "/" + c.uf : ""}` : "—"}
                    </TableCell>
                    <TableCell className="capitalize">{c.segmento ?? "—"}</TableCell>
                    <TableCell>
                      {!c.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Unidades">
                          <Link href={`/clientes/${c.id}`}>
                            <MapPin className="size-4" />
                          </Link>
                        </Button>
                        <ResourceDialog
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                          title="Editar cliente"
                          fields={clienteFields}
                          defaultValues={c}
                          action={salvarCliente.bind(null, c.id)}
                        />
                        <DeleteButton
                          nome={c.razao_social}
                          action={excluirCliente.bind(null, c.id)}
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
    </main>
  );
}
