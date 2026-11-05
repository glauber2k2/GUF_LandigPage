import type { CompetitionRules } from "../../content/schemas/app-data";
import type { SectionOf } from "../../content/schemas/sections";
import { formatPoints, weekPoints, type WeekPoints } from "../../lib/domain/points";
import { simulatorNote } from "../../lib/domain/simulator-note";

interface Config {
  rules: CompetitionRules;
  simulator: SectionOf<"competition">["simulator"];
}

/** Liga os controles do simulador já desenhado no HTML. Estado local; nada sai do navegador. */
export function hydrateSimulator(root: HTMLElement): void {
  if (root.dataset.hydrated) return;
  root.dataset.hydrated = "true";

  const { rules, simulator } = JSON.parse(root.dataset.config ?? "{}") as Config;
  const state = { ...simulator.defaults };

  const pressAll = (selector: string, attr: string, value: number) =>
    root.querySelectorAll<HTMLElement>(selector).forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.getAttribute(attr)) === value));
    });

  const setText = (selector: string, text: string) => {
    const el = root.querySelector(selector);
    if (el) el.textContent = text;
  };

  const render = () => {
    const ratio = simulator.volumeOptions[state.volumeOption]?.ratio ?? 1;
    const result: WeekPoints = weekPoints(
      { validDays: state.days, records: state.records, previousFulfilledWeeks: state.previous, volumeRatio: ratio },
      rules,
    );
    pressAll("[data-days]", "data-days", state.days);
    pressAll("[data-previous]", "data-previous", state.previous);
    pressAll("[data-volume]", "data-volume", state.volumeOption);
    setText("[data-records]", String(state.records));
    (["constancy", "streakBonus", "records", "volume"] as const).forEach((part) =>
      setText(`[data-part="${part}"]`, formatPoints(result[part])),
    );
    setText("[data-total]", String(result.total));
    setText("[data-note]", simulatorNote(simulator, rules, state.previous, result));
  };

  root.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    if (!button) return;
    const { days, previous, volume, recordsStep } = button.dataset;
    if (days !== undefined) state.days = Number(days);
    if (previous !== undefined) state.previous = Number(previous);
    if (volume !== undefined) state.volumeOption = Number(volume);
    if (recordsStep !== undefined) {
      state.records = Math.min(simulator.recordsMax, Math.max(0, state.records + Number(recordsStep)));
    }
    render();
  });
}
