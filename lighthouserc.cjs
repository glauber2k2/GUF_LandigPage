/**
 * Lighthouse CI com o orçamento obrigatório (celular, rede simulada padrão). Falha se piorar.
 * Desktop: `LHCI_PRESET=desktop npm run lhci`.
 */
const desktop = process.env.LHCI_PRESET === "desktop";

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["http://localhost/index.html"],
      numberOfRuns: 3,
      settings: desktop ? { preset: "desktop" } : {},
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
