import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /notas quando a feature "nfse" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("nfse");
