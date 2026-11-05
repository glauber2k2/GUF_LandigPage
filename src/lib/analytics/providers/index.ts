import type { AnalyticsIds } from "../csp-sources.ts";
import type { AnalyticsProvider } from "../types.ts";
import { googleAnalyticsProvider } from "./ga.ts";
import { metaPixelProvider } from "./meta.ts";

/**
 * Provedores ligados pela configuração. Lista vazia = provedor "noop": `track` não faz nada e nenhum
 * script de terceiros é carregado. Rastreador novo = um arquivo em providers/ + uma linha aqui
 * (e as origens dele em csp-sources.ts).
 */
export function providersFor(ids: AnalyticsIds): AnalyticsProvider[] {
  const providers: AnalyticsProvider[] = [];
  if (ids.metaPixelId) providers.push(metaPixelProvider(ids.metaPixelId));
  if (ids.gaId) providers.push(googleAnalyticsProvider(ids.gaId));
  return providers;
}
