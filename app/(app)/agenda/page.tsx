import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  Gauge,
  Ban,
  CalendarDays,
  UserX,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  segundaDaSemana,
  semanaDias,
  addDias,
  ymdNoFuso,
  horaNoFuso,
  rotuloDia,
  DIAS_SEMANA,
} from "@/lib/agenda";
import { contarPor, variacao } from "@/lib/relatorios";
import {
  OS_STATUS,
  OS_STATUS_BY_KEY,
  OS_CONCLUIDA,
  OS_PENDENTE,
} from "@/lib/os-status";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/dashboard/kpi-card";
import { MetricCard } from "@/components/relatorios/metric-card";
import { MiniStat } from "@/components/dashboard/mini-stat";
import { DonutChart } from "@/components/relatorios/donut-chart";
import { BarList, type BarRow } from "@/components/relatorios/bar-list";
import { SemanaNav } from "@/components/agenda/semana-nav";

export const metadata = { title: "Agenda de operadores" };

type OsRow = {
  id: string;
  numero: number;
  numero_local: number | null;
  status: string;
  scheduled_at: string;
  tecnico_id: string | null;
  clients: { razao_social: string | null } | null;
};
type EmpRow = { id: string; nome: string; responsavel_tecnico: boolean | null };

const SEM_TECNICO = "__none__";

