import Image from "next/image";
import Link from "next/link";
import { site, features, steps, faqs, type Plan } from "@/lib/site/site";
import { getPlans } from "@/lib/site/plans";
import { Icon, CheckIcon } from "@/components/site/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";
import { JsonLd } from "@/components/site/json-ld";
import { graph, ORG_ID } from "@/lib/site/schema";

export default async function Home() {
  const plans = await getPlans();
  return (
    <>
      <Hero />
      <StatsStrip />
      <TrustBand />
      <Pain />
      <Features />
      <FieldApp />
      <Gestao />
      <SiteIncluso />
      <HowItWorks />
      <Pricing plans={plans} />
      <Faq />
      <CtaBanner />
      <JsonLdHome plans={plans} />
    </>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="aurora absolute inset-0" />
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-emerald/20 blur-[130px] pulse-glow" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-4 py-1.5 text-xs font-semibold text-emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald pulse-glow" />
            Software de gestão para dedetizadoras
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] sm:text-5xl lg:text-6xl">
            Sua dedetizadora <span className="grad-text">no controle</span>, do orçamento à nota fiscal
          </h1>
          <p className="mt-6 max-w-xl text-lg text-fog">
            Tire a operação do caderno e da planilha. Ordens de serviço no celular, contratos que
            cobram sozinhos e um site que traz clientes — tudo num só lugar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary rounded-full px-7 py-3.5 text-center">
              Agende uma demonstração grátis
            </a>
            <Link href="#funcionalidades" className="btn-ghost rounded-full px-7 py-3.5 text-center">
              Ver como funciona
            </Link>
          </div>
          <p className="mt-5 text-sm text-fog">
            Sem instalar nada · Funciona no celular · <span className="font-semibold text-cream">Site profissional incluso</span>
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      {/* dashboard */}
      <div className="glass rounded-2xl p-3 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1.5 px-2 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-2 text-[11px] text-fog">app.dedetech.com.br</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 px-2">
          {[
            { k: "Contratos ativos", v: "128", c: "+12%" },
            { k: "OS do dia", v: "23", c: "8 feitas" },
            { k: "A receber", v: "R$ 18,4k", c: "este mês" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-line bg-surface/60 p-2.5">
              <div className="text-[9px] text-fog">{s.k}</div>
              <div className="mt-1 font-display text-base font-bold text-cream">{s.v}</div>
              <div className="text-[9px] font-semibold text-emerald">{s.c}</div>
            </div>
          ))}
        </div>
        <div className="p-2">
          <div className="rounded-xl border border-line bg-surface/40 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-cream">
              Faturamento recorrente
              <span className="text-emerald">MRR ↑</span>
            </div>
            <div className="flex h-16 items-end gap-1.5">
              {[35, 45, 40, 58, 52, 68, 75, 82].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-deep to-emerald" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* badges flutuantes */}
      <div className="floaty absolute -left-4 top-20 hidden rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg sm:block">
        <span className="font-semibold text-emerald">✓ Contrato gerado</span>
        <div className="text-[10px] text-fog">Visita agendada automática</div>
      </div>
      <div className="floaty-slow absolute -right-3 bottom-10 hidden rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg sm:block">
        <span className="font-semibold text-emerald">PIX recebido</span>
        <div className="text-[10px] text-fog">Baixa automática no caixa</div>
      </div>
    </div>
  );
}

