import type { APIRoute } from "astro";

/** robots.txt gerado no build, com o sitemap no domínio configurado (PUBLIC_SITE_URL). */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site ?? "http://localhost:4321").toString();
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
