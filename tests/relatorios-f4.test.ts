import { describe, expect, it } from "vitest";

import {
  resumoOrcamentos,
  produtividadePorTecnico,
  agingInadimplencia,
  type QuoteLite,
  type Periodo,
} from "@/lib/relatorios";

const P: Periodo = { ano: 2026, mes: 7 };

describe("resumoOrcamentos", () => {
  const quotes: QuoteLite[] = [
    { status: "aceito", enviado_em: "2026-07-01T10:00:00Z", aceito_em: "2026-07-05T10:00:00Z", recusado_em: null, valor: 1000 },
    { status: "aceito", enviado_em: "2026-07-02T10:00:00Z", aceito_em: "2026-07-04T10:00:00Z", recusado_em: null, valor: 500 },
    { status: "recusado", enviado_em: "2026-07-03T10:00:00Z", aceito_em: null, recusado_em: "2026-07-06T10:00:00Z", valor: 800 },
    { status: "enviado", enviado_em: "2026-06-20T10:00:00Z", aceito_em: null, recusado_em: null, valor: 300 }, // fora do período
  ];

  it("conta enviados/aceitos/recusados no período", () => {
    const r = resumoOrcamentos(quotes, P);
    expect(r.enviados).toBe(3); // os 3 de julho
    expect(r.aceitos).toBe(2);
    expect(r.recusados).toBe(1);
  });

  it("taxa de ganho = aceitos / (aceitos+recusados)", () => {
    const r = resumoOrcamentos(quotes, P);
    expect(r.taxaGanho).toBe(67); // 2/3 ≈ 67%
  });

  it("valor e ticket dos aceitos", () => {
    const r = resumoOrcamentos(quotes, P);
    expect(r.valorAceito).toBe(1500);
    expect(r.ticketAceito).toBe(750);
  });

  it("ciclo médio em dias (aceito - enviado)", () => {
    const r = resumoOrcamentos(quotes, P);
    expect(r.cicloDias).toBe(3); // (4 + 2) / 2
  });
});

describe("produtividadePorTecnico", () => {
  it("agrega por técnico com tempo médio, km e custo", () => {
    const rows = [
      { tecnico: "João", tempo_execucao_min: 60, km_rodado: 10, custo_total: 100 },
      { tecnico: "João", tempo_execucao_min: 40, km_rodado: 5, custo_total: 50 },
      { tecnico: "Maria", tempo_execucao_min: 30, km_rodado: 8, custo_total: 30 },
    ];
    const r = produtividadePorTecnico(rows);
    expect(r[0].tecnico).toBe("João"); // mais OS primeiro
    expect(r[0].qtd).toBe(2);
    expect(r[0].tempoMedioMin).toBe(50);
    expect(r[0].kmTotal).toBe(15);
    expect(r[0].custoTotal).toBe(150);
  });

  it("OS sem técnico caem em 'Sem técnico'", () => {
    const r = produtividadePorTecnico([
      { tecnico: null, tempo_execucao_min: null, km_rodado: null, custo_total: null },
    ]);
    expect(r[0].tecnico).toBe("Sem técnico");
    expect(r[0].tempoMedioMin).toBeNull();
  });
});

describe("agingInadimplencia", () => {
  type Ar = { vencimento: string; saldo: number; status: string };
  const hoje = "2026-07-31";
  const rows: Ar[] = [
    { vencimento: "2026-07-20", saldo: 100, status: "a_vencer" }, // 11 dias → 1-30
    { vencimento: "2026-06-15", saldo: 200, status: "a_vencer" }, // 46 dias → 31-60
    { vencimento: "2026-04-01", saldo: 300, status: "a_vencer" }, // 120 dias → 90+
    { vencimento: "2026-08-10", saldo: 999, status: "a_vencer" }, // futuro → ignora
    { vencimento: "2026-01-01", saldo: 500, status: "quitado" }, // quitado → ignora
  ];
  const r = agingInadimplencia(
    rows,
    hoje,
    (x) => x.vencimento,
    (x) => x.saldo,
    (x) => x.status !== "quitado",
  );

  it("distribui nas faixas certas", () => {
    expect(r[0]).toMatchObject({ faixa: "1–30 dias", valor: 100, qtd: 1 });
    expect(r[1]).toMatchObject({ faixa: "31–60 dias", valor: 200, qtd: 1 });
    expect(r[3]).toMatchObject({ faixa: "90+ dias", valor: 300, qtd: 1 });
  });

  it("ignora futuro e quitado", () => {
    const total = r.reduce((s, f) => s + f.valor, 0);
    expect(total).toBe(600); // 100+200+300
  });
});
