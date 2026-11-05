/**
 * Roda o Lighthouse CI sobre dist/ com o orçamento de lighthouserc.cjs.
 *   node scripts/lhci.mjs            → celular (padrão do Lighthouse)
 *   node scripts/lhci.mjs desktop    → desktop
 * Sem CHROME_PATH, usa o Chromium do Playwright (o mesmo dos testes e2e).
 */
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const preset = process.argv[2] === "desktop" ? "desktop" : "mobile";
const env = {
  ...process.env,
  LHCI_PRESET: preset,
  CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
};

console.log(`[lhci] ${preset} · Chrome: ${env.CHROME_PATH}`);
const result = spawnSync("npx", ["lhci", "autorun", "--config=lighthouserc.cjs"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
