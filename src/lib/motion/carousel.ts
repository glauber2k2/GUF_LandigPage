/**
 * Carrossel com rolagem nativa (scroll-snap). Marcação:
 *
 *   <div data-carousel data-carousel-auto="3200">
 *     <button data-carousel-step="-1">…</button> <button data-carousel-step="1">…</button>
 *     <div data-carousel-track> <article data-carousel-item>…</article> … </div>
 *   </div>
 *
 * Arrastar, rolar e o teclado continuam sendo da própria rolagem do navegador; as setas avançam ou
 * voltam um cartão. Com `data-carousel-auto` (ms), ele avança sozinho e volta ao início no fim, mas só
 * com o carrossel na tela e a aba visível; para com o mouse em cima ou o foco dentro, espera um pouco
 * depois que a pessoa mexe e nunca roda com prefers-reduced-motion.
 */
import { prefersReducedMotion, whileVisible } from "./reveal";

const FALLBACK_STEP_PX = 320;
/** Depois de tocar, rolar ou usar as setas, a rolagem automática espera esse tempo para voltar. */
const RESUME_AFTER_MS = 6000;
/** Folga para considerar que a rolagem chegou ao fim (arredondamento de pixels). */
const END_TOLERANCE_PX = 8;

export function initCarousels(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>("[data-carousel-track]");
    if (!track) return;
    const auto = startAutoScroll(carousel, track);
    carousel.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-carousel-step]") : null;
      const direction = Number(button?.dataset.carouselStep);
      if (!button || !Number.isFinite(direction)) return;
      auto?.pauseForAWhile();
      track.scrollBy({ left: direction * stepOf(track), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  });
}

function startAutoScroll(carousel: HTMLElement, track: HTMLElement): { pauseForAWhile: () => void } | null {
  const interval = Number(carousel.dataset.carouselAuto);
  if (
    !Number.isFinite(interval) ||
    interval <= 0 ||
    prefersReducedMotion() ||
    typeof IntersectionObserver === "undefined"
  ) {
    return null;
  }

  let hovering = false;
  let pausedUntil = 0;
  let timer: number | undefined;
  const pauseForAWhile = () => {
    pausedUntil = Date.now() + RESUME_AFTER_MS;
  };

  const advance = () => {
    if (hovering || Date.now() < pausedUntil) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - END_TOLERANCE_PX;
    track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + stepOf(track), behavior: "smooth" });
  };

  track.addEventListener("pointerenter", () => (hovering = true));
  track.addEventListener("pointerleave", () => (hovering = false));
  track.addEventListener("focusin", () => (hovering = true));
  track.addEventListener("focusout", () => (hovering = false));
  for (const type of ["pointerdown", "wheel", "touchstart", "keydown"] as const) {
    track.addEventListener(type, pauseForAWhile, { passive: true });
  }

  whileVisible(carousel, {
    onEnter: () => {
      window.clearInterval(timer);
      timer = window.setInterval(advance, interval);
    },
    onLeave: () => window.clearInterval(timer),
  });

  return { pauseForAWhile };
}

/** Largura de um cartão mais o espaço entre eles (lido na hora, não no carregamento). */
function stepOf(track: HTMLElement): number {
  const item = track.querySelector<HTMLElement>("[data-carousel-item]");
  if (!item) return FALLBACK_STEP_PX;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
  return item.getBoundingClientRect().width + gap;
}
