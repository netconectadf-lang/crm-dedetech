/** Utilitários de geolocalização para roteirização (sem dependências). */

export type GeoPonto = { id: string; lat: number; lng: number };

/** Distância em km entre dois pontos (fórmula de Haversine). */
export function distanciaKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371; // raio da Terra em km
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const lat1 = rad(aLat);
  const lat2 = rad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Ordena pontos pela heurística do vizinho mais próximo (nearest-neighbor),
 * começando do `start` (ou do primeiro ponto). Bom o suficiente para rotas de
 * campo — leve e sem dependência externa.
 */
export function ordenarPorProximidade<T extends GeoPonto>(
  pontos: T[],
  start?: { lat: number; lng: number },
): T[] {
  if (pontos.length <= 2) return [...pontos];
  const restantes = [...pontos];
  const rota: T[] = [];

  // ponto de partida: o `start` informado, senão o primeiro da lista
  let atual = start ?? { lat: restantes[0].lat, lng: restantes[0].lng };
  if (!start) rota.push(restantes.shift()!);

  while (restantes.length) {
    let melhor = 0;
    let melhorDist = Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const d = distanciaKm(atual.lat, atual.lng, restantes[i].lat, restantes[i].lng);
      if (d < melhorDist) { melhorDist = d; melhor = i; }
    }
    const prox = restantes.splice(melhor, 1)[0];
    rota.push(prox);
    atual = { lat: prox.lat, lng: prox.lng };
  }
  return rota;
}

/** Distância total (km) percorrendo os pontos na ordem dada. */
export function distanciaTotalKm(pontos: GeoPonto[]): number {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    total += distanciaKm(pontos[i - 1].lat, pontos[i - 1].lng, pontos[i].lat, pontos[i].lng);
  }
  return total;
}

/** Link do Google Maps com a rota (waypoints na ordem dada). */
export function googleMapsRota(pontos: GeoPonto[]): string {
  if (!pontos.length) return "https://www.google.com/maps";
  const coords = pontos.map((p) => `${p.lat},${p.lng}`).join("/");
  return `https://www.google.com/maps/dir/${coords}`;
}
