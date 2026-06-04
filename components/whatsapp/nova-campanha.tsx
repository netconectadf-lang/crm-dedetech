"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { criarCampanha } from "@/app/(app)/whatsapp/campanhas/actions";
import type { SaveState } from "@/lib/crud-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NovaCampanha({ scripts }: { scripts: { id: string; nome: string }[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(criarCampanha, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" disabled={scripts.length === 0}>
          Nova campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>Escolha o script e o intervalo entre os envios.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome da campanha</Label>
            <Input id="nome" name="nome" placeholder="Ex: Lembrete de visita — junho" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="script_id">Script</Label>
            <select
              id="script_id"
              name="script_id"
              required
              defaultValue=""
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Selecione…</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="intervalo_segundos">Intervalo entre envios (segundos)</Label>
            <Input
              id="intervalo_segundos"
              name="intervalo_segundos"
              type="number"
              min={2}
              max={120}
              defaultValue={6}
            />
            <p className="text-xs text-muted-foreground">Recomendado 5–10s para reduzir risco de bloqueio.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar campanha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
