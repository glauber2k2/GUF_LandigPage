import { onceVisible, prefersReducedMotion, startsOffscreen } from "../../lib/motion/reveal";

const FILL_STAGGER_MS = 70;
const COUNT_MS = 900;

/**
 * Evolução: o gráfico se desenha e a faixa de semanas acende em sequência, uma vez, quando aparecem.
 * Sem JS ou com movimento reduzido, tudo já aparece no estado final (o HTML é o estado final).
 */
export function initEvolution(section: HTMLElement): void {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

  const chart = section.querySelector<SVGElement>("[data-evolution-chart]");
  const streak = section.querySelector<HTMLElement>("[data-streak]");
  const number = section.querySelector<HTMLElement>("[data-streak-number]");
  const target = Number(streak?.dataset.streak ?? 0);

  // Só arma (esconde) o que ainda está fora da tela, para não piscar conteúdo já visível.
  startsOffscreen(section, (offscreen) => {
    if (!offscreen) return;
    chart?.classList.add("is-armed");
    streak?.classList.add("is-armed");
    if (number) number.textContent = "0";
    streak?.querySelectorAll<HTMLElement>("[data-week-fill]").forEach((fill) => {
      fill.style.setProperty("--fill-delay", `${Number(fill.dataset.weekIndex) * FILL_STAGGER_MS}ms`);
    });

    onceVisible(section, () => {
      chart?.classList.replace("is-armed", "is-drawn");
      streak?.classList.replace("is-armed", "is-drawn");
      countUp(number, target);
    });
  });
}

function countUp(el: HTMLElement | null, target: number): void {
  if (!el) return;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / COUNT_MS);
    el.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
