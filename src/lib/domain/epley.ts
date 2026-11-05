/**
 * 1RM estimado pela fórmula de Epley, igual ao app (packages/core/src/training.ts e banco):
 * carga × (1 + repetições / 30), arredondado a 1 casa.
 */
export function estimate1RM(loadKg: number, reps: number): number {
  if (loadKg <= 0 || reps <= 0) return 0;
  return Math.round(loadKg * (1 + reps / 30) * 10) / 10;
}

/** "101,3" — sempre com uma casa, como o app mostra o 1RM. */
export function formatKg(value: number): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** "+9,3" */
export function formatKgDelta(value: number): string {
  return `${value >= 0 ? "+" : "−"}${formatKg(Math.abs(value))}`;
}
