import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /mapa quando a feature "gps" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("gps");
