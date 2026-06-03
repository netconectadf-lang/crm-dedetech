"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { adicionarItemContrato } from "@/app/(app)/contratos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Servico = { id: string; nome: string; preco_base: number };
type Unidade = { id: string; apelido: string };

export function AddContractItem({
  contractId,
  servicos,
  unidades,
}: {
  contractId: string;
  servicos: Servico[];
  unidades: Unidade[];
}) {
  const action = adicionarItemContrato.bind(null, contractId);
  const [state, formAction] = useActionState<SaveState, FormData>(action, null);
  const [serviceId, setServiceId] = useState("none");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  function pick(id: string) {
    setServiceId(id);
    const s = servicos.find((x) => x.id === id);
    if (s) {
      setDescricao(s.nome);
      setValor(String(s.preco_base));
    }
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-12">
      <input type="hidden" name="service_id" value={serviceId} />
      <div className="grid gap-1 sm:col-span-3">
        <Label className="text-xs">Serviço</Label>
        <Select value={serviceId} onValueChange={pick}>
          <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— livre —</SelectItem>
            {servicos.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1 sm:col-span-3">
        <Label className="text-xs">Unidade (opcional)</Label>
        <Select name="unit_id" defaultValue="none">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Todas</SelectItem>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.apelido}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1 sm:col-span-3">
        <Label className="text-xs">Descrição</Label>
        <Input
          name="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-1 sm:col-span-1">
        <Label className="text-xs">Qtd</Label>
        <Input name="quantidade" type="number" step="any" defaultValue="1" />
      </div>
      <div className="grid gap-1 sm:col-span-1">
        <Label className="text-xs">Valor</Label>
        <Input
          name="valor"
          type="number"
          step="any"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>
      <div className="flex items-end sm:col-span-1">
        <Button type="submit" size="icon"><Plus className="size-4" /></Button>
      </div>
    </form>
  );
}
