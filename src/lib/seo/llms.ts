/** Texto do /llms.txt (formato llmstxt.org): título, resumo, fatos e links. Puro. */
import type { CompetitionRules } from "../../content/schemas/app-data.ts";
import type { FaqItem } from "../../content/schemas/sections.ts";

export interface LlmsInput {
  name: string;
  summary: string;
  values: Readonly<Record<string, string | number>>;
  rules: CompetitionRules;
  faq: readonly FaqItem[];
  links: ReadonlyArray<{ label: string; url: string }>;
}

export function buildLlmsTxt(input: LlmsInput): string {
  const { values: v, rules: r } = input;
  const price = v["pro.price"] ? `${v["pro.price"]}${v["pro.priceSuffix"] ?? ""}` : "preço anunciado no lançamento";
  const facts = [
    "App de treino de musculação em português do Brasil. Funciona no navegador e instala no celular (iPhone pelo Safari, Android pelo Chrome), sem loja de aplicativos.",
    "Registro de séries com carga, repetições e tipo (normal, aquecimento, drop-set, falha); coluna Anterior com a série do último treino; atalhos de carga e repetições; cronômetro de descanso; o registro continua sem internet e é enviado quando a conexão volta.",
    "Recorde pessoal automático pelo 1RM estimado (fórmula de Epley); a primeira vez de um exercício e o aquecimento não contam.",
    "Gráficos de evolução por exercício (carga máxima, 1RM estimado, volume), calendário de treinos e sequência de semanas (domingo a sábado).",
    `Competição mensal entre pessoas que se seguem mutuamente. Pontos por semana: ${r.constancyPointsPerDay} por dia com treino válido (${r.minValidMinutes} min ou mais de tempo efetivo, 1 por dia), sequência de +${r.bonusPerWeek} por semana cumprida (${r.daysForFulfilledWeek} dias ou mais) até ${r.bonusMax}, ${r.recordPoints} por recorde ${r.recordsMax === null ? "sem limite" : `até ${r.recordsMax}`}, e volume até ${r.volumeMax} comparado à média das últimas ${r.volumeWindowWeeks} semanas.`,
    `GUF AI: assistente sobre os próprios treinos, explica a competição e importa ficha de treino em texto; não dá orientação médica. ${v["free.guf_ai_daily_messages"]} perguntas por dia no ${v["free.name"]} e ${v["pro.guf_ai_daily_messages"]} no ${v["pro.name"]}.`,
    `Planos: ${v["free.name"]} gratuito e sem prazo (treinos, recordes e evolução completos; até ${v["free.routines_per_project"]} rotinas no projeto Favoritos; competição do mês atual). ${v["pro.name"]}: ${price}, sem esses limites.`,
    "Privacidade: perfil começa privado; medidas corporais só a própria pessoa vê; exportar dados e excluir a conta pelo app. Cadastro para maiores de 18 anos.",
  ];

  return [
    `# ${input.name}`,
    "",
    `> ${input.summary}`,
    "",
    "## Fatos",
    "",
    ...facts.map((f) => `- ${f}`),
    "",
    "## Perguntas frequentes",
    "",
    ...input.faq.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]),
    "## Links",
    "",
    ...input.links.map((link) => `- [${link.label}](${link.url})`),
    "",
  ].join("\n");
}
