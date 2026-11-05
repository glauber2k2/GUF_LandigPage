/**
 * Textos do conteúdo podem citar números do app como `{bonusMax}` ou `{free.guf_ai_daily_messages}`.
 * Assim o número existe num lugar só (o snapshot do app) e o texto nunca diverge dele.
 * Chave desconhecida é erro de build: melhor quebrar do que publicar "{algo}" na página.
 */
export type TemplateValues = Readonly<Record<string, string | number>>;

const TOKEN = /\{([a-zA-Z0-9_.]+)\}/g;

/**
 * @param runtimeKeys chaves preenchidas depois, no navegador (ex.: `{bonus}` do simulador). Ficam
 *   intactas; qualquer outra chave desconhecida é erro.
 */
export function fillTemplate(text: string, values: TemplateValues, runtimeKeys: readonly string[] = []): string {
  return text.replace(TOKEN, (token, key: string) => {
    const value = values[key];
    if (value !== undefined) return typeof value === "number" ? formatNumber(value) : value;
    if (runtimeKeys.includes(key)) return token;
    throw new Error(`Texto usa {${key}}, que não existe nos dados do app: "${text}"`);
  });
}

/** Preenche todas as strings de um objeto de conteúdo (seções, FAQ), mantendo a forma e os tipos. */
export function fillDeep<T>(value: T, values: TemplateValues, runtimeKeys: readonly string[] = []): T {
  if (typeof value === "string") return fillTemplate(value, values, runtimeKeys) as T;
  if (Array.isArray(value)) return value.map((item) => fillDeep(item, values, runtimeKeys)) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fillDeep(item, values, runtimeKeys)]),
    ) as T;
  }
  return value;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}
