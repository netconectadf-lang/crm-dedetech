"use client";

import { useEffect } from "react";

/**
 * Fallback de último recurso (erro no root layout). Precisa renderizar a própria
 * <html>/<body> porque substitui o layout raiz. Sem dependências de UI para não
 * arrastar mais código que possa falhar.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] erro fatal:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#08140F",
          color: "#e8f0ec",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 32, maxWidth: 420 }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Algo deu errado</h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
            Tivemos um problema inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#10b981",
              color: "#06231a",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
