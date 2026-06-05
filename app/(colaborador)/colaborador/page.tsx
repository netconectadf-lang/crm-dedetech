import { redirect } from "next/navigation";

import { getColaboradorContext } from "@/lib/colaborador";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import {
  espelhoPonto,
  feriasInfo,
  formatTempoCasa,
  formatSaldo,
  formatDuracao,
  diasEntre,
  ABSENCE_TYPE_LABEL,
  ABSENCE_STATUS_LABEL,
  type AbsenceType,
  type AbsenceStatus,
} from "@/lib/rh";
import type { Field } from "@/components/app/resource-form";
import { ResourceForm } from "@/components/app/resource-form";
import { PontoColaborador } from "@/components/colaborador/ponto-colaborador";
import { pedirAusenciaColaborador } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ColaboradorPage() {
  const ctx = await getColaboradorContext();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: empData }, { data: pontoMes }, { data: ausData }] = await Promise.all([
    admin.from("employees").select("data_admissao, jornada_horas").eq("id", ctx.employeeId).maybeSingle(),
    admin.from("time_entries").select("tipo, registrado_em").eq("employee_id", ctx.employeeId).gte("registrado_em", mesInicio),
    admin.from("absences").select("id, tipo, inicio, fim, status").eq("employee_id", ctx.employeeId).order("inicio", { ascending: false }),
  ]);

  const emp = empData as { data_admissao: string | null; jornada_horas: number | null } | null;
  const jornadaHoras = Number(emp?.jornada_horas ?? 8);
  const espelho = espelhoPonto((pontoMes as { tipo: string; registrado_em: string }[] | null) ?? [], jornadaHoras * 3_600_000);
  const ausencias = (ausData as { id: string; tipo: AbsenceType; inicio: string; fim: string; status: AbsenceStatus }[] | null) ?? [];
  const diasGozados = ausencias
    .filter((a) => a.tipo === "ferias" && a.status === "aprovada")
    .reduce((s, a) => s + diasEntre(a.inicio, a.fim), 0);
  const ferias = feriasInfo(emp?.data_admissao ?? null, diasGozados);

  const ausFields: Field[] = [
    {
      name: "tipo",
      label: "Tipo",
      type: "select",
      options: (Object.keys(ABSENCE_TYPE_LABEL) as AbsenceType[]).map((k) => ({ value: k, label: ABSENCE_TYPE_LABEL[k] })),
    },
    { name: "inicio", label: "Início", type: "date", required: true },
    { name: "fim", label: "Fim", type: "date", required: true },
    { name: "motivo", label: "Motivo (opcional)", type: "textarea" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        <Mini label="Férias" value={ferias ? `${ferias.saldo}d` : "—"} tone={ferias?.vencidas ? "danger" : "default"} />
        <Mini label="Banco de horas" value={formatSaldo(espelho.saldoMs)} tone={espelho.saldoMs < 0 ? "danger" : "ok"} />
        <Mini label="Tempo de casa" value={formatTempoCasa(emp?.data_admissao ?? null)} />
      </div>

      {/* Bater ponto */}
      <Card>
        <CardHeader><CardTitle className="text-base">Bater ponto</CardTitle></CardHeader>
        <CardContent>
          <PontoColaborador />
        </CardContent>
      </Card>

      {/* Espelho do mês */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Meu mês</CardTitle>
            <span className="text-xs text-muted-foreground">jornada {jornadaHoras}h/dia</span>
          </div>
        </CardHeader>
        <CardContent>
          {espelho.dias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registros de ponto neste mês.</p>
          ) : (
            <ul className="divide-y text-sm">
              {espelho.dias.map((d) => (
                <li key={d.dia} className="flex items-center justify-between py-2">
                  <span className="tabular-nums">{formatDate(d.dia)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {d.entrada ?? "—"}–{d.saida ?? "—"}
                  </span>
                  <span className="tabular-nums">{formatDuracao(d.ms)}</span>
                  <span className={`tabular-nums ${d.saldoMs >= 0 ? "text-emerald-300" : "text-destructive"}`}>
                    {formatSaldo(d.saldoMs)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pedir férias / ausência */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pedir férias / ausência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ResourceForm fields={ausFields} action={pedirAusenciaColaborador} submitLabel="Enviar solicitação" />
          {ausencias.length > 0 && (
            <ul className="divide-y text-sm">
              {ausencias.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>{ABSENCE_TYPE_LABEL[a.tipo]} · {formatDate(a.inicio)}–{formatDate(a.fim)}</span>
                  <Badge variant={a.status === "aprovada" ? "default" : a.status === "recusada" ? "destructive" : "secondary"}>
                    {ABSENCE_STATUS_LABEL[a.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" | "default" }) {
  const color = tone === "danger" ? "text-destructive" : tone === "ok" ? "text-emerald-300" : "";
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
