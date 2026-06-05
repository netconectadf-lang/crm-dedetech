"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { KeyRound, CheckCircle2 } from "lucide-react";

import { criarAcessoColaborador } from "@/app/(app)/rh/actions";
import type { SaveState } from "@/lib/crud-helpers";
import { Button } from "@/components/ui/button";

export function CriarAcessoColaborador({
  employeeId,
  jaTemAcesso,
}: {
  employeeId: string;
  jaTemAcesso: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    criarAcessoColaborador.bind(null, employeeId),
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.message) toast.success("Acesso criado — anote os dados abaixo.");
  }, [state]);

  if (jaTemAcesso) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-300">
        <CheckCircle2 className="size-4" /> Este colaborador já tem acesso ao portal.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Cria um login (usa o e-mail do funcionário) pra ele bater ponto, pedir férias e ver o banco
        de horas pelo celular.
      </p>
      <Button type="submit" disabled={pending}>
        <KeyRound className="size-4" /> {pending ? "Criando…" : "Criar acesso do colaborador"}
      </Button>
      {state?.message && (
        <p className="rounded-lg border border-primary/25 bg-primary/8 p-3 font-mono text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
