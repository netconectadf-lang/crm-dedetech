import "server-only";

export type GeocodePartes = {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
};

export type GeocodeResult = { lat: number; lng: number } | null;

/** Monta a query de endereço para o geocoder. */
function montarQuery(p: GeocodePartes): string {
  const rua = [p.logradouro, p.numero].filter(Boolean).join(", ");
  return [rua, p.bairro, p.cidade, p.uf, "Brasil"].filter(Boolean).join(", ");
}

/**
 * Geocodifica um endereço via Nominatim (OpenStreetMap). Gratuito, sem chave.
 * Respeite ~1 req/s ao chamar em lote (política de uso do Nominatim).
 * Retorna null se não encontrar ou faltar cidade.
 */
export async function geocodeEndereco(p: GeocodePartes): Promise<GeocodeResult> {
  if (!p.cidade) return null; // sem ao menos a cidade não vale tentar
  const q = montarQuery(p);
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=" +
    encodeURIComponent(q);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "dedetech-crm/1.0 (suporte@dedetech.com.br)",
        "Accept-Language": "pt-BR",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    const hit = data?.[0];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** Pausa (ms) — usada para respeitar o rate limit do Nominatim. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
