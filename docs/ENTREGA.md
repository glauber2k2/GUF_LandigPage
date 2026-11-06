# Entrega da landing page do guf (2026-11-05)

## 1. Resultados

### Lighthouse (build de produção, `npm run lhci` e `npm run lhci:desktop`)

|                       | Performance  | Acessibilidade | Boas práticas | SEO | LCP   | TBT       | CLS |
| --------------------- | ------------ | -------------- | ------------- | --- | ----- | --------- | --- |
| Celular (3 execuções) | 99 · 99 · 99 | 100            | 100           | 100 | 1,1 s | 90–130 ms | 0   |
| Desktop               | 100          | 100            | 100           | 100 | 0,3 s | 0 ms      | 0   |

Meta do item 4: Perf ≥ 95, demais = 100, LCP < 2,0 s, CLS < 0,05, TBT < 150 ms. **Atendida.**
Medido localmente (Chromium do Playwright, rede simulada padrão). Repetir no PageSpeed Insights depois de publicar.

### Tamanho da home (gzip, `scripts/check-build.mjs`)

|                                                                            |                                                           |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| JavaScript (todos os módulos, incluindo o simulador carregado sob demanda) | **7,3 KB** (orçamento: 30 KB)                             |
| CSS                                                                        | 8,3 KB                                                    |
| HTML                                                                       | 20,4 KB                                                   |
| Fontes                                                                     | 3 arquivos woff2 locais (só o Barlow 700 é pré-carregado) |

### Testes

- **Vitest:** 41 testes (pontuação com exemplos calculados à mão, Epley, planos, UTM, analytics, consentimento, JSON-LD, llms.txt, FAQ com 40–60 palavras).
- **Playwright** (celular Pixel 7 e desktop 1440 px): carga sem erros de console e de CSP, CTAs com UTM/fbclid/gclid, FAQ, simulador, teclado, CTA fixo, 404 e axe WCAG 2.1 A/AA **sem violações**.
- **Consentimento** (build com IDs de teste): nenhuma requisição a terceiros antes do aceite nem após recusar; depois de aceitar, Meta e GA carregam sem violação de CSP.
- **Links:** 18 links internos verificados, nenhum quebrado. As rotas do app usadas pela página (`/cadastro/`, `/login/`, `/termos/`, `/privacidade/`, `/planos/`) responderam 200.

## 2. Matriz de afirmações (promessa da página → arquivo do app que a confirma)

Caminhos relativos a `guf_backend/`.

