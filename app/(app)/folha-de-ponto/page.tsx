import { MapPin, Clock, Users, CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDuracao } from "@/lib/rh";
import { PageHeader } from "@/components/app/page-header";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Folha de ponto" };

type Emp = { id: string; nome: string; cargo: string | null };
type Ponto = {
  employee_id: string;
  tipo: "entrada" | "saida";
  registrado_em: string;
};

function fmtDataHora(d: string): string {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FolhaDePontoPage() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();

  const agora = new Date();
  const mesInicio = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const nomeMes = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const [{ data: empData }, { data: pontoData }] = await Promise.all([
    supabase.from("employees").select("id, nome, cargo").eq("ativo", true).order("nome"),
    supabase
      .from("time_entries")
      .select("employee_id, tipo, registrado_em")
      .gte("registrado_em", mesInicio)
      .order("registrado_em", { ascending: false }),
  ]);

  const employees = (empData as Emp[] | null) ?? [];
  const pontos = (pontoData as Ponto[] | null) ?? [];
  const nomeDe = (id: string) => employees.find((e) => e.id === id)?.nome ?? "—";

  // pares entrada→saída por funcionário + em campo + último registro
  const byEmp = new Map<string, { tipo: "entrada" | "saida"; ts: number }[]>();
  for (const p of pontos) {
    const arr = byEmp.get(p.employee_id) ?? [];
    arr.push({ tipo: p.tipo, ts: new Date(p.registrado_em).getTime() });
    byEmp.set(p.employee_id, arr);
  }
  const horasMs = new Map<string, number>();
  const ultimo = new Map<string, number>();
  const emCampo = new Set<string>();
  for (const [emp, arr] of byEmp) {
    arr.sort((a, b) => a.ts - b.ts);
    let aberto: number | null = null;
    let ms = 0;
    for (const e of arr) {
      if (e.tipo === "entrada") aberto = e.ts;
      else if (e.tipo === "saida" && aberto != null) { ms += e.ts - aberto; aberto = null; }
    }
    horasMs.set(emp, ms);
    ultimo.set(emp, arr[arr.length - 1].ts);
    if (arr.length && arr[arr.length - 1].tipo === "entrada") emCampo.add(emp);
  }

  const totalMs = [...horasMs.values()].reduce((s, v) => s + v, 0);
  const comPonto = byEmp.size;

  // funcionários ordenados: em campo primeiro, depois por horas desc
  const linhas = [...employees].sort((a, b) => {
    const ca = emCampo.has(a.id) ? 1 : 0;
    const cb = emCampo.has(b.id) ? 1 : 0;
    if (ca !== cb) return cb - ca;
    return (horasMs.get(b.id) ?? 0) - (horasMs.get(a.id) ?? 0);
  });

  const recentes = pontos.slice(0, 30);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Folha de ponto"
        description={`Registros de entrada e saída da equipe — ${nomeMes}.`}
        action={
          <AjudaTela
            titulo="Como funciona a Folha de ponto"
            descricao="O espelho de ponto da sua equipe no mês, a partir dos check-ins de entrada e saída registrados pelo app."
            topicos={[
              {
                titulo: "Os números do topo",
                itens: [
                  "Em campo agora — funcionários com ponto de entrada aberto (sem saída registrada).",
                  "Com ponto no mês — quantos bateram ponto neste mês.",
                  "Horas no mês — soma das horas trabalhadas de toda a equipe.",
                ],
              },
              {
                titulo: "Como as horas são calculadas",
                itens: [
                  "Pares entrada → saída — cada entrada é fechada pela próxima saída; a diferença vira horas trabalhadas.",
                  "Ponto aberto — quem tem entrada sem saída aparece como “em campo” e ainda não soma o período atual.",
                  "Registro pelo app — os pontos vêm dos check-ins do técnico em campo (com GPS).",
                ],
              },
            ]}
            dica="As horas consideram apenas pares completos (entrada + saída). Ponto aberto entra na conta quando a saída for registrada."
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={MapPin}
          label="Em campo agora"
          value={String(emCampo.size)}
          hint={emCampo.size > 0 ? "com ponto aberto" : "ninguém registrado"}
          tone={emCampo.size > 0 ? "ok" : "emerald"}
        />
        <KpiCard icon={Users} label="Com ponto no mês" value={`${comPonto}/${employees.length}`} tone="sky" />
        <KpiCard icon={Clock} label="Horas no mês" value={formatDuracao(totalMs)} tone="violet" />
      </div>

      {employees.length === 0 ? (
        <EmptyState title="Nenhum funcionário ativo" description="Cadastre a equipe em Funcionários." />
      ) : (
        <Panel title="Horas por funcionário" accent="rose">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Horas no mês</TableHead>
                <TableHead>Último registro</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{e.cargo ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {horasMs.has(e.id) ? formatDuracao(horasMs.get(e.id)!) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ultimo.has(e.id) ? fmtDataHora(new Date(ultimo.get(e.id)!).toISOString()) : "—"}
                  </TableCell>
                  <TableCell>
                    {emCampo.has(e.id) && (
                      <Badge className="bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                        em campo
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {recentes.length > 0 && (
        <Panel title="Registros recentes" accent="sky">
          <div className="divide-y divide-border/60">
            {recentes.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{nomeDe(p.employee_id)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      p.tipo === "entrada"
                        ? "border-emerald-500/30 text-emerald-300"
                        : "border-amber-500/30 text-amber-300"
                    }
                  >
                    {p.tipo === "entrada" ? "Entrada" : "Saída"}
                  </Badge>
                  <span className="tabular-nums text-muted-foreground">{fmtDataHora(p.registrado_em)}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </main>
  );
}
