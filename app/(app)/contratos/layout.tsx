import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /contratos quando a feature "contratos" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("contratos");
