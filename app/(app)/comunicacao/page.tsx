import { Gauge, Star, ThumbsUp, ThumbsDown } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Comunicação" };

type Resp = { score: number | null; comentario: string | null; respondido_em: string | null };
type Msg = {
  id: string;
  canal: string;
  destino: string;
  corpo: string | null;
  status: string;
  created_at: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  skipped: "secondary",
  failed: "destructive",
  queued: "outline",
};

export default async function ComunicacaoPage() {
  await requireRole(["owner", "comercial", "operacional", "financeiro"]);
  const supabase = await createClient();

  const [{ data: npsData }, { data: msgData }] = await Promise.all([
    supabase.from("nps_responses").select("score, comentario, respondido_em").not("respondido_em", "is", null),
    supabase.from("messages").select("id, canal, destino, corpo, status, created_at").order("created_at", { ascending: false }).limit(50),
  ]);

  const respostas = (npsData as Resp[] | null) ?? [];
  const msgs = (msgData as Msg[] | null) ?? [];

  const total = respostas.length;
  const promotores = respostas.filter((r) => (r.score ?? 0) >= 9).length;
  const detratores = respostas.filter((r) => (r.score ?? 0) <= 6).length;
  const neutros = total - promotores - detratores;
  const nps = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;
  const media =
    total > 0 ? (respostas.reduce((s, r) => s + (r.score ?? 0), 0) / total).toFixed(1) : "—";
  const npsTone = total === 0 ? "default" : nps >= 50 ? "ok" : nps < 0 ? "danger" : "warning";
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const comentarios = respostas.filter((r) => r.comentario);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Comunicação & NPS" description="Satisfação dos clientes e histórico de mensagens." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Gauge} label="NPS" value={total > 0 ? String(nps) : "—"} hint={`${total} respostas`} tone={npsTone} />
        <KpiCard icon={Star} label="Nota média" value={String(media)} hint="de 0 a 10" />
        <KpiCard icon={ThumbsUp} label="Promotores" value={String(promotores)} tone={promotores > 0 ? "ok" : "default"} hint="nota 9–10" />
        <KpiCard icon={ThumbsDown} label="Detratores" value={String(detratores)} tone={detratores > 0 ? "danger" : "default"} hint="nota 0–6" />
      </div>

      {total > 0 && (
        <Panel title="Distribuição das respostas">
          <div className="space-y-2.5 text-sm">
            {[
              { label: "Promotores (9–10)", n: promotores, tone: "bg-primary/70" },
              { label: "Neutros (7–8)", n: neutros, tone: "bg-warning/70" },
              { label: "Detratores (0–6)", n: detratores, tone: "bg-destructive/70" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-muted-foreground">{r.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.n > 0 ? Math.max(4, pct(r.n)) : 0}%` }} />
                </div>
                <span className="w-16 text-right tabular-nums">{r.n} · {Math.round(pct(r.n))}%</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Comentários dos clientes">
        {comentarios.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhum comentário ainda.</p>
        ) : (
          <ul className="space-y-3">
            {comentarios.map((r, i) => (
              <li key={i} className="flex items-start gap-3 border-b pb-3 text-sm last:border-b-0">
                <Badge variant={(r.score ?? 0) >= 9 ? "default" : (r.score ?? 0) <= 6 ? "destructive" : "secondary"}>
                  {r.score}
                </Badge>
                <span className="text-muted-foreground">{r.comentario}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Card>
        <CardHeader><CardTitle className="text-base">Mensagens enviadas</CardTitle></CardHeader>
        <CardContent>
          {msgs.length === 0 ? (
            <EmptyState title="Nenhuma mensagem" description="WhatsApp/e-mail enviados aparecem aqui." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {msgs.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="capitalize">{m.canal}</TableCell>
                    <TableCell>{m.destino}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[m.status] ?? "outline"}>{m.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
