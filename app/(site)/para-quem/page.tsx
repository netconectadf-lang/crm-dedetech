import type { Metadata } from "next";
import { site, segments, clientTypes } from "@/lib/site/site";
import { Icon, CheckIcon } from "@/components/site/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";

export const metadata: Metadata = {
  title: "Para quem é o Dedetech",
  description:
    "Do autônomo à operação com frota e contratos corporativos. Veja como o Dedetech atende cada tamanho de dedetizadora e cada tipo de cliente.",
  alternates: { canonical: `${site.url}/para-quem` },
};

export default function ParaQuem() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora absolute inset-0" />
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Para quem é</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
              Feito para a <span className="grad-text">sua dedetizadora</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-fog">
              Do autônomo que está começando à operação com frota e contratos corporativos — o
              Dedetech cresce junto com você.
            </p>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 inline-block rounded-full px-7 py-3.5">
              Agende uma demonstração
            </a>
          </Reveal>
        </div>
      </section>

      {/* Pelo tamanho */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Pelo tamanho da sua empresa</h2>
            <p className="mt-3 text-fog">Escolha onde você está hoje — e suba de plano quando crescer.</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 lg:grid-cols-3">
            {segments.map((s) => (
              <StaggerItem key={s.name} className="h-full">
                <div className="card flex h-full flex-col rounded-card p-7">
                  <span className="w-fit rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">Plano {s.plan}</span>
                  <h3 className="mt-4 font-display text-xl font-bold">{s.name}</h3>
                  <p className="mt-2 text-sm text-fog">{s.desc}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-cream">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {p}
                      </li>
                    ))}
                  </ul>
                  <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-7 rounded-full px-6 py-3 text-center text-sm">
                    Falar sobre o {s.plan}
                  </a>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Pelo tipo de cliente */}
      <section className="bg-bg-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Pelo tipo de cliente que você atende</h2>
            <p className="mt-3 text-fog">O Dedetech tem o que cada segmento exige — do residencial à indústria.</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {clientTypes.map((c) => (
              <StaggerItem key={c.name} className="h-full">
                <div className="card flex h-full flex-col rounded-card p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    <Icon name={c.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold">{c.name}</h3>
                  <p className="mt-2 text-sm text-fog">{c.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-br from-bg-2 to-surface p-10 text-center sm:p-16">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px] pulse-glow" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Não sabe qual plano é o seu?</h2>
            <p className="mx-auto mt-4 max-w-xl text-fog">A gente te ajuda a escolher em uma conversa rápida — sem compromisso.</p>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 inline-block rounded-full px-8 py-4 text-lg">
              Falar com a gente
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
