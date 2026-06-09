"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { gerarCobranca } from "@/app/(app)/financeiro/charge-actions";
import type { ChargeTipo } from "@/lib/asaas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Fatura = { invoiceUrl: string | null; pixPayload: string | null };

export function CobrarButtons({
  arId,
  existing,
}: {
  arId: string;
  existing?: Fatura;
}) {
  const [pending, start] = useTransition();
  const [tipoAtual, setTipoAtual] = useState<ChargeTipo | null>(null);
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [open, setOpen] = useState(false);

  function gerar(tipo: ChargeTipo) {
    setTipoAtual(tipo);
    start(async () => {
      const r = await gerarCobranca(arId, tipo);
      setTipoAtual(null);
      if (!r.ok) {
        toast.error(r.error ?? "Não foi possível gerar a cobrança.");
        return;
      }
      if (r.manual || (!r.invoiceUrl && !r.pixPayload)) {
        toast.success("Cobrança registrada (manual).");
        return;
      }
      toast.success("Cobrança gerada!");
      setFatura({ invoiceUrl: r.invoiceUrl ?? null, pixPayload: r.pixPayload ?? null });
      setOpen(true);
    });
  }

  function copiarPix(payload: string) {
    navigator.clipboard
      .writeText(payload)
      .then(() => toast.success("PIX copia-e-cola copiado!"))
      .catch(() => toast.error("Não consegui copiar."));
  }

  const mostrar = fatura ?? existing ?? null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        title="Gerar cobrança PIX"
        disabled={pending}
        onClick={() => gerar("pix")}
      >
        {pending && tipoAtual === "pix" ? "…" : "PIX"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Gerar boleto"
        disabled={pending}
        onClick={() => gerar("boleto")}
      >
        {pending && tipoAtual === "boleto" ? "…" : "Boleto"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Gerar link de cartão"
        disabled={pending}
        onClick={() => gerar("cartao")}
      >
        {pending && tipoAtual === "cartao" ? "…" : "Cartão"}
      </Button>

      {/* link persistente para a fatura já gerada */}
      {existing?.invoiceUrl && (
        <Button asChild variant="ghost" size="sm" title="Abrir fatura/cobrança">
          <a href={existing.invoiceUrl} target="_blank" rel="noopener noreferrer">
            <ReceiptText className="size-4" /> Fatura
          </a>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cobrança gerada</DialogTitle>
            <DialogDescription>
              Envie o link ou o PIX copia-e-cola para o cliente pagar.
            </DialogDescription>
          </DialogHeader>

          {mostrar?.invoiceUrl && (
            <Button asChild className="w-full">
              <a href={mostrar.invoiceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Abrir fatura
              </a>
            </Button>
          )}

          {mostrar?.pixPayload && (
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                PIX copia-e-cola
              </label>
              <textarea
                readOnly
                value={mostrar.pixPayload}
                onFocus={(e) => e.currentTarget.select()}
                className="h-24 w-full resize-none rounded-md border border-input bg-muted/30 p-2 font-mono text-xs"
              />
              <Button variant="outline" onClick={() => copiarPix(mostrar.pixPayload!)}>
                <Copy className="size-4" /> Copiar PIX
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
