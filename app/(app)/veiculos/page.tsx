import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Field } from "@/components/app/resource-form";
import { salvarVeiculo, excluirVeiculo } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ResourceDialog } from "@/components/app/resource-dialog";
import { DeleteButton } from "@/components/app/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Veículos" };

const fields: Field[] = [
  { name: "placa", label: "Placa", required: true },
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    options: [
      { value: "carro", label: "Carro" },
      { value: "moto", label: "Moto" },
      { value: "van", label: "Van" },
      { value: "caminhao", label: "Caminhão" },
    ],
  },
  { name: "modelo", label: "Modelo" },
  { name: "ano", label: "Ano", type: "number" },
  { name: "cor", label: "Cor" },
  { name: "renavam", label: "Renavam" },
  { name: "chassi", label: "Chassi" },
  { name: "id_rastreador_traccar", label: "ID rastreador (Traccar)" },
  { name: "seguradora", label: "Seguradora" },
  { name: "vencimento_seguro", label: "Venc. seguro", type: "date" },
  { name: "vencimento_ipva", label: "Venc. IPVA", type: "date" },
  { name: "vencimento_licenciamento", label: "Venc. licenciamento", type: "date" },
  { name: "km_atual", label: "KM atual", type: "number" },
  { name: "km_proxima_revisao", label: "KM próxima revisão", type: "number" },
  { name: "ativo", label: "Ativo", type: "switch" },
];

type Veiculo = {
  id: string;
  placa: string;
  modelo: string | null;
  tipo: string;
  vencimento_seguro: string | null;
  ativo: boolean;
};

export default async function VeiculosPage() {
  await requireRole(["owner", "operacional"]);
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("*").order("placa");
  const veiculos = (data as Veiculo[] | null) ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <PageHeader
        title="Veículos"
        description="Frota, documentos e rastreadores."
        action={
          <ResourceDialog
            trigger={<Button><Plus className="size-4" /> Novo veículo</Button>}
            title="Novo veículo"
            fields={fields}
            action={salvarVeiculo.bind(null, null)}
          />
        }
      />

      {veiculos.length === 0 ? (
        <EmptyState title="Nenhum veículo" description="Cadastre a frota." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Venc. seguro</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium uppercase">
                      {v.placa}
                    </TableCell>
                    <TableCell>{v.modelo ?? "—"}</TableCell>
                    <TableCell className="capitalize">{v.tipo}</TableCell>
                    <TableCell>{formatDate(v.vencimento_seguro)}</TableCell>
                    <TableCell>
                      {!v.ativo && <Badge variant="outline">inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ResourceDialog
                          trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                          title="Editar veículo"
                          fields={fields}
                          defaultValues={v}
                          action={salvarVeiculo.bind(null, v.id)}
                        />
                        <DeleteButton nome={v.placa} action={excluirVeiculo.bind(null, v.id)} />
                      </div>
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
