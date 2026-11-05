/**
 * Marcação mínima dos textos do conteúdo, para destacar trechos sem HTML no JSON:
 *   **negrito**  → <strong>
 *   ==destaque== → cor de destaque da marca (volt)
 * Puro: devolve partes; quem desenha é o componente InlineText.
 */
export type InlinePart =
  { kind: "text"; value: string } | { kind: "strong"; value: string } | { kind: "accent"; value: string };

const MARK = /(\*\*[^*]+\*\*|==[^=]+==)/g;

export function parseInline(text: string): InlinePart[] {
  return text
    .split(MARK)
    .filter((chunk) => chunk.length > 0)
    .map((chunk): InlinePart => {
      if (chunk.startsWith("**") && chunk.endsWith("**")) return { kind: "strong", value: chunk.slice(2, -2) };
      if (chunk.startsWith("==") && chunk.endsWith("==")) return { kind: "accent", value: chunk.slice(2, -2) };
      return { kind: "text", value: chunk };
    });
}

/** Texto sem as marcas (para meta tags, JSON-LD, aria-label e llms.txt). */
export function plainText(text: string): string {
  return parseInline(text)
    .map((part) => part.value)
    .join("");
}
