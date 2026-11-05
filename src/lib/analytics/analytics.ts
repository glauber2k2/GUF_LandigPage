import type { Analytics, AnalyticsData, AnalyticsEvent, AnalyticsProvider } from "./types.ts";

/**
 * Junta os provedores atrás de uma interface só. Eventos chamados antes do `start` ficam numa fila
 * (pequena, com teto) e saem quando os scripts carregam. Sem provedores, tudo vira operação vazia.
 */
const MAX_QUEUE = 20;

export function createAnalytics(providers: readonly AnalyticsProvider[]): Analytics {
  const queue: Array<[AnalyticsEvent, AnalyticsData]> = [];
  let started = false;
  let ready: AnalyticsProvider[] = [];

  const send = (event: AnalyticsEvent, data: AnalyticsData) => {
    for (const provider of ready) {
      try {
        provider.track(event, data);
      } catch {
        // Um rastreador com erro não pode afetar a página nem os outros.
      }
    }
  };

  return {
    enabled: providers.length > 0,
    track(event, data = {}) {
      if (providers.length === 0) return;
      if (!started) {
        if (queue.length < MAX_QUEUE) queue.push([event, data]);
        return;
      }
      send(event, data);
    },
    async start() {
      if (started || providers.length === 0) return;
      started = true;
      const results = await Promise.allSettled(providers.map((p) => p.load().then(() => p)));
      ready = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      queue.splice(0).forEach(([event, data]) => send(event, data));
    },
  };
}
