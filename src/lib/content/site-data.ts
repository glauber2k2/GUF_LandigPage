/**
 * Ponte entre as coleções do Astro e os componentes: carrega o conteúdo, junta os dados do app e
 * devolve tudo com os textos já preenchidos. Os componentes nunca leem coleções nem montam números.
 */
import { getCollection, getEntries, getEntry } from "astro:content";
import { site } from "../../config/site.ts";
import type { CompetitionRules, PlanCatalog } from "../../content/schemas/app-data.ts";
import type { FaqItem, Section, SectionOf, UiContent } from "../../content/schemas/sections.ts";
import { SIMULATOR_RUNTIME_KEYS, buildTemplateValues } from "../domain/template-values.ts";
import { fillDeep } from "../text/template.ts";

export interface SiteData {
  rules: CompetitionRules;
  catalog: PlanCatalog;
  ui: UiContent;
  faq: FaqItem[];
  values: Record<string, string | number>;
}

async function required<T>(entry: Promise<T | undefined> | T | undefined, what: string): Promise<T> {
  const value = await entry;
  if (value === undefined) throw new Error(`Conteúdo obrigatório ausente: ${what}`);
  return value;
}

let cache: Promise<SiteData> | null = null;

export function loadSiteData(): Promise<SiteData> {
  cache ??= build();
  return cache;
}

async function build(): Promise<SiteData> {
  const [rulesEntry, catalogEntry, uiEntry, recordsEntry, evolutionEntry, faqEntries] = await Promise.all([
    required(getEntry("competition", "current"), "src/content/competition/rules.json"),
    required(getEntry("plans", "current"), "src/content/plans/catalog.json"),
    required(getEntry("ui", "ui"), "src/content/site/ui.json"),
    required(getEntry("sections", "records"), "src/content/sections/records.json"),
    required(getEntry("sections", "evolution"), "src/content/sections/evolution.json"),
    getCollection("faq"),
  ]);

  const records = recordsEntry.data as SectionOf<"records">;
  const evolution = evolutionEntry.data as SectionOf<"evolution">;

  const values = buildTemplateValues({
    rules: rulesEntry.data,
    catalog: catalogEntry.data,
    lifts: { before: records.demo.before, after: records.demo.after },
    evolutionStart: evolution.chart.startValue,
    instagramHandle: site.social.instagram.handle,
    year: new Date().getFullYear(),
  });

  return {
    rules: rulesEntry.data,
    catalog: catalogEntry.data,
    ui: fillDeep(uiEntry.data, values),
    faq: fillDeep(
      faqEntries.map((entry) => entry.data).sort((a, b) => a.order - b.order),
      values,
    ),
    values,
  };
}

/** Seções de uma página, na ordem definida em src/content/pages/pages.json, com os textos preenchidos. */
export async function loadPageSections(pageId: string): Promise<Array<{ id: string; data: Section }>> {
  const [page, { values }] = await Promise.all([
    required(getEntry("pages", pageId), `página "${pageId}" em src/content/pages/pages.json`),
    loadSiteData(),
  ]);
  const entries = await getEntries(page.data.sections);
  return entries.map((entry) => ({
    id: entry.id,
    data: fillDeep(entry.data, values, SIMULATOR_RUNTIME_KEYS),
  }));
}
