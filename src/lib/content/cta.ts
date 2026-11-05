import { site } from "../../config/site.ts";
import type { Cta } from "../../content/schemas/sections.ts";

export interface CtaTarget {
  href: string;
  /** Links para o app recebem `data-app-link` (repasse de UTM). */
  isApp: boolean;
}

export function ctaTarget(cta: Cta): CtaTarget {
  if ("appRoute" in cta) return { href: site.appLink(cta.appRoute), isApp: true };
  return { href: cta.anchor, isApp: false };
}
