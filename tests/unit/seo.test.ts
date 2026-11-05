import { describe, expect, it } from "vitest";
import { seo } from "../../src/config/seo";
import {
  breadcrumbSchema,
  faqPageSchema,
  organizationSchema,
  serializeJsonLd,
  softwareApplicationSchema,
  websiteSchema,
  type BrandInfo,
} from "../../src/lib/seo/jsonld";
import { buildLlmsTxt } from "../../src/lib/seo/llms";
import { buildTitle, canonicalUrl, DESCRIPTION_MAX, TITLE_MAX } from "../../src/lib/seo/meta";
import { activePrice, priceForSchema } from "../../src/lib/domain/plans";
import { buildTemplateValues } from "../../src/lib/domain/template-values";
import { fillDeep } from "../../src/lib/text/template";
import { catalog, faq, rules } from "./fixtures";

const brand: BrandInfo = {
  name: "guf",
  description: seo.entityDefinition,
  siteUrl: "https://exemplo.com.br/",
  logoUrl: "https://exemplo.com.br/icon-512.png",
  sameAs: ["https://www.instagram.com/guf.app/"],
  inLanguage: "pt-BR",
};

const values = buildTemplateValues({
  rules,
  catalog,
  lifts: { before: { load: 80, reps: 6 }, after: { load: 80, reps: 8 } },
  evolutionStart: 92,
  instagramHandle: "@guf.app",
  year: 2026,
});
const filledFaq = fillDeep(faq, values);

describe("meta tags", () => {
  it("título e descrição dentro dos limites", () => {
    expect(seo.defaultTitle.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(buildTitle("Página não encontrada", seo.titleTemplate, seo.defaultTitle)).toBe(
      "Página não encontrada · guf",
    );
    expect(buildTitle(undefined, seo.titleTemplate, seo.defaultTitle)).toBe(seo.defaultTitle);
  });

  it("canônica absoluta com barra final", () => {
    expect(canonicalUrl("/", "https://exemplo.com.br")).toBe("https://exemplo.com.br/");
    expect(canonicalUrl("/treinos", "https://exemplo.com.br")).toBe("https://exemplo.com.br/treinos/");
  });

  it("definição de entidade começa pelo nome da marca", () => {
    expect(seo.entityDefinition).toMatch(/^O guf é um app de treino/);
  });
});

describe("JSON-LD", () => {
  it("Organization e WebSite consistentes (mesmo nome, descrição e @id)", () => {
    const org = organizationSchema(brand);
    const site = websiteSchema(brand);
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe(site.name);
    expect(org.description).toBe(site.description);
    expect(site.publisher).toEqual({ "@id": org["@id"] });
    expect(org.sameAs).toEqual(brand.sameAs);
  });

  it("SoftwareApplication sem avaliações inventadas e com oferta gratuita", () => {
    const price = activePrice(catalog, "pro");
    const app = softwareApplicationSchema(
      {
        name: "guf",
        description: brand.description,
        url: "https://gufapp.vercel.app",
        operatingSystem: "Web, iOS, Android",
        category: "HealthApplication",
        image: "https://exemplo.com.br/og.png",
        offers: [
          { name: "Free", price: "0", currency: "BRL" },
          ...(price ? [{ name: "Pro mensal", price: priceForSchema(price), currency: "BRL" }] : []),
        ],
      },
      brand,
    );
    expect(app).not.toHaveProperty("aggregateRating");
    expect(app).not.toHaveProperty("review");
    const offers = app.offers as Array<Record<string, string>>;
    expect(offers[0]).toMatchObject({ "@type": "Offer", price: "0", priceCurrency: "BRL" });
    if (price) expect(offers[1]?.price).toBe((price.amount_cents / 100).toFixed(2));
  });

  it("FAQPage vem da MESMA coleção da seção, na mesma ordem", () => {
    const schema = faqPageSchema(filledFaq.map((f) => ({ question: f.question, answer: f.answer })));
    const entities = schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;
    expect(entities).toHaveLength(faq.length);
    entities.forEach((entity, i) => {
      expect(entity.name).toBe(filledFaq[i]?.question);
      expect(entity.acceptedAnswer.text).toBe(filledFaq[i]?.answer);
    });
  });

  it("respostas do FAQ: diretas e com 40–60 palavras", () => {
    for (const item of filledFaq) {
      const words = item.answer.split(/\s+/).filter(Boolean).length;
      expect(words, item.question).toBeGreaterThanOrEqual(40);
      expect(words, item.question).toBeLessThanOrEqual(60);
      expect(item.answer, item.question).not.toMatch(/\{/);
    }
  });

  it("BreadcrumbList para páginas futuras", () => {
    const crumbs = breadcrumbSchema([
      { name: "Início", url: "https://exemplo.com.br/" },
      { name: "Calculadora de 1RM", url: "https://exemplo.com.br/calculadora-1rm/" },
    ]);
    const items = crumbs.itemListElement as Array<{ position: number }>;
    expect(items.map((i) => i.position)).toEqual([1, 2]);
  });

  it("serialização não permite fechar a tag script", () => {
    expect(serializeJsonLd({ text: "</script><script>" })).not.toContain("</script>");
  });
});

describe("llms.txt", () => {
  it("resumo factual com os números do app", () => {
    const txt = buildLlmsTxt({ name: "guf", summary: seo.entityDefinition, values, rules, faq: filledFaq, links: [] });
    expect(txt.startsWith("# guf\n\n> O guf é um app de treino")).toBe(true);
    expect(txt).toContain("15 por dia com treino válido");
    expect(txt).toContain("O guf é grátis?");
  });
});
