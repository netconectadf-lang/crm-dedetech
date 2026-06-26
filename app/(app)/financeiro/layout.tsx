import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /financeiro quando a feature "financeiro" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("financeiro");
