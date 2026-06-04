"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, QrCode, RefreshCw, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  gerarQrCode,
  statusWhatsapp,
  desconectarWhatsapp,
} from "@/app/(app)/integracoes/whatsapp/actions";
import type { WaState } from "@/lib/whatsapp/evolution";

export function WhatsappConnect({ initialState }: { initialState: WaState }) {
  const router = useRouter();
  const [state, setState] = useState<WaState>(initialState);
  const [qr, setQr] = useState<string | undefined>();
  const [pairingCode, setPairingCode] = useState<string | undefined>();
  const [erro, setErro] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  // Enquanto aguarda a leitura do QR, faz polling do status.
  useEffect(() => {
    if (state !== "connecting" || !qr) return;
    const id = setInterval(async () => {
      const { state: s } = await statusWhatsapp();
      if (s === "open") {
        clearInterval(id);
        setState("open");
        setQr(undefined);
        router.refresh();
      }
    }, 3500);
    return () => clearInterval(id);
  }, [state, qr, router]);

  function conectar() {
    setErro(undefined);
    startTransition(async () => {
      const r = await gerarQrCode();
      if (r.error) {
        setErro(r.error);
        return;
      }
      setState(r.state);
      setQr(r.qr);
      setPairingCode(r.pairingCode);
      if (r.state === "open") router.refresh();
    });
  }

  if (state === "open") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/25 bg-primary/8 px-4 py-3">
          <span className="flex items-center gap-2 text-sm">
            <CircleCheck className="size-5 text-primary" />
            WhatsApp <strong>conectado</strong> e pronto para enviar mensagens.
          </span>
          <form action={desconectarWhatsapp}>
            <Button type="submit" variant="outline" size="sm" className="text-destructive">
              Desconectar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {erro && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </p>
      )}

      {qr ? (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR é um data URL base64, não um asset */}
            <img src={qr} alt="QR Code do WhatsApp" width={240} height={240} />
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Smartphone className="size-4 text-primary" /> Como conectar
            </p>
            <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
              <li>Abra o <strong>WhatsApp</strong> no celular.</li>
              <li>Toque em <strong>Configurações → Aparelhos conectados</strong>.</li>
              <li>Toque em <strong>Conectar um aparelho</strong> e aponte para este QR Code.</li>
            </ol>
            {pairingCode && (
              <p className="text-muted-foreground">
                Ou use o código de pareamento:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{pairingCode}</code>
              </p>
            )}
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Aguardando leitura… a tela atualiza sozinha ao conectar.
            </p>
            <Button onClick={conectar} variant="ghost" size="sm" disabled={pending}>
              <RefreshCw className="size-4" /> Gerar novo QR
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Gere o QR Code e escaneie com o celular que tem o WhatsApp da empresa.
          </p>
          <Button onClick={conectar} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            Gerar QR Code
          </Button>
        </div>
      )}
    </div>
  );
}
