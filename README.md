# Landing page do guf

Site oficial do **guf**, app de treino de musculação com competição entre amigos.
Site estático em **Astro + TypeScript (strict) + Tailwind CSS 4**, montado por conteúdo.
O app ([GUF_PWA](https://github.com/glauber2k2/GUF_PWA)) é a fonte da verdade para funcionalidades, números e identidade visual.

|                    |                                                                   |
| ------------------ | ----------------------------------------------------------------- |
| JS da home         | ~7 KB gzip (orçamento: 30 KB)                                     |
| Lighthouse celular | Performance 99 · Acessibilidade 100 · Boas práticas 100 · SEO 100 |
| Lighthouse desktop | 100 · 100 · 100 · 100                                             |

---

## 1. Como rodar

Requisitos: **Node 22.23 ou mais novo** (recomendado: 24) e npm.

```bash
npm install
cp .env.example .env      # preencha o que tiver (nada é obrigatório para rodar local)
npm run dev               # http://localhost:4321
```

| Comando                                 | O que faz                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                           | Servidor de desenvolvimento                                                      |
| `npm run build`                         | Sincroniza os planos com o app, gera `dist/` e confere orçamento e conteúdo      |
| `npm run preview`                       | Serve o `dist/` como em produção                                                 |
| `npm run check`                         | Tipos (`astro check`, TypeScript strict)                                         |
| `npm run lint` · `npm run format`       | ESLint e Prettier                                                                |
| `npm test`                              | Testes unitários (Vitest)                                                        |
| `npm run test:e2e`                      | Smoke test no navegador, celular e desktop, com axe (rode `npm run build` antes) |
| `npm run links`                         | Links quebrados no `dist/`                                                       |
| `npm run lhci` · `npm run lhci:desktop` | Lighthouse CI com o orçamento (falha se piorar)                                  |
| `npm run verify`                        | Tudo acima em sequência                                                          |

Na primeira vez dos testes de navegador: `npx playwright install chromium`.

---

## 2. Arquitetura

Conteúdo, apresentação e lógica ficam separados. A página é montada pelos dados, os componentes só desenham e as regras ficam em funções puras testadas.

```mermaid
flowchart LR
  APP[(Supabase do app<br/>plans · plan_features · plan_prices)] -- build: scripts/sync-app-data.ts --> SNAP[content/plans/catalog.json]
  RULES[content/competition/rules.json<br/>snapshot das regras] --> DOMAIN
  SNAP --> DOMAIN[lib/domain<br/>pontos · planos · Epley]
  JSON[content/sections/*.json<br/>content/faq · site/ui] --> DATA[lib/content/site-data.ts<br/>preenche {números}]
  DOMAIN --> DATA
  DATA --> PAGE[pages/index.astro<br/>ordem: content/pages/pages.json]
  PAGE --> SECTIONS[components/sections] --> UI[components/ui + mockups]
  DATA --> SEO[lib/seo → JSON-LD · llms.txt]
```

```
src/
  config/        site.ts (URLs, rotas do app, redes, analytics) · seo.ts (título, descrição, entidade)
  content/       sections/ (um JSON por seção) · pages/ (ordem das seções) · faq/ · site/ui.json
                 plans/catalog.json (snapshot sincronizado) · competition/rules.json (snapshot manual)
                 schemas/ (Zod de tudo) → registrados em src/content.config.ts
  styles/        tokens.css (tokens do app) · global.css (Tailwind + utilitário de entrada)
  components/    ui/ (primitivos sem produto) · mockups/ (telas do app em HTML/SVG)
                 sections/ (uma seção = um componente + registry.ts) · islands/ (simulador)
                 layout/ (cabeçalho, rodapé, CTA fixo, cookies) · seo/
  layouts/       BaseLayout.astro
  lib/           domain/ (regras puras) · seo/ (JSON-LD, meta, llms) · analytics/ (interface + provedores)
                 utm/ · motion/ (entrada e "só anima na tela") · text/ (marcas e {chaves}) · content/
  scripts/       comportamento no navegador (página, mockups, ilha)
  pages/         index.astro · 404.astro · robots.txt.ts · llms.txt.ts
public/          ícones, og.png, site.webmanifest, _headers
scripts/         sync-app-data.ts · check-build.mjs · generate-icons.mjs · lhci.mjs
tests/           unit/ (Vitest) · e2e/ (Playwright + axe)
```

**Decisões principais**

- **Nenhum número escrito à mão.** Limites, preço e pontuação entram nos textos como `{chave}` (ex.: `{bonusMax}`, `{free.guf_ai_daily_messages}`, `{pro.price}`). Chave inexistente quebra o build. Melhor quebrar do que publicar um número errado.
- **Ilha sem framework.** O simulador é TypeScript puro: a mesma função calcula no build (o HTML já vem pronto) e no navegador. O código só é baixado quando o simulador chega perto da tela. Não precisa de Preact nem de React.
- **Animações só com `transform` e `opacity`**, pausadas fora da tela e com a aba oculta. Com `prefers-reduced-motion`, tudo aparece no estado final.
- **Analytics atrás de uma interface** (`track(evento, dados)`). Sem ID, nenhum script de terceiros é carregado e o aviso de cookies não aparece. Com ID, os scripts só carregam depois do "Aceitar" e do `load`.
- **CSP** por `<meta>` com hashes gerados pelo Astro, mais o cabeçalho em `public/_headers` (`frame-ancestors`, HSTS etc.).

---

## 3. Como editar

Depois de qualquer edição: `npm run build` (e `npm test` se mexer em regra).

### Trocar um texto

Abra o JSON da seção em `src/content/sections/` (ex.: `hero.json`) e edite. Marcas aceitas:
`**negrito**`, `==destaque na cor da marca==` e `{chave}` para números do app.
Os textos do cabeçalho, rodapé, CTA fixo, aviso de cookies e 404 ficam em `src/content/site/ui.json`.
O schema (Zod) avisa no build se faltar campo ou o tipo estiver errado.

### Adicionar uma pergunta no FAQ

Em `src/content/faq/faq.json`, acrescente:

```json
{ "id": "nova-pergunta", "order": 10, "question": "…?", "answer": "Resposta direta na primeira frase…" }
```

A seção e o JSON-LD `FAQPage` usam a mesma lista. O teste exige respostas com 40 a 60 palavras e a resposta direta logo na primeira frase.

### Mudar a ordem das seções (ou tirar uma)

Edite a lista em `src/content/pages/pages.json`. Os nomes são os arquivos de `src/content/sections/`.

### Trocar links (app, redes, domínio)

- Domínio do app: variável `PUBLIC_APP_URL` (padrão `https://gufapp.vercel.app`). As rotas (`/cadastro/`, `/login/`…) ficam em `src/config/site.ts`.
- Instagram e outras redes: `src/config/site.ts` (`social` e `sameAs`, que alimenta o JSON-LD).
- Domínio da landing: `PUBLIC_SITE_URL`.

### Atualizar preço, limites ou pontuação

- **Preço e limites dos planos:** vêm sozinhos do app a cada build (`npm run sync:data`), com a chave pública. Sem acesso, o build usa o snapshot `src/content/plans/catalog.json` e avisa no log. Sem preço ativo no app, o card do Pro mostra "A assinatura chega em breve no app", como o próprio app faz.
- **Pontuação da competição:** a tabela `competition_parameters` só é lida por usuário logado, então ela fica em `src/content/competition/rules.json`. Quando uma migration do app mudar a pontuação, atualize os números, `snapshotDate` e `sources`, e rode `npm test`.
- Se o app mudar algo que um texto afirma sem número (ex.: "Gráficos com o mês atual e o anterior"), um teste em `tests/unit/domain.test.ts` falha e indica o JSON a revisar.

---

## 4. Como adicionar uma página de SEO (ex.: `/calculadora-1rm`, `/treinos/abc`, `/blog`)

1. **Conteúdo:** crie a coleção em `src/content.config.ts`, por exemplo:
   ```ts
   const guides = defineCollection({
     loader: glob({ base: "./src/content/guides", pattern: "*.md" }),
     schema: z.object({ title: z.string(), description: z.string().max(160), updated: z.coerce.date() }),
   });
   ```
   Depois coloque os arquivos em `src/content/guides/`.
2. **Rota:** crie `src/pages/treinos/[slug].astro` com `getStaticPaths()` lendo `getCollection("guides")`. Para uma página única, basta `src/pages/calculadora-1rm.astro`.
3. **Layout e SEO:** use `<BaseLayout seo={{ title, description }} jsonLd={[breadcrumbSchema([...])]}>`. Título, canonical, OG e Twitter saem prontos. O `breadcrumbSchema` já existe em `src/lib/seo/jsonld.ts`.
4. **Componentes:** reutilize `components/ui` (Section, Container, Heading, Button, Card) e, se precisar, os mockups.
5. **Regras:** calculadoras e afins vão em `src/lib/domain/` como funções puras, com teste em `tests/unit/` (ex.: a 1RM já existe em `lib/domain/epley.ts`). A interação é uma ilha como `components/islands/PointsSimulator.astro`.
6. **Divulgação:** o sitemap inclui a página sozinho. Acrescente o link em `src/pages/llms.txt.ts` e, se fizer sentido, na home.

---

## 5. Variáveis de ambiente

Veja `.env.example`. Tudo é público (vai para o HTML ou é chave publicável).

| Variável                                    | Para quê                                                                   | Padrão                                      |
| ------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| `PUBLIC_SITE_URL`                           | Domínio da landing (canonical, OG, sitemap, robots, JSON-LD)               | `http://localhost:4321`, com aviso no build |
| `PUBLIC_APP_URL`                            | Endereço do app (todos os CTAs)                                            | `https://gufapp.vercel.app`                 |
| `PUBLIC_META_PIXEL_ID`                      | Meta Pixel (após consentimento)                                            | desligado                                   |
| `PUBLIC_GA_ID`                              | Google Analytics 4 (após consentimento)                                    | desligado                                   |
| `PUBLIC_GSC_VERIFICATION`                   | Código da meta tag do Search Console                                       | sem tag                                     |
| `SUPABASE_URL` · `SUPABASE_PUBLISHABLE_KEY` | Sincronizar planos e preço no build (chave **publicável**, a mesma do app) | usa o snapshot                              |

No CI, cadastre-as como **Variables** do repositório (Settings › Secrets and variables › Actions).

---

## 6. Publicação

Configuração da hospedagem (Cloudflare Pages ou Netlify):

- **Build:** `npm run build` · **Saída:** `dist` · **Node:** 24
- As variáveis da seção 5 vão no painel da hospedagem.
- `public/_headers` funciona nas duas: cabeçalhos de segurança e cache imutável para `/_astro/*`.

### Checklist

- [ ] **Domínio:** definir `PUBLIC_SITE_URL` com o domínio final e fazer um novo build. O build avisa enquanto estiver em localhost.
- [ ] **DNS:** apontar o domínio (CNAME/registro pedido pela hospedagem) e ativar HTTPS.
- [ ] **Confirmar o HSTS** em `public/_headers` (`preload`) só depois que o domínio e todos os subdomínios estiverem em HTTPS.
- [ ] **Search Console:** adicionar a propriedade, preencher `PUBLIC_GSC_VERIFICATION`, publicar, verificar e enviar `https://<domínio>/sitemap-index.xml`.
- [ ] **Meta (domínio):** em Business Manager › Segurança da marca › Domínios, verificar o domínio (meta tag ou DNS) antes de usar o Pixel.
- [ ] **Analytics:** preencher `PUBLIC_META_PIXEL_ID` e/ou `PUBLIC_GA_ID`, conferir que o aviso de cookies aparece e que nada carrega antes do "Aceitar".
- [ ] **Teste rápido:** abrir no iPhone (Safari) e no Android (Chrome) e clicar nos CTAs (devem chegar ao app com os `utm_*`).
- [ ] **PageSpeed Insights:** testar `https://<domínio>/` no celular e no desktop (meta: 95+ em performance, 100 nos demais).
- [ ] **Rich Results Test** do Google: validar `SoftwareApplication` e `FAQPage`.
- [ ] Conferir `https://<domínio>/robots.txt` e `https://<domínio>/llms.txt`.
