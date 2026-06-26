import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /roteiros quando a feature "agenda" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("agenda");
