"use client";

import { useState } from "react";
import { Trophy, X } from "lucide-react";

import { moverDeal } from "@/app/(app)/funil/actions";
import { LOSS_LABEL, type LossReason } from "@/lib/funil";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StageActions({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState<LossReason>("preco");

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="text-emerald-300"
        onClick={() => moverDeal(dealId, "ganho")}
      >
        <Trophy className="size-4" /> Ganhar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-rose-300">
            <X className="size-4" /> Perder
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">Motivo da perda</label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as LossReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LOSS_LABEL) as LossReason[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {LOSS_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                moverDeal(dealId, "perdido", motivo);
                setOpen(false);
              }}
            >
              Confirmar perda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
