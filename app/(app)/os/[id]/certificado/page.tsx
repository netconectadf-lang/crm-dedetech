import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatDate } from "@/lib/format";
import { METHOD_LABEL, numeroOS, type ApplicationMethod } from "@/lib/os";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { SignaturePad } from "@/components/os/signature-pad";
import { ValidadeButtons } from "@/components/os/validade-buttons";
import { BaixarCertificado } from "@/components/os/baixar-certificado";

export const metadata = { title: "Certificado" };

/** O certificado é um documento — renderiza SEMPRE claro (tela e PDF).
 *  CSS custom properties locais sobrescrevem os tokens do tema dentro do doc. */
const CERT_LIGHT = {
  "--background": "#ffffff",
  "--foreground": "#0f172a",
  "--card": "#ffffff",
  "--muted": "#eef2f6",
  "--muted-foreground": "#475569",
  "--border": "#e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  colorScheme: "light",
} as unknown as CSSProperties;

/** #RRGGBB -> rgba(...,a). Deriva tons claros da cor da marca para fundos/bordas. */
function hexToRgba(hex: string, a: number) {
  const h = (hex || "#0F766E").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const SHIELD_PATH = "M60 34 L84 44 L84 64 C84 80 72 90 60 96 C48 90 36 80 36 64 L36 44 Z";

/** Campo rotulado: label minúsculo em caixa-alta na cor da marca + valor em grafite. */
function Field({ label, value, color, full }: { label: string; value: ReactNode; color: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>{label}</p>
      <p className="mt-0.5 text-sm font-medium leading-snug" style={{ color: "#0f172a" }}>{value}</p>
    </div>
  );
}

/** Selo/carimbo oficial vetorial (nítido no PDF) — borda serrilhada + escudo + check. */
function Seal({ color }: { color: string }) {
  const dots = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return <circle key={i} cx={60 + Math.cos(a) * 57} cy={60 + Math.sin(a) * 57} r={2} fill={color} />;
  });
  return (
    <svg width="92" height="92" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {dots}
      <circle cx="60" cy="60" r="52" fill="#ffffff" stroke={color} strokeWidth="2.5" />
      <circle cx="60" cy="60" r="44" fill="none" stroke={color} strokeWidth="1" strokeDasharray="1.5 3" opacity="0.55" />
      <path d={SHIELD_PATH} fill={color} transform="translate(60 60) scale(0.78) translate(-60 -60)" />
      <path d="M50 63 L57 71 L72 53" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="translate(60 60) scale(0.78) translate(-60 -60)" />
    </svg>
  );
}

