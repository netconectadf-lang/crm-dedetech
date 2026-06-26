import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { KNOWN_FEATURE_KEYS } from "@/lib/entitlements/core";
import { FEATURE_BY_HREF } from "@/lib/navigation";

/**
 * Trava a cobertura do enforcement de planos. A sidebar esconde itens via
 * FEATURE_BY_HREF, mas o bloqueio REAL é server-side: cada segmento de rota
 * gated tem um app/(app)/<segmento>/layout.tsx chamando featureLayout(<feature>).
 * Estes testes impedem regressão dos dois lados ficarem fora de sincronia.
 */

const APP_DIR = fileURLToPath(new URL("../app/(app)/", import.meta.url));

/** Segmento de topo de um href ("/financeiro/receber" → "financeiro"). */
function topSegment(href: string): string {
  return href.replace(/^\/+/, "").split("/")[0];
}

describe("catálogo × navegação", () => {
  it("toda feature usada na navegação existe no catálogo", () => {
    const desconhecidas = [...new Set(Object.values(FEATURE_BY_HREF))].filter(
      (feat) => !KNOWN_FEATURE_KEYS.includes(feat),
    );
    expect(desconhecidas).toEqual([]);
  });
});

describe("enforcement server-side por segmento", () => {
  // Agrupa hrefs por segmento de topo e garante feature única por segmento.
  const featuresPorSegmento = new Map<string, Set<string>>();
  for (const [href, feat] of Object.entries(FEATURE_BY_HREF)) {
    const seg = topSegment(href);
    if (!featuresPorSegmento.has(seg)) featuresPorSegmento.set(seg, new Set());
    featuresPorSegmento.get(seg)!.add(feat);
  }

  it("cada segmento gated mapeia para uma única feature", () => {
    const ambiguos = [...featuresPorSegmento.entries()]
      .filter(([, feats]) => feats.size > 1)
      .map(([seg, feats]) => `${seg}: ${[...feats].join(", ")}`);
    expect(ambiguos).toEqual([]);
  });

  it.each([...featuresPorSegmento.entries()].map(([seg, feats]) => [seg, [...feats][0]]))(
    "/%s tem layout.tsx que exige a feature %s",
    (seg, feature) => {
      const layoutPath = `${APP_DIR}${seg}/layout.tsx`;
      expect(existsSync(layoutPath), `layout faltando: app/(app)/${seg}/layout.tsx`).toBe(true);
      const src = readFileSync(layoutPath, "utf8");
      expect(src, `app/(app)/${seg}/layout.tsx deve chamar featureLayout("${feature}")`).toContain(
        `featureLayout("${feature}")`,
      );
    },
  );
});
