import { describe, expect, it } from "vitest";

import { aniversariosCompletos, valorReajustado } from "@/lib/contratos";

describe("aniversariosCompletos", () => {
  it("conta aniversários anuais completos até a data de referência", () => {
    expect(aniversariosCompletos("2024-03-10", new Date("2026-03-15T00:00:00"))).toBe(2);
    expect(aniversariosCompletos("2024-03-10", new Date("2026-02-15T00:00:00"))).toBe(1);
    expect(aniversariosCompletos("2024-03-10", new Date("2024-12-31T00:00:00"))).toBe(0);
  });

  it("não retorna negativo antes do início", () => {
    expect(aniversariosCompletos("2026-06-01", new Date("2025-01-01T00:00:00"))).toBe(0);
  });
});

describe("valorReajustado", () => {
  it("aplica reajuste composto por ciclo", () => {
    expect(valorReajustado(100, 1, 10)).toBe(110);
    expect(valorReajustado(100, 2, 10)).toBe(121);
  });

  it("devolve o valor base sem ciclos ou sem índice", () => {
    expect(valorReajustado(250, 0, 5)).toBe(250);
    expect(valorReajustado(250, 3, 0)).toBe(250);
  });

  it("arredonda a 2 casas", () => {
    expect(valorReajustado(333.33, 1, 3.89)).toBe(346.3);
  });
});
