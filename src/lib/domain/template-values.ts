/**
 * Todos os números que os textos podem citar, vindos dos dados do app (snapshot). Um lugar só: se o
 * app mudar uma regra ou um limite, o texto muda junto.
 */
import type { CompetitionRules, PlanCatalog } from "../../content/schemas/app-data.ts";
import { planTemplateValues } from "./plans.ts";

export interface TemplateInputs {
  rules: CompetitionRules;
  catalog: PlanCatalog;
  instagramHandle: string;
  tiktokHandle: string;
  year: number;
}

export function buildTemplateValues(input: TemplateInputs): Record<string, string | number> {
  const { rules } = input;
  return {
    ...planTemplateValues(input.catalog),
    constancyPointsPerDay: rules.constancyPointsPerDay,
    daysForFulfilledWeek: rules.daysForFulfilledWeek,
    bonusPerWeek: rules.bonusPerWeek,
    bonusMax: rules.bonusMax,
    recordPoints: rules.recordPoints,
    recordsLimit: rules.recordsMax === null ? "sem limite" : `até ${rules.recordsMax} por semana`,
    volumeMax: rules.volumeMax,
    volumeWindowWeeks: rules.volumeWindowWeeks,
    minValidMinutes: rules.minValidMinutes,
    podiumDays: rules.podiumDays,
    alertGap: rules.alertGap,
    instagram: input.instagramHandle,
    tiktok: input.tiktokHandle,
    year: String(input.year),
  };
}
