import {
  CircleDollarSign,
  Megaphone,
  MessageCircle,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { KpiCard, Panel } from "@/components/dashboard/kpi-card";
import { GastoConversasChart } from "@/components/trafego/gasto-conversas-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { getMetaConfig, getMetaTrafego, type MetaAdRow } from "@/lib/meta-ads";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tráfego — Meta Ads" };
export const dynamic = "force-dynamic";

/** Início da campanha de WhatsApp da A7 — leads anteriores não entram no ROAS. */
const INICIO_CAMPANHA = "2026-06-10";

/** Últimos 8 dígitos do telefone — casa formatos com/sem 9, DDD, +55. */
const fone8 = (t: string | null | undefined) =>
  (t ?? "").replace(/\D/g, "").slice(-8);

function somar(rows: MetaAdRow[], pick: (r: MetaAdRow) => number) {
  return rows.reduce((acc, r) => acc + pick(r), 0);
}

type Semaforo = { cor: "verde" | "amarelo" | "vermelho"; motivo: string };

function semaforoDoAnuncio(row: MetaAdRow, status?: string): Semaforo {
  if (status === "DISAPPROVED" || status === "WITH_ISSUES")
    return { cor: "vermelho", motivo: "Reprovado na revisão" };
  if (row.custoConversa != null && row.custoConversa > 25)
    return { cor: "amarelo", motivo: "Custo por conversa acima de R$ 25" };
  if (row.impressions > 1000 && row.ctr < 0.7)
    return { cor: "amarelo", motivo: "CTR abaixo de 0,7%" };
  if (row.frequency > 3)
    return { cor: "amarelo", motivo: "Frequência alta — criativo saturando" };
  if (row.spend >= 30 && row.conversas === 0)
    return { cor: "vermelho", motivo: "Gasto sem nenhuma conversa" };
  return { cor: "verde", motivo: "Saudável" };
}

const SEMAFORO_CLASSES: Record<Semaforo["cor"], string> = {
  verde: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  amarelo: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  vermelho: "border-rose-500/40 bg-rose-500/10 text-rose-400",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  IN_PROCESS: "Em revisão",
  PENDING_REVIEW: "Em revisão",
  DISAPPROVED: "Reprovado",
  WITH_ISSUES: "Com problemas",
  PAUSED: "Pausado",
  ADSET_PAUSED: "Conjunto pausado",
  CAMPAIGN_PAUSED: "Campanha pausada",
};

