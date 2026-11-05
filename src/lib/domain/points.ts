/**
 * Pontuação semanal da competição do guf, igual à função `competition_week_scores` do app
 * (guf_backend/supabase/migrations/20261023200000_competition_points_per_day.sql):
 *
 *   constância = dias com treino válido × pontos por dia (sem teto de dias)
 *   sequência  = se a semana foi cumprida (dias ≥ mínimo): min(teto, bônus × semanas cumpridas seguidas,
 *                contando esta); senão 0
 *   recordes   = recordes × pontos por recorde (teto opcional; nulo = sem teto)
 *   volume     = 0 sem volume; senão máximo × min(1, volume da semana ÷ média das últimas semanas)
 *   total      = soma arredondada
 *
 * Função pura: recebe as regras (snapshot do app) e devolve as partes.
 */
import type { CompetitionRules } from "../../content/schemas/app-data.ts";

export type ScoringRules = Pick<
  CompetitionRules,
  | "constancyPointsPerDay"
  | "daysForFulfilledWeek"
  | "bonusPerWeek"
  | "bonusMax"
  | "recordPoints"
  | "recordsMax"
  | "volumeMax"
>;

export interface WeekInput {
  /** Dias da semana (0–7) com pelo menos um treino válido. */
  validDays: number;
  /** Recordes batidos na semana. */
  records: number;
  /** Semanas cumpridas seguidas imediatamente antes desta. */
  previousFulfilledWeeks: number;
  /** Volume da semana ÷ média das últimas semanas com treino (1 = igual à média). */
  volumeRatio: number;
}

export interface WeekPoints {
  constancy: number;
  streakBonus: number;
  records: number;
  volume: number;
  total: number;
  fulfilled: boolean;
  /** Sequência de semanas cumpridas ao fim desta semana (0 se não foi cumprida). */
  streakWeeks: number;
}

const clampInt = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, Math.trunc(value)));

/** Arredondamento com 2 casas, como o `round(x, 2)` do Postgres para valores positivos. */
const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function weekPoints(input: WeekInput, rules: ScoringRules): WeekPoints {
  const validDays = clampInt(input.validDays, 0, 7);
  const records = Math.max(0, Math.trunc(input.records));
  const previous = Math.max(0, Math.trunc(input.previousFulfilledWeeks));
  const ratio = Math.max(0, input.volumeRatio);

  const fulfilled = validDays >= rules.daysForFulfilledWeek;
  const streakWeeks = fulfilled ? previous + 1 : 0;

  const constancy = validDays * rules.constancyPointsPerDay;
  const streakBonus = fulfilled ? Math.min(rules.bonusMax, rules.bonusPerWeek * streakWeeks) : 0;
  const rawRecords = records * rules.recordPoints;
  const recordPts = rules.recordsMax === null ? rawRecords : Math.min(rules.recordsMax, rawRecords);
  const volume = validDays === 0 || ratio === 0 ? 0 : rules.volumeMax * Math.min(1, ratio);

  const parts = {
    constancy: round2(constancy),
    streakBonus,
    records: round2(recordPts),
    volume: round2(volume),
  };

  return {
    ...parts,
    total: Math.round(parts.constancy + parts.streakBonus + parts.records + parts.volume),
    fulfilled,
    streakWeeks,
  };
}

/** "11,25" — números da pontuação no formato do app (vírgula decimal, sem zeros sobrando). */
export function formatPoints(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}
