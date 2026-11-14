/**
 * Animações em laço (celular do hero, letreiro, objetos flutuando): o CSS só deixa rodar quando o bloco
 * com `data-loop` tem `.is-playing` (global.css). Aqui a classe acompanha a tela e a aba visível, para
 * nada girar fora da vista. Com prefers-reduced-motion, as durações já são zeradas no CSS.
 */
import { whileVisible } from "./reveal";

const PLAYING = "is-playing";

export function initLoops(root: ParentNode = document): void {
  if (typeof IntersectionObserver === "undefined") return;
  root.querySelectorAll<HTMLElement>("[data-loop]").forEach((el) => {
    whileVisible(
      el,
      {
        onEnter: () => el.classList.add(PLAYING),
        onLeave: () => el.classList.remove(PLAYING),
      },
      0.05,
    );
  });
}
