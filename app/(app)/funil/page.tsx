import { Plus, Wallet, KanbanSquare, Landmark, Check } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { rotuloCliente, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import type { DealCard } from "@/components/funil/kanban-board";
import { KanbanBoard } from "@/components/funil/kanban-board";
import { criarLead } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Funil" };

export default async function FunilPage() {
  await requireRole(["owner", "comercial"]);
  const supabase = await createClient();

  const [{ data: dealsData }, { data: clientsData }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, nome_contato, valor_estimado, origem, stage")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select(CLIENTE_OPCAO_COLS).eq("ativo", true).order("razao_social"),
  ]);

  const deals = (dealsData as DealCard[] | null) ?? [];
  const clients = (clientsData as ClienteOpcao[] | null) ?? [];

  // Métricas
  const ganhos = deals.filter((d) => d.stage === "ganho");
  const perdidos = deals.filter((d) => d.stage === "perdido");
  const fechados = ganhos.length + perdidos.length;
  const conversao = fechados > 0 ? Math.round((ganhos.length / fechados) * 100) : 0;
  const ticket =
    ganhos.length > 0
      ? ganhos.reduce((s, d) => s + Number(d.valor_estimado), 0) / ganhos.length
      : 0;
  const emAberto = deals
    .filter((d) => !["ganho", "perdido"].includes(d.stage))
    .reduce((s, d) => s + Number(d.valor_estimado), 0);

  const leadFields: Field[] = [
    { name: "nome_contato", label: "Nome do contato", required: true, full: true },
    { name: "telefone", label: "Telefone" },
    { name: "email", label: "E-mail", type: "email" },
    {
      name: "origem",
      label: "Origem",
      type: "select",
      options: [
        { value: "indicacao", label: "Indicação" },
        { value: "google", label: "Google" },
        { value: "instagram", label: "Instagram" },
        { value: "site", label: "Site" },
        { value: "passagem", label: "Passagem" },
        { value: "outro", label: "Outro" },
      ],
    },
    { name: "valor_estimado", label: "Valor estimado (R$)", type: "number" },
    {
      name: "client_id",
      label: "Vincular a cliente (opcional)",
      type: "select",
      options: [
        { value: "none", label: "Sem vínculo" },
        ...clients.map((c) => ({ value: c.id, label: rotuloCliente(c) })),
      ],
    },
    { name: "descricao", label: "Observações", type: "textarea" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Funil comercial"
        description="Arraste os cartões entre os estágios."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Novo lead</Button>}
            title="Novo lead"
            fields={leadFields}
            action={criarLead}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Em aberto" value={formatBRL(emAberto)} hint="negócios no funil" tone="ok" />
        <KpiCard icon={KanbanSquare} label="Conversão" value={`${conversao}%`} hint={`${ganhos.length} ganhos · ${perdidos.length} perdidos`} />
        <KpiCard icon={Landmark} label="Ticket médio" value={formatBRL(ticket)} hint="por negócio ganho" />
        <KpiCard icon={Check} label="Ganhos" value={String(ganhos.length)} tone={ganhos.length > 0 ? "ok" : "default"} />
      </div>

      <KanbanBoard initialDeals={deals} />
    </main>
  );
}
