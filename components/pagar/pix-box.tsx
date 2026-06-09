"use client";

import { useEffect, useState } from "react";

export function PixBox({
  token,
  pixPayload,
  pixQrImage,
  statusInicial,
}: {
  token: string;
  pixPayload: string | null;
  pixQrImage: string | null;
  statusInicial: string;
}) {
  const [status, setStatus] = useState(statusInicial);
  const [copiado, setCopiado] = useState(false);
  const pago = status === "pago";

  // Atualiza ao vivo: enquanto não pago, pergunta o status a cada 5s
  useEffect(() => {
    if (pago) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/pagar/${token}/status`, { cache: "no-store" });
        const j = (await r.json()) as { status: string | null };
        if (j.status) setStatus(j.status);
      } catch {
        /* ignora falha de rede pontual */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [token, pago]);

  function copiar() {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  if (pago) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white text-2xl">✓</span>
        <p className="text-lg font-semibold text-emerald-700">Pagamento confirmado!</p>
        <p className="text-sm text-muted-foreground">Obrigado. Já recebemos seu pagamento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">Pague com PIX — escaneie o QR Code ou copie o código:</p>
      {pixQrImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${pixQrImage}`}
          alt="QR Code PIX"
          className="size-56 rounded-lg border border-border bg-white p-2"
        />
      )}
      {pixPayload && (
        <div className="w-full">
          <textarea
            readOnly
            value={pixPayload}
            onFocus={(e) => e.currentTarget.select()}
            className="h-20 w-full resize-none rounded-md border border-input bg-muted/30 p-2 font-mono text-xs"
          />
          <button
            onClick={copiar}
            className="mt-2 w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {copiado ? "Código copiado! ✓" : "Copiar código PIX"}
          </button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Assim que o pagamento for confirmado, esta página atualiza automaticamente.
      </p>
    </div>
  );
}
