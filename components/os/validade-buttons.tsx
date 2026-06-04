"use client";

import { useTransition } from "react";

import { definirValidade } from "@/app/(app)/os/[id]/certificado/actions";
import { Button } from "@/components/ui/button";

const DIAS = [30, 60, 90, 120];

export function ValidadeButtons({
  osId,
  atualLabel,
}: {
  osId: string;
  atualLabel: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Validade do serviço</p>
      <p className="text-xs text-muted-foreground">
        Define a próxima revisão conforme o serviço (a partir da execução).
      </p>
      <div className="flex flex-wrap gap-2">
        {DIAS.map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => start(() => definirValidade(osId, d))}
          >
            {d} dias
          </Button>
        ))}
      </div>
      {atualLabel && (
        <p className="text-xs text-primary">Próxima revisão: {atualLabel}</p>
      )}
    </div>
  );
}
