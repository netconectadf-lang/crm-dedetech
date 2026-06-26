import "server-only";

import type { ReactNode } from "react";

import { requireFeature } from "./index";

/**
 * Fábrica de layout de enforcement por segmento de rota.
 *
 * Cria um layout que exige `feature` do plano ANTES de renderizar qualquer
 * página do segmento — fechando o acesso direto por URL (defesa em
 * profundidade; a sidebar já esconde o item, isto bloqueia o bypass).
 * `requireFeature` redireciona pro dashboard com aviso quando a feature
 * não está liberada. `getEntitlements` é memoizado por request (React cache),
 * então este guard não adiciona ida extra ao banco.
 *
 * Uso (em app/(app)/<segmento>/layout.tsx):
 *   export default featureLayout("funil");
 */
export function featureLayout(feature: string) {
  return async function FeatureLayout({ children }: { children: ReactNode }) {
    await requireFeature(feature);
    return children;
  };
}
