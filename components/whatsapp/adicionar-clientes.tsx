"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { adicionarClientesNaCampanha } from "@/app/(app)/whatsapp/campanhas/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveState } from "@/lib/crud-helpers";

const selectClass =
  "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AdicionarClientes({
  campanhaId,
  segmentos,
  redes,
  ufs,
}: {
  campanhaId: string;
  segmentos: string[];
  redes: string[];
  ufs: string[];
}) {
  const [open, setOpen] = useState(false);
  const [ativos, setAtivos] = useState(true);
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    adicionarClientesNaCampanha.bind(null, campanhaId),
    null,
  );

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      setOpen(false);
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <UserPlus className="size-4" /> Adicionar clientes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar clientes à campanha</DialogTitle>
          <DialogDescription>
            Filtra os clientes do CRM (com telefone) e adiciona como destinatários.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="segmento">Segmento</Label>
            <select id="segmento" name="segmento" className={selectClass}>
              <option value="">Todos</option>
              {segmentos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rede">Rede</Label>
            <select id="rede" name="rede" className={selectClass}>
              <option value="">Todas</option>
              <option value="__sem">Sem rede</option>
              {redes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="uf">UF</Label>
              <select id="uf" name="uf" className={selectClass}>
                <option value="">Todas</option>
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" placeholder="(opcional)" />
            </div>
          </div>
          <input type="hidden" name="somente_ativos" value={ativos ? "true" : "false"} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ativos}
              onChange={(e) => setAtivos(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Somente clientes ativos
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Adicionando…" : "Adicionar à campanha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
