import Link from "next/link";
import { Download, ExternalLink, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { vencendo, daysUntil } from "@/lib/rh";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
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

export const metadata = { title: "RH" };

export default async function RhPage() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();

  const [{ data: empData }, { data: examData }, { data: epiData }, { data: absData }] =
    await Promise.all([
      supabase.from("employees").select("id, nome, cargo, responsavel_tecnico, vencimento_anuidade, ativo").eq("ativo", true).order("nome"),
      supabase.from("occupational_exams").select("employee_id, validade, data").order("data", { ascending: false }),
      supabase.from("epi_deliveries").select("employee_id, descricao, validade"),
      supabase.from("absences").select("id, employee_id, tipo, inicio, fim, status, employees(nome)").eq("status", "solicitada"),
    ]);

  const employees = (empData as { id: string; nome: string; cargo: string | null; responsavel_tecnico: boolean; vencimento_anuidade: string | null }[] | null) ?? [];
  const exams = (examData as { employee_id: string; validade: string | null; data: string }[] | null) ?? [];
  const epis = (epiData as { employee_id: string; descricao: string; validade: string | null }[] | null) ?? [];
  const pendentes = (absData as unknown as { id: string; tipo: string; inicio: string; fim: string; employees: { nome: string } | null }[] | null) ?? [];

  // última ASO por funcionário
  const lastExam = new Map<string, string | null>();
  for (const e of exams) if (!lastExam.has(e.employee_id)) lastExam.set(e.employee_id, e.validade);

  const nomeDe = (id: string) => employees.find((e) => e.id === id)?.nome ?? "—";

  const alertasRT = employees.filter((e) => e.responsavel_tecnico && vencendo(e.vencimento_anuidade, 30));
  const alertasASO = employees.filter((e) => vencendo(lastExam.get(e.id) ?? null, 30));
  const alertasEPI = epis.filter((p) => vencendo(p.validade, 30));

  const temAlerta = alertasRT.length || alertasASO.length || alertasEPI.length;

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Recursos Humanos"
        description="Ponto, ausências, EPI (NR-6) e exames ocupacionais (ASO)."
        action={
          <Button asChild variant="outline">
            <a href="/rh/folha" download><Download className="size-4" /> Exportar folha (CSV)</a>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Funcionários</p><p className="mt-1 text-2xl font-semibold tabular-nums">{employees.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">ASO a vencer</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${alertasASO.length ? "text-rose-600" : ""}`}>{alertasASO.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">EPI a vencer</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${alertasEPI.length ? "text-rose-600" : ""}`}>{alertasEPI.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Ausências pendentes</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${pendentes.length ? "text-amber-600" : ""}`}>{pendentes.length}</p></CardContent></Card>
      </div>

      {temAlerta ? (
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-amber-700"><AlertTriangle className="size-4" /> Pendências de conformidade</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {alertasRT.map((e) => (
              <p key={`rt-${e.id}`}>Anuidade do RT <strong>{e.nome}</strong> vence {formatDate(e.vencimento_anuidade)} ({daysUntil(e.vencimento_anuidade)}d)</p>
            ))}
            {alertasASO.map((e) => (
              <p key={`aso-${e.id}`}>ASO de <strong>{e.nome}</strong> vence {formatDate(lastExam.get(e.id) ?? null)}</p>
            ))}
            {alertasEPI.map((p, i) => (
              <p key={`epi-${i}`}>EPI <strong>{p.descricao}</strong> de {nomeDe(p.employee_id)} vence {formatDate(p.validade)}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {pendentes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ausências aguardando aprovação</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {pendentes.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>{a.employees?.nome} · {a.tipo} · {formatDate(a.inicio)}–{formatDate(a.fim)}</span>
                  <Badge variant="secondary">solicitada</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {employees.length === 0 ? (
        <EmptyState title="Nenhum funcionário ativo" description="Cadastre a equipe em Cadastros › Funcionários." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.cargo ?? "—"}</TableCell>
                    <TableCell>{e.responsavel_tecnico && <Badge variant="secondary">RT</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/rh/${e.id}`}><ExternalLink className="size-4" /></Link>
                      </Button>
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
