"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { salvarScript } from "@/app/(app)/whatsapp/scripts/actions";
import { renderScript, VARIAVEIS_DISPONIVEIS } from "@/lib/whatsapp/render";
import type { SaveState } from "@/lib/crud-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Script = { id: string; nome: string; corpo: string; ativo: boolean };

export function ScriptEditor({ script, trigger }: { script?: Script; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [corpo, setCorpo] = useState(script?.corpo ?? "");
  const [state, action, pending] = useActionState<SaveState, FormData>(
    salvarScript.bind(null, script?.id ?? null),
    null,
  );

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fecha o dialog ao concluir a action
      setOpen(false);
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  const preview = renderScript(corpo, {
    nome: "Maria Silva",
    empresa: "Sua Empresa",
    variavel_1: "[var1]",
    variavel_2: "[var2]",
    variavel_3: "[var3]",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{script ? "Editar script" : "Novo script"}</DialogTitle>
          <DialogDescription>
            Escreva a mensagem. Use variáveis que serão trocadas pelos dados de cada contato.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome do script</Label>
            <Input id="nome" name="nome" defaultValue={script?.nome} placeholder="Ex: Lembrete de visita" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="corpo">Mensagem</Label>
            <div className="flex flex-wrap gap-1">
              {VARIAVEIS_DISPONIVEIS.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  title={v.desc}
                  onClick={() => setCorpo((c) => `${c}${v.token}`)}
                  className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary ring-1 ring-inset ring-primary/20 transition-colors hover:bg-primary/20"
                >
                  {v.token}
                </button>
              ))}
            </div>
            <Textarea
              id="corpo"
              name="corpo"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={8}
              placeholder="Olá {{nome}}, tudo bem?"
              required
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Pré-visualização</p>
            <p className="whitespace-pre-wrap text-sm">{preview || "—"}</p>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="ativo" name="ativo" defaultChecked={script?.ativo ?? true} />
            <Label htmlFor="ativo">Ativo</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar script"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
