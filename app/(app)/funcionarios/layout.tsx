import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /funcionarios quando a feature "rh" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("rh");
