import { describe, expect, it } from "vitest";

import { inicioDoMesBR, ymdNoFuso } from "@/lib/agenda";
import { espelhoPonto } from "@/lib/rh";

/**
 * Fronteira de mês e agrupamento de ponto no fuso de Brasília (UTC-3), não UTC.
 * Regressão dos off-by-3h que jogavam OS/batidas do fim do mês/dia no bucket
 * errado.
 */
describe("inicioDoMesBR", () => {
  it("01/mês às 00:00 BRT = 03:00Z", () => {
    // 15/07 12:00Z → mês é julho em BR → início = 01/07 03:00Z
    expect(inicioDoMesBR("2026-07-15T12:00:00.000Z")).toBe("2026-07-01T03:00:00.000Z");
  });

  it("31/07 23:30 BRT (= 01/08 02:30Z) ainda é JULHO em BR", () => {
    // Instante 2026-08-01T02:30:00Z é 31/07 23:30 em Brasília.
    expect(ymdNoFuso("2026-08-01T02:30:00.000Z")).toBe("2026-07-31");
    expect(inicioDoMesBR("2026-08-01T02:30:00.000Z")).toBe("2026-07-01T03:00:00.000Z");
  });
});

describe("espelhoPonto — agrupa por dia BR", () => {
  it("batida às 22h BRT (01h UTC do dia seguinte) fica no dia local certo", () => {
    // 2026-07-11T01:00:00Z = 10/07 22:00 em Brasília → deve cair em 10/07.
    const r = espelhoPonto([
      { tipo: "entrada", registrado_em: "2026-07-10T12:00:00.000Z" }, // 09:00 BRT
      { tipo: "saida", registrado_em: "2026-07-11T01:00:00.000Z" }, // 22:00 BRT do dia 10
    ]);
    // Um único dia (10/07), não dois.
    expect(r.dias).toHaveLength(1);
    expect(r.dias[0].dia).toBe("2026-07-10");
  });
});
