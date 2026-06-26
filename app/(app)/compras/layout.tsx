import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /compras quando a feature "estoque" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("estoque");
