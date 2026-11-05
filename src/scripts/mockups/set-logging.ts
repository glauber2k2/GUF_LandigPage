import { prefersReducedMotion, whileVisible } from "../../lib/motion/reveal";

interface Config {
  loadChip: number;
  repsChip: number;
  load: number;
  reps: number;
  initialLoad: number;
  initialReps: number;
  restSeconds: number;
}

/** Passos: 0 início · 1 atalho de carga · 2 atalho de repetições · 3 série concluída · 4–6 descanso. */
const STEPS = 7;
const STEP_MS = 1100;
const REST_STEP = 4;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function initSetLogging(root: HTMLElement): void {
  const config = JSON.parse(root.dataset.setLogging ?? "{}") as Config;
  const fx = (name: string) => root.querySelector<HTMLElement>(`[data-fx="${name}"]`);
  const chips = (kind: "load" | "reps") => root.querySelectorAll<HTMLElement>(`[data-chip="${kind}"]`);
  const values = (kind: "load" | "reps") => root.querySelectorAll<HTMLElement>(`[data-value="${kind}"]`);
  const restClock = root.querySelector<HTMLElement>("[data-rest-clock]");
  const restBar = root.querySelector<HTMLElement>("[data-rest-bar]");

  let step = 0;
  let rest = config.restSeconds;
  let stepTimer: number | undefined;
  let restTimer: number | undefined;

  const show = (el: HTMLElement | null, visible: boolean) => el?.classList.toggle("opacity-0", !visible);
  const activateChip = (kind: "load" | "reps", index: number | null) =>
    chips(kind).forEach((chip) => chip.classList.toggle("is-active", Number(chip.dataset.index) === index));
  const setValue = (kind: "load" | "reps", value: number) =>
    values(kind).forEach((el) => (el.textContent = String(value)));

  const paintRest = () => {
    if (restClock) restClock.textContent = clock(rest);
    if (restBar) restBar.style.transform = `scaleX(${rest / config.restSeconds})`;
  };

  const render = () => {
    setValue("load", step >= 1 ? config.load : config.initialLoad);
    setValue("reps", step >= 2 ? config.reps : config.initialReps);
    activateChip("load", step === 1 ? config.loadChip : null);
    activateChip("reps", step === 2 ? config.repsChip : null);
    show(fx("load-ring"), step === 1);
    show(fx("reps-ring"), step === 2);
    show(fx("row-done"), step >= 3);
    show(fx("check-on"), step >= 3);
    const restEl = fx("rest");
    show(fx("rest-dim"), step < REST_STEP);
    fx("rest-dim")?.classList.toggle("opacity-65", step < REST_STEP);
    restEl?.classList.toggle("translate-y-1.5", step < REST_STEP);
  };

  const stopRest = () => {
    window.clearInterval(restTimer);
    restTimer = undefined;
  };

  const startRest = () => {
    stopRest();
    rest = config.restSeconds;
    paintRest();
    restTimer = window.setInterval(() => {
      rest = Math.max(0, rest - 1);
      paintRest();
    }, 1000);
  };

  const advance = () => {
    step = (step + 1) % STEPS;
    if (step === REST_STEP) startRest();
    if (step === 0) {
      stopRest();
      rest = config.restSeconds;
      paintRest();
    }
    render();
  };

  if (prefersReducedMotion()) {
    step = REST_STEP;
    render();
    return;
  }

  whileVisible(
    root,
    {
      onEnter: () => {
        stepTimer ??= window.setInterval(advance, STEP_MS);
        if (step >= REST_STEP && restTimer === undefined) startRest();
      },
      onLeave: () => {
        window.clearInterval(stepTimer);
        stepTimer = undefined;
        stopRest();
      },
    },
    0.35,
  );
}
