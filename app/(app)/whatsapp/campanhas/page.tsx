import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { excluirCampanha } from "./actions";
import { NovaCampanha } from "@/components/whatsapp/nova-campanha";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { DeleteButton } from "@/components/app/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Campanhas · WhatsApp" };

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
  rascunho: { label: "Rascunho", tone: "bg-muted text-muted-foreground ring-border/60" },
  enviando: { label: "Enviando", tone: "bg-sky-500/15 text-sky-300 ring-sky-500/25" },
  pausada: { label: "Pausada", tone: "bg-amber-500/15 text-amber-300 ring-amber-500/25" },
  concluida: { label: "Concluída", tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25" },
};

type Campanha = {
  id: string;
  nome: string;
  status: string;
  total_contatos: number;
  enviados: number;
  falhas: number;
  wa_scripts: { nome: string } | { nome: string }[] | null;
};

export default async function CampanhasPage() {
  await requireRole(["owner", "comercial", "financeiro"]);
  const supabase = await createClient();

  const [{ data: campData }, { data: scriptData }] = await Promise.all([
    supabase
      .from("wa_campanhas")
      .select("id, nome, status, total_contatos, enviados, falhas, wa_scripts(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("wa_scripts").select("id, nome").eq("ativo", true).order("nome"),
  ]);
  const campanhas = (campData as Campanha[] | null) ?? [];
  const scripts = (scriptData as { id: string; nome: string }[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Campanhas"
        description="Dispare mensagens em massa pelo WhatsApp, com intervalo entre os envios."
        count={campanhas.length}
        action={<NovaCampanha scripts={scripts} />}
      />

      {scripts.length === 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Crie um <Link href="/whatsapp/scripts" className="underline">script</Link> antes de montar uma campanha.
        </p>
      )}

      {campanhas.length === 0 ? (
        <EmptyState title="Nenhuma campanha ainda" description="Crie uma campanha para disparar mensagens aos seus contatos." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campanhas.map((c) => {
            const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.rascunho;
            const script = Array.isArray(c.wa_scripts) ? c.wa_scripts[0] : c.wa_scripts;
            const pct = c.total_contatos > 0 ? Math.round(((c.enviados + c.falhas) / c.total_contatos) * 100) : 0;
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{c.nome}</CardTitle>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.tone}`}>
                      {badge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{script?.nome ?? "Sem script"}</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {c.enviados + c.falhas}/{c.total_contatos} enviados
                  </p>
                  <div className="flex justify-between">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/whatsapp/campanhas/${c.id}`}>
                        Abrir <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <DeleteButton nome={c.nome} action={excluirCampanha.bind(null, c.id)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
