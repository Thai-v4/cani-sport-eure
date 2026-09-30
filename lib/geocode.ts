// Géocodage inverse du point de départ via Nominatim (OpenStreetMap).
// Politique d'usage : une requête par seconde au plus, résultats mis en cache.
const CACHE_KEY = "cse-adresses";
let queue: Promise<unknown> = Promise.resolve();

function readCache(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(key: string, value: string) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [key]: value }));
  } catch {
    // stockage indisponible : on se passe du cache
  }
}

export function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = readCache()[key];
  if (cached) return Promise.resolve(cached);

  const task = queue.then(async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&accept-language=fr&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      const a = data?.address ?? {};
      const place = a.village || a.town || a.city || a.municipality || null;
      const label = place ? [a.road, place].filter(Boolean).join(", ") : null;
      if (label) writeCache(key, label);
      return label;
    } catch {
      return null;
    } finally {
      await new Promise((r) => setTimeout(r, 1100));
    }
  });
  queue = task;
  return task;
}