| Afirmação                                                                                    | Onde está no app                                                                                                                 |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Plano gratuito, sem prazo para acabar                                                        | `supabase/migrations/20261021200000_plans_and_entitlements.sql` (Free `is_default`); `docs/plans-and-access.md`                  |
| Funciona no celular sem loja; iPhone e Android                                               | `CLAUDE.md` (seção PWA); `packages/core/src/pwa.ts`; `docs/business-rules.md` §8.2 "Instalar"                                    |
| Passos de instalação (Safari › Compartilhar › Adicionar à Tela de Início; Chrome › Instalar) | `docs/business-rules.md` §8.2; `CLAUDE.md` ("No iPhone")                                                                         |
| Coluna "Anterior" com a série equivalente do último treino                                   | `docs/business-rules.md` §4.2 (`get_last_performance`)                                                                           |
| Atalhos de carga −1/+1/+5/+10 e repetições 6/8/10/12/15                                      | `docs/business-rules.md` §2 (`QuickLoad`, `QuickReps`)                                                                           |
| Tipos de série: normal, aquecimento, drop-set, falha                                         | `docs/business-rules.md` §4.2 (`workout-state.ts`)                                                                               |
| Cronômetro de descanso; pausar; tempo efetivo sem pausas                                     | `docs/business-rules.md` §4.3; `packages/ui/src/ds/workout.tsx`                                                                  |
| Registro continua sem internet; iniciar treino exige internet                                | `docs/business-rules.md` §4.5 e §4.1; `apps/web/src/shared/offline/outbox.ts`                                                    |
| Recorde automático pelo 1RM (Epley); mais repetições com a mesma carga contam                | `docs/business-rules.md` §5 (`estimate1RM`, `markRecordSets`)                                                                    |
| Primeira vez não conta; aquecimento nunca conta                                              | `docs/business-rules.md` §5                                                                                                      |
| 80 × 6 = 96,0 kg; 80 × 8 = 101,3 kg                                                          | Calculado por `src/lib/domain/epley.ts` (mesma fórmula e arredondamento); teste em `tests/unit/domain.test.ts`                   |
| Gráfico por exercício: carga máxima, 1RM, volume; 3 meses, 6 meses, 1 ano, tudo              | `docs/business-rules.md` §8.1 "Evolução"                                                                                         |
| Histórico: volume médio por dia treinado em 4 semanas, 3/6 meses, 1 ano; calendário          | `docs/business-rules.md` §8                                                                                                      |
| Sequência de semanas dom–sáb; 1 treino garante a semana; semana vazia zera                   | `docs/business-rules.md` §6 (`get_streak`)                                                                                       |
| "Semana garantida · X de Y treinos da sua meta"; faixa de 12 semanas                         | `docs/business-rules.md` §6 e §8                                                                                                 |
| Compete com quem você segue e te segue de volta                                              | `docs/business-rules.md` §8.3 "Competidores"                                                                                     |
| Temporada mensal; 3 meses, 6 meses, 1 ano, personalizado                                     | `docs/business-rules.md` §8.3 (`competitionRange`)                                                                               |
| Métricas Pontos, Volume, Treinos, Recordes; Duelo                                            | §8.3; `apps/web/src/app/(app)/competicao/duelo/`                                                                                 |
| "3 amizades" no mockup do ranking                                                            | `apps/web/src/features/competition/components/competition-ranking.tsx:89`                                                        |
| 15 pontos por dia com treino válido, sem limite de dias                                      | `supabase/migrations/20261023200000_competition_points_per_day.sql`                                                              |
| Sequência +5 por semana cumprida (≥ 3 dias), até 20, atravessa temporadas                    | `supabase/migrations/20261018171956_social_competition.sql`; fórmula em `competition_week_scores`                                |
| 3 pontos por recorde, sem limite                                                             | `supabase/migrations/20261029120000_competition_records_unlimited.sql`                                                           |
| Volume até 15, comparado à média das últimas 4 semanas                                       | `supabase/migrations/20261020012117_competition_scoring_without_rpe.sql`                                                         |
| Treino válido: ≥ 20 min de tempo efetivo, no máximo 1 por dia (o de maior volume)            | `20261018171956_social_competition.sql`; `docs/business-rules.md` §8.3 "Sessão válida"                                           |
| Simulador: soma constância + sequência + recordes + volume, arredondada                      | `competition_week_scores` (`20261023200000_competition_points_per_day.sql`); `src/lib/domain/points.ts` + testes                 |
| Pódio do campeão nos 3 primeiros dias da temporada                                           | `supabase/migrations/20261029130000_competition_season_podium.sql` (`v_champion_days := 3`)                                      |
| Avisos a menos de 20 pontos ou ao ultrapassar; desligado por padrão                          | `docs/business-rules.md` §8.3; `packages/core/src/competition.ts` (`COMPETITION_ALERT_GAP = 20`)                                 |
| GUF AI: treinos, cargas, descanso, evolução, rotinas; explica a competição e os pontos       | `docs/business-rules.md` §8.4                                                                                                    |
| GUF AI importa ficha; nada é criado sem revisão; sem orientação médica; não altera o app     | `docs/business-rules.md` §8.4 e "Importar ficha de treino"                                                                       |
| GUF AI: 3 perguntas por dia no Free, 40 no Pro                                               | `plan_features.guf_ai_daily_messages` (lido do Supabase no build)                                                                |
| Rotinas e projetos; séries, repetições alvo, descanso                                        | `docs/business-rules.md` §3                                                                                                      |
| Treino de hoje pelos dias da semana; descanso + próximo treino                               | `docs/business-rules.md` §3 (`todayPlan`)                                                                                        |
| Carga e repetições automáticas ao iniciar                                                    | `docs/business-rules.md` §4.1 "Séries planejadas ao iniciar"                                                                     |
| Ao finalizar, o app pergunta se a rotina deve virar o treino                                 | `docs/business-rules.md` §4.1 "Atualizar a rotina ao finalizar"                                                                  |
| Perfil começa privado; privado ou aberto                                                     | `docs/business-rules.md` §8.3 (`social_profiles`)                                                                                |
| Medidas só para você (fora de seguidores, competição e GUF AI)                               | `docs/business-rules.md` §8.6 e §1                                                                                               |
| Exportar dados e excluir a conta pelo app                                                    | `docs/business-rules.md` §8.2                                                                                                    |
| Free: Favoritos com até 5 rotinas; gráficos com mês atual e anterior; competição do mês      | `plan_features` (`routines_per_project` 5, `chart_months` 2, sem `competition_full_history`), lido no build                      |
| Treinos, calendário, resumos, recordes e evolução completos em qualquer plano                | `docs/business-rules.md` §8.5; `docs/plans-and-access.md`                                                                        |
| Pro sem esses limites                                                                        | `plan_features` do Pro (limites nulos, `competition_full_history`)                                                               |
| **Pro a R$ 14,80/mês**                                                                       | `plan_prices` ativo (Stripe, mensal, 1480 centavos), lido no build                                                               |
| Cancelar no app sem multa; devolução integral em até 7 dias; pagamento pelo Stripe           | `apps/web/src/features/plans/components/pro-upsell-screen.tsx` (`TRUST_LINES`); `docs/plans-and-access.md` (`withdrawal_window`) |
| 18 anos ou mais; aceite de Termos e Política no cadastro (caixas desmarcadas)                | `docs/business-rules.md` §1 (`signup-form.tsx`)                                                                                  |
| Login com e-mail e senha ou Google                                                           | `CLAUDE.md` ("Funcionalidades do MVP")                                                                                           |
| Cores, fontes, logo                                                                          | `packages/ui/styles/tokens/*.css`; `packages/ui/src/ds/brand-geometry.ts`; `CLAUDE.md` (fontes)                                  |
| Rotas do app usadas pelos CTAs e pelo rodapé                                                 | `apps/web/src/app/(auth)/cadastro`, `(auth)/login`, `termos`, `privacidade`, `(app)/planos` (todas respondem 200 em produção)    |