function heat(n: number): string {
  if (n >= 3) return "bg-primary/15";
  if (n === 2) return "bg-primary/10";
  if (n === 1) return "bg-primary/5";
  return "";
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const supabase = await createClient();

  const hojeBr = ymdNoFuso(new Date().toISOString());
  const { s } = await searchParams;
  const ref = s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : hojeBr;
  const segunda = segundaDaSemana(ref);
  const hojeSegunda = segundaDaSemana(hojeBr);
  const dias = semanaDias(segunda);
  const diaSet = new Set(dias);

  // janela de 2 semanas (atual + anterior) p/ variações
  const prevSegunda = addDias(segunda, -7);
  const prevSet = new Set(semanaDias(prevSegunda));
  const inicio = `${prevSegunda}T00:00:00-03:00`;
  const fimExcl = `${addDias(dias[6], 1)}T00:00:00-03:00`;

  const [osRes, empRes] = await Promise.all([
    supabase
      .from("service_orders")
      .select("id, numero, numero_local, status, scheduled_at, tecnico_id, clients:client_id(razao_social)")
      .gte("scheduled_at", inicio)
      .lt("scheduled_at", fimExcl)
      .order("scheduled_at"),
    supabase
      .from("employees")
      .select("id, nome, responsavel_tecnico")
      .eq("ativo", true)
      .order("nome"),
  ]);

  const todasOs = (osRes.data ?? []) as unknown as OsRow[];
  const emps = (empRes.data ?? []) as EmpRow[];

  // separa semana atual × anterior pelo dia (no fuso BR)
  const ossWeek: OsRow[] = [];
  let totalPrev = 0;
  let execPrev = 0;
  for (const os of todasOs) {
    const dia = ymdNoFuso(os.scheduled_at);
    if (diaSet.has(dia)) ossWeek.push(os);
    else if (prevSet.has(dia)) {
      totalPrev++;
      if (OS_CONCLUIDA.has(os.status)) execPrev++;
    }
  }

  // ─── métricas da semana ─────────────────────────────────────
  const total = ossWeek.length;
  const executadas = ossWeek.filter((o) => OS_CONCLUIDA.has(o.status)).length;
  const pendentes = ossWeek.filter((o) => OS_PENDENTE.has(o.status)).length;
  const canceladas = ossWeek.filter((o) => o.status === "cancelada").length;
  const semTecnico = ossWeek.filter((o) => !o.tecnico_id).length;
  const taxa = total > 0 ? Math.round((executadas / total) * 100) : 0;
  const mediaDia = (total / 7).toFixed(1);
  const escalados = new Set(ossWeek.map((o) => o.tecnico_id).filter(Boolean)).size;

  // mapa técnico→dia→OS[] + totais diários
  const porCelula = new Map<string, OsRow[]>();
  const comOs = new Set<string>();
  const totalDia = new Map<string, number>();
  const execDia = new Map<string, number>();
  for (const os of ossWeek) {
    const tec = os.tecnico_id ?? SEM_TECNICO;
    const dia = ymdNoFuso(os.scheduled_at);
    const key = `${tec}|${dia}`;
    const lista = porCelula.get(key) ?? [];
    lista.push(os);
    porCelula.set(key, lista);
    comOs.add(tec);
    totalDia.set(dia, (totalDia.get(dia) ?? 0) + 1);
    if (OS_CONCLUIDA.has(os.status)) execDia.set(dia, (execDia.get(dia) ?? 0) + 1);
  }

  // linhas: responsáveis técnicos + quem tem OS; + "Sem técnico"
  const nomePorId = new Map(emps.map((e) => [e.id, e.nome]));
  const linhas: { id: string; nome: string }[] = emps
    .filter((e) => e.responsavel_tecnico || comOs.has(e.id))
    .map((e) => ({ id: e.id, nome: e.nome }));
  if (comOs.has(SEM_TECNICO)) linhas.push({ id: SEM_TECNICO, nome: "Sem técnico" });

  const totalSemana = (tecId: string) =>
    dias.reduce((acc, d) => acc + (porCelula.get(`${tecId}|${d}`)?.length ?? 0), 0);
  const cargaMax = Math.max(1, ...linhas.map((l) => totalSemana(l.id)));

  // séries / charts
  const sparkTotal = dias.map((d) => totalDia.get(d) ?? 0);
  const sparkExec = dias.map((d) => execDia.get(d) ?? 0);

  const donutStatus = OS_STATUS.map((st) => ({
    label: st.label,
    value: ossWeek.filter((o) => o.status === st.key).length,
    color: st.color,
  })).filter((d) => d.value > 0);

  const cargaRows: BarRow[] = contarPor(
    ossWeek.filter((o) => o.tecnico_id),
    (o) => nomePorId.get(o.tecnico_id as string),
  ).map((t) => ({ label: t.chave, value: t.qtd, display: String(t.qtd), sub: "OS" }));

  const rotuloSemana = `${rotuloDia(dias[0])} – ${rotuloDia(dias[6])}`;

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6">
      <PageHeader
        title="Agenda de operadores"
        description={`Semana de ${rotuloSemana}`}
        action={<SemanaNav segunda={segunda} hojeSegunda={hojeSegunda} rotulo={rotuloSemana} />}
      />

      {/* KPIs da semana */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={ClipboardList}
          label="OS na semana"
          value={String(total)}
          tone="sky"
          delta={variacao(total, totalPrev)}
          deltaLabel="vs. semana anterior"
          spark={sparkTotal}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Executadas"
          value={String(executadas)}
          tone="emerald"
          delta={variacao(executadas, execPrev)}
          deltaLabel="vs. semana anterior"
          hint={`${taxa}% de conclusão`}
          spark={sparkExec}
        />
        <MetricCard
          icon={Clock}
          label="Pendentes"
          value={String(pendentes)}
          tone="amber"
          hint="a executar na semana"
        />
        <MetricCard
          icon={Users}
          label="Técnicos escalados"
          value={String(escalados)}
          tone="violet"
          hint={`de ${emps.length} ativos`}
        />
      </div>

      {/* indicadores secundários */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Gauge} label="Taxa de conclusão" value={`${taxa}%`} tone="bg-emerald-500/15 text-emerald-300" />
        <MiniStat icon={CalendarDays} label="Média por dia" value={mediaDia} tone="bg-sky-500/15 text-sky-300" />
        <MiniStat icon={Ban} label="Canceladas" value={String(canceladas)} tone="bg-rose-500/15 text-rose-300" />
        <MiniStat icon={UserX} label="Sem técnico" value={String(semTecnico)} tone="bg-amber-500/15 text-amber-300" />
      </div>

      {/* composição + carga */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="OS por status na semana" accent="violet">
          <DonutChart data={donutStatus} unidade="OS" empty="Nenhuma OS nesta semana." />
        </Panel>
        <Panel title="Carga por técnico" accent="cyan">
          <p className="-mt-1 text-xs text-muted-foreground">OS atribuídas na semana.</p>
          <BarList rows={cargaRows} tone="cyan" emptyLabel="Nenhuma OS atribuída nesta semana." />
        </Panel>
      </div>

      {/* grade semanal */}
      <Panel title="Grade da semana" accent="amber">
        <div className="-mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {OS_STATUS.map((st) => (
            <span key={st.key} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: st.color }} />
              {st.label}
            </span>
          ))}
        </div>

        {linhas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 px-4 py-16 text-center text-sm text-muted-foreground">
            Nenhum técnico cadastrado e nenhuma OS agendada nesta semana.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <div className="min-w-[920px]">
              {/* cabeçalho dos dias */}
              <div className="grid grid-cols-[180px_repeat(7,minmax(110px,1fr))] border-b border-border/60 bg-card/60">
                <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Técnico
                </div>
                {dias.map((d, i) => (
                  <div
                    key={d}
                    className={cn(
                      "border-l border-border/60 px-2 py-2 text-center",
                      d === hojeBr && "bg-primary/10",
                    )}
                  >
                    <p className="text-xs font-semibold capitalize">{DIAS_SEMANA[i]}</p>
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      {rotuloDia(d)}
                      {(totalDia.get(d) ?? 0) > 0 && (
                        <span className="ml-1 text-foreground">· {totalDia.get(d)}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* linhas por técnico */}
              {linhas.map((linha) => {
                const carga = totalSemana(linha.id);
                return (
                  <div
                    key={linha.id}
                    className="grid grid-cols-[180px_repeat(7,minmax(110px,1fr))] border-b border-border/60 last:border-b-0"
                  >
                    <div className="flex flex-col justify-center gap-1.5 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium">{linha.nome}</span>
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                          {carga}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-amber-500/70"
                          style={{ width: `${(carga / cargaMax) * 100}%` }}
                        />
                      </div>
                    </div>
                    {dias.map((d) => {
                      const cel = porCelula.get(`${linha.id}|${d}`) ?? [];
                      return (
                        <div
                          key={d}
                          className={cn(
                            "flex flex-col gap-1 border-l border-border/60 p-1.5",
                            heat(cel.length),
                            d === hojeBr && cel.length === 0 && "bg-primary/5",
                          )}
                        >
                          {cel.map((os) => (
                            <Link
                              key={os.id}
                              href={`/os/${os.id}`}
                              className={cn(
                                "block rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors hover:brightness-125",
                                OS_STATUS_BY_KEY[os.status]?.chip ?? "border-border bg-muted/40",
                              )}
                            >
                              <span className="font-semibold tabular-nums">{horaNoFuso(os.scheduled_at)}</span>{" "}
                              <span className="opacity-80">#{os.numero_local ?? os.numero}</span>
                              <span className="block truncate opacity-90">
                                {os.clients?.razao_social ?? "—"}
                              </span>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>
    </main>
  );
}
