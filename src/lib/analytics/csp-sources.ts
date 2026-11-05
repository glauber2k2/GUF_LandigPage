/**
 * Origens que a CSP precisa liberar para cada rastreador. Só entram quando o ID do rastreador existe:
 * sem ID, a CSP continua só com 'self'.
 */
export interface AnalyticsIds {
  metaPixelId?: string | undefined;
  gaId?: string | undefined;
}

export interface CspSources {
  script: string[];
  connect: string[];
  img: string[];
}

const META = {
  script: ["https://connect.facebook.net"],
  connect: ["https://www.facebook.com", "https://connect.facebook.net"],
  img: ["https://www.facebook.com"],
} as const;

const GA = {
  script: ["https://www.googletagmanager.com"],
  connect: [
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
  ],
  img: ["https://www.google-analytics.com", "https://www.googletagmanager.com"],
} as const;

export function analyticsCspSources(ids: AnalyticsIds): CspSources {
  const enabled = [ids.metaPixelId ? META : null, ids.gaId ? GA : null].filter((s) => s !== null);
  return {
    script: enabled.flatMap((s) => [...s.script]),
    connect: enabled.flatMap((s) => [...s.connect]),
    img: enabled.flatMap((s) => [...s.img]),
  };
}
