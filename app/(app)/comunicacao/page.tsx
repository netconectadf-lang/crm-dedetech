import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
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
  await requireRole(["owner", "comercial", "operacional"]);
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
  const nps = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;
  const media =
    total > 0 ? (respostas.reduce((s, r) => s + (r.score ?? 0), 0) / total).toFixed(1) : "—";

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader title="Comunicação & NPS" description="Satisfação dos clientes e histórico de mensagens." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">NPS</p><p className="mt-1 text-2xl font-semibold tabular-nums">{total > 0 ? nps : "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Nota média</p><p className="mt-1 text-2xl font-semibold tabular-nums">{media}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Respostas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{total}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Comentários dos clientes</CardTitle></CardHeader>
        <CardContent>
          {respostas.filter((r) => r.comentario).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum comentário ainda.</p>
          ) : (
            <ul className="space-y-3">
              {respostas.filter((r) => r.comentario).map((r, i) => (
                <li key={i} className="flex items-start gap-3 border-b pb-3 text-sm">
                  <Badge variant={(r.score ?? 0) >= 9 ? "default" : (r.score ?? 0) <= 6 ? "destructive" : "secondary"}>
                    {r.score}
                  </Badge>
                  <span className="text-muted-foreground">{r.comentario}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
