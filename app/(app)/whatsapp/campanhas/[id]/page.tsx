import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { descobrirRedes } from "@/lib/clientes";
import { montarDestinatarios, limparPendentes } from "../actions";
import { Disparador } from "@/components/whatsapp/disparador";
import { AdicionarClientes } from "@/components/whatsapp/adicionar-clientes";
import { EscolherScript } from "@/components/whatsapp/escolher-script";
import { AdicionarContatosFiltro } from "@/components/whatsapp/adicionar-contatos-filtro";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Campanha · WhatsApp" };

const DISP_BADGE: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  enviado: "bg-emerald-500/15 text-emerald-300",
  falha: "bg-rose-500/15 text-rose-300",
};

type Campanha = {
  id: string;
  nome: string;
  status: string;
  intervalo_segundos: number;
  script_id: string | null;
};
type Disparo = {
  id: string;
  nome: string | null;
  telefone: string;
  status: string;
  erro: string | null;
};

export default async function CampanhaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(["owner", "comercial"]);
  const supabase = await createClient();

  const { data: campRaw } = await supabase
    .from("wa_campanhas")
    .select("id, nome, status, intervalo_segundos, script_id")
    .eq("id", id)
    .maybeSingle();
  const camp = campRaw as Campanha | null;
  if (!camp) notFound();

  const [{ data: scriptRaw }, { data: dispData }, ...counts] = await Promise.all([
    camp.script_id
      ? supabase.from("wa_scripts").select("nome, corpo").eq("id", camp.script_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("wa_disparos")
      .select("id, nome, telefone, status, erro")
      .eq("campanha_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase.from("wa_disparos").select("id", { count: "exact", head: true }).eq("campanha_id", id).eq("status", "enviado"),
    supabase.from("wa_disparos").select("id", { count: "exact", head: true }).eq("campanha_id", id).eq("status", "falha"),
    supabase.from("wa_disparos").select("id", { count: "exact", head: true }).eq("campanha_id", id).eq("status", "pendente"),
  ]);
  const script = scriptRaw as { nome: string; corpo: string } | null;
  // todos os scripts ativos pra escolher na campanha
  const { data: scriptsData } = await supabase
    .from("wa_scripts")
    .select("id, nome, corpo")
    .eq("ativo", true)
    .order("nome");
  const scripts = (scriptsData as { id: string; nome: string; corpo: string }[] | null) ?? [];
  const disparos = (dispData as Disparo[] | null) ?? [];
  const [enviados, falhas, pendentes] = counts.map((c) => c.count ?? 0);
  const total = enviados + falhas + pendentes;

  // opções de filtro para "Adicionar clientes" (só clientes ativos com telefone)
  const { data: cliData } = await supabase
    .from("clients")
    .select("razao_social, nome_fantasia, segmento, uf")
    .eq("ativo", true)
    .not("telefone", "is", null);
  const clientesBase =
    (cliData as { razao_social: string; nome_fantasia: string | null; segmento: string | null; uf: string | null }[] | null) ??
    [];
  const segmentos = [...new Set(clientesBase.map((c) => c.segmento).filter(Boolean) as string[])].sort();
  const ufs = [...new Set(clientesBase.map((c) => c.uf).filter(Boolean) as string[])].sort();
  const redes = descobrirRedes(clientesBase).lista;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <Link
          href="/whatsapp/campanhas"
          className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Campanhas
        </Link>
        <PageHeader title={camp.nome} description={script ? `Script: ${script.nome}` : "Sem script vinculado"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagem</CardTitle>
          <CardDescription>Escolha o script da campanha e edite o texto se precisar.</CardDescription>
        </CardHeader>
        <CardContent>
          {scripts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum script cadastrado ainda. Crie em WhatsApp → Scripts.
            </p>
          ) : (
            <EscolherScript campanhaId={id} scriptIdAtual={camp.script_id} scripts={scripts} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Destinatários</CardTitle>
          <CardDescription>
            {total === 0
              ? "Monte a lista de destinatários a partir dos seus contatos."
              : `${total} destinatário(s) nesta campanha.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <form action={montarDestinatarios.bind(null, id)}>
              <Button type="submit" variant="outline" size="sm">
                <Users className="size-4" /> {total === 0 ? "Montar dos contatos" : "Adicionar novos contatos"}
              </Button>
            </form>
            <AdicionarContatosFiltro campanhaId={id} />
            <AdicionarClientes campanhaId={id} segmentos={segmentos} redes={redes} ufs={ufs} />
            {pendentes > 0 && (
              <form action={limparPendentes.bind(null, id)}>
                <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="size-4" /> Limpar pendentes
                </Button>
              </form>
            )}
          </div>

          {total > 0 && (
            <Disparador
              campanhaId={id}
              intervaloSegundos={camp.intervalo_segundos}
              total={total}
              enviadosIniciais={enviados}
              falhasIniciais={falhas}
              pendentesIniciais={pendentes}
            />
          )}
        </CardContent>
      </Card>

      {disparos.length > 0 && (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disparos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{formatPhone(d.telefone)}</TableCell>
                  <TableCell>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DISP_BADGE[d.status] ?? ""}`}>
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{d.erro ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
