import Link from "next/link";
import { ScanSearch, Sparkles, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { findMessages, evolutionConfigured } from "@/lib/whatsapp/evolution";
import { pontuarConversa } from "@/lib/whatsapp/leads";
import { CriarClienteLead } from "@/components/whatsapp/criar-cliente-lead";
import { PageHeader } from "@/components/app/page-header";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { Badge } from "@/components/ui/badge";
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

export const metadata = { title: "Leads do WhatsApp" };
export const dynamic = "force-dynamic";

const MAX_LINHAS = 100;

const ajuda = (
  <AjudaTela
    titulo="Como funciona os Leads do WhatsApp"
    descricao="Encontra, nas suas conversas, quem falou de praga/serviço e vira cliente — sem custo (busca por palavras-chave, nada vai para fora)."
    topicos={[
      {
        titulo: "Analisar",
        itens: [
          "Clique em 'Analisar conversas' — o sistema lê as mensagens recebidas das conversas individuais.",
          "Procura palavras de praga (barata, cupim, rato…), serviço (dedetização, caixa d'água…) e intenção (orçamento, valor, agendar…).",
          "Quanto mais palavras, maior a relevância (pontuação).",
        ],
      },
      {
        titulo: "Revisar e criar cliente",
        itens: [
          "Veja o nome, telefone, as palavras que bateram e um trecho da conversa.",
          "Quem já é cliente aparece marcado.",
          "Clique em 'Criar cliente' nos que fizerem sentido — vira um cliente PF com origem WhatsApp.",
        ],
      },
    ]}
    dica="Só são analisadas mensagens RECEBIDAS — assim suas campanhas/avisos não viram falso-positivo."
  />
);

type Candidato = {
  telefone: string;
  nome: string;
  score: number;
  matched: string[];
  snippet: string;
  total: number;
  jaCliente: boolean;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ go?: string }>;
}) {
  await requireRole(["owner", "comercial"]);
  const { go } = await searchParams;

  if (!go) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
        <PageHeader
          title="Leads do WhatsApp"
          description="Transforme conversas sobre dedetização/serviço em clientes."
          action={ajuda}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analisar conversas</CardTitle>
            <CardDescription>
              Lê as mensagens recebidas no WhatsApp e identifica quem falou de praga, serviço
              ou pediu orçamento. Sem custo — roda no servidor por palavras-chave.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/whatsapp/leads?go=1">
                <ScanSearch className="size-4" /> Analisar conversas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // --- roda a análise ---
  const supabase = await createClient();
  const conectado = evolutionConfigured();
  const mensagens = conectado ? await findMessages(5000) : [];

  // agrupa mensagens RECEBIDAS por telefone
  const grupos = new Map<string, { telefone: string; nome: string; textos: string[] }>();
  for (const m of mensagens) {
    if (m.fromMe) continue;
    let g = grupos.get(m.telefone);
    if (!g) {
      g = { telefone: m.telefone, nome: m.pushName, textos: [] };
      grupos.set(m.telefone, g);
    }
    if (!g.nome && m.pushName) g.nome = m.pushName;
    g.textos.push(m.texto);
  }

  // telefones que já são clientes
  const { data: cliTel } = await supabase
    .from("clients")
    .select("telefone")
    .not("telefone", "is", null);
  const telSet = new Set(
    ((cliTel as { telefone: string }[] | null) ?? []).map((c) => c.telefone.replace(/\D/g, "")),
  );

  const candidatos: Candidato[] = [];
  for (const g of grupos.values()) {
    const { score, matched } = pontuarConversa(g.textos.join("\n"));
    if (score <= 0) continue;
    const snippet =
      g.textos.find((t) => pontuarConversa(t).score > 0) ?? g.textos[g.textos.length - 1] ?? "";
    const local = g.telefone.startsWith("55") && g.telefone.length >= 12 ? g.telefone.slice(2) : g.telefone;
    candidatos.push({
      telefone: g.telefone,
      nome: g.nome || `WhatsApp ${local}`,
      score,
      matched,
      snippet,
      total: g.textos.length,
      jaCliente: telSet.has(g.telefone) || telSet.has(local),
    });
  }
  candidatos.sort((a, b) => b.score - a.score);
  const novos = candidatos.filter((c) => !c.jaCliente);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Leads do WhatsApp"
        description={`${candidatos.length} conversa(s) com indício de serviço · ${novos.length} ainda não são clientes.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {ajuda}
            <Button asChild variant="outline" size="sm">
              <Link href="/whatsapp/leads?go=1">
                <Sparkles className="size-4" /> Analisar de novo
              </Link>
            </Button>
          </div>
        }
      />

      {!conectado ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-amber-300">
            <AlertTriangle className="size-4" /> WhatsApp não está conectado — conecte em Integrações → WhatsApp.
          </CardContent>
        </Card>
      ) : candidatos.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Nenhuma conversa recente com indício de dedetização/serviço. (São analisadas as ~5.000 mensagens mais recentes.)
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Sinais</TableHead>
                  <TableHead className="hidden lg:table-cell">Trecho</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatos.slice(0, MAX_LINHAS).map((c) => (
                  <TableRow key={c.telefone} className={c.jaCliente ? "opacity-55" : undefined}>
                    <TableCell className="font-medium">
                      {c.nome}
                      <span className="block font-mono text-xs text-muted-foreground">
                        {formatPhone(c.telefone.startsWith("55") ? c.telefone.slice(2) : c.telefone)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge className="bg-primary/15 text-primary">{c.score} pts</Badge>
                        {c.matched.slice(0, 4).map((w) => (
                          <Badge key={w} variant="secondary" className="text-xs">{w}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-md truncate text-xs text-muted-foreground lg:table-cell">
                      {c.snippet}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.jaCliente ? (
                        <Badge variant="outline">já é cliente</Badge>
                      ) : (
                        <CriarClienteLead nome={c.nome} telefone={c.telefone} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
