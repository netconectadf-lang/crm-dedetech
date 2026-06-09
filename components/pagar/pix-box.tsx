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
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-400 text-2xl text-[#052E1F]">✓</span>
        <p className="text-lg font-bold text-emerald-300">Pagamento confirmado!</p>
        <p className="text-sm text-white/55">Obrigado. Já recebemos seu pagamento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-white/55">Pague com PIX — escaneie o QR Code ou copie o código:</p>
      {pixQrImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${pixQrImage}`}
          alt="QR Code PIX"
          className="size-60 rounded-2xl bg-white p-3"
        />
      )}
      {pixPayload && (
        <div className="w-full">
          <textarea
            readOnly
            value={pixPayload}
            onFocus={(e) => e.currentTarget.select()}
            className="h-20 w-full resize-none rounded-2xl border border-white/10 bg-[#0A1F17] p-3 font-mono text-xs text-white/80"
          />
          <button
            onClick={copiar}
            className="mt-2.5 w-full rounded-2xl bg-emerald-400 px-4 py-3.5 text-[15px] font-bold text-[#052E1F] transition-opacity active:opacity-90"
          >
            {copiado ? "Código copiado! ✓" : "Copiar código PIX"}
          </button>
        </div>
      )}
      <p className="text-center text-[11px] leading-relaxed text-white/40">
        Assim que o pagamento for confirmado, esta página atualiza automaticamente.
      </p>
    </div>
  );
}
