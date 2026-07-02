import { describe, expect, it } from "vitest";

import { maskCpfCnpj, maskPhone, maskCurrency, parseCurrency } from "@/lib/format";
import { toCsv } from "@/lib/csv";

describe("máscaras de entrada", () => {
  it("CPF: 11 dígitos → 000.000.000-00", () => {
    expect(maskCpfCnpj("12345678901")).toBe("123.456.789-01");
  });
  it("CNPJ: 14 dígitos → 00.000.000/0000-00", () => {
    expect(maskCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
  it("CPF parcial não quebra", () => {
    expect(maskCpfCnpj("123")).toBe("123");
    expect(maskCpfCnpj("1234")).toBe("123.4");
  });
  it("telefone celular → (00) 00000-0000", () => {
    expect(maskPhone("61999998888")).toBe("(61) 99999-8888");
  });
  it("telefone fixo → (00) 0000-0000", () => {
    expect(maskPhone("6133334444")).toBe("(61) 3333-4444");
  });
  it("moeda: dígitos viram reais com centavos", () => {
    expect(maskCurrency("12345")).toBe("123,45");
    expect(maskCurrency("5")).toBe("0,05");
    expect(maskCurrency("")).toBe("");
  });
  it("parseCurrency: máscara → número", () => {
    expect(parseCurrency("1.234,56")).toBe(1234.56);
    expect(parseCurrency("")).toBeNull();
  });
});

describe("toCsv", () => {
  it("gera cabeçalho + linhas com ; e BOM", () => {
    const csv = toCsv(
      [{ nome: "A", valor: 10 }, { nome: "B", valor: 20 }],
      [
        { header: "Nome", key: "nome" },
        { header: "Valor", key: "valor" },
      ],
    );
    expect(csv.startsWith("﻿")).toBe(true); // BOM
    const linhas = csv.replace("﻿", "").split("\n");
    expect(linhas[0]).toBe("Nome;Valor");
    expect(linhas[1]).toBe("A;10");
    expect(linhas[2]).toBe("B;20");
  });
  it("escapa campos com ; aspas e quebra de linha", () => {
    const csv = toCsv([{ x: 'a;b"c' }], [{ header: "X", key: "x" }]);
    expect(csv).toContain('"a;b""c"');
  });
});
