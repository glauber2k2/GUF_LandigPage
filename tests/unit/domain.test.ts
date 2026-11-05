import { describe, expect, it } from "vitest";
import { estimate1RM, formatKg, formatKgDelta } from "../../src/lib/domain/epley";
import {
  activePrice,
  defaultPlan,
  featureLimit,
  formatMoney,
  planTemplateValues,
  upgradePlan,
} from "../../src/lib/domain/plans";
import { MOVEMENT_GLYPH, movementOf, ranksOf } from "../../src/lib/domain/ranking";
import { simulatorNote } from "../../src/lib/domain/simulator-note";
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
  it("textos que dependem do catálogo continuam verdadeiros", () => {
    // Free: "Gráficos com o mês atual e o anterior" → chart_months = 2. Se o app mudar, revisar plans.json.
    expect(featureLimit(catalog, "free", "chart_months")).toBe(2);
    // Free: "Competição na temporada do mês atual" → sem competition_full_history.
    expect(featureLimit(catalog, "free", "competition_full_history")).toBe(false);
    expect(featureLimit(catalog, "pro", "competition_full_history")).toBeNull();
    const v = planTemplateValues(catalog);
    expect(v["free.guf_ai_daily_messages"]).toBe("3");
    expect(v["pro.guf_ai_daily_messages"]).toBe("40");
  });
});

describe("ranking do mockup", () => {
  const order = ["ana", "me", "bruno"];
  it("ordena por pontos e mantém a ordem no empate", () => {
    expect(ranksOf({ ana: 10, me: 20, bruno: 10 }, order)).toEqual({ me: 1, ana: 2, bruno: 3 });
  });
  it("movimento", () => {
    expect(movementOf(3, 1)).toBe("up");
    expect(movementOf(1, 2)).toBe("down");
    expect(movementOf(undefined, 2)).toBe("same");
    expect(MOVEMENT_GLYPH.up).toBe("▲");
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
    const records = section("records");
    const evolution = section("evolution");
    if (records.type !== "records" || evolution.type !== "evolution") throw new Error("tipo");
    const values = buildTemplateValues({
      rules,
      catalog,
      lifts: { before: records.demo.before, after: records.demo.after },
      evolutionStart: evolution.chart.startValue,
      instagramHandle: "@guf.app",
      year: 2026,
    });
    for (const file of ["hero", "competition", "gufai", "plans", "final-cta"]) {
      expect(() => fillDeep(section(file), values, ["previous", "streak", "bonus"])).not.toThrow();
    }
    expect(values.end).toBe("101,3");
    expect(values.start).toBe("92,0");
  });

  it("nota do simulador", () => {
    const competition = section("competition");
    if (competition.type !== "competition") throw new Error("tipo");
    const sim = fillDeep(competition.simulator, { bonusMax: 20, daysForFulfilledWeek: 3 }, [
      "previous",
      "streak",
      "bonus",
    ]);
    expect(simulatorNote(sim, rules, 2, { fulfilled: true, streakWeeks: 3, streakBonus: 15 })).toBe(
      "Semana cumprida: com 2 semanas cumpridas antes, a sequência chega a 3 e vale 15 pontos (máximo 20).",
    );
    expect(simulatorNote(sim, rules, 2, { fulfilled: false, streakWeeks: 0, streakBonus: 0 })).toMatch(
      /^Com menos de 3 dias/,
    );
  });
});
