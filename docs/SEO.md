# SEO do guf (gufapp.com.br)

Como a landing é encontrada por buscadores (Google, Bing) e por assistentes de IA (ChatGPT, Claude,
Perplexity, Gemini, Copilot), o que já está pronto no código e o que precisa ser feito nos painéis.
O app (`treino.gufapp.com.br`) tem as regras dele em `guf_backend/docs/seo.md`.

## 1. Mapa: quem faz o quê

| Domínio                        | Papel no SEO                                                                                           | Indexado?       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------- |
| `gufapp.com.br` (esta landing) | Página principal da marca: é ela que deve aparecer nas buscas                                          | Sim, inteira    |
| `treino.gufapp.com.br` (app)   | Ferramenta logada. Só cadastro, login e documentos legais são indexáveis; a área logada leva `noindex` | Em parte        |
| `admin.gufapp.com.br` (painel) | Interno                                                                                                | Não (`noindex`) |

Todo link de divulgação (Instagram, TikTok, bio, anúncios) aponta para `https://gufapp.com.br/`.

## 2. Público e palavras-chave

Público: quem treina musculação na academia, no Brasil, em português, e quer parar de anotar treino
no papel/notas e ver a evolução de carga. Intenções de busca que a página cobre:

| Intenção   | Termos                                                                         | Onde aparecem                         |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| Principal  | app de treino de musculação, app de treino de academia, app para anotar treino | título, H1/lead, descrição, JSON-LD   |
| Evolução   | evolução de carga, recorde pessoal, 1RM, gráfico de treino                     | seções Funções e FAQ, `featureList`   |
| Constância | sequência de treino, calendário de treino, frequência na academia              | banner OG, seções, FAQ                |
| Social     | competição com amigos, ranking de treino                                       | seções Competição e FAQ               |
| Cardio     | registrar cardio, esteira, pace                                                | lead do hero, `featureList`, llms.txt |
| Ficha      | ficha de treino, importar ficha, montar rotina                                 | seções e FAQ (GUF AI)                 |
| Marca      | guf, guf app, app guf                                                          | título, `alternateName`               |

Regra: só prometer o que o app faz (os números vêm do app no build, ver README § 3).

## 3. Títulos e descrições

Fonte única: `src/config/seo.ts` (testado em `tests/unit/seo.test.ts`).

- **Título da home** (56 caracteres, até 60): `guf: app de treino de musculação para evoluir sem chutes`
  marca primeiro, depois o termo principal, e no fim a promessa do banner ("sem chutes").
- **Páginas internas:** `%s · guf` (ex.: `Calculadora de 1RM · guf`).
- **Descrição** (152, até 160): `Registre cargas e séries em segundos, bata recordes, veja a evolução de cada exercício e dispute o ranking com amigos. App de treino de academia grátis.`
- **Definição de entidade** (`entityDefinition`): a mesma frase "O guf é um app de treino de
  musculação que…" vai na página, no JSON-LD e no `llms.txt`. Os assistentes de IA citam frases
  assim, autocontidas e factuais.

## 4. Banner de compartilhamento (Open Graph)

- Arquivo `public/og.png`, 1200 × 630 (proporção 1,91:1), "Seu treino sem chutes." + celular com a
  sequência de 12 semanas. Usado no WhatsApp, Instagram, Facebook, LinkedIn, X, Telegram e Discord, e
  como `image`/`screenshot` do JSON-LD.
- Meta tags em `src/components/seo/SEO.astro`: `og:*` (com largura, altura, tipo e `alt`) e
  `twitter:card = summary_large_image`.
- **Trocar o banner:** substituir `public/og.png` (1200 × 630, PNG, idealmente < 300 KB) e o
  `ogImage.alt` em `seo.ts`. As redes guardam a imagem em cache pela URL: depois de publicar, peça
  para elas lerem de novo (§ 8) ou renomeie o arquivo (ex.: `og-2027.png`) e atualize `ogImage.path`.

## 5. Indexação por buscadores

- **Canonical** absoluta com barra final (`lib/seo/meta.ts`).
- **Domínio:** `PUBLIC_SITE_URL`; sem a variável, o build usa `https://gufapp.com.br`
  (`astro.config.ts`). **Incidente de 2026-11-14:** a produção estava publicada com canonical, OG,
  sitemap e robots em `http://localhost:4321` (a variável não estava no build da Cloudflare). Corrigido
  com o domínio oficial como padrão, e o `postbuild` (`scripts/check-build.mjs`) agora **falha** se
  houver `http://localhost` no HTML.
- **Sitemap:** `@astrojs/sitemap` → `/sitemap-index.xml` (+ `sitemap-0.xml`), com `lastmod` = data
  do build; 404 fica de fora. Página nova entra sozinha.
- **robots.txt** (`src/pages/robots.txt.ts`): libera tudo e cita um a um os robôs de busca e de IA
  (`AI_AND_SEARCH_BOTS`): Googlebot, Bingbot, Applebot, DuckDuckBot, YandexBot, Google-Extended
  (Gemini), Applebot-Extended, GPTBot / OAI-SearchBot / ChatGPT-User (OpenAI), ClaudeBot /
  Claude-SearchBot / Claude-User (Anthropic), PerplexityBot / Perplexity-User, Meta-ExternalAgent e
  CCBot. Liberar o treino de modelos (GPTBot, Google-Extended, CCBot) é escolha da marca: aumenta a
  chance de o guf ser lembrado pelas IAs. Para não liberar, tirar o robô da lista e acrescentar
  `Disallow: /` para ele.
