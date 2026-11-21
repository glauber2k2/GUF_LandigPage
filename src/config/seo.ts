/**
 * Padrões de SEO. A definição de entidade ("O guf é um app de treino que…") é a mesma na página,
 * nas meta tags, no JSON-LD e no llms.txt: os buscadores e assistentes de IA leem uma descrição só.
 *
 * Termos pesquisados (nov/2026) em buscas e listas de apps em português: "app de treino",
 * "treino academia", "anotar/registrar treino", "evolução de carga", "ficha de treino",
 * "competição/ranking com amigos". Título: termo principal ("app de treino de musculação") no começo,
 * marca antes e a promessa do banner ("sem chutes") no fim; limites de 60/160 caracteres (tests/unit/seo.test.ts).
 * Detalhes, palavras-chave por intenção e checklist em docs/SEO.md.
 */
export const seo = {
  defaultTitle: "guf: app de treino de musculação para evoluir sem chutes",
  titleTemplate: "%s · guf",
  description:
    "Registre cargas e séries em segundos, bata recordes, veja a evolução de cada exercício e dispute o ranking com amigos. App de treino de academia grátis.",
  entityDefinition:
    "O guf é um app de treino de musculação que registra cargas, séries e cardio na academia, reconhece recordes sozinho, mostra a evolução de cada exercício e transforma a constância em pontos numa competição mensal entre amigos.",
  ogImage: {
    path: "/og.png",
    width: 1200,
    height: 630,
    alt: "guf: seu treino sem chutes. Feche a semana, mantenha a sequência e acompanhe cada carga.",
  },
  logoPath: "/icon-512.png",
  /** Outros nomes pelos quais a marca é buscada (JSON-LD alternateName). */
  alternateNames: ["guf app", "Guf App", "app guf"],
  /** Funções principais (JSON-LD featureList): o que a página e o llms.txt também dizem. */
  featureList: [
    "Registro de séries com carga, repetições e tipo, inclusive sem internet",
    "Recorde pessoal automático pelo 1RM estimado",
    "Gráficos de evolução por exercício",
    "Calendário de treinos e sequência de semanas",
    "Cardio com cronômetro, distância, pace e recordes",
    "Competição mensal com ranking entre amigos",
    "GUF AI: assistente sobre os próprios treinos e importação de ficha",
    "Medidas corporais com consentimento específico",
  ],
  themeColor: "#0B0D10",
} as const;
