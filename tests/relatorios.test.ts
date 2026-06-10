import { describe, expect, it } from "vitest";

import {
  anoMes,
  serieMensal,
  agruparRanking,
  contarPor,
  periodoAnterior,
  noPeriodo,
  somaNoPeriodo,
  variacao,
} from "@/lib/relatorios";

describe("anoMes", () => {
  it("lê ano e mês de uma data ISO sem sofrer com fuso", () => {
    expect(anoMes("2026-03-15")).toEqual({ ano: 2026, mes: 2 });
    expect(anoMes("2025-12-01T23:59:00.000Z")).toEqual({ ano: 2025, mes: 11 });
    expect(anoMes("2026-01-31")).toEqual({ ano: 2026, mes: 0 });
  });
});

describe("serieMensal", () => {
  const rows = [
    { d: "2026-01-10", v: 100 },
    { d: "2026-01-20", v: 50 },
    { d: "2026-03-05", v: 200 },
    { d: "2025-03-05", v: 999 }, // ano diferente — ignorado
    { d: null, v: 999 }, // sem data — ignorado
  ];

  it("soma valores no balde do mês correto", () => {
    const s = serieMensal(rows, 2026, (r) => r.d, (r) => r.v);
    expect(s).toHaveLength(12);
    expect(s[0]).toBe(150); // jan
    expect(s[2]).toBe(200); // mar
    expect(s.reduce((a, b) => a + b, 0)).toBe(350);
  });
});

describe("agruparRanking", () => {
  const rows = [
    { nome: "Ana", v: 100 },
    { nome: "Bruno", v: 300 },
    { nome: "Ana", v: 50 },
    { nome: null, v: 10 },
  ];

  it("agrupa, soma, conta e ordena por valor desc", () => {
    const r = agruparRanking(rows, (x) => x.nome, (x) => x.v);
    expect(r[0]).toEqual({ chave: "Bruno", valor: 300, qtd: 1 });
    expect(r[1]).toEqual({ chave: "Ana", valor: 150, qtd: 2 });
    expect(r[2]).toEqual({ chave: "—", valor: 10, qtd: 1 });
  });
});

describe("contarPor", () => {
  it("conta ocorrências por chave", () => {
    const r = contarPor(
      [{ s: "executada" }, { s: "executada" }, { s: "agendada" }],
      (x) => x.s,
    );
    expect(r[0]).toEqual({ chave: "executada", valor: 2, qtd: 2 });
    expect(r[1]).toEqual({ chave: "agendada", valor: 1, qtd: 1 });
  });
});

describe("periodoAnterior", () => {
  it("volta um ano no modo anual", () => {
    expect(periodoAnterior({ ano: 2026 })).toEqual({ ano: 2025 });
  });
  it("volta um mês, virando o ano em janeiro", () => {
    expect(periodoAnterior({ ano: 2026, mes: 6 })).toEqual({ ano: 2026, mes: 5 });
    expect(periodoAnterior({ ano: 2026, mes: 1 })).toEqual({ ano: 2025, mes: 12 });
  });
});

describe("noPeriodo", () => {
  it("casa ano inteiro ou mês específico", () => {
    expect(noPeriodo("2026-06-10", { ano: 2026 })).toBe(true);
    expect(noPeriodo("2026-06-10", { ano: 2026, mes: 6 })).toBe(true);
    expect(noPeriodo("2026-06-10", { ano: 2026, mes: 5 })).toBe(false);
    expect(noPeriodo("2025-06-10", { ano: 2026 })).toBe(false);
    expect(noPeriodo(null, { ano: 2026 })).toBe(false);
  });
});

describe("somaNoPeriodo", () => {
  const rows = [
    { d: "2026-06-01", v: 100 },
    { d: "2026-06-20", v: 50 },
    { d: "2026-05-20", v: 999 },
  ];
  it("soma só o que cai no período", () => {
    expect(somaNoPeriodo(rows, { ano: 2026, mes: 6 }, (r) => r.d, (r) => r.v)).toBe(150);
    expect(somaNoPeriodo(rows, { ano: 2026 }, (r) => r.d, (r) => r.v)).toBe(1149);
  });
});

describe("variacao", () => {
  it("calcula a variação percentual e direção", () => {
    expect(variacao(120, 100)).toEqual({ pct: 20, dir: "up" });
    expect(variacao(80, 100)).toEqual({ pct: -20, dir: "down" });
    expect(variacao(100, 100)).toEqual({ pct: 0, dir: "flat" });
  });
  it("base zero retorna pct nulo", () => {
    expect(variacao(50, 0)).toEqual({ pct: null, dir: "up" });
    expect(variacao(0, 0)).toEqual({ pct: 0, dir: "flat" });
  });
});
