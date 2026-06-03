"use client";

import { useState } from "react";
import { Pause, Play, Ban } from "lucide-react";

import { mudarStatusContrato } from "@/app/(app)/contratos/actions";
import type { ContractStatus } from "@/lib/contratos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ContractStatusActions({
  contractId,
  status,
}: {
  contractId: string;
  status: ContractStatus;
}) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (status === "cancelado" || status === "encerrado") return null;

  return (
    <div className="flex gap-2">
      {status === "ativo" ? (
        <Button
          variant="outline"
          onClick={() => mudarStatusContrato(contractId, "suspenso")}
        >
          <Pause className="size-4" /> Suspender
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => mudarStatusContrato(contractId, "ativo")}
        >
          <Play className="size-4" /> Reativar
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive">
            <Ban className="size-4" /> Cancelar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">Motivo do cancelamento</label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                mudarStatusContrato(contractId, "cancelado", motivo);
                setOpen(false);
              }}
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
