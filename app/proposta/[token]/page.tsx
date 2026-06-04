import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDate } from "@/lib/format";
import { ProposalActions } from "@/components/funil/proposal-actions";

export const metadata = { title: "Proposta" };

type QuoteFull = {
  numero: number;
  status: string;
  validade: string | null;
  desconto: number;
  observacoes: string | null;
  clients: { razao_social: string } | null;
  deals: { nome_contato: string; clients: { razao_social: string } | null } | null;
  tenants: {
    razao_social: string;
    nome_fantasia: string | null;
    cor_primaria: string | null;
    registro_vigilancia_sanitaria: string | null;
  } | null;
  quote_items: {
    descricao: string;
    quantidade: number;
    preco_unit: number;
    subtotal: number;
  }[];
};

export default async function PropostaPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("quotes")
    .select(
      "numero, status, validade, desconto, observacoes, clients(razao_social), deals(nome_contato, clients(razao_social)), tenants(razao_social, nome_fantasia, cor_primaria, registro_vigilancia_sanitaria), quote_items(descricao, quantidade, preco_unit, subtotal)",
    )
    .eq("public_token", token)
    .maybeSingle();

  if (!data) notFound();
  const quote = data as unknown as QuoteFull;

  const empresa =
    quote.tenants?.nome_fantasia || quote.tenants?.razao_social || "Empresa";
  const cor = quote.tenants?.cor_primaria || "#0F766E";
  const cliente =
    quote.clients?.razao_social ||
    quote.deals?.clients?.razao_social ||
    quote.deals?.nome_contato ||
    "Cliente";

  const subtotal = quote.quote_items.reduce((s, i) => s + Number(i.subtotal), 0);
  const total = subtotal - Number(quote.desconto);

  const expirado =
    quote.validade != null &&
    new Date(quote.validade) < new Date() &&
    !["aceito", "recusado"].includes(quote.status);
  const aceito = quote.status === "aceito";
  const recusado = quote.status === "recusado";
  const podeAgir = !aceito && !recusado && !expirado;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Cabeçalho branded */}
      <header
        className="rounded-t-2xl px-8 py-6 text-white"
        style={{ backgroundColor: cor }}
      >
        <p className="text-sm opacity-80">Proposta comercial</p>
        <h1 className="text-2xl font-bold">{empresa}</h1>
        {quote.tenants?.registro_vigilancia_sanitaria && (
          <p className="mt-1 text-xs opacity-80">
            Reg. Vigilância Sanitária: {quote.tenants.registro_vigilancia_sanitaria}
          </p>
        )}
      </header>

      <div className="space-y-6 rounded-b-2xl border border-t-0 px-8 py-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Para</p>
            <p className="font-medium">{cliente}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Orçamento</p>
            <p className="font-medium">#{quote.numero}</p>
          </div>
          {quote.validade && (
            <div className="text-right">
              <p className="text-muted-foreground">Válido até</p>
              <p className="font-medium">{formatDate(quote.validade)}</p>
            </div>
          )}
        </div>

        {/* Status banners */}
        {aceito && (
          <Banner icon={<CheckCircle2 className="size-5" />} tone="emerald">
            Proposta aceita. Obrigado! Entraremos em contato.
          </Banner>
        )}
        {recusado && (
          <Banner icon={<XCircle className="size-5" />} tone="rose">
            Proposta recusada.
          </Banner>
        )}
        {expirado && (
          <Banner icon={<Clock className="size-5" />} tone="amber">
            Esta proposta expirou. Solicite uma atualização.
          </Banner>
        )}

        {/* Itens */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Descrição</th>
              <th className="py-2 text-right">Qtd</th>
              <th className="py-2 text-right">Preço un.</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {quote.quote_items.map((i, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2">{i.descricao}</td>
                <td className="py-2 text-right tabular-nums">{i.quantidade}</td>
                <td className="py-2 text-right tabular-nums">{formatBRL(i.preco_unit)}</td>
                <td className="py-2 text-right tabular-nums">{formatBRL(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatBRL(subtotal)}</span>
          </div>
          {Number(quote.desconto) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span className="tabular-nums">- {formatBRL(quote.desconto)}</span>
            </div>
          )}
          <div
            className="flex justify-between border-t pt-1 text-lg font-bold"
            style={{ color: cor }}
          >
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(total)}</span>
          </div>
        </div>

        {quote.observacoes && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="mb-1 font-medium">Observações</p>
            <p className="whitespace-pre-line text-muted-foreground">
              {quote.observacoes}
            </p>
          </div>
        )}

        {podeAgir && <ProposalActions token={token} />}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Proposta gerada pelo Dedetech.
      </p>
    </main>
  );
}

function Banner({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: "emerald" | "rose" | "amber";
  children: React.ReactNode;
}) {
  const tones = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  };
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {icon}
      {children}
    </div>
  );
}
