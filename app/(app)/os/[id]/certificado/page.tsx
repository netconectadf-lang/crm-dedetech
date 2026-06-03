import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCpfCnpj, formatDate } from "@/lib/format";
import { METHOD_LABEL, type ApplicationMethod } from "@/lib/os";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Certificado" };

type OS = {
  numero: number;
  status: string;
  executada_em: string | null;
  pragas: string[];
  metodo: ApplicationMethod | null;
  garantia_meses: number;
  periodo_reentrada_horas: number | null;
  proxima_revisao_em: string | null;
  recomendacoes: string | null;
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
    .select("numero, status, executada_em, pragas, metodo, garantia_meses, periodo_reentrada_horas, proxima_revisao_em, recomendacoes, clients(razao_social, documento, logradouro, numero, bairro, cidade, uf)")
    .eq("id", id)
    .maybeSingle();
  if (!osData) notFound();
  const os = osData as unknown as OS;

  const [{ data: prodLines }, { data: tenantData }, { data: rtData }] = await Promise.all([
    supabase.from("service_order_products").select("products(nome_comercial, principio_ativo, grupo_quimico, registro_anvisa, antidoto)").eq("os_id", id),
    supabase.from("tenants").select("razao_social, nome_fantasia, cnpj, registro_vigilancia_sanitaria, cor_primaria").limit(1).maybeSingle(),
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

  const tenant = tenantData as { razao_social: string; nome_fantasia: string | null; cnpj: string | null; registro_vigilancia_sanitaria: string | null; cor_primaria: string | null } | null;
  const rt = rtData as { nome: string; registro_conselho: string | null } | null;

  const empresa = tenant?.nome_fantasia || tenant?.razao_social || "Empresa";
  const cor = tenant?.cor_primaria || "#0F766E";
  const cli = os.clients;
  const endereco = cli
    ? [cli.logradouro, cli.numero, cli.bairro, cli.cidade && `${cli.cidade}/${cli.uf}`].filter(Boolean).join(", ")
    : "—";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/os/${id}`}><ArrowLeft className="size-4" /> Voltar à OS</Link>
        </Button>
        <PrintButton />
      </div>

      <div className="rounded-2xl border p-8 print:border-0 print:p-0">
        <header className="flex items-center justify-between border-b pb-4" style={{ borderColor: cor }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: cor }}>{empresa}</h1>
            {tenant?.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {formatCpfCnpj(tenant.cnpj)}</p>}
            {tenant?.registro_vigilancia_sanitaria && (
              <p className="text-xs text-muted-foreground">Reg. Vigilância Sanitária: {tenant.registro_vigilancia_sanitaria}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Certificado de Execução</p>
            <p className="text-xs text-muted-foreground">OS #{os.numero}</p>
            {os.executada_em && <p className="text-xs text-muted-foreground">{formatDate(os.executada_em)}</p>}
          </div>
        </header>

        <section className="mt-4 space-y-1 text-sm">
          <p><strong>Cliente:</strong> {cli?.razao_social ?? "—"} {cli?.documento ? `· ${formatCpfCnpj(cli.documento)}` : ""}</p>
          <p><strong>Local do serviço:</strong> {endereco}</p>
          <p><strong>Pragas-alvo controladas:</strong> {os.pragas?.length ? os.pragas.join(", ") : "—"}</p>
          <p><strong>Método de aplicação:</strong> {os.metodo ? METHOD_LABEL[os.metodo] : "—"}</p>
          {os.periodo_reentrada_horas != null && (
            <p><strong>Período de reentrada:</strong> {os.periodo_reentrada_horas} horas</p>
          )}
          <p><strong>Garantia:</strong> {os.garantia_meses > 0 ? `${os.garantia_meses} meses` : "—"}{os.proxima_revisao_em ? ` · próxima revisão: ${formatDate(os.proxima_revisao_em)}` : ""}</p>
        </section>

        <section className="mt-4">
          <p className="mb-1 text-sm font-semibold">Produtos utilizados</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1">Produto</th>
                <th className="py-1">Princípio ativo</th>
                <th className="py-1">Grupo químico</th>
                <th className="py-1">Registro ANVISA</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr><td colSpan={4} className="py-2 text-muted-foreground">—</td></tr>
              ) : (
                produtos.map((p, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{p?.nome_comercial}</td>
                    <td className="py-1">{p?.principio_ativo ?? "—"}</td>
                    <td className="py-1">{p?.grupo_quimico ?? "—"}</td>
                    <td className="py-1">{p?.registro_anvisa ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-4 rounded-lg bg-muted/40 p-3 text-xs">
          <p className="font-semibold">Em caso de intoxicação</p>
          <p className="text-muted-foreground">
            Disque-Intoxicação (CIT): <strong>0800 722 6001</strong>.
            {produtos.some((p) => p?.antidoto) && (
              <> Antídoto/orientação: {produtos.map((p) => p?.antidoto).filter(Boolean).join("; ")}.</>
            )}
          </p>
        </section>

        {os.recomendacoes && (
          <section className="mt-4 text-sm">
            <p className="font-semibold">Recomendações</p>
            <p className="whitespace-pre-line text-muted-foreground">{os.recomendacoes}</p>
          </section>
        )}

        <footer className="mt-10 border-t pt-6 text-center text-sm">
          <div className="mx-auto w-64 border-t pt-1">
            {rt ? (
              <>
                <p className="font-medium">{rt.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Responsável Técnico{rt.registro_conselho ? ` · ${rt.registro_conselho}` : ""}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Responsável Técnico</p>
            )}
          </div>
        </footer>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
        ⚠️ Valide o modelo do certificado com o RT/advogado antes de usar em produção.
      </p>
    </main>
  );
}
