"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import {
  criarTarefa,
  alternarTarefa,
  excluirTarefa,
} from "@/app/(app)/funil/quote-actions";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type Task = {
  id: string;
  titulo: string;
  due_at: string | null;
  done: boolean;
};

export function TaskList({
  dealId,
  tasks,
}: {
  dealId: string;
  tasks: Task[];
}) {
  const create = criarTarefa.bind(null, dealId);
  const [state, formAction] = useActionState<SaveState, FormData>(create, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      ref.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-3">
      <form ref={ref} action={formAction} className="flex gap-2">
        <Input name="titulo" placeholder="Nova tarefa / follow-up" required />
        <Input name="due_at" type="date" className="w-40" />
        <Button type="submit">Adicionar</Button>
      </form>

      <ul className="divide-y rounded-lg border">
        {tasks.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            Nenhuma tarefa.
          </li>
        )}
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-3 py-2">
            <Checkbox
              checked={t.done}
              onCheckedChange={(v) => alternarTarefa(t.id, Boolean(v))}
            />
            <span
              className={`flex-1 text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}
            >
              {t.titulo}
            </span>
            {t.due_at && (
              <span className="text-xs text-muted-foreground">
                {formatDate(t.due_at)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => excluirTarefa(t.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
