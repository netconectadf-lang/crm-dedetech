import { Plus, Wallet, KanbanSquare, Landmark, Check } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { nomeExibicao, CLIENTE_OPCAO_COLS, type ClienteOpcao } from "@/lib/clientes";
import type { Field } from "@/components/app/resource-form";
import type { DealCard } from "@/components/funil/kanban-board";
import { KanbanBoard } from "@/components/funil/kanban-board";
import { AjudaFunil } from "@/components/funil/ajuda-funil";
import { criarLead } from "./actions";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PageHeader } from "@/components/app/page-header";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Funil" };

export default async function FunilPage() {
  await requireRole(["owner", "comercial", "financeiro"]);
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
        ...clients.map((c) => ({ value: c.id, label: nomeExibicao(c) })),
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
          <div className="flex gap-2">
            <AjudaTela
              titulo="Como funciona o Funil comercial"
              descricao="Acompanhe seus negócios (leads) do primeiro contato até o fechamento, arrastando os cartões entre os estágios."
              topicos={[
                {
                  titulo: "Cadastrar um lead",
                  itens: [
                    "Clique em 'Novo lead' e informe o nome do contato (obrigatório).",
                    "Origem — registre de onde veio (indicação, Google, site…) para medir os canais.",
                    "Valor estimado — quanto o negócio deve render; alimenta os indicadores do topo.",
                    "Vincular a cliente — opcional, ligue o lead a um cliente já cadastrado.",
                  ],
                },
                {
                  titulo: "Mover pelo kanban",
                  itens: [
                    "Arraste o cartão entre as colunas conforme o negócio avança de estágio.",
                    "Ganho — negócio fechado; entra no ticket médio e nos ganhos.",
                    "Perdido — negócio que não foi adiante; usado no cálculo de conversão.",
                  ],
                },
                {
                  titulo: "Indicadores do topo",
                  itens: [
                    "Em aberto — soma do valor dos negócios ainda em andamento.",
                    "Conversão — % de ganhos sobre o total de negócios fechados.",
                    "Ticket médio — valor médio por negócio ganho.",
                  ],
                },
              ]}
              dica="Mantenha os cartões sempre no estágio certo: os indicadores de conversão e ticket médio dependem disso."
            />
            <AjudaFunil />
            <ResourceDialog
              trigger={<Button><Plus className="size-4" /> Novo lead</Button>}
              title="Novo lead"
              fields={leadFields}
              action={criarLead}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Em aberto" value={formatBRL(emAberto)} hint="negócios no funil" tone="violet" />
        <KpiCard icon={KanbanSquare} label="Conversão" value={`${conversao}%`} hint={`${ganhos.length} ganhos · ${perdidos.length} perdidos`} tone="sky" />
        <KpiCard icon={Landmark} label="Ticket médio" value={formatBRL(ticket)} hint="por negócio ganho" tone="amber" />
        <KpiCard icon={Check} label="Ganhos" value={String(ganhos.length)} tone={ganhos.length > 0 ? "ok" : "default"} />
      </div>

      <KanbanBoard initialDeals={deals} />
    </main>
  );
}
