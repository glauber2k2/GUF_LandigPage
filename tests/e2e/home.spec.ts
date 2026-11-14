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
    await expect(page.locator("h1")).toContainText("evoluir");
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

  test("pré-lançamento: sem botão Entrar, CTAs bloqueados com 'Lançamento em breve' e preço escondido", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    const locked = page.locator("button[data-locked]");
    test.skip((await locked.count()) === 0, "app já lançado (site.launch.appOpen = true)");

    await expect(page.getByRole("link", { name: "Entrar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Entrar" })).toHaveCount(0);
    await expect(page.locator("a[data-app-link]")).toHaveCount(0);
    for (const button of await locked.all()) {
      await expect(button).toHaveAttribute("aria-disabled", "true");
      const tooltipId = await button.getAttribute("aria-describedby");
      await expect(page.locator(`#${tooltipId}`)).toHaveText("Lançamento em breve");
    }

    // Abre por hover (desktop) ou toque (celular) e não navega.
    const hero = page.locator('button[data-cta="hero"]');
    const tooltip = page.locator("#tt-hero");
    await expect(tooltip).toBeHidden();
    // aria-disabled: o Playwright só interage com elemento "desabilitado" se forçado.
    if (isMobile) await hero.tap({ force: true });
    else await hero.hover({ force: true });
    await expect(tooltip).toBeVisible();
    await hero.click({ force: true });
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();

    // Teclado: foco mostra o tooltip.
    await page.locator('button[data-cta="header"]').focus();
    await expect(page.locator("#tt-header")).toBeVisible();

    // Preço do Pro escondido em toda a página (inclusive JSON-LD).
    await expect(page.locator("#planos")).toContainText("R$ ??,??");
    expect(await page.content()).not.toMatch(/14,80|14\.80/);
  });

  test("CTAs apontam para o app e repassam UTM, fbclid e gclid", async ({ page }) => {
    await page.goto("/?utm_source=instagram&utm_campaign=lancamento&fbclid=abc&gclid=xyz&ref=ignorar");
    const links = page.locator("a[data-app-link]");
    test.skip((await links.count()) === 0, "pré-lançamento: os botões do app estão bloqueados");
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

  test("recursos: as setas passam os cartões do carrossel", async ({ page, isMobile }) => {
    test.skip(isMobile, "no celular, o carrossel é só arrastar");
    await page.goto("/");
    const track = page.locator("[data-carousel-track]");
    await track.scrollIntoViewIfNeeded();
    // Volta ao começo (a rolagem automática pode já ter andado) e confere que a seta avança um cartão.
    await track.evaluate((el) => el.scrollTo({ left: 0 }));
    await page.locator('button[data-carousel-step="1"]').click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  });

  test("recursos: o carrossel avança sozinho e não roda com movimento reduzido", async ({ page }) => {
    await page.goto("/");
    const track = page.locator("[data-carousel-track]");
    await track.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect.poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 8000 }).toBeGreaterThan(100);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await track.scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);
    expect(await track.evaluate((el) => el.scrollLeft)).toBe(0);
  });

  test("lojas: em breve enquanto não houver link", async ({ page }) => {
    await page.goto("/");
    const lite = page.locator("#sem-baixar");
    await expect(lite).toContainText("Google Play");
    await expect(lite).toContainText("App Store");
    await expect(lite).toContainText("Em breve");
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
