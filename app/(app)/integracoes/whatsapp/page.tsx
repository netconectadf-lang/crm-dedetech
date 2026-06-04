import Link from "next/link";
import { MessageCircle, ArrowLeft, AlertTriangle } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { evolutionConfigured, getConnectionState } from "@/lib/whatsapp/evolution";
import { WhatsappConnect } from "@/components/integracoes/whatsapp-connect";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "WhatsApp · Integrações" };

export default async function WhatsappPage() {
  await requireRole(["owner"]);
  const configured = evolutionConfigured();
  const state = configured ? await getConnectionState() : "unknown";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <Link
          href="/integracoes"
          className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Integrações
        </Link>
        <PageHeader title="WhatsApp" description="Conecte o número da empresa para enviar cobranças, lembretes e certificados." />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" />
            <CardTitle className="text-base">Conectar número de WhatsApp</CardTitle>
          </div>
          <CardDescription>
            Use um número dedicado da empresa. Conectar via QR Code é como o <strong>WhatsApp Web</strong> —
            o aparelho precisa ficar com internet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configured ? (
            <WhatsappConnect initialState={state} />
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
              <AlertTriangle className="size-4" />
              Integração de WhatsApp ainda não configurada nesta instância. Fale com o suporte do Dedetech.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
