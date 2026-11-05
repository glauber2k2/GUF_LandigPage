import { MOVEMENT_GLYPH, movementOf, ranksOf } from "../../lib/domain/ranking";
import { prefersReducedMotion, whileVisible } from "../../lib/motion/reveal";

interface RankingConfig {
  order: string[];
  frames: Array<Record<string, number>>;
  toastFrame: number;
  rowStep: number;
}

const FRAME_MS = 2800;
const TWEEN_MS = 600;

/**
 * Anima o mockup do ranking: a cada quadro os pontos sobem (contagem), as linhas trocam de posição
 * (transform) e o aviso "te ultrapassou" aparece no quadro configurado. Só roda com o hero na tela;
 * com movimento reduzido, mostra o último quadro parado.
 */
export function initRanking(root: HTMLElement): void {
  const config = JSON.parse(root.dataset.ranking ?? "{}") as RankingConfig;
  if (config.frames.length === 0) return;

  const rows = new Map(
    config.order.map((id) => [id, root.querySelector<HTMLElement>(`[data-person="${id}"]`)] as const),
  );
  const toast = root.querySelector<HTMLElement>("[data-ranking-toast]");

  let frame = 0;
  let shown: Record<string, number> = { ...config.frames[0] };
  let timer: number | undefined;
  let tween: number | undefined;

  const place = (points: Record<string, number>, previous?: Record<string, number>) => {
    const ranks = ranksOf(points, config.order);
    const before = previous ? ranksOf(previous, config.order) : undefined;
    for (const [id, row] of rows) {
      if (!row) continue;
      const rank = ranks[id] ?? 1;
      row.style.transform = `translateY(${(rank - 1) * config.rowStep}px)`;
      const rankEl = row.querySelector("[data-rank]");
      const moveEl = row.querySelector<HTMLElement>("[data-move]");
      if (rankEl) rankEl.textContent = String(rank);
      if (moveEl) {
        const move = movementOf(before?.[id], rank);
        moveEl.textContent = MOVEMENT_GLYPH[move];
        moveEl.classList.toggle("text-success", move === "up");
        moveEl.classList.toggle("text-fg-muted", move !== "up");
      }
    }
  };

  const paintPoints = (points: Record<string, number>) => {
    for (const [id, row] of rows) {
      const el = row?.querySelector("[data-points]");
      if (el) el.textContent = String(points[id] ?? 0);
    }
  };

  const showToast = (visible: boolean) => {
    toast?.classList.toggle("opacity-0", !visible);
    toast?.classList.toggle("-translate-y-3", !visible);
  };

  const animateTo = (target: Record<string, number>) => {
    const from = { ...shown };
    const start = performance.now();
    if (tween) cancelAnimationFrame(tween);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / TWEEN_MS);
      const eased = 1 - (1 - t) ** 3;
      shown = Object.fromEntries(
        config.order.map((id) => [id, Math.round((from[id] ?? 0) + ((target[id] ?? 0) - (from[id] ?? 0)) * eased)]),
      );
      paintPoints(shown);
      if (t < 1) tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  };

  const next = () => {
    const previous = config.frames[frame] ?? {};
    frame = (frame + 1) % config.frames.length;
    const target = config.frames[frame] ?? {};
    showToast(frame === config.toastFrame);
    if (frame === 0) {
      shown = { ...target };
      paintPoints(shown);
      place(target);
      return;
    }
    place(target, previous);
    animateTo(target);
  };

  if (prefersReducedMotion()) {
    const last = config.frames[config.frames.length - 1] ?? {};
    paintPoints(last);
    place(last);
    return;
  }

  place(shown);
  whileVisible(root, {
    onEnter: () => {
      timer ??= window.setInterval(next, FRAME_MS);
    },
    onLeave: () => {
      window.clearInterval(timer);
      timer = undefined;
    },
  });
}
