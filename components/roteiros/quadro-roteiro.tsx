"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Navigation, Wand2, Clock, User } from "lucide-react";

import { atribuirTecnicoOS, otimizarRotaTecnico } from "@/app/(app)/roteiros/actions";
import { distanciaTotalKm, googleMapsRota, type GeoPonto } from "@/lib/geo";
import { Button } from "@/components/ui/button";

export type OsRoteiro = {
  id: string;
  numero: number;
  cliente: string;
  endereco: string;
  hora: string;
  lat: number | null;
  lng: number | null;
  tecnicoId: string | null;
  rotaSeq: number | null;
};
export type TecnicoOpt = { id: string; nome: string };

const SEM = "__sem__";

function ordenar(a: OsRoteiro, b: OsRoteiro): number {
  // rota_seq primeiro (nulls por último), depois horário
  if (a.rotaSeq != null && b.rotaSeq != null) return a.rotaSeq - b.rotaSeq;
  if (a.rotaSeq != null) return -1;
  if (b.rotaSeq != null) return 1;
  return a.hora.localeCompare(b.hora);
}

export function QuadroRoteiro({
  data,
  osList,
  tecnicos,
}: {
  data: string;
  osList: OsRoteiro[];
  tecnicos: TecnicoOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const nome = (id: string | null) => tecnicos.find((t) => t.id === id)?.nome ?? "Sem técnico";

  // agrupa por técnico
  const grupos = new Map<string, OsRoteiro[]>();
  for (const o of osList) {
    const k = o.tecnicoId ?? SEM;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(o);
  }
  for (const arr of grupos.values()) arr.sort(ordenar);

  const semTecnico = grupos.get(SEM) ?? [];
  const comTecnico = [...grupos.entries()].filter(([k]) => k !== SEM);

  function mover(osId: string, value: string) {
    start(async () => {
      await atribuirTecnicoOS(osId, value === SEM ? null : value);
      router.refresh();
    });
  }
  function otimizar(tecnicoId: string) {
    start(async () => {
      const r = await otimizarRotaTecnico(data, tecnicoId);
      if (r.ok) toast.success(`Rota otimizada (${r.total} visitas).`);
      else toast.error("Sem visitas com localização para otimizar.");
      router.refresh();
    });
  }

  const SelectTecnico = ({ os }: { os: OsRoteiro }) => (
    <select
      value={os.tecnicoId ?? SEM}
      disabled={pending}
      onChange={(e) => mover(os.id, e.target.value)}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value={SEM}>Sem técnico</option>
      {tecnicos.map((t) => (
        <option key={t.id} value={t.id}>{t.nome}</option>
      ))}
    </select>
  );

  const CardOs = ({ os, idx }: { os: OsRoteiro; idx?: number }) => (
    <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-2">
      {idx != null && (
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {idx + 1}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          OS #{os.numero} · {os.cliente}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" /> {os.endereco || "sem endereço"}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" /> {os.hora}
          {(os.lat == null || os.lng == null) && (
            <span className="ml-1 text-amber-400">· sem localização</span>
          )}
        </p>
      </div>
      <SelectTecnico os={os} />
    </li>
  );

  return (
    <div className="space-y-5">
      {/* Não atribuídas */}
      {semTecnico.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
            <User className="size-4" /> Sem técnico ({semTecnico.length})
          </h3>
          <ul className="space-y-2">
            {semTecnico.map((os) => <CardOs key={os.id} os={os} />)}
          </ul>
        </div>
      )}

      {/* Por técnico */}
      <div className="grid gap-4 lg:grid-cols-2">
        {comTecnico.map(([tecnicoId, lista]) => {
          const geo = lista.filter((o) => o.lat != null && o.lng != null) as (OsRoteiro & GeoPonto)[];
          const km = distanciaTotalKm(geo);
          const mapsUrl = googleMapsRota(geo);
          return (
            <div key={tecnicoId} className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <User className="size-4 text-primary" /> {nome(tecnicoId)}
                  <span className="font-normal text-muted-foreground">
                    · {lista.length} visita(s){km > 0 ? ` · ~${km.toFixed(1)} km` : ""}
                  </span>
                </h3>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" disabled={pending || geo.length < 2} onClick={() => otimizar(tecnicoId)}>
                    <Wand2 className="size-4" /> Otimizar
                  </Button>
                  {geo.length > 0 && (
                    <Button asChild variant="outline" size="sm">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <Navigation className="size-4" /> Google Maps
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <ul className="space-y-2">
                {lista.map((os, i) => <CardOs key={os.id} os={os} idx={i} />)}
              </ul>
            </div>
          );
        })}
      </div>

      {osList.length === 0 && (
        <p className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma visita agendada para este dia.
        </p>
      )}
    </div>
  );
}
