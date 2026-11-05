/**
 * Dados estruturados (schema.org, formato aceito pelo Google). Gerados a partir do conteúdo, nunca
 * escritos à mão nas páginas. Sem AggregateRating/Review: o guf ainda não tem avaliações reais.
 */
export interface BrandInfo {
  name: string;
  description: string;
  siteUrl: string;
  logoUrl: string;
  sameAs: readonly string[];
  inLanguage: string;
}

export interface OfferInfo {
  name: string;
  /** "0" para o plano gratuito; "14.80" etc. */
  price: string;
  currency: string;
  description?: string;
}

export interface AppInfo {
  name: string;
  description: string;
  url: string;
  operatingSystem: string;
  category: "HealthApplication" | "SportsApplication";
  offers: readonly OfferInfo[];
  image: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface Crumb {
  name: string;
  url: string;
}

type JsonLd = Record<string, unknown>;

const CONTEXT = "https://schema.org";

const orgId = (brand: BrandInfo) => `${brand.siteUrl}#organization`;
const siteId = (brand: BrandInfo) => `${brand.siteUrl}#website`;

export function organizationSchema(brand: BrandInfo): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": orgId(brand),
    name: brand.name,
    url: brand.siteUrl,
    logo: brand.logoUrl,
    description: brand.description,
    ...(brand.sameAs.length > 0 ? { sameAs: [...brand.sameAs] } : {}),
  };
}

export function websiteSchema(brand: BrandInfo): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": siteId(brand),
    name: brand.name,
    url: brand.siteUrl,
    description: brand.description,
    inLanguage: brand.inLanguage,
    publisher: { "@id": orgId(brand) },
  };
}

export function softwareApplicationSchema(app: AppInfo, brand: BrandInfo): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.description,
    url: app.url,
    image: app.image,
    applicationCategory: app.category,
    operatingSystem: app.operatingSystem,
    inLanguage: brand.inLanguage,
    publisher: { "@id": orgId(brand) },
    offers: app.offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      price: offer.price,
      priceCurrency: offer.currency,
      ...(offer.description ? { description: offer.description } : {}),
    })),
  };
}

export function faqPageSchema(entries: readonly FaqEntry[]): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Para as páginas internas futuras (ex.: /calculadora-1rm). A home não usa. */
export function breadcrumbSchema(crumbs: readonly Crumb[]): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/** JSON para dentro de <script type="application/ld+json">, sem permitir fechar a tag. */
export function serializeJsonLd(data: JsonLd | readonly JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
