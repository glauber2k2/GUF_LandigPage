/**
 * Utilitário único de entrada ("reveal") da página.
 *
 *   <div data-reveal>…</div>                     sobe 16 px e aparece ao entrar na tela
 *   <div data-reveal data-reveal-delay="140">…   atraso explícito (ms)
 *
 * Irmãos com `data-reveal` dentro do mesmo pai entram escalonados (70 ms). O CSS em global.css
 * desenha os estados; aqui só se trocam classes. O que já está na primeira dobra não é escondido
 * (nada de conteúdo piscando nem LCP atrasado), e com prefers-reduced-motion nada se move.
 */
const STAGGER_MS = 70;
const PENDING = "is-reveal-pending";
const SHOWN = "is-revealed";

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initReveal(root: ParentNode = document): void {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

  // Sem medir nada no carregamento (getBoundingClientRect forçaria um layout da página inteira):
  // o primeiro aviso do observer diz quem já está na tela (fica como está) e quem está fora
  // (é escondido ali, longe da vista, e entra quando aparecer).
  const seen = new WeakSet<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (!seen.has(el)) {
          seen.add(el);
          if (entry.isIntersecting) {
            observer.unobserve(el);
          } else {
            el.style.setProperty("--reveal-delay", `${revealDelay(el)}ms`);
            el.classList.add(PENDING);
          }
          continue;
        }
        if (!entry.isIntersecting) continue;
        el.classList.add(SHOWN);
        el.classList.remove(PENDING);
        observer.unobserve(el);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => observer.observe(el));
}

/** Diz uma vez, sem forçar layout, se o elemento começou fora da tela. */
export function startsOffscreen(el: Element, callback: (offscreen: boolean) => void): void {
  const observer = new IntersectionObserver(([entry]) => {
    observer.disconnect();
    callback(!(entry?.isIntersecting ?? false));
  });
  observer.observe(el);
}

function revealDelay(el: HTMLElement): number {
  const explicit = Number(el.dataset.revealDelay);
  if (Number.isFinite(explicit) && el.dataset.revealDelay !== undefined) return explicit;
  const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal")) : [];
  return Math.max(0, siblings.indexOf(el)) * STAGGER_MS;
}

/**
 * Roda `onEnter`/`onLeave` conforme o elemento entra e sai da tela, e pausa quando a aba fica oculta.
 * Usado pelas animações contínuas (ranking, demonstração da série), que nunca rodam fora da tela.
 */
export function whileVisible(
  el: Element,
  handlers: { onEnter: () => void; onLeave: () => void },
  threshold = 0.25,
): void {
  let inView = false;
  const sync = () => (inView && !document.hidden ? handlers.onEnter() : handlers.onLeave());
  new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? false;
      sync();
    },
    { threshold },
  ).observe(el);
  document.addEventListener("visibilitychange", sync);
}

/** Dispara uma vez quando o elemento aparece (ex.: o gráfico que se desenha). */
export function onceVisible(el: Element, callback: () => void, threshold = 0.35): void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      callback();
    },
    { threshold },
  );
  observer.observe(el);
}
