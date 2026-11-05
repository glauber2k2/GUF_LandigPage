import { z } from "astro/zod";
import { ICON_NAMES } from "../../lib/icons.ts";

/**
 * Schemas do conteúdo de cada seção da home. Um arquivo JSON por seção em src/content/sections/,
 * identificado pelo campo `type`. Textos aceitam **negrito** e ==destaque==; números do app entram
 * como {chave} (ver lib/text/template.ts) e nunca são escritos à mão.
 */
const text = z.string().min(1);
const icon = z.enum(ICON_NAMES);

/** Destino de um botão: rota do app (recebe UTM) ou âncora da própria página. */
export const ctaSchema = z.union([
  z.object({ label: text, appRoute: z.enum(["signup", "login", "plans"]) }),
  z.object({ label: text, anchor: z.string().regex(/^#[a-z0-9-]+$/) }),
]);
export type Cta = z.infer<typeof ctaSchema>;

const heading = {
  eyebrow: text.optional(),
  title: text,
};

const anchor = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .optional();

const setColumns = z.object({ set: text, previous: text, load: text, reps: text });

const heroSchema = z.object({
  type: z.literal("hero"),
  badge: text,
  title: text,
  lead: text,
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  checks: z.array(text).min(1),
  ranking: z.object({
    ariaLabel: text,
    title: text,
    periodLabel: text,
    tabs: z.array(text).length(4),
    listTitle: text,
    countLabel: text,
    workoutsLabel: text,
    streakLabel: text,
    pointsLabel: text,
    people: z
      .array(
        z.object({
          id: z.string(),
          name: text,
          initial: z.string().length(1),
          workouts: z.number().int().nonnegative(),
          streakWeeks: z.number().int().nonnegative(),
          isMe: z.boolean().default(false),
        }),
      )
      .min(2),
    /** Pontos de cada pessoa em cada quadro da animação (o primeiro é o estado inicial). */
    frames: z.array(z.record(z.string(), z.number().int().nonnegative())).min(1),
    toast: z.object({ title: text, meta: text, frame: z.number().int().nonnegative() }),
  }),
});

const benefitsSchema = z.object({
  type: z.literal("benefits"),
  ariaLabel: text,
  items: z.array(z.object({ icon, tone: z.enum(["accent", "pr"]), title: text, text })).min(1),
});

const problemSchema = z.object({
  type: z.literal("problem"),
  title: text,
  items: z.array(text).min(1),
  closing: text,
});

const loggingSchema = z.object({
  type: z.literal("logging"),
  anchor,
  ...heading,
  bullets: z.array(text).min(1),
  offline: z.object({ title: text, text }),
  demo: z.object({
    ariaLabel: text,
    exercise: z.object({ initials: text, name: text, tags: z.array(text) }),
    columns: setColumns,
    sets: z
      .array(z.object({ set: z.number().int(), previous: text, load: z.number(), reps: z.number().int() }))
      .length(3),
    loadLabel: text,
    repsLabel: text,
    loadChips: z.array(text).min(1),
    repsChips: z.array(text).min(1),
    animation: z.object({
      loadChip: z.number().int().nonnegative(),
      repsChip: z.number().int().nonnegative(),
      load: z.number(),
      reps: z.number().int(),
    }),
    rest: z.object({ seconds: z.number().int().positive(), nextLabel: text, pauseLabel: text }),
  }),
});

const liftSchema = z.object({ load: z.number().positive(), reps: z.number().int().positive() });

const recordsSchema = z.object({
  type: z.literal("records"),
  ...heading,
  body: text,
  note: text,
  demo: z.object({
    ariaLabel: text,
    columns: setColumns,
    set: z.number().int(),
    badge: text,
    before: liftSchema,
    after: liftSchema,
    beforeLabel: text,
    afterLabel: text,
    caption: text,
    recordCaption: text,
    unit: text,
  }),
});

const evolutionSchema = z.object({
  type: z.literal("evolution"),
  ...heading,
  body: text,
  note: text,
  chart: z.object({
    title: text,
    unit: text,
    /** 1RM estimado no início do período (o fim é o recorde da seção anterior). */
    startValue: z.number().positive(),
    ariaLabel: text,
    periods: z.array(text).min(1),
    activePeriod: z.number().int().nonnegative(),
    /** Pontos do traço (x 0–320, y 0–150). */
    points: z.array(z.tuple([z.number(), z.number()])).min(2),
  }),
  streak: z.object({
    weeks: z.number().int().nonnegative(),
    word: text,
    caption: text,
    /** Últimas 12 semanas; a última é a atual. */
    pattern: z.array(z.boolean()).length(12),
    legend: text,
    securedTitle: text,
    securedText: text,
  }),
});

const competitionSchema = z.object({
  type: z.literal("competition"),
  anchor,
  ...heading,
  lead: text,
  cards: z.array(z.object({ icon, title: text, text })).min(1),
  scoring: z.object({
    title: text,
    items: z
      .array(
        z.object({
          value: text,
          tone: z.enum(["accent", "pr", "data"]),
          title: text,
          text,
        }),
      )
      .min(1),
    validNote: text,
  }),
  simulator: z.object({
    title: text,
    subtitle: text,
    daysLegend: text,
    recordsLabel: text,
    recordsDecrease: text,
    recordsIncrease: text,
    recordsMax: z.number().int().positive(),
    previousLabel: text,
    previousOptions: z.array(z.object({ value: z.number().int().nonnegative(), label: text, noteLabel: text })).min(1),
    volumeLabel: text,
    volumeOptions: z.array(z.object({ label: text, ratio: z.number().positive() })).min(1),
    breakdown: z.object({ constancy: text, streak: text, records: text, volume: text }),
    totalCaption: text,
    fulfilledNote: text,
    notFulfilledNote: text,
    defaults: z.object({
      days: z.number().int().min(1).max(7),
      records: z.number().int().nonnegative(),
      previous: z.number().int().nonnegative(),
      volumeOption: z.number().int().nonnegative(),
    }),
  }),
  podium: z.object({
    title: text,
    text,
    ariaLabel: text,
    places: z
      .array(
        z.object({
          place: z.number().int().min(1).max(3),
          name: text,
          initial: z.string().length(1),
          points: z.number().int().nonnegative(),
          isMe: z.boolean().default(false),
        }),
      )
      .length(3),
  }),
  alerts: z.object({ title: text, text, items: z.array(z.object({ title: text, text })).min(1) }),
  cta: ctaSchema,
});

const gufAiSchema = z.object({
  type: z.literal("gufai"),
  ...heading,
  bullets: z.array(text).min(1),
  note: text,
  chat: z.object({
    ariaLabel: text,
    title: text,
    messages: z
      .array(
        z.object({
          from: z.enum(["user", "assistant"]),
          text,
          card: z.object({ title: text, meta: text, action: text }).optional(),
        }),
      )
      .min(1),
  }),
});

const organizationSchema = z.object({
  type: z.literal("organization"),
  ...heading,
  items: z.array(z.object({ title: text, text })).min(1),
  today: z.object({
    ariaLabel: text,
    label: text,
    title: text,
    meta: text,
    days: z.array(z.object({ letter: text, state: z.enum(["off", "today", "planned"]) })).length(7),
    action: text,
  }),
});

const privacySchema = z.object({
  type: z.literal("privacy"),
  ...heading,
  cards: z.array(z.object({ icon, title: text, text })).min(1),
});

const plansSchema = z.object({
  type: z.literal("plans"),
  anchor,
  ...heading,
  lead: text,
  free: z.object({ tagline: text, features: z.array(text).min(1), cta: ctaSchema }),
  pro: z.object({
    tagline: text,
    features: z.array(text).min(1),
    /** Com preço ativo no app: link para assinar dentro do app e as garantias reais da assinatura. */
    cta: ctaSchema,
    guarantees: z.array(z.object({ icon, text })),
    /** Sem preço ativo no app (venda desligada). */
    unavailable: text,
  }),
});

const installSchema = z.object({
  type: z.literal("install"),
  ...heading,
  lead: text,
  platforms: z
    .array(
      z.object({
        title: text,
        browser: text,
        steps: z.array(z.object({ text, icon: icon.optional() })).min(1),
        note: text,
      }),
    )
    .min(1),
});

const faqSchema = z.object({
  type: z.literal("faq"),
  anchor,
  title: text,
});

const finalCtaSchema = z.object({
  type: z.literal("finalCta"),
  title: text,
  lead: text,
  cta: ctaSchema,
  instagramLabel: text,
});

export const sectionSchema = z.discriminatedUnion("type", [
  heroSchema,
  benefitsSchema,
  problemSchema,
  loggingSchema,
  recordsSchema,
  evolutionSchema,
  competitionSchema,
  gufAiSchema,
  organizationSchema,
  privacySchema,
  plansSchema,
  installSchema,
  faqSchema,
  finalCtaSchema,
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

/** Textos fixos da moldura (cabeçalho, rodapé, CTA fixo, aviso de cookies, 404). */
export const uiSchema = z.object({
  id: z.string(),
  skipLink: text,
  header: z.object({ homeLabel: text, navLabel: text, login: ctaSchema, signup: ctaSchema }),
  footer: z.object({
    tagline: text,
    instagramLabel: text,
    legalNavLabel: text,
    termsLabel: text,
    privacyLabel: text,
    copyright: text,
  }),
  sticky: z.object({ cta: ctaSchema }),
  consent: z.object({
    title: text,
    text,
    accept: text,
    reject: text,
    policyLabel: text,
  }),
  notFound: z.object({
    title: text,
    heading: text,
    text,
    homeLabel: text,
    faqLabel: text,
    signup: ctaSchema,
  }),
});

export const faqItemSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  question: text,
  /** Resposta direta na primeira frase; 40–60 palavras (otimização para respostas de buscadores e IA). */
  answer: text,
});

export type FaqItem = z.infer<typeof faqItemSchema>;
export type UiContent = z.infer<typeof uiSchema>;
