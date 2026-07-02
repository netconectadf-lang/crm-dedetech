"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Error boundary do app. Antes qualquer exceção numa server component caía na
 * tela genérica do Next, sem marca nem "tentar de novo". Aqui damos contexto e
 * um botão de retry (reset re-renderiza o segmento).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erro na tela:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar esta tela. Você pode tentar de novo — se
          persistir, avise o suporte.
        </p>
        {error.digest && (
          <p className="pt-1 font-mono text-xs text-muted-foreground/70">
            ref: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>
        <RotateCw className="size-4" />
        Tentar novamente
      </Button>
    </main>
  );
}
