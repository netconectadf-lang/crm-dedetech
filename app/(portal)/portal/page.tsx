import { redirect } from "next/navigation";

import { getPortalContext } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDate } from "@/lib/format";
import { OS_STATUS_LABEL, OS_STATUS_TONE, type OsStatus } from "@/lib/os";
import {
  proximasVisitas,
  type ContractPeriodicity,
} from "@/lib/contratos";
import { effectiveStatus, type FinanceStatus } from "@/lib/financeiro";
import type { Field } from "@/components/app/resource-form";
import { ResourceForm } from "@/components/app/resource-form";
import { abrirChamado } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Portal do Cliente" };

const chamadoFields: Field[] = [
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    options: [
      { value: "visita_extra", label: "Solicitar visita extra" },
      { value: "duvida", label: "Dúvida" },
      { value: "reclamacao", label: "Reclamação" },
      { value: "outro", label: "Outro" },
    ],
  },
  { name: "mensagem", label: "Mensagem", type: "textarea", required: true, full: true },
];

export default async function PortalHomePage() {
  const portal = await getPortalContext();
  if (!portal) redirect("/login");
  const db = createAdminClient();
  const cid = portal.clientId;

  const [{ data: osData }, { data: contractData }, { data: arData }, { data: chargeData }, { data: reqData }] =
    await Promise.all([
      db.from("service_orders").select("numero, status, scheduled_at, executada_em").eq("client_id", cid).order("scheduled_at", { ascending: false }).limit(30),
      db.from("contracts").select("titulo, periodicidade, vigencia_inicio, dia_faturamento").eq("client_id", cid).eq("status", "ativo"),
      db.from("accounts_receivable").select("id, descricao, valor, valor_pago, vencimento, status").eq("client_id", cid).neq("status", "cancelado").order("vencimento"),
      db.from("charges").select("ar_id, invoice_url, tipo").eq("client_id", cid).not("invoice_url", "is", null),
      db.from("client_requests").select("tipo, mensagem, status, created_at").eq("client_id", cid).order("created_at", { ascending: false }).limit(10),
    ]);

  const oss = (osData as { numero: number; status: OsStatus; scheduled_at: string | null; executada_em: string | null }[] | null) ?? [];
  const contracts = (contractData as { titulo: string; periodicidade: ContractPeriodicity; vigencia_inicio: string; dia_faturamento: number }[] | null) ?? [];
  const ar = (arData as { id: string; descricao: string; valor: number; valor_pago: number; vencimento: string; status: FinanceStatus }[] | null) ?? [];
  const charges = (chargeData as { ar_id: string | null; invoice_url: string; tipo: string }[] | null) ?? [];
  const reqs = (reqData as { tipo: string; mensagem: string; status: string; created_at: string }[] | null) ?? [];

  const agendadas = oss.filter((o) => ["agendada", "a_caminho", "em_execucao"].includes(o.status));
  const historico = oss.filter((o) => ["executada", "faturada"].includes(o.status));
  const proxVisitas = contracts.flatMap((c) =>
    proximasVisitas(c.vigencia_inicio, c.dia_faturamento, c.periodicidade, 2).map((d) => ({ titulo: c.titulo, data: d })),
  ).sort((a, b) => a.data.getTime() - b.data.getTime()).slice(0, 4);
  const abertas = ar.filter((a) => a.status === "a_vencer" || a.status === "parcial");
  const chargeByAr = new Map(charges.map((c) => [c.ar_id, c.invoice_url]));

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {portal.clientName} 👋</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus serviços, agenda e financeiro.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Próximas visitas</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {agendadas.length === 0 && proxVisitas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma visita agendada.</p>
            ) : (
              <>
                {agendadas.map((o) => (
                  <div key={o.numero} className="flex items-center justify-between">
                    <span>OS #{o.numero}</span>
                    <span className={`rounded px-2 py-0.5 text-xs ${OS_STATUS_TONE[o.status]}`}>{OS_STATUS_LABEL[o.status]}</span>
                  </div>
                ))}
                {proxVisitas.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-muted-foreground">
                    <span>{v.titulo}</span>
                    <span className="tabular-nums">{v.data.toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Financeiro</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {abertas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma cobrança em aberto. 🎉</p>
            ) : (
              abertas.map((a) => {
                const st = effectiveStatus(a);
                const link = chargeByAr.get(a.id);
                return (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <span className="flex-1 truncate">{a.descricao}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${st.tone}`}>{st.label}</span>
                    <span className="tabular-nums">{formatBRL(Number(a.valor) - Number(a.valor_pago))}</span>
                    {link && (
                      <Button asChild size="sm" variant="outline" className="h-7">
                        <a href={link} target="_blank" rel="noopener noreferrer">Pagar</a>
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de serviços</CardTitle></CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum serviço executado ainda.</p>
          ) : (
            <ul className="divide-y text-sm">
              {historico.map((o) => (
                <li key={o.numero} className="flex items-center justify-between py-2">
                  <span>OS #{o.numero}</span>
                  <span className="text-muted-foreground">{o.executada_em ? formatDate(o.executada_em) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Solicitar atendimento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ResourceForm fields={chamadoFields} action={abrirChamado} submitLabel="Enviar solicitação" />
          {reqs.length > 0 && (
            <ul className="divide-y text-sm">
              {reqs.map((r, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span className="flex-1 truncate text-muted-foreground">{r.mensagem}</span>
                  <Badge variant="outline">{r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
