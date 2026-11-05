import { prefersReducedMotion, whileVisible } from "../../lib/motion/reveal";

const FIRST_MS = 700;
const CYCLE_MS = 4200;
const RELIGHT_MS = 900;

/** Troféu do recorde: acende ao aparecer e repete o ciclo enquanto a seção está na tela. */
export function initRecordDemo(root: HTMLElement): void {
  const parts = ["glow", "row", "trophy"].map((name) => root.querySelector<HTMLElement>(`[data-fx="${name}"]`));
  const badge = root.querySelector<HTMLElement>('[data-fx="badge"]');

  const lit = (on: boolean) => {
    parts.forEach((el) => el?.classList.toggle("opacity-0", !on));
    badge?.classList.toggle("opacity-0", !on);
    badge?.classList.toggle("scale-60", !on);
  };

  if (prefersReducedMotion()) {
    lit(true);
    return;
  }

  const timers: number[] = [];
  let cycle: number | undefined;
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

  whileVisible(
    root,
    {
      onEnter: () => {
        if (cycle !== undefined) return;
        later(() => lit(true), FIRST_MS);
        cycle = window.setInterval(() => {
          lit(false);
          later(() => lit(true), RELIGHT_MS);
        }, CYCLE_MS);
      },
      onLeave: () => {
        window.clearInterval(cycle);
        cycle = undefined;
        timers.splice(0).forEach((t) => window.clearTimeout(t));
        lit(true);
      },
    },
    0.35,
  );
}
