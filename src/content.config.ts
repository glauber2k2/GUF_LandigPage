import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { competitionRulesSchema, planCatalogSchema } from "./content/schemas/app-data.ts";
import { faqItemSchema, sectionSchema, uiSchema } from "./content/schemas/sections.ts";

/** Seções da home: um JSON por seção (o id é o nome do arquivo). */
const sections = defineCollection({
  loader: glob({ base: "./src/content/sections", pattern: "*.json" }),
  schema: sectionSchema,
});

/** Páginas montadas por seções. A ordem da home é a ordem desta lista. */
const pages = defineCollection({
  loader: file("./src/content/pages/pages.json"),
  schema: z.object({
    id: z.string(),
    sections: z.array(reference("sections")).min(1),
  }),
});

/** Perguntas frequentes: alimentam a seção de FAQ E o JSON-LD FAQPage (fonte única). */
const faq = defineCollection({
  loader: file("./src/content/faq/faq.json"),
  schema: faqItemSchema,
});

const ui = defineCollection({
  loader: file("./src/content/site/ui.json"),
  schema: uiSchema,
});

/** Snapshot do catálogo de planos do app (atualizado no build por scripts/sync-app-data.ts). */
const plans = defineCollection({
  loader: file("./src/content/plans/catalog.json"),
  schema: planCatalogSchema,
});

/** Snapshot das regras da competição do app (ver howToUpdate no próprio arquivo). */
const competition = defineCollection({
  loader: file("./src/content/competition/rules.json"),
  schema: competitionRulesSchema,
});

export const collections = { sections, pages, faq, ui, plans, competition };
