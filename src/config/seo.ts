/**
 * Padrões de SEO. A definição de entidade ("O guf é um app de treino que…") é a mesma na página,
 * nas meta tags, no JSON-LD e no llms.txt: os buscadores e assistentes de IA leem uma descrição só.
 *
 * Termos pesquisados (nov/2026) em buscas e listas de apps em português: "app de treino",
 * "treino academia", "anotar/registrar treino", "evolução de carga", "ficha de treino",
 * "competição/ranking com amigos".
 */
export const seo = {
  defaultTitle: "guf: app de treino de academia com ranking entre amigos",
  titleTemplate: "%s · guf",
  description:
    "Anote cargas e séries em segundos, veja a evolução de carga em gráficos e dispute o ranking mensal com amigos. App de treino grátis para iPhone e Android.",
  entityDefinition:
    "O guf é um app de treino de musculação que registra cargas e séries na academia, reconhece recordes sozinho, mostra a evolução de cada exercício e transforma a constância em pontos numa competição mensal entre amigos.",
  ogImage: { path: "/og.png", width: 1200, height: 630, alt: "guf: seu treino agora é uma competição." },
  logoPath: "/icon-512.png",
  themeColor: "#0B0D10",
} as const;
