import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatBRL } from "@/lib/format";
import {
  ABSENCE_TYPE_LABEL,
  ABSENCE_STATUS_LABEL,
  EXAM_TYPE_LABEL,
  feriasInfo,
  formatTempoCasa,
  formatDuracao,
  formatSaldo,
  espelhoPonto,
  conformidade,
  diasEntre,
  type AbsenceType,
  type AbsenceStatus,
  type ExamType,
} from "@/lib/rh";
import type { Field } from "@/components/app/resource-form";
import { ResourceForm } from "@/components/app/resource-form";
import { PontoButton } from "@/components/rh/ponto-button";
import { solicitarAusencia, decidirAusencia, salvarEPI, salvarASO, salvarTreinamento, excluirTreinamento } from "../actions";
import { PageHeader } from "@/components/app/page-header";
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

export const metadata = { title: "Funcionário" };

export default async function RhEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "rh"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: empData } = await supabase
    .from("employees")
    .select("id, nome, cargo, responsavel_tecnico, registro_conselho, data_admissao, salario")
    .eq("id", id)
    .maybeSingle();
  if (!empData) notFound();
  const emp = empData as { id: string; nome: string; cargo: string | null; responsavel_tecnico: boolean; registro_conselho: string | null; data_admissao: string | null; salario: number | null };

  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: pontos }, { data: ausencias }, { data: epis }, { data: asos }, { data: pontoMesData }, { data: trainData }] =
    await Promise.all([
      supabase.from("time_entries").select("id, tipo, registrado_em").eq("employee_id", id).order("registrado_em", { ascending: false }).limit(10),
      supabase.from("absences").select("id, tipo, inicio, fim, status, motivo").eq("employee_id", id).order("inicio", { ascending: false }),
      supabase.from("epi_deliveries").select("id, descricao, entregue_em, validade, assinado").eq("employee_id", id).order("entregue_em", { ascending: false }),
      supabase.from("occupational_exams").select("id, tipo, data, validade, resultado").eq("employee_id", id).order("data", { ascending: false }),
      supabase.from("time_entries").select("tipo, registrado_em").eq("employee_id", id).gte("registrado_em", mesInicio),
      supabase.from("trainings").select("id, nome, categoria, instituicao, concluido_em, validade").eq("employee_id", id).order("validade", { ascending: true, nullsFirst: false }),
    ]);

  const espelho = espelhoPonto((pontoMesData as { tipo: string; registrado_em: string }[] | null) ?? []);
  const trainList = (trainData as { id: string; nome: string; categoria: string | null; instituicao: string | null; concluido_em: string | null; validade: string | null }[] | null) ?? [];

  const trainingFields: Field[] = [
    { name: "nome", label: "Treinamento / certificação", required: true, full: true },
    {
      name: "categoria",
      label: "Categoria",
      type: "select",
      options: [
        { value: "nr", label: "NR (norma regulamentadora)" },
        { value: "aplicacao_produtos", label: "Aplicação de produtos" },
        { value: "integracao", label: "Integração" },
        { value: "reciclagem", label: "Reciclagem" },
        { value: "outro", label: "Outro" },
      ],
    },
    { name: "instituicao", label: "Instituição" },
    { name: "concluido_em", label: "Concluído em", type: "date" },
    { name: "validade", label: "Validade", type: "date" },
  ];

  const ponto = (pontos as { id: string; tipo: string; registrado_em: string }[] | null) ?? [];
  const ausList = (ausencias as { id: string; tipo: AbsenceType; inicio: string; fim: string; status: AbsenceStatus; motivo: string | null }[] | null) ?? [];
  const epiList = (epis as { id: string; descricao: string; entregue_em: string; validade: string | null; assinado: boolean }[] | null) ?? [];
  const asoList = (asos as { id: string; tipo: ExamType; data: string; validade: string | null; resultado: string | null }[] | null) ?? [];

  const diasFeriasGozados = ausList
    .filter((a) => a.tipo === "ferias" && a.status === "aprovada")
    .reduce((s, a) => s + diasEntre(a.inicio, a.fim), 0);
  const ferias = feriasInfo(emp.data_admissao, diasFeriasGozados);

  const ausFields: Field[] = [
    { name: "tipo", label: "Tipo", type: "select", options: (Object.keys(ABSENCE_TYPE_LABEL) as AbsenceType[]).map((k) => ({ value: k, label: ABSENCE_TYPE_LABEL[k] })) },
    { name: "inicio", label: "Início", type: "date", required: true },
    { name: "fim", label: "Fim", type: "date", required: true },
    { name: "motivo", label: "Motivo", type: "textarea" },
  ];
  const epiFields: Field[] = [
    { name: "descricao", label: "EPI", required: true, full: true },
    { name: "entregue_em", label: "Entregue em", type: "date", required: true },
    { name: "validade", label: "Troca / validade", type: "date" },
    { name: "assinado", label: "Recebimento assinado", type: "switch" },
  ];
  const asoFields: Field[] = [
    { name: "tipo", label: "Tipo", type: "select", options: (Object.keys(EXAM_TYPE_LABEL) as ExamType[]).map((k) => ({ value: k, label: EXAM_TYPE_LABEL[k] })) },
    { name: "data", label: "Data", type: "date", required: true },
    { name: "validade", label: "Validade", type: "date" },
    { name: "resultado", label: "Resultado (apto/inapto)" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/rh"><ArrowLeft className="size-4" /> RH</Link>
      </Button>
      <PageHeader
        title={emp.nome}
        description={`${emp.cargo ?? ""}${emp.responsavel_tecnico ? ` · RT ${emp.registro_conselho ?? ""}` : ""}`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Resumo
          label="Tempo de casa"
          value={formatTempoCasa(emp.data_admissao)}
          hint={emp.data_admissao ? `desde ${formatDate(emp.data_admissao)}` : "admissão não informada"}
        />
        <Resumo
          label="Saldo de férias"
          value={ferias ? `${ferias.saldo} dias` : "—"}
          hint={ferias?.vencidas ? "⚠ vencidas — risco de dobra" : ferias ? `${ferias.diasGozados}d gozados de ${ferias.diasDireito}d` : "informe a admissão"}
          tone={ferias?.vencidas ? "danger" : undefined}
        />
        <Resumo
          label="Salário base"
          value={emp.salario ? formatBRL(Number(emp.salario)) : "—"}
          hint="usado no custeio de OS"
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ponto eletrônico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <PontoButton employeeId={emp.id} />
          {ponto.length > 0 && (
            <ul className="divide-y text-sm">
              {ponto.map((p) => (
                <li key={p.id} className="flex justify-between py-1.5">
                  <span className="capitalize">{p.tipo}</span>
                  <span className="text-muted-foreground tabular-nums">{new Date(p.registrado_em).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Espelho de ponto — mês atual</CardTitle>
            <span className="text-sm text-muted-foreground">
              Banco de horas:{" "}
              <strong className={espelho.saldoMs >= 0 ? "text-emerald-300" : "text-destructive"}>
                {formatSaldo(espelho.saldoMs)}
              </strong>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {espelho.dias.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Sem registros de ponto neste mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead className="text-right">Trabalhado</TableHead>
                    <TableHead className="text-right">Saldo (8h)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {espelho.dias.map((d) => (
                    <TableRow key={d.dia}>
                      <TableCell className="tabular-nums">{formatDate(d.dia)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{d.entrada ?? "—"}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{d.saida ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatDuracao(d.ms)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${d.saldoMs >= 0 ? "text-emerald-300" : "text-destructive"}`}>
                        {formatSaldo(d.saldoMs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Férias & ausências</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ResourceForm fields={ausFields} action={solicitarAusencia.bind(null, emp.id)} submitLabel="Registrar ausência" />
            <ul className="divide-y text-sm">
              {ausList.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>{ABSENCE_TYPE_LABEL[a.tipo]} · {formatDate(a.inicio)}–{formatDate(a.fim)}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "aprovada" ? "default" : a.status === "recusada" ? "destructive" : "secondary"}>{ABSENCE_STATUS_LABEL[a.status]}</Badge>
                    {a.status === "solicitada" && (
                      <>
                        <form action={decidirAusencia.bind(null, a.id, emp.id, "aprovada")}><Button type="submit" variant="ghost" size="sm" className="text-emerald-300">Aprovar</Button></form>
                        <form action={decidirAusencia.bind(null, a.id, emp.id, "recusada")}><Button type="submit" variant="ghost" size="sm" className="text-destructive">Recusar</Button></form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">EPI (NR-6)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ResourceForm fields={epiFields} action={salvarEPI.bind(null, emp.id)} submitLabel="Registrar entrega" />
            <ul className="divide-y text-sm">
              {epiList.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <span>{e.descricao} · {formatDate(e.entregue_em)}{e.validade ? ` → ${formatDate(e.validade)}` : ""}</span>
                  {e.assinado ? <Badge variant="secondary">assinado</Badge> : <Badge variant="outline">pendente</Badge>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Exames ocupacionais (ASO)
            <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-300">
              <ShieldAlert className="size-3.5" /> dado sensível (LGPD)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResourceForm fields={asoFields} action={salvarASO.bind(null, emp.id)} submitLabel="Registrar exame" />
          <ul className="divide-y text-sm">
            {asoList.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>{EXAM_TYPE_LABEL[a.tipo]} · {formatDate(a.data)}{a.validade ? ` → ${formatDate(a.validade)}` : ""}</span>
                {a.resultado && <Badge variant="outline">{a.resultado}</Badge>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Treinamentos & certificações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ResourceForm fields={trainingFields} action={salvarTreinamento.bind(null, emp.id)} submitLabel="Registrar treinamento" />
          {trainList.length > 0 && (
            <ul className="divide-y text-sm">
              {trainList.map((t) => {
                const c = conformidade(t.validade);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${c.dot}`} title={c.label} />
                      <span>
                        {t.nome}
                        {t.categoria ? <span className="text-muted-foreground"> · {t.categoria}</span> : null}
                        {t.validade ? <span className="text-muted-foreground"> · val. {formatDate(t.validade)}</span> : null}
                      </span>
                    </span>
                    <form action={excluirTreinamento.bind(null, t.id, emp.id)}>
                      <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Resumo({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "danger";
}) {
  return (
    <div className={`rounded-lg border p-3 ${tone === "danger" ? "border-destructive/30 bg-destructive/8" : "border-border/60 bg-muted/20"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${tone === "danger" ? "text-destructive" : ""}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
