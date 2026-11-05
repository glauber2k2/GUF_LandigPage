/**
 * Contrato do rastreamento. A página só conhece `track(evento, dados)`; quem envia (Meta, GA, nenhum)
 * é decidido pela configuração (IDs nas variáveis de ambiente) e pelo consentimento da pessoa.
 */
export type AnalyticsEvent = "cta_click" | "page_view";

export type AnalyticsData = Readonly<Record<string, string | number | boolean>>;

export interface AnalyticsProvider {
  readonly name: string;
  /** Injeta o script do rastreador. Só é chamado depois do consentimento. */
  load(): Promise<void>;
  track(event: AnalyticsEvent, data: AnalyticsData): void;
}

export interface Analytics {
  track(event: AnalyticsEvent, data?: AnalyticsData): void;
  /** Carrega os provedores e envia o que ficou na fila. */
  start(): Promise<void>;
  readonly enabled: boolean;
}
