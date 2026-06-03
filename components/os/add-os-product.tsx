"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { adicionarProdutoOS } from "@/app/(app)/os/actions";
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

export function AddOsProduct({
  osId,
  produtos,
}: {
  osId: string;
  produtos: { id: string; nome_comercial: string }[];
}) {
  const action = adicionarProdutoOS.bind(null, osId);
  const [state, formAction] = useActionState<SaveState, FormData>(action, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-12">
      <div className="grid gap-1 sm:col-span-5">
        <Label className="text-xs">Produto</Label>
        <Select name="product_id">
          <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
          <SelectContent>
            {produtos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome_comercial}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1 sm:col-span-2">
        <Label className="text-xs">Quantidade</Label>
        <Input name="quantidade" type="number" step="any" required />
      </div>
      <div className="grid gap-1 sm:col-span-4">
        <Label className="text-xs">Diluição</Label>
        <Input name="diluicao" placeholder="ex.: 1:100" />
      </div>
      <div className="flex items-end sm:col-span-1">
        <Button type="submit" size="icon"><Plus className="size-4" /></Button>
      </div>
    </form>
  );
}