export default async function TrafegoPage() {
  await requireRole(["owner", "comercial", "financeiro"]);

  const cfg = getMetaConfig();
  if (!cfg) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
        <PageHeader
          title="Tráfego — Meta Ads"
          description="Dashboard de campanhas de WhatsApp com ROAS real"
        />
        <Card>
          <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Integração com o Meta ainda não configurada.
            </p>
            <p>
              Defina as variáveis de ambiente (local em{" "}
              <code className="rounded bg-muted px-1">.env.local</code> e na
              Vercel):
            </p>
            <pre className="rounded-lg bg-muted p-3 text-xs">
              {`META_ADS_TOKEN=        # token de longa duração (60 dias)
META_AD_ACCOUNT_ID=    # ex.: act_1155171905520343
META_CAMPAIGN_ID=      # ex.: 120247611137510776`}
            </pre>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createClient();
  const [trafego, contatosRes, dealsRes] = await Promise.all([
    getMetaTrafego(cfg),
    supabase
      .from("wa_contatos")
      .select("telefone,status,created_at")
      .gte("created_at", INICIO_CAMPANHA),
    supabase
      .from("deals")
      .select("telefone,valor_estimado,stage,created_at")
      .gte("created_at", INICIO_CAMPANHA),
  ]);

  const contatos = contatosRes.data ?? [];
  const deals = dealsRes.data ?? [];

  // ---- Métricas Meta
  const gastoHoje = somar(trafego.hoje, (r) => r.spend);
  const conversasHoje = somar(trafego.hoje, (r) => r.conversas);
  const gastoTotal = somar(trafego.acumulado, (r) => r.spend);
  const conversasTotal = somar(trafego.acumulado, (r) => r.conversas);
  const custoConversaHoje = conversasHoje > 0 ? gastoHoje / conversasHoje : null;
  const custoConversaTotal =
    conversasTotal > 0 ? gastoTotal / conversasTotal : null;

  // ---- Funil CRM (desde o início da campanha)
  const fonesLeads = new Set(contatos.map((c) => fone8(c.telefone)));
  const dealsDeLeads = deals.filter((d) => fonesLeads.has(fone8(d.telefone)));
  const ganhos = dealsDeLeads.filter((d) => d.stage === "ganho");
  const receitaGanha = ganhos.reduce(
    (acc, d) => acc + Number(d.valor_estimado ?? 0),
    0,
  );
  const roas = gastoTotal > 0 ? receitaGanha / gastoTotal : null;

  const porStatus = contatos.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const statusPorAnuncio = new Map(
    trafego.ads.map((a) => [a.name, a.effectiveStatus]),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Tráfego — Meta Ads"
        description="Campanha de WhatsApp: gasto, conversas e retorno real (ROAS) cruzado com o funil do CRM"
      />

      {trafego.erro && (
        <Card className="border-rose-500/40">
          <CardContent className="p-4 text-sm text-rose-400">
            ⚠️ {trafego.erro}
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          icon={Wallet}
          label="Gasto hoje"
          value={formatBRL(gastoHoje)}
          hint="orçamento R$ 30/dia"
          tone="sky"
        />
        <KpiCard
          icon={MessageCircle}
          label="Conversas hoje"
          value={String(conversasHoje)}
          hint="WhatsApp iniciadas"
          tone="emerald"
        />
        <KpiCard
          icon={Target}
          label="Custo/conversa hoje"
          value={custoConversaHoje != null ? formatBRL(custoConversaHoje) : "—"}
          hint="meta: até R$ 15"
          tone={
            custoConversaHoje != null && custoConversaHoje > 25
              ? "warning"
              : "default"
          }
        />
        <KpiCard
          icon={CircleDollarSign}
          label="Gasto total"
          value={formatBRL(gastoTotal)}
          hint={`${conversasTotal} conversas · ${
            custoConversaTotal != null
              ? formatBRL(custoConversaTotal) + "/conversa"
              : "sem conversas"
          }`}
          tone="sky"
        />
        <KpiCard
          icon={Megaphone}
          label="Leads no CRM"
          value={String(contatos.length)}
          hint="desde o início da campanha"
          tone="violet"
        />
        <KpiCard
          icon={TrendingUp}
          label="ROAS real"
          value={roas != null ? `${roas.toFixed(1)}x` : "—"}
          hint={`${formatBRL(receitaGanha)} ganhos / ${ganhos.length} negócios`}
          tone={roas != null && roas >= 3 ? "emerald" : "default"}
        />
      </section>

      {/* Gráfico 30 dias */}
      <Panel title="Gasto × conversas — últimos 30 dias" accent="sky">
        <GastoConversasChart data={trafego.serie30d} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Tabela por anúncio */}
        <Panel
          title="Desempenho por anúncio (acumulado)"
          accent="emerald"
          className="lg:col-span-3"
        >
          {trafego.acumulado.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem veiculação ainda — os anúncios podem estar em revisão.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anúncio</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conversas</TableHead>
                  <TableHead className="text-right">R$/conversa</TableHead>
                  <TableHead>Saúde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafego.acumulado.map((row) => {
                  const st = statusPorAnuncio.get(row.adName);
                  const s = semaforoDoAnuncio(row, st);
                  return (
                    <TableRow key={row.adName}>
                      <TableCell>
                        <p className="font-medium">{row.adName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.adsetName}
                          {st ? ` · ${STATUS_LABEL[st] ?? st}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(row.spend)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.ctr.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.conversas}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.custoConversa != null
                          ? formatBRL(row.custoConversa)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={SEMAFORO_CLASSES[s.cor]}
                          title={s.motivo}
                        >
                          {s.motivo}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Panel>

        {/* Funil lead → venda */}
        <Panel
          title="Funil — do anúncio à venda"
          accent="violet"
          className="lg:col-span-2"
        >
          <div className="space-y-3 text-sm">
            <FunilLinha
              label="Conversas iniciadas (Meta)"
              valor={conversasTotal}
            />
            <FunilLinha label="Leads registrados no CRM" valor={contatos.length} />
            {Object.entries(porStatus).map(([status, qtd]) => (
              <FunilLinha
                key={status}
                label={`— ${status}`}
                valor={qtd}
                muted
              />
            ))}
            <FunilLinha
              label="Negócios abertos (funil)"
              valor={dealsDeLeads.length}
            />
            <FunilLinha label="Negócios GANHOS" valor={ganhos.length} forte />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium">Receita ganha</span>
              <span className="font-semibold tabular-nums text-emerald-400">
                {formatBRL(receitaGanha)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cruzamento por telefone (lead do WhatsApp × negócio no funil)
              desde {INICIO_CAMPANHA.split("-").reverse().join("/")}. Registre
              todo lead da campanha em WhatsApp → Leads para o ROAS ficar fiel.
            </p>
          </div>
        </Panel>
      </div>
    </main>
  );
}

function FunilLinha({
  label,
  valor,
  muted,
  forte,
}: {
  label: string;
  valor: number;
  muted?: boolean;
  forte?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          muted
            ? "pl-2 text-xs text-muted-foreground"
            : forte
              ? "font-medium"
              : undefined
        }
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${forte ? "font-semibold text-emerald-400" : muted ? "text-xs text-muted-foreground" : ""}`}
      >
        {valor}
      </span>
    </div>
  );
}
