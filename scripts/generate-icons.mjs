/**
 * Gera os ícones de public/ a partir do símbolo do guf (mesma geometria do app).
 * Rodar só quando a marca mudar: `node scripts/generate-icons.mjs`. Os PNGs ficam versionados.
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#0B0D10";
const VOLT = "#C6F432";

/** Símbolo em uma caixa 64×64; `scale` encolhe o símbolo para a área segura do ícone maskable. */
const markSvg = ({ rounded, scale }) => {
  const size = 48 * scale;
  const offset = (64 - size) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 16 : 0}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <circle cx="24" cy="24" r="16" fill="none" stroke="${VOLT}" stroke-width="7" stroke-linecap="round" stroke-dasharray="78.2 200" transform="rotate(-20 24 24)"/>
    <circle cx="32" cy="10.14" r="4.5" fill="${VOLT}"/>
  </g>
</svg>
`;
};

const favicon = markSvg({ rounded: true, scale: 0.889 });
const square = markSvg({ rounded: false, scale: 0.889 });
const maskable = markSvg({ rounded: false, scale: 0.62 });

writeFileSync("public/favicon.svg", favicon);

const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/${file}`);

await Promise.all([
  png(favicon, 32, "favicon-32.png"),
  png(square, 180, "apple-touch-icon.png"),
  png(favicon, 192, "icon-192.png"),
  png(favicon, 512, "icon-512.png"),
  png(maskable, 512, "icon-maskable-512.png"),
]);

console.log("Ícones gerados em public/.");
