import { readFileSync } from "node:fs";
import { z } from "astro/zod";
import { competitionRulesSchema, planCatalogSchema } from "../../src/content/schemas/app-data";
import { faqItemSchema, sectionSchema } from "../../src/content/schemas/sections";

const read = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));

/** Snapshots reais versionados (os mesmos que o build usa). */
export const rules = z.array(competitionRulesSchema).parse(read("src/content/competition/rules.json"))[0]!;
export const catalog = z.array(planCatalogSchema).parse(read("src/content/plans/catalog.json"))[0]!;
export const faq = z.array(faqItemSchema).parse(read("src/content/faq/faq.json"));
export const section = (file: string) => sectionSchema.parse(read(`src/content/sections/${file}.json`));
