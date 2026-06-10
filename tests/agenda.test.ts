import { describe, expect, it } from "vitest";

import { segundaDaSemana, semanaDias, addDias, ymdNoFuso, horaNoFuso } from "@/lib/agenda";

describe("segundaDaSemana", () => {
  it("retorna a segunda da semana de qualquer dia", () => {
    // 2026-06-10 é uma quarta-feira → segunda é 2026-06-08
    expect(segundaDaSemana("2026-06-10")).toBe("2026-06-08");
    expect(segundaDaSemana("2026-06-08")).toBe("2026-06-08"); // já é segunda
    expect(segundaDaSemana("2026-06-14")).toBe("2026-06-08"); // domingo
  });
});

describe("semanaDias", () => {
  it("gera os 7 dias a partir da segunda", () => {
    const d = semanaDias("2026-06-08");
    expect(d).toHaveLength(7);
    expect(d[0]).toBe("2026-06-08");
    expect(d[6]).toBe("2026-06-14");
  });

  it("atravessa virada de mês corretamente", () => {
    expect(semanaDias("2026-06-29")[6]).toBe("2026-07-05");
  });
});

describe("addDias", () => {
  it("soma e subtrai dias", () => {
    expect(addDias("2026-06-08", 7)).toBe("2026-06-15");
    expect(addDias("2026-06-08", -7)).toBe("2026-06-01");
  });
});

describe("bucketização no fuso de Brasília", () => {
  it("um horário noturno em BR cai no dia local, não no UTC", () => {
    // 2026-06-10T23:30-03:00 = 2026-06-11T02:30Z; deve cair em 2026-06-10 (BR)
    expect(ymdNoFuso("2026-06-11T02:30:00.000Z")).toBe("2026-06-10");
    expect(horaNoFuso("2026-06-11T02:30:00.000Z")).toBe("23:30");
  });
});
