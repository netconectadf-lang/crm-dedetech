import type { Metadata } from "next";
import Link from "next/link";
import {
  KanbanSquare,
  FileSignature,
  ClipboardList,
  Boxes,
  Radar,
  Wallet,
  ShieldCheck,
  Smartphone,
  Cloud,
  Building2,
  ArrowRight,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { publicSiteUrl } from "@/lib/public-url";

export const metadata: Metadata = {
  title: { absolute: "Dedetech — Sistema de gestão para dedetizadoras" },
  description:
    "Tire a dedetizadora do caderno e do WhatsApp. Funil de vendas, contratos recorrentes, ordens de serviço no celular, estoque rastreável, MIP com QR Code e financeiro num só sistema.",
  alternates: { canonical: "/" },
};

const BENEFITS = [
  {
    icon: KanbanSquare,
    title: "Funil de vendas + orçamento",
    desc: "Acompanhe cada lead do primeiro contato ao contrato fechado e gere orçamentos em segundos, sem perder negócio no WhatsApp.",
  },
  {
    icon: FileSignature,
    title: "Contratos recorrentes",
    desc: "Transforme serviços avulsos em receita previsível. O sistema agenda as visitas e mostra seu faturamento recorrente (MRR) em tempo real.",
  },
  {
    icon: ClipboardList,
    title: "Ordem de serviço no campo",
    desc: "O técnico executa pelo celular, registra a ficha técnica e emite certificado e comprovante na hora — mesmo sem internet.",
  },
  {
    icon: Boxes,
    title: "Estoque rastreável",
    desc: "Controle produtos por lote e validade (FEFO), saiba o que sai em cada OS e nunca mais aplique um defensivo vencido.",
  },
  {
    icon: Radar,
    title: "MIP com QR Code",
    desc: "Monitoramento integrado de pragas com leitura por QR nos pontos de isca e laudo técnico pronto para o cliente e a vigilância.",
  },
  {
    icon: Wallet,
    title: "Financeiro & cobrança",
    desc: "Contas a pagar e receber, inadimplência, cobrança automática e portal do cliente — o caixa da operação sob controle.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Cadastre clientes e serviços",
    desc: "Importe sua carteira e defina seus serviços, preços e periodicidades.",
  },
  {
    n: "2",
    title: "Feche contratos e gere as OS",
    desc: "Os contratos recorrentes agendam sozinhos as ordens de serviço.",
  },
  {
    n: "3",
    title: "A equipe executa no celular",
    desc: "Ficha técnica, certificado e MIP registrados no campo, com ou sem sinal.",
  },
  {
    n: "4",
    title: "Acompanhe tudo no dashboard",
    desc: "Recorrência, financeiro, estoque e alertas operacionais num só lugar.",
  },
];

const FAQ = [
  {
    q: "Preciso instalar algum programa?",
    a: "Não. O Dedetech roda no navegador, em qualquer computador. No campo, o técnico usa pelo celular como um aplicativo (PWA), sem precisar baixar nada da loja.",
  },
  {
    q: "Funciona offline durante o serviço?",
    a: "Sim. A ordem de serviço foi feita para o campo: o técnico preenche a ficha, coleta assinatura e emite o certificado mesmo sem internet, e tudo sincroniza quando o sinal volta.",
  },
  {
    q: "Atende à LGPD?",
    a: "Sim. O sistema tem registro de consentimento, trilha de auditoria de quem acessou cada dado e controle de acesso por papel (comercial, técnico, financeiro, RH).",
  },
  {
    q: "Serve para mais de uma empresa ou unidade?",
    a: "Sim. O Dedetech é multiempresa: você administra várias filiais ou CNPJs na mesma conta, com os dados de cada uma isolados e seguros.",
  },
  {
    q: "Os dados são meus?",
    a: "Sempre. Seus dados ficam na nuvem, seguros e disponíveis para exportação quando você quiser. Você nunca fica refém do sistema.",
  },
];

const SITE_URL = publicSiteUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Dedetech",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Sistema de gestão para empresas de controle de pragas: funil, contratos recorrentes, ordens de serviço no celular, estoque rastreável, MIP com QR Code e financeiro.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
        description: "Crie sua conta e comece a usar.",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_18px_-2px_var(--color-primary)]">
        D
      </span>
      <span className="font-semibold tracking-tight">
        Dedetech
        <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          crm
        </span>
      </span>
    </span>
  );
}

export default function MarketingHome() {
  return (
    <div className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Começar agora</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
            Sistema para dedetizadoras
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Tire a dedetizadora do caderno e do WhatsApp
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            O Dedetech reúne funil de vendas, contratos recorrentes, ordens de
            serviço no celular, estoque rastreável, MIP com QR Code e financeiro
            num só sistema — feito para o controle de pragas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Começar agora <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>

          {/* Trust strip — sem números fabricados */}
          <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {[
              { icon: Smartphone, t: "App de campo (PWA, offline)" },
              { icon: Building2, t: "Multiempresa" },
              { icon: ShieldCheck, t: "Conforme a LGPD" },
              { icon: Cloud, t: "Seus dados na nuvem" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Dor */}
        <section className="border-y border-border/60 bg-card/30">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Gerenciar dedetização no improviso custa caro
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                "Agendamentos espalhados no WhatsApp e na cabeça do dono — visita esquecida é cliente perdido.",
                "Certificado, ficha técnica e laudo de MIP feitos na mão, sem padrão e sem histórico.",
                "Sem visão da recorrência nem do financeiro: você não sabe quanto entra todo mês.",
              ].map((dor) => (
                <p
                  key={dor}
                  className="rounded-xl border border-border/60 bg-card/60 p-5 text-sm text-muted-foreground"
                >
                  {dor}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Tudo o que a operação precisa, num só lugar
            </h2>
            <p className="mt-3 text-muted-foreground">
              Do primeiro orçamento ao laudo entregue — comercial, campo e
              financeiro conectados.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl border border-border/60 bg-card/80 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_var(--color-primary)]"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-y border-border/60 bg-card/30">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Como funciona
            </h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="relative">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_18px_-4px_var(--color-primary)]">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-6 py-20">
          <h2 className="text-center text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Perguntas frequentes
          </h2>
          <dl className="mt-10 divide-y divide-border/60">
            {FAQ.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="flex items-start gap-2 font-medium">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f.q}
                </dt>
                <dd className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA final */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-10 text-center sm:p-14">
            <h2 className="mx-auto max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Comece a organizar sua dedetizadora hoje
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Crie sua conta em minutos e leve comercial, campo e financeiro para
              o mesmo lugar.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Criar minha conta <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Criar conta
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dedetech · Gestão sem pragas
          </p>
        </div>
      </footer>
    </div>
  );
}
