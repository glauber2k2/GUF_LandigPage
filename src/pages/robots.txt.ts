import type { APIRoute } from "astro";

/**
 * Robôs de busca e de assistentes de IA que o guf quer receber, citados um a um: alguns só leem o
 * próprio bloco, e a lista deixa explícito que a página pode ser indexada e citada por eles.
 * A landing é toda pública; o app (treino.gufapp.com.br) tem o próprio robots.txt.
 */
export const AI_AND_SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "DuckDuckBot",
  "YandexBot",
  "Google-Extended",
  "Applebot-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Meta-ExternalAgent",
  "CCBot",
] as const;

/** robots.txt gerado no build, com o sitemap no domínio configurado (PUBLIC_SITE_URL). */
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://gufapp.com.br");
  const sitemap = new URL("sitemap-index.xml", base).toString();
  const bots = AI_AND_SEARCH_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join("\n");
  const body = `${bots}\nUser-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
