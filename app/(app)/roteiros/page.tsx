import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MapaLoader, type Ponto } from "@/components/mapa/map-loader";
import { QuadroRoteiro, type OsRoteiro, type TecnicoOpt } from "@/components/roteiros/quadro-roteiro";

export const metadata = { title: "Roteiros do dia" };

type Row = {
  id: string;
  numero: number;
  status: string;
  scheduled_at: string | null;
  lat: number | null;
  lng: number | null;
  rota_seq: number | null;
  tecnico_id: string | null;
  clients: {
    razao_social: string;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
  } | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
function hojeYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDias(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function RoteirosPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const supabase = await createClient();
  const { d } = await searchParams;
  const data = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : hojeYmd();

  const ini = new Date(`${data}T00:00:00`).toISOString();
  const fim = new Date(`${data}T00:00:00`);
  fim.setDate(fim.getDate() + 1);

  const [{ data: osData }, { data: tecData }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "id, numero, status, scheduled_at, lat, lng, rota_seq, tecnico_id, clients:client_id(razao_social, logradouro, numero, bairro, cidade)",
      )
      .gte("scheduled_at", ini)
      .lt("scheduled_at", fim.toISOString())
      .in("status", ["agendada", "a_caminho", "em_execucao"])
      .order("scheduled_at"),
    supabase.from("employees").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const rows = (osData as unknown as Row[] | null) ?? [];
  const tecnicos = ((tecData as { id: string; nome: string }[] | null) ?? []).map(
    (t): TecnicoOpt => ({ id: t.id, nome: t.nome }),
  );

  const osList: OsRoteiro[] = rows.map((r) => {
    const c = r.clients;
    const endereco = c
      ? [[c.logradouro, c.numero].filter(Boolean).join(", "), c.bairro, c.cidade].filter(Boolean).join(" · ")
      : "";
    const hora = r.scheduled_at
      ? new Date(r.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "—";
    return {
      id: r.id,
      numero: r.numero,
      cliente: c?.razao_social ?? "—",
      endereco,
      hora,
      lat: r.lat != null ? Number(r.lat) : null,
      lng: r.lng != null ? Number(r.lng) : null,
      tecnicoId: r.tecnico_id,
      rotaSeq: r.rota_seq,
    };
  });

  const pontos: Ponto[] = osList
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({
      id: o.id,
      camada: "os",
      lat: o.lat!,
      lng: o.lng!,
      titulo: `OS #${o.numero} · ${o.cliente}`,
      sub: o.endereco,
    }));

  const prev = addDias(data, -1);
  const next = addDias(data, 1);
  const semGeo = osList.filter((o) => o.lat == null || o.lng == null).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Roteiros do dia"
        description="Distribua as visitas entre os técnicos e otimize a rota de cada um."
      />

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/roteiros?d=${prev}`}><ChevronLeft className="size-4" /> Dia anterior</Link>
        </Button>
        <span className="text-sm font-semibold">
          {new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          <span className="ml-2 font-normal text-muted-foreground">· {osList.length} visita(s)</span>
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/roteiros?d=${next}`}>Próximo dia <ChevronRight className="size-4" /></Link>
        </Button>
      </div>

      {semGeo > 0 && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
          {semGeo} visita(s) sem localização (lat/lng) — não entram na otimização nem no mapa. Cadastre o
          endereço/coordenadas do cliente para incluí-las.
        </p>
      )}

      <QuadroRoteiro data={data} osList={osList} tecnicos={tecnicos} />

      {pontos.length > 0 && <MapaLoader pontos={pontos} />}
    </main>
  );
}
