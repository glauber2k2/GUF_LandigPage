/**
 * Busca no Supabase do app o catálogo de planos (plans, features, plan_features) e os preços à venda
 * (plan_prices ativos), valida com Zod e grava o snapshot em src/content/plans/catalog.json.
 *
 * Usa só a chave PÚBLICA: o RLS do app libera leitura dessas tabelas para `anon`.
 * Se faltar variável ou a busca falhar, mantém o último snapshot versionado e avisa no log:
 * o build nunca quebra por causa disso.
 *
 * Os parâmetros da competição NÃO são buscados aqui: competition_parameters só é legível por usuário
 * logado. Eles ficam em src/content/competition/rules.json (ver o campo howToUpdate).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { z } from "astro/zod";
import {
  featureSchema,
  planCatalogSchema,
  planFeatureSchema,
  planPriceSchema,
  planSchema,
} from "../src/content/schemas/app-data.ts";

const SNAPSHOT_PATH = fileURLToPath(new URL("../src/content/plans/catalog.json", import.meta.url));
const TIMEOUT_MS = 10_000;

const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const baseUrl = env.SUPABASE_URL?.replace(/\/+$/, "");
const key = env.SUPABASE_PUBLISHABLE_KEY;

async function fetchTable<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: { apikey: key ?? "", Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return schema.parse(await response.json());
}

function warn(message: string): void {
  console.warn(`\n⚠️  [sync:data] ${message}\n    Usando o snapshot versionado em src/content/plans/catalog.json.\n`);
}

function readSnapshot() {
  try {
    return z.array(planCatalogSchema).parse(JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")))[0];
  } catch (error) {
    console.error(`[sync:data] Snapshot inválido: ${String(error)}`);
    return undefined;
  }
}

function snapshotIsValid(): boolean {
  return readSnapshot() !== undefined;
}

async function main(): Promise<void> {
  if (!baseUrl || !key) {
    warn("SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não definidos.");
    if (!snapshotIsValid()) process.exitCode = 1;
    return;
  }

  try {
    const [plans, features, planFeatures, prices] = await Promise.all([
      fetchTable("plans?select=code,name,rank,is_default,is_purchasable&order=rank", z.array(planSchema)),
      fetchTable("features?select=code,kind,description&order=code", z.array(featureSchema)),
      fetchTable(
        "plan_features?select=plan_code,feature_code,limit_value&order=plan_code,feature_code",
        z.array(planFeatureSchema),
      ),
      fetchTable(
        "plan_prices?select=plan_code,provider,billing_interval,amount_cents,currency&is_active=eq.true&order=plan_code",
        z.array(planPriceSchema),
      ),
    ]);

    const catalog = planCatalogSchema.parse({
      id: "current",
      syncedAt: new Date().toISOString(),
      source: "Supabase do app (plans, features, plan_features, plan_prices ativos) via chave pública",
      plans,
      features,
      planFeatures,
      prices,
    });

    // Só regrava quando os dados mudam: o snapshot versionado não ganha diff a cada build.
    const dataOf = (c: { plans: unknown; features: unknown; planFeatures: unknown; prices: unknown }) =>
      JSON.stringify([c.plans, c.features, c.planFeatures, c.prices]);
    const current = readSnapshot();
    if (current && dataOf(current) === dataOf(catalog)) {
      console.log("[sync:data] Catálogo do app sem mudanças desde o último snapshot.");
      return;
    }
    writeFileSync(SNAPSHOT_PATH, `${JSON.stringify([catalog], null, 2)}\n`);
    console.log(
      `[sync:data] Catálogo atualizado: ${plans.length} planos, ${planFeatures.length} limites, ${prices.length} preço(s) à venda.`,
    );
  } catch (error) {
    warn(`Falha ao buscar o catálogo: ${error instanceof Error ? error.message : String(error)}`);
    if (!snapshotIsValid()) process.exitCode = 1;
  }
}

await main();
