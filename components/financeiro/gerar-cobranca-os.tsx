"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

import { faturarEGerarCobranca } from "@/app/(app)/financeiro/actions";
import type { ChargeTipo } from "@/lib/asaas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function venc7(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

type Fatura = { invoiceUrl: string | null; pixPayload: string | null };

export function GerarCobrancaOSDialog({
  osId,
  valorSugerido,
}: {
  osId: string;
  valorSugerido?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [valor, setValor] = useState(valorSugerido && valorSugerido > 0 ? String(valorSugerido) : "");
  const [vencimento, setVencimento] = useState(venc7());
  const [tipo, setTipo] = useState<ChargeTipo>("pix");
  const [fatura, setFatura] = useState<Fatura | null>(null);

  function gerar() {
    const v = Number(valor.replace(",", "."));
    if (!v || v <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    start(async () => {
      const r = await faturarEGerarCobranca(osId, { valor: v, vencimento, tipo });
      if (!r.ok) {
        toast.error(r.error ?? "Não foi possível gerar a cobrança.");
        return;
      }
      router.refresh();
      if (r.invoiceUrl || r.pixPayload) {
        toast.success("Cobrança gerada!");
        setFatura({ invoiceUrl: r.invoiceUrl ?? null, pixPayload: r.pixPayload ?? null });
      } else {
        toast.success("Cobrança registrada.");
        setOpen(false);
      }
    });
  }

  function copiar(payload: string) {
    navigator.clipboard
      .writeText(payload)
      .then(() => toast.success("PIX copia-e-cola copiado!"))
      .catch(() => toast.error("Não consegui copiar."));
  }

  return (
    <>
      <Button
        className="bg-primary hover:bg-primary/90"
        onClick={() => {
          setFatura(null);
          setOpen(true);
        }}
      >
        <Wallet className="size-4" /> Gerar cobrança
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar cobrança</DialogTitle>
            <DialogDescription>
              Informe o valor e a forma de pagamento — gera no Asaas na hora.
            </DialogDescription>
          </DialogHeader>

          {!fatura ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor-cobranca">Valor (R$)</Label>
                <Input
                  id="valor-cobranca"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="venc-cobranca">Vencimento</Label>
                <Input
                  id="venc-cobranca"
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Forma de pagamento</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as ChargeTipo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={gerar} disabled={pending}>
                {pending ? "Gerando…" : "Gerar cobrança"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {fatura.invoiceUrl && (
                <Button asChild className="w-full">
                  <a href={fatura.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" /> Abrir fatura
                  </a>
                </Button>
              )}
              {fatura.pixPayload && (
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">PIX copia-e-cola</Label>
                  <textarea
                    readOnly
                    value={fatura.pixPayload}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-24 w-full resize-none rounded-md border border-input bg-muted/30 p-2 font-mono text-xs"
                  />
                  <Button variant="outline" onClick={() => copiar(fatura.pixPayload!)}>
                    <Copy className="size-4" /> Copiar PIX
                  </Button>
                </div>
              )}
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
