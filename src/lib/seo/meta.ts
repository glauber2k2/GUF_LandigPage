/** Regras puras das meta tags: título pelo modelo, URL canônica absoluta e limites de tamanho. */
export function buildTitle(pageTitle: string | undefined, template: string, defaultTitle: string): string {
  return pageTitle ? template.replace("%s", pageTitle) : defaultTitle;
}

export function absoluteUrl(pathOrUrl: string, site: URL | string): string {
  return new URL(pathOrUrl, site).toString();
}

/** Canônica sem query string nem fragmento, com barra final (o build gera /pagina/index.html). */
export function canonicalUrl(pathname: string, site: URL | string): string {
  const clean = pathname.endsWith("/") || pathname.includes(".") ? pathname : `${pathname}/`;
  return new URL(clean, site).toString();
}

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
