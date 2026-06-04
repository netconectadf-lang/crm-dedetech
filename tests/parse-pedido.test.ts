import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parsePedido } from "@/lib/compras/parse-pedido";

const texto = readFileSync(
  fileURLToPath(new URL("./fixtures/pedido-serdi.txt", import.meta.url)),
  "utf8",
);

describe("parsePedido (layout SERDI/VELO)", () => {
  const p = parsePedido(texto);

  it("extrai cabeçalho do pedido", () => {
    expect(p.numeroPedido).toBe("14272");
    expect(p.fornecedorCnpj).toBe("37.995.386/0001-29");
    expect(p.fornecedorNome).toMatch(/SERDI/i);
    expect(p.emitidoEm).toBe("2026-01-16");
  });

  it("extrai todos os 15 itens", () => {
    expect(p.itens).toHaveLength(15);
  });

  it("casa o total do documento", () => {
    expect(p.valorTotal).toBeCloseTo(9335.18, 2);
  });

  it("soma dos itens bate com o total", () => {
    const soma = p.itens.reduce((s, i) => s + i.valorTotal, 0);
    expect(soma).toBeCloseTo(9335.18, 2);
  });

  it("primeiro item: OLEO MINERAL", () => {
    expect(p.itens[0]).toMatchObject({
      codigo: "811",
      descricao: "OLEO MINERAL 5LT",
      quantidade: 1,
      valorUnitario: 135,
      valorTotal: 135,
    });
  });

  it("item com milhar e descrição numérica: TENOPA BASF", () => {
    const tenopa = p.itens.find((i) => i.codigo === "1220");
    expect(tenopa).toMatchObject({
      descricao: "TENOPA BASF 1LT",
      quantidade: 10,
      valorUnitario: 285,
      valorTotal: 2850,
    });
  });

  it("cada item respeita unit × qtd = total", () => {
    for (const i of p.itens) {
      expect(i.valorUnitario * i.quantidade).toBeCloseTo(i.valorTotal, 2);
    }
  });
});