## 3. Divergências do protótipo corrigidas

| #   | Protótipo                                                                   | Correção                                                                                                                                                                 | Por quê                                                                      |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | Links para `app.gufapp.vercel.app`                                          | `https://gufapp.vercel.app` (variável `PUBLIC_APP_URL`)                                                                                                                  | O endereço do protótipo não existe; o do app está documentado e responde 200 |
| 2   | Pro: "A assinatura chega em breve no app"                                   | Mostra o preço real (R$ 14,80/mês) e as garantias que o app exibe, com o botão "Assinar pelo app"; se o preço for desativado no app, volta sozinho para "chega em breve" | O app já vende o Pro (`plan_prices` ativo)                                   |
| 3   | Rodapé sem Termos e Privacidade                                             | Links para `/termos/` e `/privacidade/` do app                                                                                                                           | Exigência da LGPD com rastreadores; as páginas existem no app                |
| 4   | Sem aviso de cookies                                                        | Aviso só quando há rastreador configurado; nada carrega antes do aceite                                                                                                  | Exigência do prompt e da LGPD                                                |
| 5   | Respostas do FAQ com 15–35 palavras                                         | 40–60 palavras, resposta direta na primeira frase, mesmos fatos                                                                                                          | Otimização para buscadores e assistentes de IA                               |
| 6   | Animação do ranking com `setInterval` contínuo                              | Roda só com o hero na tela e a aba visível                                                                                                                               | Desempenho e bateria                                                         |
| 7   | Animações de `top`, `width`, `background`, `stroke-dashoffset`              | Só `transform` e `opacity` (camadas e máscara)                                                                                                                           | Orçamento de desempenho                                                      |
| 8   | Estilos inline em tudo                                                      | Tokens + Tailwind; zero atributo `style` no HTML                                                                                                                         | CSP sem `unsafe-inline` e manutenção                                         |
| 9   | Texto cinza sobre linhas destacadas e cartão de descanso a 35% de opacidade | Texto secundário com mais contraste; cartão esmaecido por um véu                                                                                                         | Acessibilidade 100 (axe/Lighthouse)                                          |

Mantido sem mudança: "3 amizades" (é texto do app) e todos os demais números (conferidos).

## 4. Pendências que dependem de você

Nada disso aparece como texto provisório na página. São configurações ou decisões.

1. **Domínio e hospedagem:** definir `PUBLIC_SITE_URL` e fazer um novo build. Enquanto isso, canonical, OG, sitemap e robots apontam para `localhost` e o build avisa. Depois: DNS, HTTPS e checklist do README.
2. ~~Confirmar o preço do Pro~~ **Confirmado em 2026-11-06:** R$ 14,80/mês é o preço real. A página o lê de `plan_prices` a cada build; se mudar no app, a landing acompanha no próximo deploy.
3. **IDs de analytics (opcionais):** `PUBLIC_META_PIXEL_ID` e `PUBLIC_GA_ID`. Sem eles, nada é rastreado e o aviso de cookies não aparece.
4. **⚠️ Risco jurídico (LGPD):** a Política de Privacidade linkada é a do app. Antes de ligar o Pixel ou o GA, valide com o jurídico se ela cobre os cookies de medição da landing e o compartilhamento com Meta e Google. Talvez seja preciso uma seção nova ou uma política de cookies própria.
5. **Search Console:** código da verificação em `PUBLIC_GSC_VERIFICATION`. Também a verificação de domínio na Meta, se for usar o Pixel.
6. **Repositório remoto:** o projeto tem git local, com um commit por etapa. Crie o repositório no GitHub, faça o push e cadastre as Variables do CI (`PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).
7. **E-mail de contato:** não está na página. O app usa um e-mail pessoal (`PRIVACY_CONTACT_EMAIL`). Se quiser um e-mail no rodapé, defina um endereço do domínio.
8. **HSTS `preload`:** só manter no `public/_headers` se todos os subdomínios do domínio final forem HTTPS.
