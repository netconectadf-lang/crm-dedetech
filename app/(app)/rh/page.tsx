import Link from "next/link";
import {
  Download,
  ExternalLink,
  AlertTriangle,
  UsersRound,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Wallet,
  Clock,
  Cake,
  Plane,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatBRL } from "@/lib/format";
import {
  vencendo,
  daysUntil,
  conformidade,
  formatDuracao,
  mesesDesde,
  aniversarianteEsteMes,
  diasEntre,
  feriasInfo,
  ABSENCE_TYPE_LABEL,
  type AbsenceType,
} from "@/lib/rh";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Conformidade" };

type Emp = {
  id: string;
  nome: string;
  cargo: string | null;
  responsavel_tecnico: boolean;
  vencimento_anuidade: string | null;
  salario: number | null;
  data_admissao: string | null;
  nascimento: string | null;
};

export default async function RhPage() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();

  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: empData }, { data: examData }, { data: epiData }, { data: absData }, { data: pontoData }, { data: feriasData }, { data: absMesData }, { data: trainData }] =
    await Promise.all([
      supabase.from("employees").select("id, nome, cargo, responsavel_tecnico, vencimento_anuidade, salario, data_admissao, nascimento, ativo").eq("ativo", true).order("nome"),
      supabase.from("occupational_exams").select("employee_id, validade, data").order("data", { ascending: false }),
      supabase.from("epi_deliveries").select("employee_id, descricao, validade"),
      supabase.from("absences").select("id, employee_id, tipo, inicio, fim, status, employees(nome)").eq("status", "solicitada"),
      supabase.from("time_entries").select("employee_id, tipo, registrado_em").gte("registrado_em", mesInicio),
      supabase.from("absences").select("employee_id, inicio, fim").eq("tipo", "ferias").eq("status", "aprovada"),
      supabase.from("absences").select("inicio, fim").in("tipo", ["falta", "atestado"]).gte("inicio", mesInicio.slice(0, 10)),
      supabase.from("trainings").select("employee_id, nome, validade"),
    ]);

  const employees = (empData as Emp[] | null) ?? [];
  const exams = (examData as { employee_id: string; validade: string | null; data: string }[] | null) ?? [];
  const epis = (epiData as { employee_id: string; descricao: string; validade: string | null }[] | null) ?? [];
  const pendentes = (absData as unknown as { id: string; employee_id: string; tipo: AbsenceType; inicio: string; fim: string; employees: { nome: string } | null }[] | null) ?? [];
  const pontos = (pontoData as { employee_id: string; tipo: "entrada" | "saida"; registrado_em: string }[] | null) ?? [];

  // última ASO por funcionário (lista já vem desc por data)
  const lastExam = new Map<string, string | null>();
  for (const e of exams) if (!lastExam.has(e.employee_id)) lastExam.set(e.employee_id, e.validade);

  // EPI mais urgente por funcionário
  const epiValidades = new Map<string, string[]>();
  const epiQtd = new Map<string, number>();
  for (const e of epis) {
    epiQtd.set(e.employee_id, (epiQtd.get(e.employee_id) ?? 0) + 1);
    if (e.validade) epiValidades.set(e.employee_id, [...(epiValidades.get(e.employee_id) ?? []), e.validade]);
  }
  const epiUrgente = (empId: string): string | null | undefined => {
    const vs = epiValidades.get(empId);
    if (vs && vs.length) return [...vs].sort()[0]; // mais próxima
    return epiQtd.get(empId) ? "9999-12-31" : undefined; // tem EPI sem validade = ok; sem EPI = sem registro
  };

  // ponto do mês: pares entrada→saída por funcionário + quem está em campo
  const byEmp = new Map<string, { tipo: "entrada" | "saida"; ts: number }[]>();
  for (const p of pontos) {
    const arr = byEmp.get(p.employee_id) ?? [];
    arr.push({ tipo: p.tipo, ts: new Date(p.registrado_em).getTime() });
    byEmp.set(p.employee_id, arr);
  }
  const horasMs = new Map<string, number>();
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
    if (arr.length && arr[arr.length - 1].tipo === "entrada") emCampo.add(emp);
  }

  // Férias gozadas (dias) por funcionário → saldo CLT
  const feriasGozadas = (feriasData as { employee_id: string; inicio: string; fim: string }[] | null) ?? [];
  const gozadasPorEmp = new Map<string, number>();
  for (const f of feriasGozadas)
    gozadasPorEmp.set(f.employee_id, (gozadasPorEmp.get(f.employee_id) ?? 0) + diasEntre(f.inicio, f.fim));
  const feriasDe = (e: Emp) => feriasInfo(e.data_admissao, gozadasPorEmp.get(e.id) ?? 0);

  // Indicadores de pessoas
  const absMes = (absMesData as { inicio: string; fim: string }[] | null) ?? [];
  const custoFolha = employees.reduce((s, e) => s + Number(e.salario ?? 0), 0);
  const mesesCasa = employees.map((e) => mesesDesde(e.data_admissao)).filter((m): m is number => m != null);
  const tempoMedioMeses = mesesCasa.length ? Math.round(mesesCasa.reduce((a, b) => a + b, 0) / mesesCasa.length) : 0;
  const tempoMedioLabel = tempoMedioMeses >= 12 ? `${Math.floor(tempoMedioMeses / 12)}a ${tempoMedioMeses % 12}m` : `${tempoMedioMeses}m`;
  const aniversariantes = employees.filter((e) => aniversarianteEsteMes(e.nascimento));
  const diasAusentesMes = absMes.reduce((s, a) => s + diasEntre(a.inicio, a.fim), 0);
  const absenteismoPct = employees.length ? Math.round((diasAusentesMes / (employees.length * 22)) * 100) : 0;

  const alertasRT = employees.filter((e) => e.responsavel_tecnico && vencendo(e.vencimento_anuidade, 30));
  const alertasASO = employees.filter((e) => vencendo(lastExam.get(e.id) ?? null, 30));
  const alertasEPI = epis.filter((p) => vencendo(p.validade, 30));
  const alertasFerias = employees.filter((e) => feriasDe(e)?.vencidas);
  const treinos = (trainData as { employee_id: string; nome: string; validade: string | null }[] | null) ?? [];
  const alertasTrein = treinos.filter((t) => vencendo(t.validade, 30));
  const nomeDe = (id: string) => employees.find((e) => e.id === id)?.nome ?? "—";
  const temAlerta = alertasRT.length || alertasASO.length || alertasEPI.length || alertasFerias.length || alertasTrein.length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Conformidade"
        description="Ausências, EPI (NR-6), exames ocupacionais (ASO) e anuidade do RT."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funciona a Conformidade do RH"
              descricao="Acompanhe ASO, EPI, anuidade do RT, ponto em campo e ausências da equipe num só painel."
              topicos={[
                {
                  titulo: "Ler os alertas",
                  itens: [
                    "Os cards do topo mostram funcionários ativos, quem está em campo agora (ponto aberto), ASO a vencer e ausências pendentes.",
                    "O bloco 'Pendências de conformidade' lista o que vence em até 30 dias: anuidade de RT, ASO e EPI.",
                    "Clique em qualquer alerta para abrir a ficha do funcionário e resolver.",
                  ],
                },
                {
                  titulo: "Aprovar ausências",
                  itens: [
                    "Folgas, férias e atestados solicitados aparecem em 'Ausências aguardando aprovação'.",
                    "Clique na ausência para abrir a ficha e aprovar ou recusar.",
                  ],
                },
                {
                  titulo: "Matriz e horas",
                  itens: [
                    "A matriz mostra a situação de ASO, EPI e RT de cada um, com horas trabalhadas no mês (somadas pelos pares entrada→saída do ponto).",
                    "Use o botão de abrir (seta) para ir à ficha completa.",
                    "Exporte tudo em 'Exportar folha (CSV)' para a contabilidade.",
                  ],
                },
              ]}
              dica="Os pontos coloridos seguem semáforo: verde = em dia, amarelo = vencendo, vermelho = vencido ou sem registro."
            />
            <Button asChild variant="outline">
              <a href="/rh/folha" download><Download className="size-4" /> Exportar folha (CSV)</a>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={UsersRound} label="Funcionários" value={String(employees.length)} hint="ativos" tone="sky" />
        <KpiCard icon={MapPin} label="Em campo agora" value={String(emCampo.size)} hint={emCampo.size > 0 ? "com ponto aberto" : "ninguém registrado"} tone={emCampo.size > 0 ? "ok" : "emerald"} />
        <KpiCard icon={AlertTriangle} label="ASO a vencer" value={String(alertasASO.length)} tone={alertasASO.length ? "danger" : "emerald"} hint={alertasASO.length ? "exigem ação" : "em dia"} />
        <KpiCard icon={CalendarDays} label="Ausências pendentes" value={String(pendentes.length)} tone={pendentes.length ? "warning" : "emerald"} hint={pendentes.length ? "aguardando você" : "nada pendente"} />
      </div>

      {/* Indicadores de pessoas */}
      <Panel title="Indicadores de pessoas" accent="sky">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador icon={Wallet} label="Custo de folha" value={formatBRL(custoFolha)} hint="salários base/mês" />
          <Indicador icon={Clock} label="Tempo médio de casa" value={tempoMedioLabel} hint="da equipe ativa" />
          <Indicador
            icon={Cake}
            label="Aniversariantes do mês"
            value={String(aniversariantes.length)}
            hint={aniversariantes.length ? aniversariantes.map((a) => a.nome.split(" ")[0]).join(", ") : "ninguém este mês"}
          />
          <Indicador icon={Plane} label="Absenteísmo" value={`${absenteismoPct}%`} hint={`${diasAusentesMes} dia(s) de falta/atestado no mês`} />
        </div>
      </Panel>

      {/* Conformidade — alertas acionáveis */}
      {temAlerta ? (
        <Panel title="Pendências de conformidade">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {alertasRT.map((e) => (
              <Link key={`rt-${e.id}`} href={`/rh/${e.id}`} className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm transition-colors hover:bg-destructive/12">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <span>Anuidade RT <strong>{e.nome}</strong> · {daysUntil(e.vencimento_anuidade)}d</span>
              </Link>
            ))}
            {alertasASO.map((e) => (
              <Link key={`aso-${e.id}`} href={`/rh/${e.id}`} className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm transition-colors hover:bg-destructive/12">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <span>ASO <strong>{e.nome}</strong> · {formatDate(lastExam.get(e.id) ?? null)}</span>
              </Link>
            ))}
            {alertasEPI.map((p, i) => (
              <Link key={`epi-${i}`} href={`/rh/${p.employee_id}`} className="flex items-center gap-2 rounded-lg border border-warning/25 bg-warning/8 px-3 py-2 text-sm transition-colors hover:bg-warning/12">
                <AlertTriangle className="size-4 shrink-0 text-warning" />
                <span>EPI <strong>{p.descricao}</strong> · {nomeDe(p.employee_id)}</span>
              </Link>
            ))}
            {alertasFerias.map((e) => (
              <Link key={`fer-${e.id}`} href={`/rh/${e.id}`} className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm transition-colors hover:bg-destructive/12">
                <Plane className="size-4 shrink-0 text-destructive" />
                <span>Férias vencidas <strong>{e.nome}</strong> · {feriasDe(e)!.saldo}d (risco de dobra)</span>
              </Link>
            ))}
            {alertasTrein.map((t, i) => (
              <Link key={`tr-${i}`} href={`/rh/${t.employee_id}`} className="flex items-center gap-2 rounded-lg border border-warning/25 bg-warning/8 px-3 py-2 text-sm transition-colors hover:bg-warning/12">
                <AlertTriangle className="size-4 shrink-0 text-warning" />
                <span>Treinamento <strong>{t.nome}</strong> · {nomeDe(t.employee_id)} · {daysUntil(t.validade)}d</span>
              </Link>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel title="Conformidade">
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3.5">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">Equipe em dia — nenhuma pendência de ASO, EPI ou anuidade.</p>
          </div>
        </Panel>
      )}

      {/* Em campo + ausências */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Em campo agora">
          {emCampo.size === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Ninguém com ponto aberto.</p>
          ) : (
            <ul className="space-y-2">
              {employees.filter((e) => emCampo.has(e.id)).map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                    {e.nome}
                  </span>
                  <span className="tabular-nums text-xs text-muted-foreground">{formatDuracao(horasMs.get(e.id) ?? 0)} no mês</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Ausências aguardando aprovação">
          {pendentes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma ausência pendente.</p>
          ) : (
            <ul className="space-y-2">
              {pendentes.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <Link href={`/rh/${a.employee_id}`} className="hover:text-primary">
                    {a.employees?.nome} · {ABSENCE_TYPE_LABEL[a.tipo]} · {formatDate(a.inicio)}–{formatDate(a.fim)}
                  </Link>
                  <Badge variant="secondary">solicitada</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Matriz de conformidade + horas */}
      {employees.length === 0 ? (
        <EmptyState title="Nenhum funcionário ativo" description="Cadastre a equipe em Cadastros › Funcionários." />
      ) : (
        <Panel title="Matriz de conformidade">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>ASO</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>RT / Anuidade</TableHead>
                  <TableHead>Férias</TableHead>
                  <TableHead className="text-right">Horas (mês)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => {
                  const aso = conformidade(lastExam.get(e.id) ?? null);
                  const epi = conformidade(epiUrgente(e.id));
                  const rt = e.responsavel_tecnico ? conformidade(e.vencimento_anuidade) : null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.nome}
                        {e.responsavel_tecnico && <Badge variant="secondary" className="ml-2">RT</Badge>}
                      </TableCell>
                      <TableCell><ConfDot c={aso} /></TableCell>
                      <TableCell><ConfDot c={epi} /></TableCell>
                      <TableCell>{rt ? <ConfDot c={rt} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {(() => {
                          const f = feriasDe(e);
                          if (!f) return <span className="text-muted-foreground">—</span>;
                          return (
                            <span className={f.vencidas ? "font-medium text-destructive" : f.saldo > 0 ? "text-amber-300" : "text-muted-foreground"}>
                              {f.saldo}d{f.vencidas ? " ⚠" : ""}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatDuracao(horasMs.get(e.id) ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/rh/${e.id}`}><ExternalLink className="size-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}
    </main>
  );
}

function ConfDot({ c }: { c: { label: string; dot: string } }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className={`size-2 shrink-0 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function Indicador({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
