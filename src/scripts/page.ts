import { createAnalytics } from "../lib/analytics/analytics";
import { readConsent, saveConsent, type ConsentChoice } from "../lib/analytics/consent";
import { trackCtaClicks } from "../lib/analytics/cta-tracking";
import type { AnalyticsIds } from "../lib/analytics/csp-sources";
import { providersFor } from "../lib/analytics/providers";
import { initReveal } from "../lib/motion/reveal";
import { applyTrackedParamsToAppLinks } from "../lib/utm/apply";

/** Comportamentos comuns a todas as páginas. Cada um é independente e falha sozinho. */
export function initPage(): void {
  applyTrackedParamsToAppLinks();
  initReveal();
  initStickyCta();
  initAnalytics();
}

/** CTA fixo no celular: aparece quando o hero sai da tela e some quando o aviso de cookies está aberto. */
function initStickyCta(): void {
  const bar = document.querySelector<HTMLElement>("[data-sticky-cta]");
  const hero = document.querySelector("[data-hero]");
  if (!bar || !hero || typeof IntersectionObserver === "undefined") return;

  const set = (visible: boolean) => {
    bar.classList.toggle("is-visible", visible);
    bar.toggleAttribute("inert", !visible);
    bar.setAttribute("aria-hidden", String(!visible));
  };
  let pastHero = false;
  const sync = () => set(pastHero && !document.body.hasAttribute("data-consent-open"));

  new IntersectionObserver(([entry]) => {
    if (!entry) return;
    pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
    sync();
  }).observe(hero);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["data-consent-open"] });
}

/**
 * Analytics: sem ID nas variáveis de ambiente, nada roda (o atributo nem existe). Com ID, nada carrega
 * antes do "Aceitar"; depois do aceite, os scripts entram após o evento `load`, sem bloquear a página.
 */
function initAnalytics(): void {
  const raw = document.body.dataset.analytics;
  if (!raw) return;
  const analytics = createAnalytics(providersFor(JSON.parse(raw) as AnalyticsIds));
  if (!analytics.enabled) return;

  trackCtaClicks(analytics);

  const startAfterLoad = () => {
    const start = () => void analytics.start();
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  };

  const choice = readConsent();
  if (choice === "granted") {
    startAfterLoad();
    return;
  }
  if (choice === "denied") return;

  showConsent((answer) => {
    saveConsent(answer);
    if (answer === "granted") startAfterLoad();
  });
}

function showConsent(onChoice: (choice: ConsentChoice) => void): void {
  const banner = document.querySelector<HTMLElement>("[data-consent]");
  if (!banner) return;
  banner.hidden = false;
  document.body.setAttribute("data-consent-open", "");
  banner.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-consent-choice]") : null;
    const choice = button?.dataset.consentChoice;
    if (choice !== "granted" && choice !== "denied") return;
    banner.hidden = true;
    document.body.removeAttribute("data-consent-open");
    onChoice(choice);
  });
}
