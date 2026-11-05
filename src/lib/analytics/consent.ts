/**
 * Escolha da pessoa sobre cookies de rastreamento (LGPD). Guardada só no navegador; sem escolha,
 * nenhum rastreador carrega. Leitura e gravação protegidas: navegação privada pode bloquear o storage.
 */
export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "guf.consent.v1";

export function readConsent(storage: Pick<Storage, "getItem"> | null = safeStorage()): ConsentChoice | null {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice, storage: Pick<Storage, "setItem"> | null = safeStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, choice);
  } catch {
    // Sem storage, a escolha vale só nesta visita.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
