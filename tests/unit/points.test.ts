import { describe, expect, it } from "vitest";
import { formatPoints, weekPoints } from "../../src/lib/domain/points";
import { rules } from "./fixtures";

/**
 * Exemplos calculados à mão a partir de `competition_week_scores`
 * (guf_backend/supabase/migrations/20261023200000_competition_points_per_day.sql) com os parâmetros
 * vigentes: 15/dia, semana cumprida com 3 dias, +5 por semana seguida até 20, 3 por recorde sem
 * teto, volume até 15 proporcional à média.
 */
describe("weekPoints (regras do app)", () => {
  it("usa os parâmetros vigentes do snapshot", () => {
    expect(rules).toMatchObject({
      constancyPointsPerDay: 15,
      daysForFulfilledWeek: 3,
      bonusPerWeek: 5,
      bonusMax: 20,
      recordPoints: 3,
      recordsMax: null,
      volumeMax: 15,
    });
  });

  it("exemplo padrão do protótipo: 3 dias, 1 recorde, 2 semanas antes, volume na média = 78", () => {
    // constância 3×15 = 45; sequência min(20, 5×3) = 15; recordes 1×3 = 3; volume 15 → 78
    const r = weekPoints({ validDays: 3, records: 1, previousFulfilledWeeks: 2, volumeRatio: 1 }, rules);
    expect(r).toEqual({
      constancy: 45,
      streakBonus: 15,
      records: 3,
      volume: 15,
      total: 78,
      fulfilled: true,
      streakWeeks: 3,
    });
  });

  it("semana não cumprida (2 dias) zera a sequência e não dá bônus", () => {
    // 2×15 = 30; sem bônus; 0 recordes; volume 15×0,5 = 7,5 → round(37,5) = 38
    const r = weekPoints({ validDays: 2, records: 0, previousFulfilledWeeks: 3, volumeRatio: 0.5 }, rules);
    expect(r.fulfilled).toBe(false);
    expect(r.streakWeeks).toBe(0);
    expect(r.streakBonus).toBe(0);
    expect(r.volume).toBe(7.5);
    expect(r.total).toBe(38);
  });

  it("constância não tem teto de dias: 7 dias = 105", () => {
    const r = weekPoints({ validDays: 7, records: 0, previousFulfilledWeeks: 0, volumeRatio: 1 }, rules);
    // 105 + min(20, 5×1) = 5 + 0 + 15 = 125
    expect(r.constancy).toBe(105);
    expect(r.streakBonus).toBe(5);
    expect(r.total).toBe(125);
  });

  it("sequência chega ao teto de 20 com 3 ou mais semanas antes", () => {
    const r = weekPoints({ validDays: 4, records: 0, previousFulfilledWeeks: 10, volumeRatio: 1 }, rules);
    expect(r.streakBonus).toBe(20);
    expect(r.streakWeeks).toBe(11);
  });

  it("recordes sem teto: 10 recordes = 30 pontos", () => {
    const r = weekPoints({ validDays: 3, records: 10, previousFulfilledWeeks: 0, volumeRatio: 1 }, rules);
    expect(r.records).toBe(30);
  });

  it("volume acima da média não passa de 15; 3/4 da média = 11,25", () => {
    expect(weekPoints({ validDays: 3, records: 0, previousFulfilledWeeks: 0, volumeRatio: 2 }, rules).volume).toBe(15);
    const r = weekPoints({ validDays: 3, records: 1, previousFulfilledWeeks: 1, volumeRatio: 0.75 }, rules);
    // 45 + min(20, 5×2)=10 + 3 + 11,25 = 69,25 → 69
    expect(r.volume).toBe(11.25);
    expect(r.total).toBe(69);
  });

  it("respeita teto de recordes quando o app definir um", () => {
    const r = weekPoints(
      { validDays: 3, records: 10, previousFulfilledWeeks: 0, volumeRatio: 1 },
      { ...rules, recordPoints: 5, recordsMax: 25 },
    );
    expect(r.records).toBe(25);
  });

  it("formata como o app (vírgula decimal)", () => {
    expect(formatPoints(11.25)).toBe("11,25");
    expect(formatPoints(15)).toBe("15");
  });
});
