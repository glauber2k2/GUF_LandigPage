import { z } from "astro/zod";
import { ICON_NAMES } from "../../lib/icons.ts";

/**
 * Schemas do conteúdo de cada seção da home. Um arquivo JSON por seção em src/content/sections/,
 * identificado pelo campo `type`. Textos aceitam **negrito** e ==destaque==; números do app entram
 * como {chave} (ver lib/text/template.ts) e nunca são escritos à mão.
 */
const text = z.string().min(1);
const icon = z.enum(ICON_NAMES);

/** Imagens de objetos (src/assets/images): o conteúdo escolhe pelo nome, o componente importa. */
export const OBJECT_IMAGES = ["dumbbell", "sneaker", "trophy", "tape", "plate"] as const;
const objectImage = z.enum(OBJECT_IMAGES);

/** Destino de um botão: rota do app (recebe UTM) ou âncora da própria página. */
export const ctaSchema = z.union([
  z.object({ label: text, appRoute: z.enum(["app", "signup", "login", "plans"]) }),
  z.object({ label: text, anchor: z.string().regex(/^#[a-z0-9-]+$/) }),
]);
export type Cta = z.infer<typeof ctaSchema>;

const anchor = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .optional();

/** Tela Início do app desenhada dentro do celular do hero (dados de exemplo, como num print). */
const homeScreenSchema = z.object({
  ariaLabel: text,
  greeting: text,
  date: text,
  avatarInitial: z.string().length(1),
  today: z.object({
    label: text,
    project: text,
    title: text,
    meta: text,
    average: text,
    tags: z.array(text).min(1),
    exercises: z.array(z.object({ name: text, sets: text })).min(1),
    more: text,
    start: text,
    swap: text,
  }),
  week: z.object({
    title: text,
    count: text,
    goalSuffix: text,
    /** Domingo a sábado, como no app. */
    days: z
      .array(
        z.object({
          letter: z.string().length(1),
          day: z.number().int().min(1).max(31),
          state: z.enum(["done", "today", "off"]),
        }),
      )
      .length(7),
  }),
  historyTitle: text,
  streak: z.object({
    value: text,
    unit: text,
    caption: text,
    badge: text,
    /** Últimas 12 semanas; a última é a atual. */
    pattern: z.array(z.boolean()).length(12),
    securedTitle: text,
    securedText: text,
  }),
  volume: z.object({
    title: text,
    periods: z.array(text).min(1),
    value: text,
    unit: text,
    delta: text,
    /** Altura de cada barra em %, de 5 em 5 (a última é a semana atual; vira classe, sem style inline por causa da CSP). */
    bars: z.array(z.number().int().min(5).max(100).multipleOf(5)).length(8),
  }),
  toast: z.object({ title: text, text }),
  nav: z.object({ home: text, compete: text, start: text, projects: text, profile: text }),
});

const heroSchema = z.object({
  type: z.literal("hero"),
  /** Duas linhas do título: a segunda aparece vazada. */
  title: z.tuple([text, text]),
  lead: text,
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  trust: z.array(text).min(1).max(4),
  imageAlt: text,
  screen: homeScreenSchema,
  chips: z.array(z.object({ icon, tone: z.enum(["pr", "ink", "data"]), title: text, text })).length(3),
});

const factsSchema = z.object({
  type: z.literal("facts"),
  eyebrow: text,
  items: z
    .array(z.object({ value: text, text }))
    .min(1)
    .max(4),
});

const featuresSchema = z.object({
  type: z.literal("features"),
  anchor,
  title: text,
  hint: text,
  prevLabel: text,
  nextLabel: text,
  ariaLabel: text,
  cards: z
    .array(
      z.object({
        tone: z.enum(["ink", "paper"]),
        eyebrow: text,
        title: text,
        text,
        image: objectImage.optional(),
        imageAlt: text.optional(),
        chat: z.array(z.object({ from: z.enum(["user", "assistant"]), text })).optional(),
      }),
    )
    .min(2),
  cta: ctaSchema,
});

const liteSchema = z.object({
  type: z.literal("lite"),
  anchor,
  badge: text,
  title: z.tuple([text, text]),
  lead: text,
  steps: z.array(z.object({ text, note: text.optional() })).min(1),
  cta: ctaSchema,
  perks: z.array(text).min(1),
  homeCaption: text,
  homeAriaLabel: text,
  storesLabel: text,
  stores: z.object({
    soon: text,
    googlePlay: z.object({ soonCaption: text, liveCaption: text, name: text }),
    appStore: z.object({ soonCaption: text, liveCaption: text, name: text }),
  }),
});

const stepsSchema = z.object({
  type: z.literal("steps"),
  anchor,
  title: text,
  highlight: text,
  items: z.array(z.object({ title: text, text })).length(3),
  cta: ctaSchema,
});

const plansSchema = z.object({
  type: z.literal("plans"),
  anchor,
  title: z.tuple([text, text]),
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
  secondaryCta: ctaSchema,
  socialLabel: text,
  instagramLabel: text,
  tiktokLabel: text,
  marquee: z.array(text).min(3),
});

export const sectionSchema = z.discriminatedUnion("type", [
  heroSchema,
  factsSchema,
  featuresSchema,
  liteSchema,
  stepsSchema,
  plansSchema,
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
  header: z.object({
    homeLabel: text,
    navLabel: text,
    links: z.array(z.object({ label: text, anchor: z.string().regex(/^#[a-z0-9-]+$/) })).max(4),
    signup: ctaSchema,
  }),
  footer: z.object({
    tagline: text,
    instagramLabel: text,
    tiktokLabel: text,
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