type OS = {
  numero: number;
  numero_local: number | null;
  status: string;
  executada_em: string | null;
  pragas: string[];
  estruturas: string[];
  metodo: ApplicationMethod | null;
  garantia_meses: number;
  periodo_reentrada_horas: number | null;
  proxima_revisao_em: string | null;
  recomendacoes: string | null;
  assinatura_cliente_url: string | null;
  tenant_id: string;
  clients: {
    razao_social: string;
    documento: string | null;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
  } | null;
};

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "operacional", "tecnico"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: osData } = await supabase
    .from("service_orders")
    .select("numero, numero_local, status, executada_em, pragas, estruturas, metodo, garantia_meses, periodo_reentrada_horas, proxima_revisao_em, recomendacoes, assinatura_cliente_url, tenant_id, clients(razao_social, documento, logradouro, numero, bairro, cidade, uf)")
    .eq("id", id)
    .maybeSingle();
  if (!osData) notFound();
  const os = osData as unknown as OS;

  // bucket de assinaturas é privado: gera URL assinada (TTL 1h) a partir do path.
  // (retrocompat: registros antigos guardavam a URL pública completa)
  let assinaturaUrl: string | null = null;
  if (os.assinatura_cliente_url) {
    const raw = os.assinatura_cliente_url;
    const path = raw.startsWith("http") ? (raw.split("/assinaturas/")[1]?.split("?")[0] ?? "") : raw;
    if (path) {
      const { data: signed } = await createAdminClient()
        .storage.from("assinaturas")
        .createSignedUrl(path, 3600);
      assinaturaUrl = signed?.signedUrl ?? null;
    }
  }

  // Fotos da execução enviadas pelo app de campo (bucket privado, por tenant/OS).
  const fotosDir = `${os.tenant_id}/os/${id}/fotos`;
  const { data: fotoFiles } = await createAdminClient()
    .storage.from("assinaturas")
    .list(fotosDir, { limit: 50, sortBy: { column: "name", order: "asc" } });
  const fotos = (
    await Promise.all(
      (fotoFiles ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map(async (f) => {
          const { data } = await createAdminClient().storage.from("assinaturas").createSignedUrl(`${fotosDir}/${f.name}`, 3600);
          return data?.signedUrl ?? null;
        })
    )
  ).filter(Boolean) as string[];

  const [{ data: prodLines }, { data: tenantData }, { data: rtData }] = await Promise.all([
    supabase.from("service_order_products").select("products(nome_comercial, principio_ativo, grupo_quimico, registro_anvisa, antidoto)").eq("os_id", id),
    supabase.from("tenants").select("razao_social, nome_fantasia, cnpj, registro_vigilancia_sanitaria, cor_primaria, logo_url").limit(1).maybeSingle(),
    supabase.from("employees").select("nome, registro_conselho").eq("responsavel_tecnico", true).eq("ativo", true).limit(1).maybeSingle(),
  ]);

  type ProdCert = {
    nome_comercial: string;
    principio_ativo: string | null;
    grupo_quimico: string | null;
    registro_anvisa: string | null;
    antidoto: string | null;
  };
  const produtos = ((prodLines as { products: ProdCert | null }[] | null) ?? [])
    .map((l) => l.products)
    .filter((p): p is ProdCert => p != null);

  const tenant = tenantData as { razao_social: string; nome_fantasia: string | null; cnpj: string | null; registro_vigilancia_sanitaria: string | null; cor_primaria: string | null; logo_url: string | null } | null;
  const rt = rtData as { nome: string; registro_conselho: string | null } | null;

  const empresa = tenant?.nome_fantasia || tenant?.razao_social || "Empresa";
  const cor = tenant?.cor_primaria || "#0F766E";
  // logo da empresa cadastrada nas Configurações; se não houver, cai no nome em texto.
  const logoUrl = tenant?.logo_url || null;
  const cli = os.clients;
  const endereco = cli
    ? [cli.logradouro, cli.numero, cli.bairro, cli.cidade && `${cli.cidade}/${cli.uf}`].filter(Boolean).join(", ")
    : "—";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 print:py-0">
      <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/os/${id}`}><ArrowLeft className="size-4" /> Voltar à OS</Link>
        </Button>
        <div className="flex gap-2">
          <BaixarCertificado numero={os.numero_local ?? os.numero} />
          <PrintButton />
        </div>
      </div>

      <div
        id="certificado"
        style={CERT_LIGHT}
        className="relative rounded-2xl bg-white p-3 shadow-sm print:rounded-none print:p-0 print:shadow-none"
      >
        {/* moldura dupla verde (estilo certificado clássico) */}
        <div className="relative rounded-xl" style={{ border: `2px solid ${cor}`, padding: 5 }}>
          <div className="relative overflow-hidden rounded-lg" style={{ border: `1px solid ${hexToRgba(cor, 0.45)}` }}>
            {/* cantos decorados */}
            <span aria-hidden className="absolute left-3 top-3 size-4" style={{ borderLeft: `2px solid ${cor}`, borderTop: `2px solid ${cor}` }} />
            <span aria-hidden className="absolute right-3 top-3 size-4" style={{ borderRight: `2px solid ${cor}`, borderTop: `2px solid ${cor}` }} />
            <span aria-hidden className="absolute bottom-3 left-3 size-4" style={{ borderLeft: `2px solid ${cor}`, borderBottom: `2px solid ${cor}` }} />
            <span aria-hidden className="absolute bottom-3 right-3 size-4" style={{ borderRight: `2px solid ${cor}`, borderBottom: `2px solid ${cor}` }} />

            {/* marca d'água — escudo institucional */}
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <svg width="320" height="320" viewBox="0 0 120 120" style={{ opacity: 0.05 }}>
                <path d={SHIELD_PATH} fill={cor} />
              </svg>
            </div>

            <div className="relative p-8 print:p-7">
              {/* CABEÇALHO com LOGO */}
              <header className="flex items-start justify-between gap-4">
                <div>
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={empresa} className="h-16 w-auto object-contain" style={{ maxWidth: 230 }} />
                  ) : (
                    <h1 className="text-xl font-bold leading-tight" style={{ color: cor }}>{empresa}</h1>
                  )}
                  <div className="mt-1.5">
                    {tenant?.cnpj && <p className="text-[11px] text-muted-foreground">CNPJ {formatCpfCnpj(tenant.cnpj)}</p>}
                    {tenant?.registro_vigilancia_sanitaria && (
                      <p className="text-[11px] text-muted-foreground">Reg. Vig. Sanitária {tenant.registro_vigilancia_sanitaria}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ background: hexToRgba(cor, 0.1), color: cor }}
                  >
                    Certificado de Execução
                  </span>
                  <p className="mt-2 text-2xl font-black leading-none" style={{ color: cor }}>OS #{numeroOS(os)}</p>
                  {os.executada_em && <p className="mt-1 text-[11px] text-muted-foreground">Emitido em {formatDate(os.executada_em)}</p>}
                </div>
              </header>

              <div className="my-6 h-px w-full" style={{ background: hexToRgba(cor, 0.18) }} />

          {/* DADOS DO SERVIÇO */}
          <section className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field full color={cor} label="Cliente" value={<>{cli?.razao_social ?? "—"}{cli?.documento ? ` · ${formatCpfCnpj(cli.documento)}` : ""}</>} />
            <Field full color={cor} label="Local do serviço" value={endereco} />
            <Field color={cor} label="Pragas-alvo controladas" value={os.pragas?.length ? os.pragas.join(", ") : "—"} />
            <Field color={cor} label="Áreas/estruturas tratadas" value={os.estruturas?.length ? os.estruturas.join(", ") : "—"} />
            <Field color={cor} label="Método de aplicação" value={os.metodo ? METHOD_LABEL[os.metodo] : "—"} />
            <Field
              color={cor}
              label="Garantia"
              value={`${os.garantia_meses > 0 ? `${os.garantia_meses} meses` : "—"}${os.proxima_revisao_em ? ` · próx. revisão ${formatDate(os.proxima_revisao_em)}` : ""}`}
            />
            {os.periodo_reentrada_horas != null && (
              <Field color={cor} label="Período de reentrada" value={`${os.periodo_reentrada_horas} horas`} />
            )}
          </section>

          {/* INTOXICAÇÃO */}
          <section
            className="mt-6 flex items-start gap-3 rounded-xl p-4"
            style={{ background: hexToRgba(cor, 0.06), borderLeft: `3px solid ${cor}` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
              <path d="M12 3 L22 20 H2 Z" fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 9 V14" stroke={cor} strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1.1" fill={cor} />
            </svg>
            <div className="text-xs">
              <p className="font-semibold" style={{ color: "#0f172a" }}>Em caso de intoxicação</p>
              <p className="text-muted-foreground">
                Disque-Intoxicação (CIT): <strong style={{ color: "#0f172a" }}>0800 722 6001</strong>.
                {produtos.some((p) => p?.antidoto) && (
                  <> Antídoto/orientação: {produtos.map((p) => p?.antidoto).filter(Boolean).join("; ")}.</>
                )}
              </p>
            </div>
          </section>

          {os.recomendacoes && (
            <section className="mt-6">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: cor }}>Recomendações</p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{os.recomendacoes}</p>
            </section>
          )}

          {fotos.length > 0 && (
            <section className="mt-7">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: cor }}>Registro fotográfico</p>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-md border object-cover" />
                ))}
              </div>
            </section>
          )}

          {/* ASSINATURAS + SELO */}
          <footer
            className="relative mt-14 grid grid-cols-2 gap-10 pt-10 text-center text-sm"
            style={{ borderTop: `1px solid ${hexToRgba(cor, 0.18)}` }}
          >
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <Seal color={cor} />
            </div>
            <div className="flex flex-col items-center justify-end">
              {assinaturaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assinaturaUrl} alt="Assinatura do cliente" className="mb-1 h-16 object-contain" />
              )}
              <div className="w-full border-t pt-1">
                <p className="font-medium" style={{ color: "#0f172a" }}>{cli?.razao_social ?? "Cliente"}</p>
                <p className="text-xs text-muted-foreground">Assinatura do cliente</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="w-full border-t pt-1">
                {rt ? (
                  <>
                    <p className="font-medium" style={{ color: "#0f172a" }}>{rt.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Responsável Técnico{rt.registro_conselho ? ` · ${rt.registro_conselho}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Responsável Técnico</p>
                )}
              </div>
            </div>
          </footer>

          {/* RODAPÉ DE VALIDAÇÃO */}
          <div
            className="mt-8 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"
            style={{ borderTop: `1px solid ${hexToRgba(cor, 0.12)}`, paddingTop: 10 }}
          >
            <span>Documento emitido eletronicamente por {empresa}</span>
            <span>OS #{numeroOS(os)}{os.executada_em ? ` · ${formatDate(os.executada_em)}` : ""}</span>
          </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 rounded-xl border border-border/60 bg-card/60 p-5 print:hidden sm:grid-cols-2">
        <SignaturePad osId={id} jaAssinado={!!os.assinatura_cliente_url} />
        <ValidadeButtons
          osId={id}
          atualLabel={os.proxima_revisao_em ? formatDate(os.proxima_revisao_em) : null}
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
        Valide o modelo do certificado com o RT/advogado antes de usar em produção.
      </p>
    </main>
  );
}
