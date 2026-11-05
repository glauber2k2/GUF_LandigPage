import type { Analytics } from "./types.ts";

/**
 * Um único ouvinte para todos os CTAs: qualquer elemento com `data-cta="<seção>"` gera `cta_click`
 * com a seção de origem e o destino. Novos CTAs não precisam de código, só do atributo.
 */
export function trackCtaClicks(analytics: Analytics, root: Document = document): void {
  root.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cta]") : null;
      if (!target) return;
      const href = target instanceof HTMLAnchorElement ? (target.getAttribute("href") ?? "") : "";
      analytics.track("cta_click", {
        section: target.dataset.cta ?? "",
        destination: href.startsWith("#") ? href : safePath(href),
      });
    },
    { capture: true },
  );
}

function safePath(href: string): string {
  try {
    const url = new URL(href, location.href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}
