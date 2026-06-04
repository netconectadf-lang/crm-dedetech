"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { definirStatusContato } from "@/app/(app)/whatsapp/contatos/actions";

const STATUS = [
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "interessado", label: "Interessado" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
  { value: "opt_out", label: "Não perturbe" },
];

export function StatusContato({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const novo = e.target.value;
        startTransition(async () => {
          await definirStatusContato(id, novo);
          router.refresh();
        });
      }}
      className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {STATUS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
