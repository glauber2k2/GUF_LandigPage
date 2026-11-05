import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "../../src/lib/analytics/analytics";
import { readConsent, saveConsent } from "../../src/lib/analytics/consent";
import { analyticsCspSources } from "../../src/lib/analytics/csp-sources";
import type { AnalyticsProvider } from "../../src/lib/analytics/types";
import { isTrackedParam, pickTrackedParams, withTrackedParams } from "../../src/lib/utm/params";

describe("lib/utm", () => {
  const app = "https://gufapp.vercel.app/cadastro/";

  it("reconhece utm_*, fbclid e gclid", () => {
    expect(isTrackedParam("utm_source")).toBe(true);
    expect(isTrackedParam("UTM_Campaign")).toBe(true);
    expect(isTrackedParam("fbclid")).toBe(true);
    expect(isTrackedParam("gclid")).toBe(true);
    expect(isTrackedParam("ref")).toBe(false);
  });

  it("repassa só os parâmetros de campanha", () => {
    const url = withTrackedParams(app, "?utm_source=ig&utm_medium=bio&ref=x&fbclid=abc");
    expect(new URL(url).searchParams.toString()).toBe("utm_source=ig&utm_medium=bio&fbclid=abc");
  });

  it("não duplica: o que já está no link vence", () => {
    const url = withTrackedParams(`${app}?utm_source=site`, "?utm_source=ig&gclid=1");
    const params = new URL(url).searchParams;
    expect(params.getAll("utm_source")).toEqual(["site"]);
    expect(params.get("gclid")).toBe("1");
  });

  it("sem parâmetros, devolve o link igual", () => {
    expect(withTrackedParams(app, "")).toBe(app);
    expect(withTrackedParams(app, "?ref=x")).toBe(app);
  });

  it("ignora vazios e repetidos", () => {
    expect(pickTrackedParams("?utm_source=&utm_source=a&utm_source=b").toString()).toBe("utm_source=a");
  });
});

describe("lib/analytics", () => {
  const fakeProvider = () => {
    const calls: unknown[] = [];
    const provider: AnalyticsProvider = {
      name: "fake",
      load: vi.fn(async () => {}),
      track: (event, data) => calls.push([event, data]),
    };
    return { provider, calls };
  };

  it("noop: sem provedores nada acontece", async () => {
    const analytics = createAnalytics([]);
    expect(analytics.enabled).toBe(false);
    analytics.track("cta_click", { section: "hero" });
    await analytics.start();
  });

  it("guarda eventos até o start e depois envia", async () => {
    const { provider, calls } = fakeProvider();
    const analytics = createAnalytics([provider]);
    analytics.track("cta_click", { section: "hero" });
    expect(calls).toHaveLength(0);
    await analytics.start();
    expect(provider.load).toHaveBeenCalledOnce();
    expect(calls).toEqual([["cta_click", { section: "hero" }]]);
    analytics.track("cta_click", { section: "final" });
    expect(calls).toHaveLength(2);
  });

  it("provedor que falha ao carregar não derruba os outros", async () => {
    const { provider, calls } = fakeProvider();
    const broken: AnalyticsProvider = {
      name: "x",
      load: async () => Promise.reject(new Error("bloqueado")),
      track: () => {},
    };
    const analytics = createAnalytics([broken, provider]);
    analytics.track("cta_click", { section: "hero" });
    await analytics.start();
    expect(calls).toHaveLength(1);
  });

  it("CSP só libera origens dos rastreadores configurados", () => {
    expect(analyticsCspSources({})).toEqual({ script: [], connect: [], img: [] });
    expect(analyticsCspSources({ gaId: "G-1" }).script).toEqual(["https://www.googletagmanager.com"]);
    expect(analyticsCspSources({ metaPixelId: "1" }).script).toEqual(["https://connect.facebook.net"]);
  });

  it("consentimento lido e gravado com segurança", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    expect(readConsent(storage)).toBeNull();
    saveConsent("granted", storage);
    expect(readConsent(storage)).toBe("granted");
    const throwing = {
      getItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(readConsent(throwing)).toBeNull();
  });
});
