import { loadScript } from "../load-script.ts";
import type { AnalyticsProvider } from "../types.ts";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Google Analytics 4 sem snippet inline: `gtag` e `dataLayer` são criados aqui. */
export function googleAnalyticsProvider(measurementId: string): AnalyticsProvider {
  return {
    name: "ga",
    async load() {
      window.dataLayer = window.dataLayer ?? [];
      window.gtag = function gtag() {
        // gtag.js espera o objeto `arguments`, não um array.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { anonymize_ip: true });
      await loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
    },
    track(event, data) {
      if (event === "page_view") return;
      window.gtag?.("event", event, data);
    },
  };
}
