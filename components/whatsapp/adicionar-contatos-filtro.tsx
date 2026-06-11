"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Filter } from "lucide-react";

import { adicionarContatosPorFiltro } from "@/app/(app)/whatsapp/campanhas/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SaveState } from "@/lib/crud-helpers";

const selectClass =
  "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TEMPERATURAS = [["quente", "🔥 Quente"], ["morno", "🌤️ Morno"], ["frio", "🧊 Frio"]];
const PRAGAS = [
  ["barata", "Barata"], ["formiga", "Formiga"], ["cupim", "Cupim"], ["rato", "Rato"],
  ["escorpiao", "Escorpião"], ["aranha", "Aranha"], ["pombo", "Pombo"], ["morcego", "Morcego"],
  ["mosquito-dengue", "Mosquito/Dengue"], ["pulga-carrapato", "Pulga/Carrapato"],
  ["percevejo", "Percevejo"], ["mosca", "Mosca"], ["traca", "Traça"],
  ["caixa-d-agua", "Caixa d'água"], ["sanitizacao", "Sanitização"],
  ["impermeabilizacao", "Impermeabilização"], ["dedetizacao-geral", "Dedetização (geral)"],
  ["geral-sem-servico", "Geral (sem serviço)"],
];
const RECENCIA = [
  ["ate-30d", "Até 30 dias"], ["31-60d", "31 a 60 dias"],
  ["61-90d", "61 a 90 dias"], ["90d-mais", "Mais de 90 dias"],
];
const STATUS = [
  ["novo", "Novo"], ["contatado", "Contatado"], ["interessado", "Interessado"], ["convertido", "Convertido"],
];

export function AdicionarContatosFiltro({ campanhaId }: { campanhaId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    adicionarContatosPorFiltro.bind(null, campanhaId),
    null,
  );

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      // fechar o dialog ao concluir a server action é um efeito colateral legítimo aqui
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Filter className="size-4" /> Adicionar por filtro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar contatos por filtro</DialogTitle>
          <DialogDescription>
            Escolha as etiquetas; todos os contatos que casarem entram na campanha (exceto descadastrados).
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="temp">Temperatura</Label>
            <select id="temp" name="temp" className={selectClass}>
              <option value="">Todas</option>
              {TEMPERATURAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="praga">Praga / serviço</Label>
            <select id="praga" name="praga" className={selectClass}>
              <option value="">Todas</option>
              {PRAGAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rec">Último contato</Label>
            <select id="rec" name="rec" className={selectClass}>
              <option value="">Qualquer data</option>
              {RECENCIA.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className={selectClass}>
              <option value="">Todos</option>
              {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Adicionando…" : "Adicionar à campanha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
