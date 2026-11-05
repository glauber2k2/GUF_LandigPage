import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Erros de console (inclui violações de CSP) e exceções da página. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

test.describe("home", () => {
  test("carrega com um H1, título, meta tags e sem erros", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/guf/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("competição");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{80,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\.png$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.flatMap((n) => [JSON.parse(n.textContent ?? "[]")].flat().map((d) => d["@type"])));
    expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "SoftwareApplication", "FAQPage"]));

    await page.mouse.wheel(0, 20_000);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test("CTAs apontam para o app e repassam UTM, fbclid e gclid", async ({ page }) => {
    await page.goto("/?utm_source=instagram&utm_campaign=lancamento&fbclid=abc&gclid=xyz&ref=ignorar");
    const links = page.locator("a[data-app-link]");
    expect(await links.count()).toBeGreaterThan(5);
    for (const href of await links.evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href))) {
      const url = new URL(href);
      expect(url.hostname).not.toBe("localhost");
      expect(url.searchParams.get("utm_source")).toBe("instagram");
      expect(url.searchParams.get("utm_campaign")).toBe("lancamento");
      expect(url.searchParams.get("fbclid")).toBe("abc");
      expect(url.searchParams.get("gclid")).toBe("xyz");
      expect(url.searchParams.has("ref")).toBe(false);
      expect(url.searchParams.getAll("utm_source")).toHaveLength(1);
    }
    const hero = page.locator('a[data-cta="hero"]');
    await expect(hero).toHaveAttribute("href", /\/cadastro\/\?/);
  });

  test("FAQ abre e fecha", async ({ page }) => {
    await page.goto("/");
    const first = page.locator("details[data-faq-item]").first();
    await first.locator("summary").scrollIntoViewIfNeeded();
    await expect(first).not.toHaveAttribute("open", "");
    await first.locator("summary").click();
    await expect(first).toHaveAttribute("open", "");
    await expect(first.locator("p")).toBeVisible();
  });

  test("simulador calcula a semana com as regras do app", async ({ page }) => {
    await page.goto("/");
    const sim = page.locator("points-simulator");
    await sim.scrollIntoViewIfNeeded();
    const total = sim.locator("[data-total]");
    await expect(total).toHaveText("78");
    await expect(sim).toHaveAttribute("data-hydrated", "true");

    // 5 dias: 75 + sequência 15 + 1 recorde 3 + volume 15 = 108
    await sim.locator('button[data-days="5"]').click();
    await expect(total).toHaveText("108");
    await expect(sim.locator('button[data-days="5"]')).toHaveAttribute("aria-pressed", "true");

    // +1 recorde = 111; volume na metade (7,5) = 103,5 → 104
    await sim.locator('button[data-records-step="1"]').click();
    await expect(total).toHaveText("111");
    await sim.locator('button[data-volume="0"]').click();
    await expect(total).toHaveText("104");

    // 2 dias: semana não cumprida, sem sequência: 30 + 0 + 6 + 7,5 = 43,5 → 44
    await sim.locator('button[data-days="2"]').click();
    await expect(total).toHaveText("44");
    await expect(sim.locator("[data-note]")).toContainText("não é cumprida");
  });

  test("acessibilidade sem violações (axe, WCAG A/AA)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("navegação por teclado: pular para o conteúdo e foco visível", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.locator('a[href="#conteudo"]');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
  });
});

test.describe("celular", () => {
  test("CTA fixo aparece só depois do hero", async ({ page, isMobile }) => {
    test.skip(!isMobile, "só no celular");
    await page.goto("/");
    const sticky = page.locator("[data-sticky-cta]");
    await expect(sticky).not.toHaveClass(/is-visible/);
    await page.locator("#como-funciona").scrollIntoViewIfNeeded();
    await expect(sticky).toHaveClass(/is-visible/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(sticky).not.toHaveClass(/is-visible/);
  });
});

test("404 útil e fora do índice", async ({ page }) => {
  await page.goto("/pagina-que-nao-existe/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});
