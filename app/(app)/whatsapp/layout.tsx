import { featureLayout } from "@/lib/entitlements/gate-layout";

// Enforcement de plano: bloqueia o segmento /whatsapp quando a feature "whatsapp" nao
// esta liberada (defesa em profundidade contra acesso direto por URL).
export default featureLayout("whatsapp");
