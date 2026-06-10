import Link from "next/link";

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
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { SemanaNav } from "@/components/agenda/semana-nav";

export const metadata = { title: "Agenda de operadores" };

type OsRow = {
  id: string;
  numero: number;
  status: string;
  scheduled_at: string;
  tecnico_id: string | null;
  clients: { razao_social: string | null } | null;
};
type EmpRow = { id: string; nome: string; responsavel_tecnico: boolean | null };

const STATUS_TONE: Record<string, string> = {
  agendada: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  a_caminho: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  em_execucao: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  executada: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  faturada: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  cancelada: "border-border bg-muted/40 text-muted-foreground line-through",
};

const SEM_TECNICO = "__none__";

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

  // limites em timestamptz (fuso BR) para a janela da semana
  const inicio = `${dias[0]}T00:00:00-03:00`;
  const fimExcl = `${addDias(dias[6], 1)}T00:00:00-03:00`;

  const [osRes, empRes] = await Promise.all([
    supabase
      .from("service_orders")
      .select("id, numero, status, scheduled_at, tecnico_id, clients:client_id(razao_social)")
      .gte("scheduled_at", inicio)
      .lt("scheduled_at", fimExcl)
      .order("scheduled_at"),
    supabase
      .from("employees")
      .select("id, nome, responsavel_tecnico")
      .eq("ativo", true)
      .order("nome"),
  ]);

  const oss = (osRes.data ?? []) as unknown as OsRow[];
  const emps = (empRes.data ?? []) as EmpRow[];

  // mapa: técnico → dia → OS[]
  const porCelula = new Map<string, OsRow[]>();
  const comOs = new Set<string>();
  for (const os of oss) {
    const tec = os.tecnico_id ?? SEM_TECNICO;
    const dia = ymdNoFuso(os.scheduled_at);
    const key = `${tec}|${dia}`;
    const lista = porCelula.get(key) ?? [];
    lista.push(os);
    porCelula.set(key, lista);
    comOs.add(tec);
  }

  // linhas: técnicos cadastrados (responsável técnico) + quem tem OS na semana
  const nomePorId = new Map(emps.map((e) => [e.id, e.nome]));
  const tecnicoIds = emps
    .filter((e) => e.responsavel_tecnico || comOs.has(e.id))
    .map((e) => e.id);
  const linhas: { id: string; nome: string }[] = tecnicoIds.map((id) => ({
    id,
    nome: nomePorId.get(id) ?? "—",
  }));
  if (comOs.has(SEM_TECNICO)) {
    linhas.push({ id: SEM_TECNICO, nome: "Sem técnico" });
  }

  const totalSemana = (tecId: string) =>
    dias.reduce((acc, d) => acc + (porCelula.get(`${tecId}|${d}`)?.length ?? 0), 0);

  const rotuloSemana = `${rotuloDia(dias[0])} – ${rotuloDia(dias[6])}`;

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6">
      <PageHeader
        title="Agenda de operadores"
        description="Carga de trabalho dos técnicos na semana. Clique numa OS para abrir."
        action={<SemanaNav segunda={segunda} hojeSegunda={hojeSegunda} rotulo={rotuloSemana} />}
      />

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
                  <p className="text-[11px] tabular-nums text-muted-foreground">{rotuloDia(d)}</p>
                </div>
              ))}
            </div>

            {/* linhas por técnico */}
            {linhas.map((linha) => (
              <div
                key={linha.id}
                className="grid grid-cols-[180px_repeat(7,minmax(110px,1fr))] border-b border-border/60 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 truncate text-sm font-medium">{linha.nome}</span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                    {totalSemana(linha.id)}
                  </span>
                </div>
                {dias.map((d) => {
                  const cel = porCelula.get(`${linha.id}|${d}`) ?? [];
                  return (
                    <div
                      key={d}
                      className={cn(
                        "flex flex-col gap-1 border-l border-border/60 p-1.5",
                        d === hojeBr && "bg-primary/5",
                      )}
                    >
                      {cel.map((os) => (
                        <Link
                          key={os.id}
                          href={`/os/${os.id}`}
                          className={cn(
                            "block rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors hover:brightness-125",
                            STATUS_TONE[os.status] ?? "border-border bg-muted/40",
                          )}
                        >
                          <span className="font-semibold tabular-nums">{horaNoFuso(os.scheduled_at)}</span>{" "}
                          <span className="opacity-80">#{os.numero}</span>
                          <span className="block truncate opacity-90">
                            {os.clients?.razao_social ?? "—"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
