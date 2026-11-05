import { withTrackedParams } from "./params.ts";

/** Aplica os parâmetros de campanha da página atual a todos os links marcados com `data-app-link`. */
export function applyTrackedParamsToAppLinks(root: ParentNode = document, search = location.search): void {
  if (!search) return;
  root.querySelectorAll<HTMLAnchorElement>("a[data-app-link]").forEach((link) => {
    try {
      link.href = withTrackedParams(link.href, search);
    } catch {
      // Link inválido não deve quebrar os outros.
    }
  });
}
