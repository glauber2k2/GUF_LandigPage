/**
 * Setas de um carrossel com rolagem nativa (scroll-snap). Marcação:
 *
 *   <div data-carousel>
 *     <button data-carousel-step="-1">…</button> <button data-carousel-step="1">…</button>
 *     <div data-carousel-track> <article data-carousel-item>…</article> … </div>
 *   </div>
 *
 * Arrastar, rolar e o teclado continuam sendo da própria rolagem do navegador; as setas só avançam
 * um cartão (ou voltam), com animação suave fora do movimento reduzido.
 */
import { prefersReducedMotion } from "./reveal";

const FALLBACK_STEP_PX = 320;

export function initCarousels(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>("[data-carousel-track]");
    if (!track) return;
    carousel.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-carousel-step]") : null;
      const direction = Number(button?.dataset.carouselStep);
      if (!button || !Number.isFinite(direction)) return;
      track.scrollBy({ left: direction * stepOf(track), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  });
}

/** Largura de um cartão mais o espaço entre eles (lido na hora do clique, não no carregamento). */
function stepOf(track: HTMLElement): number {
  const item = track.querySelector<HTMLElement>("[data-carousel-item]");
  if (!item) return FALLBACK_STEP_PX;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
  return item.getBoundingClientRect().width + gap;
}
