import { describe, expect, it } from "vitest";

import { metricasNps, npsTone } from "@/lib/nps";

describe("metricasNps", () => {
  it("classifica promotores/neutros/detratores e calcula NPS", () => {
    const m = metricasNps([10, 9, 8, 7, 6, 0]);
    expect(m.total).toBe(6);
    expect(m.promotores).toBe(2); // 10, 9
    expect(m.neutros).toBe(2); // 8, 7
    expect(m.detratores).toBe(2); // 6, 0
    expect(m.nps).toBe(0); // (2-2)/6
  });

  it("calcula média com 1 casa", () => {
    expect(metricasNps([9, 10, 8]).media).toBe(9);
    expect(metricasNps([10, 9, 9]).media).toBe(9.3);
  });

  it("lida com lista vazia sem dividir por zero", () => {
    const m = metricasNps([]);
    expect(m).toEqual({ total: 0, promotores: 0, neutros: 0, detratores: 0, nps: 0, media: 0 });
  });

  it("NPS 100 só promotores, -100 só detratores", () => {
    expect(metricasNps([9, 10, 10]).nps).toBe(100);
    expect(metricasNps([0, 5, 6]).nps).toBe(-100);
  });
});

describe("npsTone", () => {
  it("mapeia o tom conforme o valor", () => {
    expect(npsTone(0, 0)).toBe("default");
    expect(npsTone(10, 70)).toBe("ok");
    expect(npsTone(10, 20)).toBe("warning");
    expect(npsTone(10, -10)).toBe("danger");
  });
});
