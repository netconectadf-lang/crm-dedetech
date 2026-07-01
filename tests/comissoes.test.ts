import { describe, expect, it } from "vitest";

import { liberarComissoesDaAr } from "@/lib/comissoes";

/**
 * Garante que ao pagar uma AR (webhook Asaas / cartão / baixa manual) as
 * comissões "provisionadas" são recalculadas sobre o valor recebido e marcadas
 * como "liberada". Regressão dos pagamentos automáticos que não liberavam nada.
 */

type Comissao = { id: string; percentual: number | null; valor_fixo: number | null };

/** Mock mínimo e chainável do supabase-js suficiente p/ liberarComissoesDaAr. */
function fakeSupabase(comissoes: Comissao[]) {
  const updates: Array<Record<string, unknown>> = [];

  function selectChain(result: unknown) {
    const p: any = { eq: () => p, then: (r: any) => Promise.resolve(result).then(r) };
    return p;
  }
  function updateChain(payload: Record<string, unknown>) {
    const captured: Record<string, unknown> = { ...payload };
    const p: any = {
      eq: (col: string, val: unknown) => {
        captured[col] = val;
        return p;
      },
      then: (r: any) => {
        updates.push(captured);
        return Promise.resolve({}).then(r);
      },
    };
    return p;
  }

  const client: any = {
    from: () => ({
      select: () => selectChain({ data: comissoes }),
      update: (payload: Record<string, unknown>) => updateChain(payload),
    }),
  };
  return { client, updates };
}

describe("liberarComissoesDaAr", () => {
  it("percentual: calcula sobre o valor recebido e marca liberada", async () => {
    const { client, updates } = fakeSupabase([
      { id: "c1", percentual: 10, valor_fixo: null },
    ]);
    await liberarComissoesDaAr(client, "t1", "ar1", 200);
    expect(updates).toHaveLength(1);
    expect(updates[0].status).toBe("liberada");
    expect(updates[0].valor).toBe(20); // 10% de 200
    expect(updates[0].base_valor).toBe(200);
    expect(updates[0].id).toBe("c1");
    expect(updates[0].tenant_id).toBe("t1");
  });

  it("valor fixo: usa o valor fixo, ignora a base", async () => {
    const { client, updates } = fakeSupabase([
      { id: "c2", percentual: null, valor_fixo: 50 },
    ]);
    await liberarComissoesDaAr(client, "t1", "ar1", 999);
    expect(updates[0].valor).toBe(50);
  });

  it("sem comissões provisionadas: não faz nada (idempotente)", async () => {
    const { client, updates } = fakeSupabase([]);
    await liberarComissoesDaAr(client, "t1", "ar1", 100);
    expect(updates).toHaveLength(0);
  });

  it("múltiplas comissões: libera todas", async () => {
    const { client, updates } = fakeSupabase([
      { id: "c1", percentual: 5, valor_fixo: null },
      { id: "c2", percentual: null, valor_fixo: 30 },
    ]);
    await liberarComissoesDaAr(client, "t1", "ar1", 400);
    expect(updates).toHaveLength(2);
    expect(updates[0].valor).toBe(20); // 5% de 400
    expect(updates[1].valor).toBe(30);
  });
});
