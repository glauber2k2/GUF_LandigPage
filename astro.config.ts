import { defineConfig, envField, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import { analyticsCspSources } from "./src/lib/analytics/csp-sources.ts";

/** Diretiva CSP com as origens extras (o tipo do Astro exige o nome da diretiva no início). */
const directive = <D extends string>(name: D, ...sources: string[]) => [name, ...sources].join(" ") as `${D}${string}`;

// A config roda antes do astro:env; as variáveis que mudam o build (domínio, CSP) são lidas aqui.
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
// Domínio oficial como padrão: um build sem a variável (ex.: Workers Builds sem PUBLIC_SITE_URL) publicou
// canonical, Open Graph, sitemap e robots apontando para localhost, e o Google ignora a página.
const PRODUCTION_SITE_URL = "https://gufapp.com.br";
const siteUrl = env.PUBLIC_SITE_URL || PRODUCTION_SITE_URL;
const analytics = analyticsCspSources({
  metaPixelId: env.PUBLIC_META_PIXEL_ID,
  gaId: env.PUBLIC_GA_ID,
});

export default defineConfig({
  site: siteUrl,
  trailingSlash: "ignore",
  build: { format: "directory", inlineStylesheets: "auto" },
  compressHTML: true,
  prefetch: false,
  // Sem Markdown com código na página; desligar o Shiki evita estilos inline incompatíveis com a CSP.
  markdown: { syntaxHighlight: false },

  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_APP_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://treino.gufapp.com.br",
      }),
      PUBLIC_META_PIXEL_ID: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_GA_ID: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_GSC_VERIFICATION: envField.string({ context: "client", access: "public", optional: true }),
    },
  },

  // CSP por <meta> com hashes dos scripts e estilos que o próprio Astro gera. Diretivas que o <meta> não
  // aceita (frame-ancestors) ficam no cabeçalho, em public/_headers.
  security: {
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        directive("img-src", "'self'", "data:", ...analytics.img),
        directive("connect-src", "'self'", ...analytics.connect),
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        "manifest-src 'self'",
        "worker-src 'none'",
      ],
      scriptDirective: { resources: ["'self'", ...analytics.script] },
      styleDirective: { resources: ["'self'"] },
    },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/inter-latin-wght-normal.woff2"],
            weight: "100 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Barlow Condensed",
      cssVariable: "--font-barlow",
      fallbacks: ["Arial Narrow", "sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/barlow-condensed-latin-600-normal.woff2"],
            weight: 600,
            style: "normal",
            display: "swap",
          },
          {
            src: ["./src/assets/fonts/barlow-condensed-latin-700-normal.woff2"],
            weight: 700,
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
  ],

  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
      // Data do build: avisa os buscadores de que a página mudou a cada publicação.
      lastmod: new Date(),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
