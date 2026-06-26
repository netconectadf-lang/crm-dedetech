import { site, plans as staticPlans, type Plan } from "@/lib/site/site";

type ApiPlan = {
  slug: string;
  nome: string;
  preco_centavos: number;
  periodo: string;
  publico_alvo: string | null;
  features: string[];
  destaque: boolean;
  cta_label: string;
  cta_tipo: string;
  ordem: number;
};

function formatPrice(centavos: number): string {
  const reais = Math.round(centavos / 100);
  return `R$ ${reais.toLocaleString("pt-BR")}`;
}

/**
 * Busca os planos no sistema (fonte única). Cai no estático se a API falhar,
 * para a vitrine nunca ficar sem preços.
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${site.app}/api/planos`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return staticPlans;
    const json = (await res.json()) as { plans?: ApiPlan[] };
    if (!json.plans?.length) return staticPlans;

    return json.plans.map((p) => ({
      name: p.nome,
      price: formatPrice(p.preco_centavos),
      period: p.periodo,
      for: p.publico_alvo ?? "",
      features: p.features ?? [],
      highlight: p.destaque,
      cta: p.cta_label,
      ctaHref: p.cta_tipo === "whatsapp" ? site.whatsapp : site.signup,
    }));
  } catch {
    return staticPlans;
  }
}
