import type { Metadata } from "next";
import { site } from "@/lib/site/site";
import { ContatoForm } from "@/components/site/contato-form";
import { Reveal } from "@/components/site/motion";

export const metadata: Metadata = {
  title: "Fale com a gente",
  description:
    "Agende uma demonstração do Dedetech e veja como organizar sua dedetizadora: ordens de serviço, contratos, estoque ANVISA e financeiro em um só sistema.",
  alternates: { canonical: `${site.url}/contato` },
};

export default function Contato() {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora absolute inset-0" />
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2">
        <Reveal>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Demonstração</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
              Vamos organizar sua <span className="grad-text">dedetizadora</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-fog">
              Deixe seus dados que a equipe Dedetech entra em contato para mostrar o sistema
              na prática e tirar suas dúvidas. Prefere agora? Chame no WhatsApp.
            </p>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-7 inline-block rounded-full px-7 py-3.5">
              Falar no WhatsApp: {site.phone}
            </a>
          </div>
        </Reveal>
        <Reveal>
          <ContatoForm />
        </Reveal>
      </div>
    </section>
  );
}
