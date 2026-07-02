import { describe, expect, it } from "vitest";

import {
  primeiraVisita,
  avancarPeriodo,
  ymdLocal,
  PERIODICITY_MONTHS,
} from "@/lib/contratos";

describe("primeiraVisita", () => {
  it("usa o dia de faturamento no mês do início da vigência", () => {
    // vigência inicia 03/01, dia de faturamento 5 → primeira visita 05/01
    expect(ymdLocal(primeiraVisita("2026-01-03", 5))).toBe("2026-01-05");
  });

  it("se o dia já passou no mês do início, vai para o mês seguinte", () => {
    // vigência inicia 10/01, dia 5 → 05/01 é antes do início → 05/02
    expect(ymdLocal(primeiraVisita("2026-01-10", 5))).toBe("2026-02-05");
  });

  it("clampa o dia de faturamento em 28", () => {
    expect(ymdLocal(primeiraVisita("2026-01-01", 31))).toBe("2026-01-28");
  });
});

describe("avancarPeriodo", () => {
  const base = primeiraVisita("2026-01-05", 5); // 05/01/2026

  it("mensal avança 1 mês", () => {
    expect(ymdLocal(avancarPeriodo(base, "mensal", 5))).toBe("2026-02-05");
  });
  it("trimestral avança 3 meses", () => {
    expect(ymdLocal(avancarPeriodo(base, "trimestral", 5))).toBe("2026-04-05");
  });
  it("anual avança 12 meses", () => {
    expect(ymdLocal(avancarPeriodo(base, "anual", 5))).toBe("2027-01-05");
  });
  it("PERIODICITY_MONTHS bate com os passos", () => {
    expect(PERIODICITY_MONTHS.bimestral).toBe(2);
    expect(PERIODICITY_MONTHS.semestral).toBe(6);
  });
});
