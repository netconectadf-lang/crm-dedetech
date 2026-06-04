import Link from "next/link";
import { Send, CircleCheck, Ban, Check, AlertTriangle, ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { aprovarChat, bloquearChat, removerChat, desconectarBot } from "./actions";
import { ConectarBot } from "@/components/integracoes/conectar-bot";
import { AjudaTelegram } from "@/components/integracoes/ajuda-telegram";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/app/delete-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Telegram · Integrações" };

const CHAT_BADGE: Record<string, { label: string; tone: string }> = {
  pendente: { label: "Pendente", tone: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25" },
  aprovado: { label: "Aprovado", tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25" },
  bloqueado: { label: "Bloqueado", tone: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25" },
};

export default async function TelegramPage() {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const [{ data: intData }, { data: chatsData }] = await Promise.all([
    supabase.from("telegram_integrations").select("bot_username, enabled").eq("tenant_id", ctx.tenantId).maybeSingle(),
    supabase.from("telegram_chats").select("id, chat_id, nome, status, created_at").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }),
  ]);
  const integ = intData as { bot_username: string | null; enabled: boolean } | null;
  const chats = (chatsData as { id: string; chat_id: string; nome: string | null; status: string; created_at: string }[] | null) ?? [];
  const pendentes = chats.filter((c) => c.status === "pendente").length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <Link
          href="/integracoes"
          className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Integrações
        </Link>
        <PageHeader title="Telegram" description="Lance despesas e envie pedidos em PDF direto pelo bot." />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Send className="size-5 text-primary" />
              <CardTitle className="text-base">Telegram — lançar despesas e pedidos</CardTitle>
            </div>
            <AjudaTelegram />
          </div>
          <CardDescription>
            Crie um bot no <strong>@BotFather</strong> (mande <code>/newbot</code>), copie o token e cole aqui.
            Depois sua equipe lança despesas (<code>gasolina 150</code>) e envia pedidos em PDF direto pelo Telegram.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!integ ? (
            <ConectarBot />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/25 bg-primary/8 px-4 py-3">
                <span className="flex items-center gap-2 text-sm">
                  <CircleCheck className="size-5 text-primary" />
                  Bot conectado: <strong>@{integ.bot_username ?? "bot"}</strong>
                </span>
                <form action={desconectarBot}>
                  <Button type="submit" variant="outline" size="sm" className="text-destructive">Desconectar</Button>
                </form>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                <p className="font-medium">Como liberar a equipe</p>
                <p className="text-muted-foreground">
                  Cada pessoa abre <strong>@{integ.bot_username ?? "seu_bot"}</strong> no Telegram e manda <code>/start</code>.
                  Ela aparece aqui embaixo como <em>pendente</em> — é só você <strong>aprovar</strong>.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Chats da equipe</h3>
                  {pendentes > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-300">{pendentes} pendente{pendentes > 1 ? "s" : ""}</Badge>
                  )}
                </div>
                {chats.length === 0 ? (
                  <p className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                    <AlertTriangle className="size-4" /> Ninguém mandou <code>/start</code> ainda. Peça à equipe para iniciar o bot.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pessoa / chat</TableHead>
                        <TableHead>Desde</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chats.map((c) => {
                        const b = CHAT_BADGE[c.status] ?? CHAT_BADGE.pendente;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              {c.nome ?? "—"}
                              <span className="block font-mono text-xs text-muted-foreground">{c.chat_id}</span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                            <TableCell>
                              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${b.tone}`}>{b.label}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {c.status !== "aprovado" && (
                                  <form action={aprovarChat.bind(null, c.id)}>
                                    <Button type="submit" variant="ghost" size="sm" className="text-emerald-300"><Check className="size-4" /> Aprovar</Button>
                                  </form>
                                )}
                                {c.status !== "bloqueado" && (
                                  <form action={bloquearChat.bind(null, c.id)}>
                                    <Button type="submit" variant="ghost" size="icon" title="Bloquear"><Ban className="size-4" /></Button>
                                  </form>
                                )}
                                <DeleteButton nome={c.nome ?? c.chat_id} action={removerChat.bind(null, c.id)} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
