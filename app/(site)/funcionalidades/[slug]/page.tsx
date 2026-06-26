import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { site, features, featureFaqs } from "@/lib/site/site";
import { Icon, CheckIcon } from "@/components/site/icons";
import { Reveal } from "@/components/site/motion";
import { JsonLd } from "@/components/site/json-ld";
import { graph } from "@/lib/site/schema";

export function generateStaticParams() {
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const f = features.find((x) => x.slug === slug);
  if (!f) return {};
  const title = `${f.name} para dedetizadoras`;
  return {
    title,
    description: f.long,
    alternates: { canonical: `${site.url}/funcionalidades/${f.slug}` },
    openGraph: {
      type: "article",
      url: `${site.url}/funcionalidades/${f.slug}`,
      title: `${title} | ${site.name}`,
      description: f.long,
    },
  };
}

export default async function FuncionalidadePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = features.find((x) => x.slug === slug);
  if (!f) notFound();

  const outras = features.filter((x) => x.slug !== f.slug);
  const faqs = featureFaqs[f.slug] ?? [];

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: site.url },
      { "@type": "ListItem", position: 2, name: "Funcionalidades", item: `${site.url}/funcionalidades` },
      { "@type": "ListItem", position: 3, name: f.name, item: `${site.url}/funcionalidades/${f.slug}` },
    ],
  };
  const faqPage = faqs.length
    ? {
        "@type": "FAQPage",
        mainEntity: faqs.map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: q.a },
        })),
      }
    : null;
  const jsonLd = graph(...[breadcrumb, faqPage].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora absolute inset-0" />
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <nav className="text-sm text-fog">
            <Link href="/" className="hover:text-emerald">Início</Link>
            <span className="mx-2">/</span>
            <Link href="/funcionalidades" className="hover:text-emerald">Funcionalidades</Link>
          </nav>
          <Reveal>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <Icon name={f.icon} className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald">{f.category}</span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{f.name}</h1>
            <p className="mt-5 max-w-2xl text-lg text-fog">{f.short}</p>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-8 inline-block rounded-full px-7 py-3.5"
            >
              Agende uma demonstração
            </a>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          {f.image && (
            <Reveal className="order-1">
              <div className="relative aspect-[16/9] overflow-hidden rounded-card border border-line">
                <Image
                  src={f.image}
                  alt={`${f.name} — Dedetech`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </Reveal>
          )}
          <Reveal className="order-2">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Como funciona {f.name.toLowerCase()} no Dedetech?
            </h2>
            <p className="mt-4 text-lg text-cream">{f.long}</p>
            <ul className="mt-6 grid gap-3">
              {f.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-cream">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald" /> {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* FAQ específico da funcionalidade (AEO/GEO + FAQPage schema) */}
      {faqs.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Perguntas frequentes sobre {f.name.toLowerCase()}
            </h2>
            <div className="mt-8 space-y-3">
              {faqs.map((q) => (
                <details key={q.q} className="card group rounded-xl p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
                    {q.q}
                    <span className="text-emerald transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-fog">{q.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Links internos para as outras funcionalidades (rede de links / pSEO) */}
      <section className="border-b border-line bg-bg-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            <span className="text-emerald">·</span> Outras funcionalidades
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {outras.map((o) => (
              <Link
                key={o.slug}
                href={`/funcionalidades/${o.slug}`}
                className="card group flex flex-col rounded-card p-6 transition hover:ring-1 hover:ring-emerald/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
                    <Icon name={o.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold group-hover:text-emerald">{o.name}</h3>
                </div>
                <p className="mt-3 text-sm text-fog">{o.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-br from-bg-2 to-surface p-10 text-center sm:p-16">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px] pulse-glow" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Veja o Dedetech na sua operação</h2>
            <p className="mx-auto mt-4 max-w-xl text-fog">
              Agende uma demonstração e veja {f.name.toLowerCase()} funcionando na prática.
            </p>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-7 inline-block rounded-full px-8 py-4 text-lg"
            >
              Agende uma demonstração
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
