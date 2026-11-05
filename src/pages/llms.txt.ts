import type { APIRoute } from "astro";
import { seo } from "../config/seo";
import { site as siteConfig } from "../config/site";
import { loadSiteData } from "../lib/content/site-data";
import { buildLlmsTxt } from "../lib/seo/llms";

/** /llms.txt: resumo factual do guf para assistentes de IA, gerado do mesmo conteúdo da página. */
export const GET: APIRoute = async ({ site }) => {
  const data = await loadSiteData();
  const base = site ?? new URL("http://localhost:4321");
  const body = buildLlmsTxt({
    name: siteConfig.name,
    summary: seo.entityDefinition,
    values: data.values,
    rules: data.rules,
    faq: data.faq,
    links: [
      { label: "Site", url: new URL("/", base).toString() },
      { label: "Criar conta grátis", url: siteConfig.appLink("signup") },
      { label: "Entrar", url: siteConfig.appLink("login") },
      { label: "Termos de Uso", url: siteConfig.appLink("terms") },
      { label: "Política de Privacidade", url: siteConfig.appLink("privacy") },
      { label: "Instagram", url: siteConfig.social.instagram.url },
    ],
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
