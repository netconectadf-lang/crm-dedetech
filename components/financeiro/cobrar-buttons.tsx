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

type Fatura = { payUrl?: string | null; invoiceUrl: string | null; pixPayload: string | null };

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
      setFatura({ payUrl: r.payUrl ?? null, invoiceUrl: r.invoiceUrl ?? null, pixPayload: r.pixPayload ?? null });
      setOpen(true);
    });
  }

  function copiarPix(payload: string) {
    navigator.clipboard
      .writeText(payload)
      .then(() => toast.success("Copiado!"))
      .catch(() => toast.error("Não consegui copiar."));
  }

  const mostrar = fatura ?? existing ?? null;
  const linkExistente = existing?.payUrl ?? existing?.invoiceUrl ?? null;

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

      {/* link persistente para a página de pagamento já gerada */}
      {linkExistente && (
        <Button asChild variant="ghost" size="sm" title="Abrir página de pagamento">
          <a href={linkExistente} target="_blank" rel="noopener noreferrer">
            <ReceiptText className="size-4" /> Pagamento
          </a>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cobrança gerada</DialogTitle>
            <DialogDescription>
              Envie o link de pagamento ao cliente — ele paga na sua página, com sua marca.
            </DialogDescription>
          </DialogHeader>

          {mostrar?.payUrl && (
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">Link de pagamento</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={mostrar.payUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 rounded-md border border-input bg-muted/30 px-2 text-xs"
                />
                <Button variant="outline" size="sm" onClick={() => copiarPix(mostrar.payUrl!)}>
                  <Copy className="size-4" /> Copiar
                </Button>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a href={mostrar.payUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" /> Abrir página de pagamento
                </a>
              </Button>
            </div>
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
