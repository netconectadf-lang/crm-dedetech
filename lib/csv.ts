/**
 * Geração de CSV compatível com Excel pt-BR (separador ';' + BOM UTF-8).
 * Isomórfico (serve p/ route handlers no servidor e download no cliente).
 */

export type CsvColuna = { header: string; key: string };

function campo(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[], colunas: CsvColuna[]): string {
  const linhas = [
    colunas.map((c) => campo(c.header)).join(";"),
    ...rows.map((r) => colunas.map((c) => campo(r[c.key])).join(";")),
  ];
  return "﻿" + linhas.join("\n"); // BOM p/ o Excel abrir com acentos certos
}
