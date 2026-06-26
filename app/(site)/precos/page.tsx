import type { Metadata } from "next";
import Link from "next/link";
import { site, type Plan } from "@/lib/site/site";
import { getPlans } from "@/lib/site/plans";
import { CheckIcon } from "@/components/site/icons";
import { Reveal } from "@/components/site/motion";
import { JsonLd } from "@/components/site/json-ld";
import { graph, ORG_ID } from "@/lib/site/schema";

const title = "Preços e planos do Dedetech";
const description =
  "Quanto custa o sistema para dedetizadora Dedetech? Planos a partir de R$ 149/mês, sem fidelidade e com site profissional incluso. Veja o que cada plano inclui.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${site.url}/precos` },
  openGraph: {
    type: "website",
    url: `${site.url}/precos`,
    title: `${title} | ${site.name}`,
    description,
  },
};

// FAQ de preço — intenção de decisão + FAQPage schema.
const precoFaqs = [
  { q: "Quanto custa o sistema para dedetizadora?", a: "O Dedetech começa em R$ 149/mês no plano Starter (autônomo/MEI), R$ 349/mês no Pro (pequena e média) e R$ 799/mês no Enterprise (frota e contratos corporativos). Todos incluem site profissional." },
  { q: "Tem fidelidade ou multa de cancelamento?", a: "Não. Os planos são mensais, sem fidelidade — você cancela quando quiser." },
  { q: "O site profissional está incluso no preço?", a: "Sim. Todos os planos incluem um site profissional otimizado para o Google, sem custo extra." },
  { q: "Posso trocar de plano depois?", a: "Sim. Você sobe ou desce de plano conforme a operação cresce, sem perder seus dados." },
];

export default async function PrecosPage() {
  const plans = await getPlans();

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: site.url },
      { "@type": "ListItem", position: 2, name: "Preços", item: `${site.url}/precos` },
    ],
  };
  const offerCatalog = {
    "@type": "Product",
    name: `${site.name} — Sistema para Dedetizadoras`,
    description: site.description,
    brand: { "@id": ORG_ID },
    offers: plans.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.price.replace(/[^\d]/g, ""),
      priceCurrency: "BRL",
      category: p.for,
      url: `${site.url}/precos`,
    })),
  };
  const faqPage = {
    "@type": "FAQPage",
    mainEntity: precoFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={graph(breadcrumb, offerCatalog, faqPage)} />

      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora absolute inset-0" />
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <nav className="text-left text-sm text-fog">
            <Link href="/" className="hover:text-emerald">Início</Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Preços</span>
          </nav>
          <Reveal>
            <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
              Preços e <span className="grad-text">planos</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-fog">
              Um plano para cada tamanho de operação. Sem fidelidade, cancele quando quiser — e com
              site profissional incluso em todos.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-bg-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.name} p={p} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-fog">
            Preços em reais (BRL), por mês. Valores e recursos podem mudar conforme o plano contratado.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Perguntas frequentes sobre preços</h2>
        <div className="mt-8 space-y-3">
          {precoFaqs.map((f) => (
            <details key={f.q} className="card group rounded-xl p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
                {f.q}
                <span className="text-emerald transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-fog">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="card mt-12 rounded-3xl p-8 text-center">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Ficou com dúvida no plano ideal?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fog">
            Fale com a gente no WhatsApp e a gente indica o melhor plano para a sua operação.
          </p>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-5 inline-block rounded-full px-7 py-3.5"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

function PlanCard({ p }: { p: Plan }) {
  return (
    <div
      className={`card relative flex flex-col rounded-card p-7 ${
        p.highlight
          ? "ring-2 ring-emerald shadow-[0_0_0_1px_rgba(18,206,142,0.4),0_30px_60px_-25px_rgba(18,206,142,0.4)]"
          : ""
      }`}
    >
      {p.highlight && (
        <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-emerald-deep to-emerald px-3 py-1 text-xs font-bold text-[#04140d]">
          Mais popular
        </span>
      )}
      <h2 className="font-display text-xl font-bold">{p.name}</h2>
      <p className="mt-1 text-sm text-fog">{p.for}</p>
      <div className="mt-5 flex items-end gap-1">
        <span className="font-display text-4xl font-bold">{p.price}</span>
        <span className="mb-1 text-sm text-fog">{p.period}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-cream">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {f}
          </li>
        ))}
      </ul>
      <a
        href={p.ctaHref ?? site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-7 rounded-full px-6 py-3 text-center text-sm ${p.highlight ? "btn-primary" : "btn-ghost"}`}
      >
        {p.cta}
      </a>
    </div>
  );
}
