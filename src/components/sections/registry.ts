/**
 * Mapa tipo de seção → componente. A home é montada a partir da lista em
 * src/content/pages/pages.json: adicionar, remover ou reordenar seções não mexe nas outras.
 * Seção nova = schema em content/schemas/sections.ts + JSON em content/sections/ + componente + uma linha aqui.
 */
import type { SectionType } from "../../content/schemas/sections";
import Facts from "./Facts.astro";
import Faq from "./Faq.astro";
import Features from "./Features.astro";
import FinalCta from "./FinalCta.astro";
import Hero from "./Hero.astro";
import Lite from "./Lite.astro";
import Plans from "./Plans.astro";
import Steps from "./Steps.astro";

// Componentes .astro não têm tipo de props exportável de forma genérica; o encaixe dos dados de
// cada tipo é garantido pelo SectionRenderer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstroComponent = (props: any) => any;

export const SECTION_COMPONENTS: Record<SectionType, AstroComponent> = {
  hero: Hero,
  facts: Facts,
  features: Features,
  lite: Lite,
  plans: Plans,
  steps: Steps,
  faq: Faq,
  finalCta: FinalCta,
};
