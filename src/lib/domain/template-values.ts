/**
 * Todos os números que os textos podem citar, vindos dos dados do app (snapshot) e de cálculos
 * puros (Epley). Um lugar só: se o app mudar uma regra, o texto muda junto.
 */
import type { CompetitionRules, PlanCatalog } from "../../content/schemas/app-data.ts";
import { estimate1RM, formatKg } from "./epley.ts";
import { planTemplateValues } from "./plans.ts";

export interface Lift {
  load: number;
  reps: number;
}

export interface TemplateInputs {
  rules: CompetitionRules;
  catalog: PlanCatalog;
  /** Recorde da seção de recordes: melhor antes e o de hoje. */
  lifts: { before: Lift; after: Lift };
  /** 1RM estimado no início do gráfico de evolução. */
  evolutionStart: number;
  instagramHandle: string;
  year: number;
}

/** Chaves que só o simulador preenche, no navegador. */
export const SIMULATOR_RUNTIME_KEYS = ["previous", "streak", "bonus"] as const;

export function buildTemplateValues(input: TemplateInputs): Record<string, string | number> {
  const { rules, lifts } = input;
  const end = estimate1RM(lifts.after.load, lifts.after.reps);
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
    beforeLoad: lifts.before.load,
    beforeReps: lifts.before.reps,
    afterLoad: lifts.after.load,
    afterReps: lifts.after.reps,
    start: formatKg(input.evolutionStart),
    end: formatKg(end),
    instagram: input.instagramHandle,
    year: String(input.year),
  };
}
