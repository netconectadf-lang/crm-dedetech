import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site, features, featureCategories } from "@/lib/site/site";
import { Icon, CheckIcon } from "@/components/site/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description:
    "Conheça as funcionalidades do Dedetech: ordens de serviço no celular, contratos recorrentes, estoque ANVISA, financeiro, NFSe, MIP, GPS e site incluso.",
  alternates: { canonical: `${site.url}/funcionalidades` },
};

export default function Funcionalidades() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora absolute inset-0" />
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Funcionalidades</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
              Tudo o que sua dedetizadora precisa, <span className="grad-text">de ponta a ponta</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-fog">
              Do orçamento à nota fiscal, do campo ao financeiro. Conheça cada parte do Dedetech.
            </p>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 inline-block rounded-full px-7 py-3.5">
              Agende uma demonstração
            </a>
          </Reveal>
        </div>
      </section>

      {featureCategories.map((cat) => {
        const items = features.filter((f) => f.category === cat);
        return (
          <section key={cat} className="border-b border-line even:bg-bg-2">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <Reveal>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  <span className="text-emerald">·</span> {cat}
                </h2>
              </Reveal>
              <Stagger className="mt-8 grid gap-5 md:grid-cols-2">
                {items.map((f) => (
                  <StaggerItem key={f.slug} className="h-full">
                    <div className={`card group flex h-full flex-col overflow-hidden rounded-card ${f.highlight ? "ring-1 ring-emerald/40" : ""}`}>
                      {f.image && (
                        <div className="relative aspect-[16/9] overflow-hidden border-b border-line">
                          <Image src={f.image} alt={f.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-7">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                          <Icon name={f.icon} className="h-6 w-6" />
                        </div>
                        <h3 className="font-display text-lg font-bold">{f.name}</h3>
                      </div>
                      <p className="mt-4 text-sm text-fog">{f.long}</p>
                      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                        {f.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm text-cream">
                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {b}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/funcionalidades/${f.slug}`}
                        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald transition-all hover:gap-2"
                      >
                        Ver detalhes →
                      </Link>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-br from-bg-2 to-surface p-10 text-center sm:p-16">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px] pulse-glow" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Veja tudo isso funcionando na sua operação</h2>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 inline-block rounded-full px-8 py-4 text-lg">
              Agende uma demonstração
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
