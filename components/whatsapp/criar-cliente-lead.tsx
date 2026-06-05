"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Check } from "lucide-react";

import { criarClienteDoLead } from "@/app/(app)/whatsapp/leads/actions";
import { Button } from "@/components/ui/button";
import type { SaveState } from "@/lib/crud-helpers";

export function CriarClienteLead({ nome, telefone }: { nome: string; telefone: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    criarClienteDoLead,
    null,
  );
  const [criado, setCriado] = useState(false);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      setCriado(true);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  if (criado) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
        <Check className="size-3.5" /> Criado
      </span>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="nome" value={nome} />
      <input type="hidden" name="telefone" value={telefone} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <UserPlus className="size-4" /> {pending ? "Criando…" : "Criar cliente"}
      </Button>
    </form>
  );
}
