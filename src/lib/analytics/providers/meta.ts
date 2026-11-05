import { loadScript } from "../load-script.ts";
import type { AnalyticsProvider } from "../types.ts";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Meta Pixel sem snippet inline (a CSP não libera scripts inline): a fila `fbq` é criada aqui. */
function installFbqStub(): Fbq {
  const stub = function (...args: unknown[]) {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  } as Fbq;
  stub.queue = [];
  stub.push = stub;
  stub.loaded = true;
  stub.version = "2.0";
  window.fbq = stub;
  window._fbq = stub;
  return stub;
}

export function metaPixelProvider(pixelId: string): AnalyticsProvider {
  return {
    name: "meta",
    async load() {
      const fbq = window.fbq ?? installFbqStub();
      fbq("init", pixelId);
      fbq("track", "PageView");
      await loadScript("https://connect.facebook.net/en_US/fbevents.js");
    },
    track(event, data) {
      if (event === "page_view") return;
      window.fbq?.("trackCustom", "CTAClick", data);
    },
  };
}
