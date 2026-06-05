import Link from "next/link";
import {
  KanbanSquare,
  FileText,
  FileSignature,
  ClipboardList,
  Wallet,
  ArrowDownCircle,
  Receipt,
  MessageSquareHeart,
  Building2,
  Wrench,
  SprayCan,
  Boxes,
  Bug,
  IdCard,
  Handshake,
  Truck,
  Landmark,
  Package,
  Clock,
  ShieldCheck,
  Megaphone,
  MapPin,
  LifeBuoy,
  Radar,
  Plug,
  MessageCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Guia do sistema" };

const COR: Record<string, string> = {
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  indigo: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  sky: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  cyan: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  rose: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

type Etapa = { n: number; icon: LucideIcon; cor: keyof typeof COR | string; titulo: string; href: string; desc: string };

const JORNADA: Etapa[] = [
  { n: 1, icon: KanbanSquare, cor: "violet", titulo: "Funil comercial", href: "/funil", desc: "Captou um contato? Cadastre o lead e arraste pelas etapas (contato → diagnóstico → orçamento → negociação) até Ganho." },
  { n: 2, icon: FileText, cor: "indigo", titulo: "Orçamento", href: "/orcamentos", desc: "Monte a proposta com itens e valores e envie ao cliente (link da proposta). Ao ser aceito, vira Ordem de Serviço ou Contrato." },
  { n: 3, icon: FileSignature, cor: "amber", titulo: "Contrato (recorrente)", href: "/contratos", desc: "Para serviços que se repetem (mensal, trimestral…). Define periodicidade, vigência e dia de faturamento — gera as visitas e cobranças automaticamente." },
  { n: 4, icon: ClipboardList, cor: "emerald", titulo: "Ordem de Serviço", href: "/os", desc: "Agende, atribua o técnico/veículo (ou um prestador terceirizado) e registre a execução em campo: pragas, produtos, assinatura do cliente. Depois finalize." },
  { n: 5, icon: Wallet, cor: "sky", titulo: "Custos & Margem", href: "/os", desc: "Ao finalizar a OS, o sistema dá baixa no estoque e apura o custo (produtos + combustível + mão de obra) e a margem do serviço." },
  { n: 6, icon: ArrowDownCircle, cor: "cyan", titulo: "Cobrança", href: "/financeiro/receber", desc: "Gere a cobrança da OS no Financeiro → A receber e receba via PIX ou boleto. O saldo e o fluxo de caixa atualizam sozinhos." },
  { n: 7, icon: Receipt, cor: "rose", titulo: "Nota fiscal (NFS-e)", href: "/notas", desc: "Emita a nota fiscal de serviço a partir da cobrança, pelo Sistema Nacional NFS-e (gov.br). Baixe o DANFSe para o cliente." },
  { n: 8, icon: MessageSquareHeart, cor: "emerald", titulo: "Pós-venda & fidelização", href: "/comunicacao", desc: "Pesquisa de satisfação (NPS) automática após a OS + lembretes por WhatsApp: revisão chegando, contrato a vencer e aniversário do cliente." },
];

type Atalho = { icon: LucideIcon; label: string; href: string };

const CADASTROS: Atalho[] = [
  { icon: Building2, label: "Clientes", href: "/clientes" },
  { icon: Wrench, label: "Serviços", href: "/servicos" },
  { icon: SprayCan, label: "Produtos", href: "/produtos" },
  { icon: Boxes, label: "Estoque", href: "/estoque" },
  { icon: Bug, label: "Pragas", href: "/pragas" },
  { icon: Package, label: "Fornecedores", href: "/fornecedores" },
  { icon: IdCard, label: "Funcionários", href: "/funcionarios" },
  { icon: Handshake, label: "Prestadores", href: "/prestadores" },
  { icon: Truck, label: "Veículos", href: "/veiculos" },
  { icon: Landmark, label: "Plano de Contas", href: "/plano-de-contas" },
  { icon: Clock, label: "Folha de ponto", href: "/folha-de-ponto" },
  { icon: ShieldCheck, label: "Conformidade", href: "/rh" },
];

const OPERACAO: Atalho[] = [
  { icon: Radar, label: "MIP / Monitoramento", href: "/mip" },
  { icon: MapPin, label: "Mapa da operação", href: "/mapa" },
  { icon: LifeBuoy, label: "Chamados", href: "/chamados" },
  { icon: Megaphone, label: "Campanhas WhatsApp", href: "/whatsapp/campanhas" },
];

const INTEGRACOES: Atalho[] = [
  { icon: Plug, label: "Hub de Integrações", href: "/integracoes" },
  { icon: MessageCircle, label: "WhatsApp", href: "/integracoes/whatsapp" },
  { icon: Receipt, label: "NFS-e (gov.br)", href: "/integracoes/nfse" },
  { icon: ClipboardList, label: "Trílogo (Bluefit)", href: "/integracoes/trilogo" },
];

function Atalhos({ titulo, itens }: { titulo: string; itens: Atalho[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {itens.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Icon className="size-4 shrink-0 text-primary" />
                <span className="truncate group-hover:text-foreground">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AjudaPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Guia do sistema"
        description="Entenda o fluxo completo do Dedetech — do primeiro contato ao pós-venda — e o que cada módulo faz."
      />

      {/* Jornada principal */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          A jornada (passo a passo)
        </h2>
        <ol className="relative space-y-3">
          {JORNADA.map((e, i) => {
            const Icon = e.icon;
            const ultimo = i === JORNADA.length - 1;
            return (
              <li key={e.n} className="relative flex gap-4">
                {!ultimo && (
                  <span className="absolute left-[19px] top-12 h-[calc(100%-1rem)] w-px bg-border" aria-hidden />
                )}
                <span
                  className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ${COR[e.cor] ?? COR.emerald}`}
                >
                  {e.n}
                </span>
                <Card className="flex-1">
                  <CardContent className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <Icon className="size-4 shrink-0 text-primary" /> {e.titulo}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
                    </div>
                    <Link
                      href={e.href}
                      className="inline-flex shrink-0 items-center gap-1 self-center rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      Abrir <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <Atalhos titulo="Cadastros de apoio" itens={CADASTROS} />
      <Atalhos titulo="Operação & comunicação" itens={OPERACAO} />
      <Atalhos titulo="Integrações" itens={INTEGRACOES} />

      <p className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        💡 Em cada tela há o botão <span className="font-medium text-foreground">“Como funciona”</span> com a explicação
        detalhada daquele módulo. Este guia mostra como tudo se conecta.
      </p>
    </main>
  );
}
