import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site/site";
import { posts, getPost, relatedPosts } from "@/lib/site/posts";
import { Reveal } from "@/components/site/motion";
import { CheckIcon } from "@/components/site/icons";
import { JsonLd } from "@/components/site/json-ld";
import { graph, ORG_ID, WEBSITE_ID, PERSON_ID, authorNode } from "@/lib/site/schema";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `${site.url}/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.excerpt, url: `${site.url}/blog/${p.slug}`, images: [p.cover] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();
  const related = relatedPosts(p);

  const article = {
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    image: `${site.url}${p.cover}`,
    datePublished: p.date,
    dateModified: p.updated ?? p.date,
    author: { "@id": PERSON_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: `${site.url}/blog/${p.slug}`,
    inLanguage: "pt-BR",
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: site.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog` },
      { "@type": "ListItem", position: 3, name: p.title, item: `${site.url}/blog/${p.slug}` },
    ],
  };

  const jsonLd = graph(authorNode(), article, breadcrumb);

  return (
    <article>
      <header className="relative overflow-hidden border-b border-line">
        <Image src={p.cover} alt={p.title} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/90 to-bg/60" />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
          <nav className="text-sm text-fog">
            <Link href="/" className="hover:text-emerald">Início</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-emerald">Blog</Link>
          </nav>
          <div className="mt-6 flex items-center gap-2 text-xs text-fog">
            <span className="rounded-full bg-emerald/10 px-2.5 py-1 font-semibold text-emerald">{p.category}</span>
            <span>{p.readingMin} min de leitura</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">{p.title}</h1>
          <p className="mt-3 text-lg text-fog">{p.excerpt}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {p.takeaways?.length ? (
          <Reveal>
            <div className="card rounded-card p-6">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-emerald">Resumo rápido</p>
              <ul className="mt-4 space-y-2.5">
                {p.takeaways.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-fog">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}

        <div className="mt-10 space-y-5">
          {p.body.map((b, i) => {
            if (b.type === "h2") return <h2 key={i} className="mt-8 font-display text-2xl font-bold">{b.text}</h2>;
            if (b.type === "ul")
              return (
                <ul key={i} className="space-y-2">
                  {b.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 text-fog">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" /> {it}
                    </li>
                  ))}
                </ul>
              );
            return <p key={i} className="leading-relaxed text-fog">{b.text}</p>;
          })}
        </div>

        <div className="card mt-12 rounded-3xl p-8 text-center">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Coloque isso em prática com o Dedetech</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fog">O sistema completo para gerir e crescer a sua dedetizadora.</p>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 inline-block rounded-full px-7 py-3.5">Agende uma demonstração</a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-bg-2">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-bold">Leia também</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="card group flex h-full flex-col overflow-hidden rounded-card">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={r.cover} alt={r.title} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-base font-bold leading-snug group-hover:text-emerald">{r.title}</h3>
                    <span className="mt-3 text-sm font-semibold text-emerald">Ler →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd data={jsonLd} />
    </article>
  );
}
