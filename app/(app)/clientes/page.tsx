import Link from "next/link";
import { Plus, Pencil, MapPin } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatPhone } from "@/lib/format";
import { descobrirRedes } from "@/lib/clientes";
import { clienteFields } from "./fields";
import { salvarCliente, excluirCliente } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { ClientesFiltros } from "@/components/clientes/filtros";
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
  searchParams: Promise<{ q?: string; uf?: string; rede?: string }>;
}) {
  await requireRole(["owner", "comercial", "operacional"]);
  const { q, uf, rede } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("clients").select("*").order("razao_social");
  const todos = (data as Cliente[] | null) ?? [];

  // redes derivadas dos nomes + opções dos filtros
  const { lista: redes, redeDe } = descobrirRedes(todos);
  const ufs = [...new Set(todos.map((c) => c.uf).filter(Boolean) as string[])].sort();

  // aplica filtros
  const termo = q?.trim().toLowerCase();
  const clientes = todos.filter((c) => {
    if (uf && c.uf !== uf) return false;
    if (rede) {
      const r = redeDe(c.razao_social, c.nome_fantasia);
      if (rede === "__sem" ? r != null : r !== rede) return false;
    }
    if (termo) {
      const alvo = `${c.razao_social} ${c.nome_fantasia ?? ""}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description="Pessoas e empresas atendidas."
        count={clientes.length}
        action={novoBtn}
      />

      <ClientesFiltros ufs={ufs} redes={redes} />

      {clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente"
          description={q || uf || rede ? "Nada encontrado para o filtro." : "Cadastre o primeiro cliente."}
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
                      {(() => {
                        const r = redeDe(c.razao_social, c.nome_fantasia);
                        return r ? <Badge variant="secondary" className="ml-2">{r}</Badge> : null;
                      })()}
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
