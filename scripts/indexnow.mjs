/**
 * Avisa Bing, Yandex, Seznam e Naver (protocolo IndexNow) de que as páginas mudaram: o Bing
 * alimenta o ChatGPT Search e o Copilot. Rodar DEPOIS do deploy (a chave precisa estar no ar):
 *   npm run indexnow
 * A chave é pública por definição (fica em public/<chave>.txt); trocar = novo arquivo + INDEXNOW_KEY.
 */
/* global fetch -- fetch nativo do Node 18+ (o eslint dos scripts não conhece o global). */
import { readFileSync } from "node:fs";

const INDEXNOW_KEY = "f7b3ba69c5ddc112cad0958c176af3fa";
const SITE = (process.env.PUBLIC_SITE_URL || "https://gufapp.com.br").replace(/\/+$/, "");
const host = new URL(SITE).host;

const sitemap = readFileSync("dist/sitemap-0.xml", "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
urls.push(`${SITE}/llms.txt`);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls }),
});
console.log(`[indexnow] ${response.status} ${response.statusText} · ${urls.length} URL(s)`);
if (response.status >= 400) process.exit(1);
