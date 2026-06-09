"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { gerarCobranca } from "@/app/(app)/financeiro/charge-actions";
import type { ChargeTipo } from "@/lib/asaas";
import { Button } from "@/components/ui/button";

type Fatura = { payUrl?: string | null; invoiceUrl: string | null; pixPayload: string | null };

export function CobrarButtons({
  arId,
  existing,
}: {
  arId: string;
  existing?: Fatura;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tipoAtual, setTipoAtual] = useState<ChargeTipo | null>(null);

  function gerar(tipo: ChargeTipo) {
    // abre a aba JÁ no clique (gesto do usuário) p/ não ser bloqueada como popup;
    // depois redireciona pra página de pagamento quando o link estiver pronto.
    const win = window.open("", "_blank");
    setTipoAtual(tipo);
    start(async () => {
      const r = await gerarCobranca(arId, tipo);
      setTipoAtual(null);
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
    });
  }

  const linkExistente = existing?.payUrl ?? existing?.invoiceUrl ?? null;

  return (
    <>
      <Button variant="ghost" size="sm" title="Gerar cobrança PIX" disabled={pending} onClick={() => gerar("pix")}>
        {pending && tipoAtual === "pix" ? "…" : "PIX"}
      </Button>
      <Button variant="ghost" size="sm" title="Gerar boleto" disabled={pending} onClick={() => gerar("boleto")}>
        {pending && tipoAtual === "boleto" ? "…" : "Boleto"}
      </Button>
      <Button variant="ghost" size="sm" title="Gerar link de cartão" disabled={pending} onClick={() => gerar("cartao")}>
        {pending && tipoAtual === "cartao" ? "…" : "Cartão"}
      </Button>

      {linkExistente && (
        <Button asChild variant="ghost" size="sm" title="Abrir página de pagamento">
          <a href={linkExistente} target="_blank" rel="noopener noreferrer">
            <ReceiptText className="size-4" /> Pagamento
          </a>
        </Button>
      )}
    </>
  );
}
