"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { adicionarItem } from "@/app/(app)/funil/quote-actions";
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
type Produto = { id: string; nome_comercial: string; preco_venda: number };

export function AddItemForm({
  quoteId,
  servicos,
  produtos,
}: {
  quoteId: string;
  servicos: Servico[];
  produtos: Produto[];
}) {
  const action = adicionarItem.bind(null, quoteId);
  const [state, formAction] = useActionState<SaveState, FormData>(action, null);

  const [kind, setKind] = useState<"servico" | "produto" | "outro">("servico");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [refId, setRefId] = useState("none");

  // Sucesso → o servidor revalida e o pai remonta este form (key = nº de itens),
  // limpando os campos. Aqui só sinalizamos erro.
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  function pickServico(id: string) {
    setRefId(id);
    const s = servicos.find((x) => x.id === id);
    if (s) {
      setDescricao(s.nome);
      setPreco(String(s.preco_base));
    }
  }
  function pickProduto(id: string) {
    setRefId(id);
    const p = produtos.find((x) => x.id === id);
    if (p) {
      setDescricao(p.nome_comercial);
      setPreco(String(p.preco_venda));
    }
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-12">
      <input type="hidden" name="kind" value={kind} />
      <input
        type="hidden"
        name="service_id"
        value={kind === "servico" ? refId : "none"}
      />
      <input
        type="hidden"
        name="product_id"
        value={kind === "produto" ? refId : "none"}
      />

      <div className="grid gap-1 sm:col-span-2">
        <Label className="text-xs">Tipo</Label>
        <Select
          value={kind}
          onValueChange={(v) => {
            setKind(v as typeof kind);
            setRefId("none");
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="servico">Serviço</SelectItem>
            <SelectItem value="produto">Produto</SelectItem>
            <SelectItem value="outro">Livre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {kind === "servico" && (
        <div className="grid gap-1 sm:col-span-3">
          <Label className="text-xs">Serviço</Label>
          <Select value={refId} onValueChange={pickServico}>
            <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {servicos.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {kind === "produto" && (
        <div className="grid gap-1 sm:col-span-3">
          <Label className="text-xs">Produto</Label>
          <Select value={refId} onValueChange={pickProduto}>
            <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome_comercial}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className={`grid gap-1 ${kind === "outro" ? "sm:col-span-5" : "sm:col-span-3"}`}>
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
      <div className="grid gap-1 sm:col-span-2">
        <Label className="text-xs">Preço un. (R$)</Label>
        <Input
          name="preco_unit"
          type="number"
          step="any"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
        />
      </div>
      <div className="flex items-end sm:col-span-1">
        <Button type="submit" size="icon"><Plus className="size-4" /></Button>
      </div>
    </form>
  );
}
