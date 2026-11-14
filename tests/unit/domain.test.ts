import { describe, expect, it } from "vitest";
import { estimate1RM, formatKg, formatKgDelta } from "../../src/lib/domain/epley";
import {
  activePrice,
  defaultPlan,
  featureLimit,
  formatMoney,
  intervalPrice,
  monthlyEquivalentCents,
  planTemplateValues,
  upgradePlan,
} from "../../src/lib/domain/plans";
import { buildTemplateValues } from "../../src/lib/domain/template-values";
import { fillDeep, fillTemplate } from "../../src/lib/text/template";
import { parseInline, plainText } from "../../src/lib/text/inline";
import { catalog, rules, section } from "./fixtures";

describe("Epley (igual ao app)", () => {
  it("80 × 6 = 96,0 e 80 × 8 = 101,3", () => {
    expect(formatKg(estimate1RM(80, 6))).toBe("96,0");
    expect(formatKg(estimate1RM(80, 8))).toBe("101,3");
  });
  it("variação com sinal", () => {
    expect(formatKgDelta(101.3 - 92)).toBe("+9,3");
    expect(formatKgDelta(-2)).toBe("−2,0");
  });
});

describe("catálogo de planos", () => {
  it("Free é o padrão e Pro é o plano à venda", () => {
    expect(defaultPlan(catalog).code).toBe("free");
    expect(upgradePlan(catalog).code).toBe("pro");
  });
  it("limites lidos do catálogo", () => {
    expect(featureLimit(catalog, "free", "routines_per_project")).toBe(5);
    expect(featureLimit(catalog, "pro", "routines_per_project")).toBeNull();
    expect(featureLimit(catalog, "free", "competition_full_history")).toBe(false);
  });
  it("preço formatado como no app", () => {
    expect(formatMoney(1480, "brl").replace(/\s/g, " ")).toBe("R$ 14,80");
    const price = activePrice(catalog, "pro");
    expect(price === null || price.amount_cents > 0).toBe(true);
  });
  it("preço do site vem do Stripe, e o anual sai por mês arredondado como no app", () => {
    const monthly = intervalPrice(catalog, "pro", "month");
    const yearly = intervalPrice(catalog, "pro", "year");
    if (catalog.prices.some((p) => p.provider === "stripe")) expect(monthly?.provider).toBe("stripe");
    expect(yearly === null || yearly.billing_interval === "year").toBe(true);
    if (!monthly) return;
    expect(monthlyEquivalentCents({ ...monthly, billing_interval: "year", amount_cents: 14800 })).toBe(1233);
    expect(formatMoney(1233, "brl").replace(/\s/g, " ")).toBe("R$ 12,33");
  });
  it("textos que dependem do catálogo continuam verdadeiros", () => {
    // Free: "Gráficos com o mês atual e o anterior" → chart_months = 2. Se o app mudar, revisar plans.json.
    expect(featureLimit(catalog, "free", "chart_months")).toBe(2);
    // Free: "Competição na temporada do mês atual" → sem competition_full_history.
    expect(featureLimit(catalog, "free", "competition_full_history")).toBe(false);
    expect(featureLimit(catalog, "pro", "competition_full_history")).toBeNull();
    const v = planTemplateValues(catalog);
    expect(v["free.guf_ai_daily_messages"]).toBe("1");
    expect(v["pro.guf_ai_daily_messages"]).toBe("15");
  });
});

describe("textos", () => {
  it("marcas inline", () => {
    expect(parseInline("Coluna **Anterior** e ==pontos==.")).toEqual([
      { kind: "text", value: "Coluna " },
      { kind: "strong", value: "Anterior" },
      { kind: "text", value: " e " },
      { kind: "accent", value: "pontos" },
      { kind: "text", value: "." },
    ]);
    expect(plainText("Seu treino é uma ==competição.==")).toBe("Seu treino é uma competição.");
  });

  it("template: chave desconhecida é erro, chave de runtime fica", () => {
    expect(fillTemplate("até {bonusMax}", { bonusMax: 20 })).toBe("até 20");
    expect(() => fillTemplate("{nada}", {})).toThrow(/nada/);
    expect(fillTemplate("{bonus} de {bonusMax}", { bonusMax: 20 }, ["bonus"])).toBe("{bonus} de 20");
  });

  it("todo o conteúdo das seções resolve sem chave faltando", () => {
    const values = buildTemplateValues({
      rules,
      catalog,
      instagramHandle: "@guf.app",
      tiktokHandle: "@guf.app",
      year: 2026,
    });
    for (const file of ["hero", "facts", "features", "lite", "plans", "steps", "faq", "final-cta"]) {
      expect(() => fillDeep(section(file), values)).not.toThrow();
    }
    expect(fillTemplate("{tiktok}", values)).toBe("@guf.app");
  });

  it("barras do gráfico do hero em passos de 5% (viram classes, sem style inline)", () => {
    const hero = section("hero");
    if (hero.type !== "hero") throw new Error("tipo");
    expect(hero.screen.volume.bars.every((h) => h % 5 === 0)).toBe(true);
  });
});
