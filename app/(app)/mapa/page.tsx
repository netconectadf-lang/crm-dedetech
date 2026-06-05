import { MapPin, ScrollText, Clock, Building2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MapaLoader, type Ponto } from "@/components/mapa/map-loader";

export const metadata = { title: "Mapa da operação" };

function fmtData(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function MapaPage() {
  await requireRole(["owner", "operacional", "comercial"]);
  const supabase = await createClient();

  const [{ data: osData }, { data: pontoData }, { data: cliData }] = await Promise.all([
    supabase
      .from("service_orders")
      .select("id, numero, status, scheduled_at, executada_em, lat, lng, cliente:client_id(razao_social), tecnico:tecnico_id(nome)")
      .not("lat", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(400),
    supabase
      .from("time_entries")
      .select("id, tipo, registrado_em, lat, lng, employees(nome)")
      .not("lat", "is", null)
      .order("registrado_em", { ascending: false })
      .limit(400),
    supabase
      .from("client_units")
      .select("id, lat, lng, cidade, bairro, clients(razao_social)")
      .not("lat", "is", null)
      .limit(400),
  ]);

  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

  const osPontos: Ponto[] = ((osData as Record<string, unknown>[] | null) ?? []).map((o) => ({
    id: `os-${o.id}`,
    camada: "os",
    lat: num(o.lat),
    lng: num(o.lng),
    titulo: `OS #${o.numero ?? ""}`,
    sub: [
      (o.cliente as { razao_social?: string } | null)?.razao_social,
      (o.tecnico as { nome?: string } | null)?.nome,
      String(o.status ?? ""),
      fmtData((o.executada_em as string) ?? (o.scheduled_at as string)),
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const pontoPontos: Ponto[] = ((pontoData as Record<string, unknown>[] | null) ?? []).map((p) => ({
    id: `pt-${p.id}`,
    camada: "ponto",
    lat: num(p.lat),
    lng: num(p.lng),
    titulo: (p.employees as { nome?: string } | null)?.nome ?? "Técnico",
    sub: `Ponto: ${String(p.tipo ?? "")} · ${fmtData(p.registrado_em as string)}`,
  }));

  const cliPontos: Ponto[] = ((cliData as Record<string, unknown>[] | null) ?? []).map((c) => ({
    id: `cli-${c.id}`,
    camada: "cliente",
    lat: num(c.lat),
    lng: num(c.lng),
    titulo: (c.clients as { razao_social?: string } | null)?.razao_social ?? "Cliente",
    sub: [c.bairro, c.cidade].filter(Boolean).join(", ") || "Unidade do cliente",
  }));

  const pontos = [...osPontos, ...pontoPontos, ...cliPontos].filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Mapa da operação"
        description="Onde sua frota e equipe atuaram: ordens de serviço, check-ins de ponto e clientes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={ScrollText} label="Ordens de serviço" value={String(osPontos.length)} />
        <KpiCard icon={Clock} label="Check-ins de ponto" value={String(pontoPontos.length)} />
        <KpiCard icon={Building2} label="Unidades de clientes" value={String(cliPontos.length)} />
      </div>

      {pontos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-20 text-center text-muted-foreground">
          <MapPin className="size-8" />
          <p className="font-medium">Nenhum ponto georreferenciado ainda</p>
          <p className="max-w-md text-sm">
            Assim que houver ordens de serviço com GPS, check-ins de ponto ou clientes com coordenadas, eles aparecem aqui.
          </p>
        </div>
      ) : (
        <MapaLoader pontos={pontos} />
      )}
    </main>
  );
}
