import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, QrCode, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  DEVICE_TYPE_LABEL,
  READING_STATUS_LABEL,
  READING_STATUS_TONE,
  type MipDeviceType,
  type MipReadingStatus,
} from "@/lib/mip";
import type { Field } from "@/components/app/resource-form";
import { ResourceForm } from "@/components/app/resource-form";
import { registrarLeitura } from "../actions";
import { PageHeader } from "@/components/app/page-header";
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

export const metadata = { title: "Dispositivo MIP" };

type Device = {
  id: string;
  numero: string;
  tipo: MipDeviceType;
  unit_id: string;
  client_units: { apelido: string; clients: { razao_social: string } | null } | null;
};

const readingFields: Field[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: (Object.keys(READING_STATUS_LABEL) as MipReadingStatus[]).map((k) => ({ value: k, label: READING_STATUS_LABEL[k] })),
  },
  { name: "consumo_pct", label: "Consumo da isca (%)", type: "number" },
  { name: "captura", label: "Capturas", type: "number" },
  { name: "observacao", label: "Observação", type: "textarea" },
];

export default async function MipDevicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: devData } = await supabase
    .from("mip_devices")
    .select("id, numero, tipo, unit_id, client_units(apelido, clients(razao_social))")
    .eq("id", id)
    .maybeSingle();
  if (!devData) notFound();
  const d = devData as unknown as Device;

  const { data: readData } = await supabase
    .from("mip_readings")
    .select("id, status, consumo_pct, captura, observacao, lida_em")
    .eq("device_id", id)
    .order("lida_em", { ascending: false })
    .limit(50);
  const readings = (readData as { id: string; status: MipReadingStatus; consumo_pct: number | null; captura: number; observacao: string | null; lida_em: string }[] | null) ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/mip"><ArrowLeft className="size-4" /> MIP</Link>
      </Button>

      <PageHeader
        title={`Dispositivo #${d.numero}`}
        description={`${DEVICE_TYPE_LABEL[d.tipo]} · ${d.client_units?.clients?.razao_social ?? ""} — ${d.client_units?.apelido ?? ""}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href={`/mip/${d.id}/etiqueta`}><QrCode className="size-4" /> Etiqueta</Link></Button>
            <Button asChild variant="outline"><Link href={`/mip/laudo/${d.unit_id}`}><FileText className="size-4" /> Laudo da unidade</Link></Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Registrar leitura</CardTitle></CardHeader>
        <CardContent>
          <ResourceForm
            fields={readingFields}
            action={registrarLeitura.bind(null, d.id)}
            submitLabel="Registrar leitura"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico / série temporal</CardTitle></CardHeader>
        <CardContent>
          {readings.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma leitura ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-right">Capturas</TableHead>
                  <TableHead>Obs.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(r.lida_em).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${READING_STATUS_TONE[r.status]}`}>
                        {READING_STATUS_LABEL[r.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.consumo_pct != null ? `${r.consumo_pct}%` : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.captura}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.observacao ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