/* ---------------- STATS ---------------- */
function StatsStrip() {
  const stats = [
    { v: "100%", k: "no celular, até offline" },
    { v: "1 só", k: "sistema do orçamento à NFSe" },
    { v: "Auto", k: "cobrança por boleto e PIX" },
    { v: "+ site", k: "profissional incluso" },
  ];
  return (
    <section className="border-b border-line bg-bg-2">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="px-2 py-8 text-center">
            <div className="font-display text-2xl font-bold text-emerald sm:text-3xl">{s.v}</div>
            <div className="mt-1 text-sm text-fog">{s.k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- TRUST BAND ---------------- */
function TrustBand() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Image src="/fotos/equipe-van.jpg" alt="Equipe de controle de pragas" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/40" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Feito para a operação da sua equipe</h2>
          <p className="mt-4 text-fog">
            Do escritório ao campo, todo mundo na mesma página: o dono acompanha os números, o
            financeiro cobra sozinho e o técnico atende pelo celular. Sem retrabalho, sem papelada.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- GESTÃO ---------------- */
function Gestao() {
  return (
    <section className="border-y border-line bg-bg-2">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2">
        <Reveal delay={0.1} className="order-2 lg:order-1">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-emerald/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-card border border-line shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)]">
              <Image src="/fotos/gestor-laptop.jpg" alt="Gestora acompanhando a dedetizadora no Dedetech" width={1376} height={768} className="w-full object-cover" />
            </div>
            <div className="floaty absolute -bottom-5 -right-4 hidden rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg sm:block">
              <span className="font-semibold text-emerald">MRR +12%</span>
              <div className="text-[10px] text-fog">Receita recorrente no mês</div>
            </div>
          </div>
        </Reveal>
        <Reveal className="order-1 lg:order-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Visão do dono</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">A sua dedetizadora inteira numa tela</h2>
          <p className="mt-4 text-fog">
            Acompanhe contratos, ordens de serviço, caixa e estoque em tempo real. Saiba exatamente
            quanto entra, o que falta cobrar e como anda a equipe — de qualquer lugar.
          </p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {["Fluxo de caixa e DRE", "Receita recorrente (MRR)", "Inadimplência sob controle", "Relatórios e exportações"].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-cream">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- DOR ---------------- */
function Pain() {
  const before = ["Ordens de serviço no papel e no WhatsApp", "Cobrança no caderno e cliente que esquece", "Estoque sem controle de validade e ANVISA", "Receita imprevisível, sem contratos organizados"];
  const after = ["Ficha digital no celular, com foto e assinatura", "Boleto e PIX automáticos, com baixa na hora", "Lotes, validade e FEFO sob controle", "Contratos que geram visitas e cobranças sozinhos"];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Da bagunça do papel ao <span className="grad-text">controle total</span></h2>
        <p className="mt-4 text-fog">Se a sua dedetizadora ainda roda em planilha e caderninho, você está perdendo dinheiro e tempo. O Dedetech organiza tudo.</p>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <Reveal>
          <div className="card rounded-card p-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-fog">Sem o Dedetech</p>
            <ul className="mt-5 space-y-3">
              {before.map((b) => (
                <li key={b} className="flex items-start gap-3 text-fog">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fog/60" />
                  <span className="line-through decoration-fog/40">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card rounded-card p-7 ring-1 ring-emerald/30">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Com o Dedetech</p>
            <ul className="mt-5 space-y-3">
              {after.map((a) => (
                <li key={a} className="flex items-start gap-3 text-cream">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- FEATURES ---------------- */
function Features() {
  return (
    <section id="funcionalidades" className="border-y border-line bg-bg-2">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Funcionalidades</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Tudo o que sua operação precisa</h2>
          <p className="mt-4 text-fog">Do primeiro orçamento à nota fiscal — com a equipe atendendo pelo celular e a gestão na palma da mão.</p>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <StaggerItem key={f.slug} className="h-full">
              <div className={`card group flex h-full flex-col overflow-hidden rounded-card ${f.highlight ? "ring-1 ring-emerald/40" : ""}`}>
                {f.image && (
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
                    <Image src={f.image} alt={f.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{f.name}</h3>
                  <p className="mt-2 text-sm text-fog">{f.short}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------- FIELD APP ---------------- */
function FieldApp() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald">No campo</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">O técnico atende pelo celular — até sem internet</h2>
          <p className="mt-4 text-fog">A ficha de visita é preenchida na hora, com praga, produtos, foto, assinatura e GPS. Sincroniza sozinha quando a rede voltar, e dispara certificado, cobrança e nota.</p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {["Foto e assinatura do cliente", "Geolocalização do atendimento", "Produtos com lote e validade", "Certificado gerado na hora"].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-cream">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-emerald/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-card border border-line shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)]">
              <Image src="/fotos/tecnico-app.jpg" alt="Técnico de controle de pragas preenchendo a ficha de visita no celular" width={1376} height={768} className="w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
            </div>
            <div className="floaty absolute -bottom-6 -left-4 hidden w-44 overflow-hidden rounded-xl border border-line shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9)] sm:block">
              <Image src="/fotos/mao-celular.jpg" alt="App de campo do Dedetech em uso" width={352} height={196} className="w-full object-cover" />
            </div>
            <div className="floaty-slow absolute -top-4 right-6 hidden rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg sm:block">
              <span className="font-semibold text-emerald">✓ Sincronizado</span>
              <div className="text-[10px] text-fog">Certificado + cobrança disparados</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- SITE INCLUSO ---------------- */
function SiteIncluso() {
  return (
    <section className="relative overflow-hidden border-y border-line">
      <div className="aurora absolute inset-0 opacity-80" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald/15 px-4 py-1.5 text-xs font-semibold text-emerald">
            Diferencial Dedetech
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl">
            Seu sistema já vem com um <span className="grad-text">site que capta clientes</span>
          </h2>
          <p className="mt-4 text-fog">
            Além de gerir tudo por dentro, cada empresa ganha um site profissional, otimizado para o
            Google, com seus serviços e cidades atendidas — e os pedidos caem direto no seu funil.
          </p>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 inline-block rounded-full px-7 py-3.5">
            Quero meu site + sistema
          </a>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Otimizado para o Google (SEO)", "Páginas por serviço e cidade", "Formulário que vira lead", "Sua marca e seus contatos"].map((t) => (
              <div key={t} className="glass rounded-xl p-4 text-sm text-cream">
                <CheckIcon className="mb-2 h-5 w-5 text-emerald" />
                {t}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Como funciona</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Comece em minutos, cresça no automático</h2>
      </Reveal>
      <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <StaggerItem key={s.n}>
            <div className="card rounded-card p-7">
              <div className="font-display text-4xl font-bold text-emerald/40">{s.n}</div>
              <h3 className="mt-3 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-fog">{s.d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ---------------- PRICING ---------------- */
function Pricing({ plans }: { plans: Plan[] }) {
  return (
    <section id="precos" className="border-y border-line bg-bg-2">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Planos</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Um plano para cada tamanho de operação</h2>
          <p className="mt-4 text-fog">Sem fidelidade. Cancele quando quiser. Site profissional incluso em todos.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`card relative flex flex-col rounded-card p-7 ${p.highlight ? "ring-2 ring-emerald shadow-[0_0_0_1px_rgba(18,206,142,0.4),0_30px_60px_-25px_rgba(18,206,142,0.4)]" : ""}`}>
              {p.highlight && <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-emerald-deep to-emerald px-3 py-1 text-xs font-bold text-[#04140d]">Mais popular</span>}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
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
              <a href={p.ctaHref ?? site.whatsapp} target="_blank" rel="noopener noreferrer" className={`mt-7 rounded-full px-6 py-3 text-center text-sm ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Perguntas frequentes</h2>
      <div className="mt-10 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="card group rounded-xl p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
              {f.q}
              <span className="text-emerald transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-fog">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-br from-bg-2 to-surface p-10 text-center sm:p-16">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px] pulse-glow" />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Pronto para tirar sua dedetizadora do papel?</h2>
          <p className="mx-auto mt-4 max-w-xl text-fog">Agende uma demonstração gratuita e veja o Dedetech funcionando na sua operação — em menos de 30 minutos.</p>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 inline-block rounded-full px-8 py-4 text-lg">
            Agende uma demonstração
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- JSON-LD ---------------- */
function JsonLdHome({ plans }: { plans: Plan[] }) {
  const software = {
    "@type": "SoftwareApplication",
    "@id": `${site.url}/#software`,
    name: site.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: site.description,
    url: site.url,
    publisher: { "@id": ORG_ID },
    offers: plans.map((p) => ({ "@type": "Offer", name: p.name, price: p.price.replace(/[^\d]/g, ""), priceCurrency: "BRL" })),
  };
  const faqPage = {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return <JsonLd data={graph(software, faqPage)} />;
}
