import Link from "next/link";
import { notFound } from "next/navigation";

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
import { registrarLeitura } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Leitura MIP" };

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

export default async function ScanLeituraPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("mip_devices")
    .select("id, numero, tipo, client_units(apelido, clients(razao_social))")
    .eq("qr_token", token)
    .maybeSingle();
  if (!data) notFound();
  const d = data as unknown as {
    id: string;
    numero: string;
    tipo: MipDeviceType;
    client_units: { apelido: string; clients: { razao_social: string } | null } | null;
  };

  const { data: lastData } = await supabase
    .from("mip_readings")
    .select("status, lida_em")
    .eq("device_id", d.id)
    .order("lida_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = lastData as { status: MipReadingStatus; lida_em: string } | null;

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Dispositivo #{d.numero}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {DEVICE_TYPE_LABEL[d.tipo]} · {d.client_units?.clients?.razao_social} — {d.client_units?.apelido}
          </p>
          {last && (
            <p className="text-xs text-muted-foreground">
              Última: <span className={`rounded px-1.5 py-0.5 ${READING_STATUS_TONE[last.status]}`}>{READING_STATUS_LABEL[last.status]}</span> ({new Date(last.lida_em).toLocaleDateString("pt-BR")})
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <ResourceForm
            fields={readingFields}
            action={registrarLeitura.bind(null, d.id)}
            submitLabel="Registrar leitura"
          />
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={`/mip/${d.id}`}>Ver histórico do ponto</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
