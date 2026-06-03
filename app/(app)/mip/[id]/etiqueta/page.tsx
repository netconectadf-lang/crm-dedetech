import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { DEVICE_TYPE_LABEL, type MipDeviceType } from "@/lib/mip";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Etiqueta MIP" };

async function appOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function EtiquetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("mip_devices")
    .select("numero, tipo, qr_token, client_units(apelido, clients(razao_social))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const d = data as unknown as {
    numero: string;
    tipo: MipDeviceType;
    qr_token: string;
    client_units: { apelido: string; clients: { razao_social: string } | null } | null;
  };

  const url = `${await appOrigin()}/mip/d/${d.qr_token}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 320 });

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/mip/${id}`}><ArrowLeft className="size-4" /> Voltar</Link>
        </Button>
        <PrintButton label="Imprimir etiqueta" />
      </div>

      <div className="rounded-2xl border p-6 text-center">
        <p className="text-sm text-muted-foreground">{d.client_units?.clients?.razao_social}</p>
        <p className="text-xs text-muted-foreground">{d.client_units?.apelido}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR do dispositivo" className="mx-auto my-4 size-56" />
        <p className="text-2xl font-bold">#{d.numero}</p>
        <p className="text-sm text-muted-foreground">{DEVICE_TYPE_LABEL[d.tipo]}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Escaneie para registrar a leitura
        </p>
      </div>
    </main>
  );
}
