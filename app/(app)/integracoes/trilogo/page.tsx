import { RefreshCw, CircleCheck, AlertTriangle, Link2 } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { signIn, listUnitsFromTickets } from "@/lib/trilogo/client";
import { montarSugestoes, type ClienteParaMapa } from "@/lib/trilogo/match";
import { sincronizarAgora } from "./actions";
import {
  TrilogoMapa,
  type ClienteOpcao,
  type LinhaMapa,
} from "@/components/integracoes/trilogo-mapa";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata = { title: "Trílogo — Bluefit" };
export const dynamic = "force-dynamic";

type SyncRun = {
  started_at: string;
  ok: boolean;
  origem: string;
  criados: number;
  pulados: number;
  sem_mapeamento: number;
  erros: number;
  mensagem: string | null;
};

function clienteLabel(c: ClienteParaMapa): string {
  // Nome completo (como vem do Trílogo) para facilitar o casamento no de-para.
  return c.nome_fantasia?.trim() || c.razao_social;
}

export default async function TrilogoPage() {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const [{ data: clientesData }, { data: runsData }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, razao_social, nome_fantasia, cidade, uf, trilogo_company_id")
      .eq("tenant_id", ctx.tenantId)
      .eq("ativo", true)
      .order("razao_social"),
    supabase
      .from("trilogo_sync_runs")
      .select("started_at, ok, origem, criados, pulados, sem_mapeamento, erros, mensagem")
      .eq("tenant_id", ctx.tenantId)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  const clientes = (clientesData ?? []) as ClienteParaMapa[];
  const runs = (runsData ?? []) as SyncRun[];
  const ultimo = runs[0] ?? null;

  // Busca as unidades no Trílogo (login ao vivo). Se falhar, mostra o aviso de config.
  let erroConexao: string | null = null;
  let linhas: LinhaMapa[] = [];
  let supplierName: string | null = null;

  try {
    const session = await signIn();
    supplierName = session.supplierName;
    const unidades = await listUnitsFromTickets(session.accessToken);
    const sugestoes = montarSugestoes(unidades, clientes);
    linhas = sugestoes.map((s) => {
      const defaultClientId = s.vinculadoId ?? s.sugestaoId ?? "";
      const tipo: LinhaMapa["tipo"] = s.vinculadoId
        ? "vinculado"
        : s.sugestaoId
          ? "sugerido"
          : "novo";
      return { companyId: s.unidade.companyId, nome: s.unidade.nome, defaultClientId, tipo };
    });
  } catch (e) {
    erroConexao = e instanceof Error ? e.message : "Não foi possível conectar ao Trílogo.";
  }

  const opcoes: ClienteOpcao[] = clientes.map((c) => ({
    id: c.id,
    label: clienteLabel(c),
  }));

  const semCasar = linhas.filter((l) => l.tipo === "novo").length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Trílogo — Bluefit"
        description="Importa os chamados abertos da Bluefit como ordens de serviço, 2× por dia."
      />

      {/* Painel de status */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link2 className="size-5 text-primary" />
              <CardTitle className="text-base">
                Conexão {supplierName ? `· ${supplierName}` : ""}
              </CardTitle>
            </div>
            <form action={sincronizarAgora}>
              <Button type="submit" variant="outline" size="sm" disabled={!!erroConexao}>
                <RefreshCw className="size-4" /> Sincronizar agora
              </Button>
            </form>
          </div>
          <CardDescription>
            {erroConexao ? (
              <span className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="size-4" /> {erroConexao}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-300">
                <CircleCheck className="size-4" /> Conectado ao painel da Bluefit.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {ultimo ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="text-muted-foreground">
                Último sync: <strong className="text-foreground">{formatDate(ultimo.started_at)}</strong> ({ultimo.origem})
              </span>
              <span>✅ {ultimo.criados} criadas</span>
              <span>↩️ {ultimo.pulados} já existiam</span>
              <span>⚠️ {ultimo.sem_mapeamento} sem unidade</span>
              {ultimo.erros > 0 && <span className="text-rose-300">❌ {ultimo.erros} erros</span>}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma sincronização ainda.</p>
          )}
          {semCasar > 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-amber-200">
              <AlertTriangle className="size-4" />
              {semCasar} unidade(s) do Trílogo ainda sem cliente vinculado — os chamados delas não viram OS até você casar abaixo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* De-para de unidades */}
      {!erroConexao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">De-para de unidades</CardTitle>
            <CardDescription>
              Cada unidade Bluefit do Trílogo aponta para um cliente do CRM. O vínculo é
              lembrado e usado em todas as próximas importações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrilogoMapa clientes={opcoes} linhas={linhas} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
