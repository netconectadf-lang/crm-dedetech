import Link from "next/link";
import { Plus, ExternalLink, QrCode, AlertTriangle, Radar, Building2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  DEVICE_TYPE_LABEL,
  READING_STATUS_LABEL,
  READING_STATUS_TONE,
  isCritical,
  type MipDeviceType,
  type MipReadingStatus,
} from "@/lib/mip";
import type { Field } from "@/components/app/resource-form";
import { salvarDispositivo, excluirDispositivo } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
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

export const metadata = { title: "MIP / Monitoramento" };

type Device = {
  id: string;
  numero: string;
  tipo: MipDeviceType;
  unit_id: string;
  client_units: { apelido: string; clients: { razao_social: string } | null } | null;
};

export default async function MipPage() {
  await requireRole(["owner", "operacional", "tecnico"]);
  const supabase = await createClient();

  const [{ data: devData }, { data: readData }, { data: unitData }] =
    await Promise.all([
      supabase
        .from("mip_devices")
        .select("id, numero, tipo, unit_id, client_units(apelido, clients(razao_social))")
        .eq("ativo", true)
        .order("numero"),
      supabase
        .from("mip_readings")
        .select("device_id, status, lida_em")
        .order("lida_em", { ascending: false }),
      supabase
        .from("client_units")
        .select("id, apelido, clients(razao_social)")
        .order("apelido"),
    ]);

  const devices = (devData as unknown as Device[] | null) ?? [];
  const readings = (readData as { device_id: string; status: MipReadingStatus; lida_em: string }[] | null) ?? [];
  const units = (unitData as unknown as { id: string; apelido: string; clients: { razao_social: string } | null }[] | null) ?? [];

  // última leitura por dispositivo
  const last = new Map<string, { status: MipReadingStatus; lida_em: string }>();
  for (const r of readings) if (!last.has(r.device_id)) last.set(r.device_id, r);

  const criticos = devices.filter((d) => isCritical(last.get(d.id)?.status ?? null));
  const unidadesMonitoradas = new Set(devices.map((d) => d.unit_id)).size;
  const semLeitura = devices.filter((d) => !last.has(d.id)).length;

  const fields: Field[] = [
    {
      name: "unit_id",
      label: "Unidade",
      type: "select",
      required: true,
      options: units.map((u) => ({
        value: u.id,
        label: `${u.clients?.razao_social ?? "—"} · ${u.apelido}`,
      })),
    },
    {
      name: "tipo",
      label: "Tipo",
      type: "select",
      options: (Object.keys(DEVICE_TYPE_LABEL) as MipDeviceType[]).map((k) => ({ value: k, label: DEVICE_TYPE_LABEL[k] })),
    },
    { name: "numero", label: "Número / identificação", required: true },
    { name: "ativo", label: "Ativo", type: "switch" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="MIP / Monitoramento"
        description="Dispositivos com QR, leitura por visita e pontos críticos."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Novo dispositivo</Button>}
            title="Novo dispositivo"
            fields={fields}
            action={salvarDispositivo.bind(null, null)}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Radar} label="Dispositivos" value={String(devices.length)} hint="ativos" />
        <KpiCard icon={AlertTriangle} label="Pontos críticos" value={String(criticos.length)} hint={criticos.length ? "infestação ativa" : "sob controle"} tone={criticos.length ? "danger" : "default"} />
        <KpiCard icon={QrCode} label="Sem leitura" value={String(semLeitura)} hint={semLeitura ? "escanear na visita" : "todos lidos"} tone={semLeitura ? "warning" : "default"} />
        <KpiCard icon={Building2} label="Unidades monitoradas" value={String(unidadesMonitoradas)} />
      </div>

      {criticos.length > 0 && (
        <Card className="border-rose-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-300">
              <AlertTriangle className="size-4" /> Pontos críticos (infestação ativa)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {criticos.map((d) => (
              <Link key={d.id} href={`/mip/${d.id}`} className="rounded-md bg-rose-500/10 px-2 py-1 text-rose-300 hover:underline">
                #{d.numero} · {d.client_units?.apelido}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {devices.length === 0 ? (
        <EmptyState title="Nenhum dispositivo" description="Cadastre porta-iscas e armadilhas das unidades." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente / Unidade</TableHead>
                  <TableHead>Última leitura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => {
                  const l = last.get(d.id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono font-medium">{d.numero}</TableCell>
                      <TableCell>{DEVICE_TYPE_LABEL[d.tipo]}</TableCell>
                      <TableCell className="text-sm">
                        {d.client_units?.clients?.razao_social ?? "—"}
                        <span className="block text-xs text-muted-foreground">{d.client_units?.apelido}</span>
                      </TableCell>
                      <TableCell>
                        {l ? (
                          <span className="text-sm">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${READING_STATUS_TONE[l.status]}`}>
                              {READING_STATUS_LABEL[l.status]}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">{formatDate(l.lida_em)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem leitura</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Etiqueta QR">
                            <Link href={`/mip/${d.id}/etiqueta`}><QrCode className="size-4" /></Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon" title="Detalhe">
                            <Link href={`/mip/${d.id}`}><ExternalLink className="size-4" /></Link>
                          </Button>
                          <DeleteButton nome={`dispositivo #${d.numero}`} action={excluirDispositivo.bind(null, d.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