- **IndexNow** (Bing, Yandex, Seznam, Naver; o índice do Bing alimenta o ChatGPT Search e o
  Copilot): chave pública em `public/f7b3ba69c5ddc112cad0958c176af3fa.txt`. Depois de cada deploy:
  `npm run build && npm run indexnow` (envia as URLs do sitemap e o `llms.txt`). Alternativa sem
  script: Cloudflare › o domínio › Caching › Configuration › **Crawler Hints** ligado (a Cloudflare
  avisa o IndexNow sozinha).
- **Desempenho e acessibilidade** contam para o ranking: Lighthouse 99/100/100/100 (`npm run lhci`),
  JS da home ≤ 30 KB (o build falha acima).

## 6. Dados estruturados (JSON-LD)

Gerados por `src/lib/seo/jsonld.ts` a partir do conteúdo (`lib/content/structured-data.ts`), nunca
escritos à mão:

- `Organization` + `WebSite` (todas as páginas): nome, `alternateName` (guf app, Guf App, app guf),
  logo, descrição, redes (`sameAs`).
- `SoftwareApplication` (home): `HealthApplication` / `Fitness`, Web, iOS e Android, `featureList`,
  `screenshot`, `browserRequirements` e as ofertas (Free R$ 0 e o Pro com o preço real do app;
  escondido enquanto `site.launch.showProPrice` for `false`).
- `FAQPage` (home): as mesmas perguntas da seção FAQ, com respostas de 40 a 60 palavras (testado).
- `BreadcrumbList`: pronto para páginas internas.
- **Proibido:** `AggregateRating`/`Review` sem avaliações reais (o Google penaliza).

Conferir: https://search.google.com/test/rich-results e https://validator.schema.org.

## 7. Assistentes de IA (GEO)

- **`/llms.txt`** (formato llmstxt.org, `src/lib/seo/llms.ts`): resumo, fatos com os números do app
  (planos, competição, cardio, GUF AI, privacidade), FAQ e links. Anunciado no `<head>` por
  `<link rel="alternate" type="text/plain" href="/llms.txt">`. Função nova do app → um fato novo aqui.
- Conteúdo em HTML estático (Astro, sem depender de JavaScript): os robôs de IA não executam JS.
- Respostas do FAQ diretas, com a resposta na primeira frase; números exatos; a mesma definição de
  entidade em todo lugar.
- **Cloudflare › AI Crawl Control** (ou "Bots" › "Block AI bots"): deixar **desligado** o bloqueio de
  robôs de IA no domínio `gufapp.com.br`, senão a Cloudflare barra os robôs antes do `robots.txt`.
  O "robots.txt gerenciado" (Content Signals) pode ficar ligado: ele só acrescenta comentários e
  sinais ao arquivo.

## 8. Checklist dos painéis (fora do código)

- [ ] **Google Search Console:** propriedade de **domínio** `gufapp.com.br` (verificação por DNS na
      Cloudflare cobre `gufapp.com.br`, `www` e `treino`). Alternativa: `PUBLIC_GSC_VERIFICATION`
      com o código da meta tag. Enviar `https://gufapp.com.br/sitemap-index.xml` e pedir a indexação
      da home em "Inspeção de URL".
- [ ] **Bing Webmaster Tools:** importar do Search Console (um clique) e enviar o mesmo sitemap.
      Cobre Bing, DuckDuckGo, Yahoo, ChatGPT Search e Copilot.
- [ ] **Cloudflare:** Crawler Hints ligado; bloqueio de robôs de IA desligado; redirecionar
      `www.gufapp.com.br` → `https://gufapp.com.br` (hoje o `www` não responde), por regra de
      redirecionamento 301.
- [ ] **Prévia dos links:** depois de publicar o banner, conferir e forçar nova leitura em
      https://developers.facebook.com/tools/debug/ (Facebook, Instagram e WhatsApp) e
      https://www.linkedin.com/post-inspector/.
- [ ] **Perfil da marca:** usar o mesmo nome ("guf"), a mesma frase e o link `https://gufapp.com.br/`
      no Instagram, no TikTok e, quando existir, na ficha da Google Play (os buscadores ligam as
      contas pelo `sameAs`).
- [ ] **Lançamento:** `site.launch.appOpen = true` e `showProPrice` conforme a decisão (README § 3).

## 9. Próximos passos de conteúdo (onde está o maior ganho)

Uma página só concorre por poucos termos. Páginas novas, cada uma com o próprio título, descrição,
`BreadcrumbList` e link no `llms.txt` (passo a passo no README § 4):

1. `/calculadora-1rm/`: calculadora de 1RM (Epley, a mesma do app; `lib/domain/epley.ts` já existe).
   Termo muito buscado e que traz exatamente o público.
2. `/ficha-de-treino/`: modelos de ficha ABC / ABCD com botão "importar no guf".
3. `/app-para-anotar-treino/`: comparação papel × bloco de notas × guf.
4. `/competicao/`: como funcionam os pontos e o ranking.

## 10. Onde mexer

| O quê                                                            | Arquivo                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Título, descrição, entidade, banner, nomes alternativos, funções | `src/config/seo.ts`                                           |
| Meta tags (OG, Twitter, canonical, robots da página)             | `src/components/seo/SEO.astro`                                |
| JSON-LD                                                          | `src/lib/seo/jsonld.ts`, `src/lib/content/structured-data.ts` |
| robots.txt / robôs liberados                                     | `src/pages/robots.txt.ts`                                     |
| llms.txt                                                         | `src/lib/seo/llms.ts`, `src/pages/llms.txt.ts`                |
| Sitemap                                                          | `astro.config.ts` (`sitemap()`)                               |
| IndexNow                                                         | `scripts/indexnow.mjs`, `public/<chave>.txt`                  |
| Testes                                                           | `tests/unit/seo.test.ts`                                      |
