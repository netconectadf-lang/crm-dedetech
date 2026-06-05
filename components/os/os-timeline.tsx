import { CirclePlus, CalendarClock, Truck, Flag, CircleCheck, RefreshCw, type LucideIcon } from "lucide-react";

type OsTimelineProps = {
  createdAt: string;
  scheduledAt: string | null;
  chegadaEm: string | null;
  saidaEm: string | null;
  executadaEm: string | null;
  proximaRevisaoEm: string | null;
};

type Evento = { label: string; data: string; icon: LucideIcon; futuro?: boolean };

function fmt(d: string, soData = false): string {
  const dt = new Date(d);
  return dt.toLocaleString("pt-BR", soData
    ? { day: "2-digit", month: "2-digit", year: "numeric" }
    : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function OsTimeline(props: OsTimelineProps) {
  const candidatos: (Evento | null)[] = [
    { label: "OS criada", data: props.createdAt, icon: CirclePlus },
    props.scheduledAt ? { label: "Agendada", data: props.scheduledAt, icon: CalendarClock } : null,
    props.chegadaEm ? { label: "Técnico chegou", data: props.chegadaEm, icon: Truck } : null,
    props.saidaEm ? { label: "Fim da execução", data: props.saidaEm, icon: Flag } : null,
    props.executadaEm ? { label: "Executada", data: props.executadaEm, icon: CircleCheck } : null,
    props.proximaRevisaoEm
      ? { label: "Próxima revisão", data: props.proximaRevisaoEm, icon: RefreshCw, futuro: true }
      : null,
  ];
  const eventos = (candidatos.filter(Boolean) as Evento[]).sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  );

  return (
    <ol className="relative space-y-4">
      {eventos.map((e, i) => {
        const Icon = e.icon;
        const ultimo = i === eventos.length - 1;
        return (
          <li key={e.label} className="relative flex gap-3">
            {!ultimo && <span className="absolute left-[11px] top-6 h-full w-px bg-border" aria-hidden />}
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
                e.futuro
                  ? "bg-muted text-muted-foreground ring-border"
                  : "bg-primary/15 text-primary ring-primary/30"
              }`}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium leading-tight">{e.label}</p>
              <p className="text-xs text-muted-foreground">{fmt(e.data, e.futuro)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
