"use client";

import { Download } from "lucide-react";

import { toCsv, type CsvColuna } from "@/lib/csv";
import { Button } from "@/components/ui/button";

/**
 * Botão de exportar CSV a partir de linhas JÁ carregadas na tela (respeita os
 * filtros aplicados). Reutilizável em qualquer lista: passe `rows` + `colunas`.
 */
export function ExportarCsv({
  rows,
  colunas,
  filename,
  label = "Exportar CSV",
}: {
  rows: Record<string, unknown>[];
  colunas: CsvColuna[];
  filename: string;
  label?: string;
}) {
  function baixar() {
    const csv = toCsv(rows, colunas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={baixar} disabled={rows.length === 0}>
      <Download className="size-4" />
      {label}
    </Button>
  );
}
