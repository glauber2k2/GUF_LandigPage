/** Texto explicativo do simulador, a partir das regras e do resultado da semana. Puro. */
import type { CompetitionRules } from "../../content/schemas/app-data.ts";
import type { SectionOf } from "../../content/schemas/sections.ts";
import { fillTemplate } from "../text/template.ts";
import type { WeekPoints } from "./points.ts";

type SimulatorContent = Pick<
  SectionOf<"competition">["simulator"],
  "previousOptions" | "fulfilledNote" | "notFulfilledNote"
>;

export function simulatorNote(
  content: SimulatorContent,
  rules: Pick<CompetitionRules, "bonusMax" | "daysForFulfilledWeek">,
  previous: number,
  result: Pick<WeekPoints, "fulfilled" | "streakWeeks" | "streakBonus">,
): string {
  if (!result.fulfilled) {
    return fillTemplate(content.notFulfilledNote, { daysForFulfilledWeek: rules.daysForFulfilledWeek });
  }
  const option = content.previousOptions.find((o) => o.value === previous);
  return fillTemplate(content.fulfilledNote, {
    previous: option?.noteLabel ?? String(previous),
    streak: result.streakWeeks,
    bonus: result.streakBonus,
    bonusMax: rules.bonusMax,
  });
}
