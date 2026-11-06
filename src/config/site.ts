/**
 * Configuração do site: endereços, rotas do app, redes, idioma e recursos ligados.
 * Trocar um link ou o domínio do app = mudar aqui (ou na variável de ambiente), nunca nos componentes.
 */
import { PUBLIC_APP_URL, PUBLIC_GA_ID, PUBLIC_GSC_VERIFICATION, PUBLIC_META_PIXEL_ID } from "astro:env/client";

const appUrl = PUBLIC_APP_URL.replace(/\/+$/, "");

/** Rotas públicas do app (todas existem em guf_backend/apps/web/src/app; o app usa barra final). */
const APP_ROUTES = {
  signup: "/cadastro/",
  login: "/login/",
  plans: "/planos/",
  terms: "/termos/",
  privacy: "/privacidade/",
} as const;

export type AppRoute = keyof typeof APP_ROUTES;

export const site = {
  /** Nome da marca, sempre em minúsculas, como no app ("guf", nunca "guff"). */
  name: "guf",
  lang: "pt-BR",
  locale: "pt_BR",
  appUrl,
  appLink: (route: AppRoute): string => `${appUrl}${APP_ROUTES[route]}`,
  social: {
    instagram: { handle: "@guf.app", url: "https://www.instagram.com/guf.app/" },
  },
  /** Mesmas redes em todo lugar: rodapé, CTA final e JSON-LD (sameAs). */
  sameAs: ["https://www.instagram.com/guf.app/"] as const,
  analytics: {
    metaPixelId: PUBLIC_META_PIXEL_ID || undefined,
    gaId: PUBLIC_GA_ID || undefined,
  },
  googleSiteVerification: PUBLIC_GSC_VERIFICATION || undefined,
  features: {
    /** O CTA fixo no rodapé aparece só no celular, depois do hero. */
    mobileStickyCta: true,
  },

  /**
   * PRÉ-LANÇAMENTO. No dia do lançamento, mudar as duas chaves para `true` e publicar de novo:
   *
   *  - `appOpen: true`      → os botões voltam a ser links para o app (cadastro, planos), com UTM.
   *  - `showProPrice: true` → o card do Pro, o JSON-LD e o llms.txt mostram o preço.
   *
   * PREÇO DE LANÇAMENTO DO PRO: R$ 14,80/mês (confirmado em 2026-11-06).
   * O valor NÃO é escrito aqui: vem de `plan_prices` do app a cada build (src/content/plans/catalog.json).
   * Para mudar o preço, mude no app; a página acompanha no próximo deploy.
   */
  launch: {
    appOpen: false,
    showProPrice: false,
    /** Texto do tooltip nos botões bloqueados. */
    lockedLabel: "Lançamento em breve",
    /** O que aparece no lugar do preço enquanto `showProPrice` é false. */
    priceMask: "R$ ??,??",
    /** Lido por leitores de tela no lugar das interrogações. */
    priceMaskLabel: "Preço anunciado no lançamento",
  },
} as const;

export const analyticsEnabled = Boolean(site.analytics.metaPixelId || site.analytics.gaId);
