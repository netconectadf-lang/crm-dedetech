"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
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

  function gerar() {
    const v = Number(valor.replace(",", "."));
    if (!v || v <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    // abre a aba já no clique p/ não ser bloqueada; redireciona quando pronto
    const win = window.open("", "_blank");
    start(async () => {
      const r = await faturarEGerarCobranca(osId, { valor: v, vencimento, tipo });
      if (!r.ok) {
        win?.close();
        toast.error(r.error ?? "Não foi possível gerar a cobrança.");
        return;
      }
      router.refresh();
      const url = r.payUrl ?? r.invoiceUrl;
      if (url) {
        if (win) win.location.href = url;
        else window.open(url, "_blank");
        toast.success("Cobrança gerada — abrindo pagamento.");
      } else {
        win?.close();
        toast.success("Cobrança registrada.");
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        className="bg-primary hover:bg-primary/90"
        onClick={() => setOpen(true)}
      >
        <Wallet className="size-4" /> Gerar cobrança
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar cobrança</DialogTitle>
            <DialogDescription>
              Informe o valor e a forma — gera no Asaas e abre a página de pagamento.
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>
    </>
  );
}
