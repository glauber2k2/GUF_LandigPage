/**
 * Confere o build depois do `astro build`:
 *  - orçamento: JavaScript da home ≤ 30 KB gzip (sem analytics, que só carrega após aceite);
 *  - CSS da home (relatório);
 *  - nenhum texto provisório ou chave de template sobrando ({algo}) no HTML publicado;
 *  - aviso se o domínio ainda é o padrão (PUBLIC_SITE_URL não definido).
 * Falha o build (exit 1) se algo passar do limite.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
const JS_BUDGET_KB = 30;
const failures = [];

const html = readFileSync(join(DIST, "index.html"), "utf8");
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const gz = (path) => gzipSync(readFileSync(path)).length;

/** Todos os JS do build: os que a home carrega direto e os importados sob demanda (simulador). */
const astroDir = join(DIST, "_astro");
const jsFiles = readdirSync(astroDir).filter((f) => f.endsWith(".js"));
const jsTotal = jsFiles.reduce((sum, f) => sum + gz(join(astroDir, f)), 0);
const inlineScripts = [...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1] ?? "")
  .join("");
const inlineJs = gzipSync(Buffer.from(inlineScripts)).length;

const cssLinked = [...html.matchAll(/href="\/(_astro\/[^"]+\.css)"/g)].map((m) => join(DIST, m[1]));
const cssLinkedTotal = cssLinked.reduce((sum, f) => sum + gz(f), 0);
const inlineCss = gzipSync(
  Buffer.from([...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("")),
).length;

const jsKb = kb(jsTotal + inlineJs);
console.log("\n[check-build] Home");
console.log(`  JS (gzip, todos os módulos + inline): ${jsKb} KB  (orçamento ${JS_BUDGET_KB} KB)`);
console.log(`  CSS (gzip, arquivos + inline): ${kb(cssLinkedTotal + inlineCss)} KB`);
console.log(`  HTML (gzip): ${kb(gzipSync(Buffer.from(html)).length)} KB  ·  arquivos JS: ${jsFiles.length}`);

if (jsKb > JS_BUDGET_KB) failures.push(`JavaScript da home acima do orçamento: ${jsKb} KB > ${JS_BUDGET_KB} KB`);

// Só o texto visível: sem scripts, estilos e atributos (o simulador guarda chaves de runtime em data-*).
const visible = html
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<style[\s\S]*?<\/style>/g, "")
  .replace(/<[^>]*>/g, " ");
const leftover = visible.match(/\{[a-zA-Z][a-zA-Z0-9_.]*\}/g);
if (leftover) failures.push(`Chaves de template sem valor no HTML: ${[...new Set(leftover)].join(", ")}`);
// "todo" é palavra comum em português: só as marcas em maiúsculas contam.
if (/lorem ipsum|\[PRESTADOR/i.test(visible) || /\b(TODO|FIXME|XXX)\b/.test(visible)) {
  failures.push("Texto provisório no HTML publicado.");
}

if (html.includes("http://localhost:4321")) {
  console.warn("\n⚠️  [check-build] PUBLIC_SITE_URL não definido: canonical, OG e sitemap apontam para localhost.");
  console.warn("    Defina o domínio final antes de publicar (ver .env.example).");
}

const size = statSync(join(DIST, "index.html")).size;
if (size > 300 * 1024) failures.push(`index.html muito grande: ${kb(size)} KB`);

if (failures.length > 0) {
  console.error(`\n✗ [check-build]\n  - ${failures.join("\n  - ")}\n`);
  process.exit(1);
}
console.log("\n✓ [check-build] Orçamento e conteúdo ok.\n");
