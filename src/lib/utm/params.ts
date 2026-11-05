/**
 * Repasse de parâmetros de campanha da URL da landing para os links do app.
 * Puro: recebe o link e a query string atual e devolve o link final, sem duplicar parâmetros
 * (o que já está no link vence, para um CTA poder fixar a própria origem).
 */
const TRACKED_PREFIXES = ["utm_"] as const;
const TRACKED_KEYS = ["fbclid", "gclid"] as const;

export function isTrackedParam(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    TRACKED_PREFIXES.some((prefix) => lower.startsWith(prefix)) || (TRACKED_KEYS as readonly string[]).includes(lower)
  );
}

export function pickTrackedParams(search: string): URLSearchParams {
  const picked = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(search)) {
    if (isTrackedParam(key) && value !== "" && !picked.has(key)) picked.set(key, value);
  }
  return picked;
}

export function withTrackedParams(href: string, search: string): string {
  const tracked = pickTrackedParams(search);
  if ([...tracked.keys()].length === 0) return href;

  const url = new URL(href);
  for (const [key, value] of tracked) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}
