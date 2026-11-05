/**
 * Leitura do catálogo de planos do app (snapshot de plans/plan_features/plan_prices).
 * O site nunca escreve um limite ou preço à mão: pergunta ao catálogo, como o app faz.
 */
import type { PlanCatalog, PlanPrice } from "../../content/schemas/app-data.ts";

/** Limite de uma funcionalidade: número, `null` = sem limite, `false` = não liberada no plano. */
export type FeatureLimit = number | null | false;

export function featureLimit(catalog: PlanCatalog, planCode: string, featureCode: string): FeatureLimit {
  const row = catalog.planFeatures.find((f) => f.plan_code === planCode && f.feature_code === featureCode);
  return row ? row.limit_value : false;
}

export function defaultPlan(catalog: PlanCatalog) {
  const plan = catalog.plans.find((p) => p.is_default);
  if (!plan) throw new Error("Catálogo sem plano padrão (is_default).");
  return plan;
}

/** O plano pago de menor rank à venda (hoje, o Pro). */
export function upgradePlan(catalog: PlanCatalog) {
  const plan = [...catalog.plans].filter((p) => p.is_purchasable).sort((a, b) => a.rank - b.rank)[0];
  if (!plan) throw new Error("Catálogo sem plano à venda (is_purchasable).");
  return plan;
}

/** Preço mensal à venda do plano; sem preço ativo, a venda está desligada no app. */
export function activePrice(catalog: PlanCatalog, planCode: string): PlanPrice | null {
  const prices = catalog.prices.filter((p) => p.plan_code === planCode);
  return prices.find((p) => p.billing_interval === "month") ?? prices[0] ?? null;
}

/** "R$ 14,80" — mesmo formato do app (`formatMoney` em packages/core/src/billing.ts). */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

const INTERVAL_SUFFIX: Record<PlanPrice["billing_interval"], string> = { month: "/mês", year: "/ano" };

export function formatIntervalSuffix(price: PlanPrice): string {
  return INTERVAL_SUFFIX[price.billing_interval];
}

/** "14.80" — valor para o JSON-LD (Offer.price). */
export function priceForSchema(price: PlanPrice): string {
  return (price.amount_cents / 100).toFixed(2);
}

/**
 * Valores que os textos dos planos podem usar como `{free.routines_per_project}`, `{pro.guf_ai_daily_messages}`,
 * `{pro.price}` etc. Limite sem teto vira "sem limite"; funcionalidade não liberada vira "não".
 */
export function planTemplateValues(catalog: PlanCatalog): Record<string, string> {
  const values: Record<string, string> = {};
  for (const plan of catalog.plans) {
    values[`${plan.code}.name`] = plan.name;
    for (const feature of catalog.features) {
      const limit = featureLimit(catalog, plan.code, feature.code);
      values[`${plan.code}.${feature.code}`] = limit === false ? "não" : limit === null ? "sem limite" : String(limit);
    }
    const price = activePrice(catalog, plan.code);
    if (price) {
      values[`${plan.code}.price`] = formatMoney(price.amount_cents, price.currency);
      values[`${plan.code}.priceSuffix`] = formatIntervalSuffix(price);
    }
  }
  return values;
}
