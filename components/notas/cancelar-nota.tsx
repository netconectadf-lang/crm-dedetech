"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cancelarNota } from "@/app/(app)/notas/actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CancelarNota({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [just, setJust] = useState("");
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar NFS-e</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Justificativa do cancelamento (mín. 5 caracteres)"
          value={just}
          onChange={(e) => setJust(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending || just.trim().length < 5}
            onClick={() =>
              start(async () => {
                const r = await cancelarNota(id, just.trim());
                if (r.error) toast.error(r.error);
                else {
                  toast.success(r.message ?? "Cancelada.");
                  setOpen(false);
                }
              })
            }
          >
            {pending ? "Cancelando…" : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
