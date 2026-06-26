import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /orcamentos quando a feature "funil" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("funil");
