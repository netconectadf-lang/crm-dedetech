"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { vincularScript, salvarCorpoScript } from "@/app/(app)/whatsapp/campanhas/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Script = { id: string; nome: string; corpo: string };

export function EscolherScript({
  campanhaId,
  scriptIdAtual,
  scripts,
}: {
  campanhaId: string;
  scriptIdAtual: string | null;
  scripts: Script[];
}) {
  const [sel, setSel] = useState(scriptIdAtual ?? "");
  const [corpo, setCorpo] = useState(scripts.find((s) => s.id === scriptIdAtual)?.corpo ?? "");
  const [pending, start] = useTransition();

  function escolher(id: string) {
    setSel(id);
    setCorpo(scripts.find((s) => s.id === id)?.corpo ?? "");
    start(async () => {
      const r = await vincularScript(campanhaId, id);
      if (r.error) toast.error(r.error);
      else toast.success("Script vinculado à campanha.");
    });
  }

  function salvar() {
    if (!sel) {
      toast.error("Escolha um script primeiro.");
      return;
    }
    start(async () => {
      const r = await salvarCorpoScript(sel, corpo);
      if (r.error) toast.error(r.error);
      else toast.success("Mensagem salva.");
    });
  }

  return (
    <div className="space-y-3">
      <Select value={sel} onValueChange={escolher}>
        <SelectTrigger className="w-full sm:w-96">
          <SelectValue placeholder="Escolha um script…" />
        </SelectTrigger>
        <SelectContent>
          {scripts.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sel && (
        <>
          <Textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={7}
            className="text-sm"
            placeholder="Texto da mensagem…"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={salvar} disabled={pending}>
              <Save className="size-4" /> {pending ? "Salvando…" : "Salvar mensagem"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {"Variáveis: {{nome}} (contato) e {{var1}} (serviço). Editar altera o script para futuras campanhas."}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
