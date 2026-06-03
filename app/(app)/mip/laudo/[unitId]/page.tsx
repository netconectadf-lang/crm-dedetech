import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  DEVICE_TYPE_LABEL,
  READING_STATUS_LABEL,
  isCritical,
  type MipDeviceType,
  type MipReadingStatus,
} from "@/lib/mip";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Laudo MIP" };

export default async function LaudoMipPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { unitId } = await params;
  const supabase = await createClient();

  const { data: unitData } = await supabase
    .from("client_units")
    .select("apelido, cidade, uf, clients(razao_social)")
    .eq("id", unitId)
    .maybeSingle();
  if (!unitData) notFound();
  const unit = unitData as unknown as {
    apelido: string;
    cidade: string | null;
    uf: string | null;
    clients: { razao_social: string } | null;
  };

  const [{ data: devData }, { data: readData }, { data: tenantData }] =
    await Promise.all([
      supabase.from("mip_devices").select("id, numero, tipo").eq("unit_id", unitId).eq("ativo", true).order("numero"),
      supabase.from("mip_readings").select("device_id, status, consumo_pct, captura, lida_em").order("lida_em", { ascending: false }),
      supabase.from("tenants").select("razao_social, nome_fantasia, registro_vigilancia_sanitaria, cor_primaria").limit(1).maybeSingle(),
    ]);

  const devices = (devData as { id: string; numero: string; tipo: MipDeviceType }[] | null) ?? [];
  const readings = (readData as { device_id: string; status: MipReadingStatus; consumo_pct: number | null; captura: number; lida_em: string }[] | null) ?? [];
  const tenant = tenantData as { razao_social: string; nome_fantasia: string | null; registro_vigilancia_sanitaria: string | null; cor_primaria: string | null } | null;

  const last = new Map<string, { status: MipReadingStatus; consumo_pct: number | null; captura: number; lida_em: string }>();
  for (const r of readings) if (!last.has(r.device_id)) last.set(r.device_id, r);

  const empresa = tenant?.nome_fantasia || tenant?.razao_social || "Empresa";
  const cor = tenant?.cor_primaria || "#0F766E";
  const criticos = devices.filter((d) => isCritical(last.get(d.id)?.status ?? null));

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/mip"><ArrowLeft className="size-4" /> MIP</Link></Button>
        <PrintButton />
      </div>

      <div className="rounded-2xl border p-8 print:border-0 print:p-0">
        <header className="flex items-center justify-between border-b pb-4" style={{ borderColor: cor }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: cor }}>{empresa}</h1>
            {tenant?.registro_vigilancia_sanitaria && (
              <p className="text-xs text-muted-foreground">Reg. Vigilância Sanitária: {tenant.registro_vigilancia_sanitaria}</p>
            )}
          </div>
          <p className="text-sm font-semibold">Laudo de Monitoramento (MIP)</p>
        </header>

        <section className="mt-4 space-y-1 text-sm">
          <p><strong>Cliente:</strong> {unit.clients?.razao_social ?? "—"}</p>
          <p><strong>Unidade:</strong> {unit.apelido}{unit.cidade ? ` · ${unit.cidade}/${unit.uf}` : ""}</p>
          <p><strong>Dispositivos monitorados:</strong> {devices.length} · <strong>Pontos críticos:</strong> {criticos.length}</p>
        </section>

        <table className="mt-4 w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-1">Nº</th>
              <th className="py-1">Tipo</th>
              <th className="py-1">Última leitura</th>
              <th className="py-1">Status</th>
              <th className="py-1 text-right">Consumo</th>
              <th className="py-1 text-right">Capturas</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const l = last.get(d.id);
              const crit = isCritical(l?.status ?? null);
              return (
                <tr key={d.id} className={`border-b ${crit ? "font-medium text-rose-700" : ""}`}>
                  <td className="py-1">{d.numero}</td>
                  <td className="py-1">{DEVICE_TYPE_LABEL[d.tipo]}</td>
                  <td className="py-1">{l ? formatDate(l.lida_em) : "—"}</td>
                  <td className="py-1">{l ? READING_STATUS_LABEL[l.status] : "Sem leitura"}</td>
                  <td className="py-1 text-right">{l?.consumo_pct != null ? `${l.consumo_pct}%` : "—"}</td>
                  <td className="py-1 text-right">{l?.captura ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {criticos.length > 0 && (
          <section className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            <p className="font-semibold">Pontos críticos (recomenda-se ação corretiva):</p>
            <p>{criticos.map((d) => `#${d.numero}`).join(", ")}</p>
          </section>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          Documento gerado pelo Dedetech para apresentação em auditorias (ISO 22000 / ANVISA).
        </p>
      </div>
    </main>
  );
}
