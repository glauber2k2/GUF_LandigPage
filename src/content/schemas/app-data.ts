import { z } from "astro/zod";

/**
 * Dados que vêm do app (fonte da verdade). Os schemas validam tanto o snapshot versionado quanto o
 * que o script de sincronização busca no Supabase, para os dois nunca terem formatos diferentes.
 */

export const planSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  rank: z.number().int(),
  is_default: z.boolean(),
  is_purchasable: z.boolean(),
});

export const featureSchema = z.object({
  code: z.string().min(1),
  kind: z.enum(["flag", "limit"]),
  description: z.string(),
});

export const planFeatureSchema = z.object({
  plan_code: z.string().min(1),
  feature_code: z.string().min(1),
  /** Em `limit`, nulo = sem limite. Sem linha = funcionalidade não liberada no plano. */
  limit_value: z.number().int().nonnegative().nullable(),
});

export const planPriceSchema = z.object({
  plan_code: z.string().min(1),
  provider: z.string().min(1),
  billing_interval: z.enum(["month", "year"]),
  amount_cents: z.number().int().positive(),
  currency: z.string().regex(/^[a-z]{3}$/),
});

export const planCatalogSchema = z.object({
  id: z.string(),
  /** ISO 8601 da última sincronização bem-sucedida. */
  syncedAt: z.string(),
  source: z.string(),
  plans: z.array(planSchema).min(1),
  features: z.array(featureSchema),
  planFeatures: z.array(planFeatureSchema),
  /** Preços à venda (`plan_prices.is_active`). Vazio = venda desligada no app. */
  prices: z.array(planPriceSchema),
});

export const competitionRulesSchema = z.object({
  id: z.string(),
  snapshotDate: z.string(),
  /** Arquivos do repositório do app de onde cada número foi tirado. */
  sources: z.array(z.string()).min(1),
  howToUpdate: z.string(),
  /** Pontos por dia com treino válido na semana, sem teto de dias. */
  constancyPointsPerDay: z.number().positive(),
  /** Dias com treino válido para a semana contar como cumprida (sequência). */
  daysForFulfilledWeek: z.number().int().positive(),
  bonusPerWeek: z.number().positive(),
  bonusMax: z.number().positive(),
  recordPoints: z.number().positive(),
  /** Nulo = sem teto de recordes na semana. */
  recordsMax: z.number().positive().nullable(),
  volumeMax: z.number().positive(),
  volumeWindowWeeks: z.number().int().positive(),
  /** Tempo efetivo mínimo (sem pausas) para o treino ser válido. */
  minValidMinutes: z.number().int().positive(),
  /** Dias do início da temporada em que o pódio mostra o top 3 da temporada anterior. */
  podiumDays: z.number().int().positive(),
  /** Diferença de pontos que dispara o aviso "está chegando". */
  alertGap: z.number().int().positive(),
});

export type PlanCatalog = z.infer<typeof planCatalogSchema>;
export type PlanPrice = z.infer<typeof planPriceSchema>;
export type CompetitionRules = z.infer<typeof competitionRulesSchema>;
