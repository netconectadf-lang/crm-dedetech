import Link from "next/link";
import {
  MessageCircle,
  Send,
  Mail,
  FileBadge,
  Building2,
  Workflow,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { resumoCertificado } from "@/lib/nfse-gov/store";
import { evolutionConfigured, getConnectionState } from "@/lib/whatsapp/evolution";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Integrações" };

type Status = "conectado" | "disponivel" | "em-breve";

const STATUS_BADGE: Record<Status, { label: string; tone: string }> = {
  conectado: { label: "Conectado", tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25" },
  disponivel: { label: "Disponível", tone: "bg-sky-500/15 text-sky-300 ring-sky-500/25" },
  "em-breve": { label: "Em breve", tone: "bg-muted text-muted-foreground ring-border/60" },
};

type Integracao = {
  key: string;
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  href?: string;
  status: Status;
};

export default async function IntegracoesPage() {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const { data: tg } = await supabase
    .from("telegram_integrations")
    .select("enabled")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const telegramConectado = Boolean((tg as { enabled: boolean } | null)?.enabled);

  const certNfse = await resumoCertificado(ctx.tenantId);

  const whatsappConfig = evolutionConfigured();
  const whatsappState = whatsappConfig ? await getConnectionState() : "unknown";

  const integracoes: Integracao[] = [
    {
      key: "whatsapp",
      icon: MessageCircle,
      titulo: "WhatsApp",
      descricao: "Envie cobranças, lembretes de visita e certificados direto pro cliente.",
      href: whatsappConfig ? "/integracoes/whatsapp" : undefined,
      status: whatsappState === "open" ? "conectado" : whatsappConfig ? "disponivel" : "em-breve",
    },
    {
      key: "telegram",
      icon: Send,
      titulo: "Telegram",
      descricao: "A equipe lança despesas e envia pedidos em PDF pelo bot.",
      href: "/integracoes/telegram",
      status: telegramConectado ? "conectado" : "disponivel",
    },
    {
      key: "email",
      icon: Mail,
      titulo: "E-mail",
      descricao: "Envio de notas, propostas e avisos por e-mail. (ainda faremos)",
      status: "em-breve",
    },
    {
      key: "nfse",
      icon: FileBadge,
      titulo: "NFS-e Nacional",
      descricao: "Emita nota fiscal de serviço pelo Sistema Nacional (gov.br). Certificado A1 da empresa.",
      href: "/integracoes/nfse",
      status: certNfse ? "conectado" : "disponivel",
    },
    {
      key: "cnpj",
      icon: Building2,
      titulo: "Cartão CNPJ",
      descricao: "Documento fiscal da empresa para conferência do cadastro.",
      status: "em-breve",
    },
    {
      key: "trilogo",
      icon: Workflow,
      titulo: "Trílogo (Bluefit)",
      descricao: "Importa chamados de manutenção e gera ordens de serviço automaticamente.",
      href: "/integracoes/trilogo",
      status: "disponivel",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Integrações" description="Conecte serviços externos à sua empresa." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {integracoes.map((item) => {
          const Icon = item.icon;
          const badge = STATUS_BADGE[item.status];
          return (
            <Card key={item.key} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                    <Icon className="size-5" />
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.tone}`}>
                    {badge.label}
                  </span>
                </div>
                <CardTitle className="text-base">{item.titulo}</CardTitle>
                <CardDescription>{item.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                {item.href ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={item.href}>
                      {item.status === "conectado" ? "Gerenciar" : "Configurar"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Em breve
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
