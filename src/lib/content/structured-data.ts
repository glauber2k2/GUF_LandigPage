/**
 * Monta os dados das entidades (marca, app, FAQ) a partir da configuração e do conteúdo, para os
 * builders puros de lib/seo. Mesmos nome, descrição e redes da página e das meta tags.
 */
import { seo } from "../../config/seo.ts";
import { site } from "../../config/site.ts";
import type { PlanCatalog } from "../../content/schemas/app-data.ts";
import type { FaqItem } from "../../content/schemas/sections.ts";
import { activePrice, defaultPlan, priceForSchema, upgradePlan } from "../domain/plans.ts";
import type { AppInfo, BrandInfo, FaqEntry, OfferInfo } from "../seo/jsonld.ts";
import { absoluteUrl } from "../seo/meta.ts";

export function brandInfo(siteUrl: URL): BrandInfo {
  return {
    name: site.name,
    description: seo.entityDefinition,
    siteUrl: new URL("/", siteUrl).toString(),
    logoUrl: absoluteUrl(seo.logoPath, siteUrl),
    sameAs: site.sameAs,
    inLanguage: site.lang,
  };
}

export function appInfo(siteUrl: URL, catalog: PlanCatalog): AppInfo {
  const free = defaultPlan(catalog);
  const pro = upgradePlan(catalog);
  const price = activePrice(catalog, pro.code);
  const offers: OfferInfo[] = [{ name: free.name, price: "0", currency: "BRL" }];
  if (price) {
    offers.push({
      name: `${pro.name} ${price.billing_interval === "month" ? "mensal" : "anual"}`,
      price: priceForSchema(price),
      currency: price.currency.toUpperCase(),
    });
  }
  return {
    name: site.name,
    description: seo.entityDefinition,
    url: site.appUrl,
    // O guf é um PWA: roda no navegador e instala no iPhone (Safari) e no Android (Chrome).
    operatingSystem: "Web, iOS, Android",
    category: "HealthApplication",
    offers,
    image: absoluteUrl(seo.ogImage.path, siteUrl),
  };
}

export function faqEntries(items: readonly FaqItem[]): FaqEntry[] {
  return items.map((item) => ({ question: item.question, answer: item.answer }));
}
