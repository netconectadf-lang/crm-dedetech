import { Camera, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mostra as fotos e a assinatura registradas pelo app de campo na OS.
 * As fotos vivem no bucket privado `assinaturas`, em {tenant}/os/{id}/fotos/.
 */
export async function ExecucaoMidia({ osId, showSignature = true }: { osId: string; showSignature?: boolean }) {
  const supabase = await createClient();
  const { data: os } = await supabase
    .from("service_orders")
    .select("tenant_id, assinatura_cliente_url")
    .eq("id", osId)
    .maybeSingle();
  if (!os) return null;

  const admin = createAdminClient();
  const dir = `${os.tenant_id}/os/${osId}/fotos`;
  const { data: files } = await admin.storage.from("assinaturas").list(dir, { limit: 50, sortBy: { column: "name", order: "asc" } });
  const fotos = (
    await Promise.all(
      (files ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map(async (f) => {
          const { data } = await admin.storage.from("assinaturas").createSignedUrl(`${dir}/${f.name}`, 3600);
          return data?.signedUrl ?? null;
        })
    )
  ).filter(Boolean) as string[];

  let assinatura: string | null = null;
  if (showSignature && os.assinatura_cliente_url) {
    const raw = os.assinatura_cliente_url as string;
    const path = raw.startsWith("http") ? raw.split("/assinaturas/")[1]?.split("?")[0] ?? "" : raw;
    if (path) {
      const { data } = await admin.storage.from("assinaturas").createSignedUrl(path, 3600);
      assinatura = data?.signedUrl ?? null;
    }
  }

  if (!fotos.length && !assinatura) return null;

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Mídia da execução</h2>

      {fotos.length > 0 && (
        <>
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Camera className="size-3.5" /> Fotos ({fotos.length})
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border transition hover:opacity-90">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              </a>
            ))}
          </div>
        </>
      )}

      {assinatura && (
        <>
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <PenLine className="size-3.5" /> Assinatura do cliente
          </p>
          <div className="rounded-lg border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assinatura} alt="Assinatura do cliente" className="mx-auto max-h-32" />
          </div>
        </>
      )}
    </section>
  );
}
