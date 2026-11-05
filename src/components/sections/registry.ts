/**
 * Mapa tipo de seção → componente. A home é montada a partir da lista em
 * src/content/pages/pages.json: adicionar, remover ou reordenar seções não mexe nas outras.
 * Seção nova = schema em content/schemas/sections.ts + JSON em content/sections/ + componente + uma linha aqui.
 */
import type { SectionType } from "../../content/schemas/sections";
import Benefits from "./Benefits.astro";
import Competition from "./Competition.astro";
import Evolution from "./Evolution.astro";
import Faq from "./Faq.astro";
import FinalCta from "./FinalCta.astro";
import GufAi from "./GufAi.astro";
import Hero from "./Hero.astro";
import Install from "./Install.astro";
import Logging from "./Logging.astro";
import Organization from "./Organization.astro";
import Plans from "./Plans.astro";
import Privacy from "./Privacy.astro";
import Problem from "./Problem.astro";
import Records from "./Records.astro";

// Componentes .astro não têm tipo de props exportável de forma genérica; o encaixe dos dados de
// cada tipo é garantido pelo SectionRenderer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstroComponent = (props: any) => any;

export const SECTION_COMPONENTS: Record<SectionType, AstroComponent> = {
  hero: Hero,
  benefits: Benefits,
  problem: Problem,
  logging: Logging,
  records: Records,
  evolution: Evolution,
  competition: Competition,
  gufai: GufAi,
  organization: Organization,
  privacy: Privacy,
  plans: Plans,
  install: Install,
  faq: Faq,
  finalCta: FinalCta,
};
