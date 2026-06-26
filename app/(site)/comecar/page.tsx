import type { Metadata } from "next";
import { site } from "@/lib/site/site";
import { ComecarForm } from "@/components/site/comecar-form";
import { Reveal } from "@/components/site/motion";

export const metadata: Metadata = {
  title: "Começar grátis",
  description:
    "Crie a conta da sua dedetizadora no Dedetech e comece o teste grátis: ordens de serviço, contratos, estoque ANVISA, financeiro e nota fiscal em um só lugar.",
  alternates: { canonical: `${site.url}/comecar` },
  robots: { index: false, follow: true },
};

export default function Comecar() {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora absolute inset-0" />
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2">
        <Reveal>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Teste grátis</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
              Comece sua dedetizadora <span className="grad-text">sem pragas</span> hoje
            </h1>
            <p className="mt-5 max-w-md text-lg text-fog">
              Crie sua conta em minutos. Sem cartão de crédito. Ordens de serviço no celular,
              contratos recorrentes, estoque ANVISA, financeiro e nota fiscal — tudo integrado.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cream">
              <li>✓ Site profissional já incluso</li>
              <li>✓ Suporte humano em português</li>
              <li>✓ Migração e onboarding sem dor</li>
            </ul>
          </div>
        </Reveal>
        <Reveal>
          <ComecarForm />
        </Reveal>
      </div>
    </section>
  );
}
