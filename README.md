# brohde.com

Personal portfolio + writing site for Brian Rohde. Showcases client work and project deep dives to potential clients, plus thought-leadership articles on AI-assisted workflows.

## Stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- Hosted on Cloudflare (Pages)
- Private GitHub repo (for now)

## Local development

```
npm install       # once
npm run dev       # dev server at http://localhost:4321
npm run build     # astro check && astro build -> ./dist (static, for Cloudflare Pages)
npm run preview   # serve the production build locally
npm run format    # prettier (astro + tailwind plugins)
```

Deploy target: Cloudflare Pages. Build command `npm run build`, output directory `dist`.

**New to this repo? Read `docs/ENGINEERING.md` next.** It covers the full architecture (pages, layouts, the terminal controller, the theme token system, content collections), the content-layer staleness gotcha you will otherwise lose an afternoon to, the interaction model as actually decided and shipped, the content review workflow, deploy details (env vars, `_headers`, the chat production plan), and the binding engineering rules.

## Repo map

| Path                            | Purpose                                                                                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro.config.mjs`              | Astro config: static output, sitemap (excludes /chat, /styleguide), prefetch, Tailwind v4 vite plugin                                                                                                                                                    |
| `src/content.config.ts`         | Content collections: `articles` schema (title, description, date, draft, external)                                                                                                                                                                       |
| `src/content/articles/`         | One folder per article (`<slug>/index.md`)                                                                                                                                                                                                               |
| `src/pages/`                    | Routes: `/` (masthead + flow chat bar + ledger, #160), `/about`, `/chat` (top composer + newest-first transcript, #153), `/styleguide`, `/log/[...slug]`, `/404`, `/rss.xml`                                                                                                                              |
| `src/layouts/BaseLayout.astro`  | HTML shell: head, SEO, theme-color, font preloads, ClientRouter (fallback swap, #150), analytics, terminal mount                                                                                                                                                    |
| `src/components/`               | `SEO`, `Analytics` (PostHog), `SiteHeader` (global two-row header; the input row is /chat's composer, #153), `ChatBar` (the one input material + [send]), `HomeIntro` (masthead + identity, #160), `ArticleLog` (ledger), `SiteFooter`, `ThemeToggle`, `Scene` (facade), `HeroBand` (article hero, #97/#103)                                                                                                                       |
| `src/scripts/terminal.ts`       | Command router, roving cursor (#63), redirect countdown (#143), chat persistence (#144), header state bridge (#145/#153), scene state/theme bridge (#150)                                                                                                                                       |
| `src/scripts/scene/`            | The aurora + glyph tide scene (#106/#114/#120): lazy module behind the #70 facade (engine, placements, sources, live styles); facade in `Scene.astro` + `src/styles/scene.css`                                                                           |
| `src/styles/global.css`         | Tailwind import, design tokens (both grounds, #40), Circular @font-face (#20), base + View-Transition rules                                                                                                                                              |
| `src/styles/terminal.css`       | Component classes for option C (#67): masthead + editorial identity, the chat input material (scoped night tokens), ledger, the /chat transcript panel                                                                                                                                           |
| `src/assets/fonts/`             | LL Circular Pro woff2 subsets (Book/Medium/Bold, licensed #20), hashed into `/_astro/` at build                                                                                                                                                          |
| `src/lib/site.ts`               | Site constants: metadata, social links, company links, log helpers                                                                                                                                                                                       |
| `public/`                       | `_headers` (CSP + security), `_redirects`, `robots.txt`, favicons, `apple-touch-icon.png`, `media/` (case-study video), `og.png` (social card)                                                                                                           |
| `functions/api/chat.ts`         | Cloudflare Pages Function: production chat backend, POST `/api/chat`. Haiku router ported from `chat/` (behavior frozen, #61) + Turnstile + per-IP rate limiting (#49). `_chat-prompt.generated.ts` beside it is built from `chat/` (gitignored)         |
| `tools/build/build-chat-prompt.mjs` | Prebuild codegen (runs in `npm run build`): bundles `chat/system-prompt.md` + `facts.md` into the chat Function, single source of truth                                                                                                              |
| `tools/og/`                     | On-demand OG-card renderer (`node tools/og/render.mjs`, Chrome over CDP): writes `public/og.png`                                                                                                                                                          |
| `wrangler.toml`                 | Cloudflare Pages config-as-code: output dir + `nodejs_compat` for the chat Function (secrets/KV bindings stay in the dashboard)                                                                                                                          |
| `PLAN.md`                       | Original project brief from Brian                                                                                                                                                                                                                        |
| `CLAUDE.md`                     | Working agreement for Claude sessions, read first                                                                                                                                                                                                        |
| `docs/STATUS.md`                | **Current state + next steps**: the session-resume anchor                                                                                                                                                                                                |
| `docs/DECISIONS.md`             | Every decision made, with rationale                                                                                                                                                                                                                      |
| `docs/COMMS-LOG.md`             | Running log of Brian ↔ Claude communications and delegated sub-agent work                                                                                                                                                                                |
| `docs/ENGINEERING.md`           | **Build reference for engineers**: architecture, run/build/deploy, the interaction model as shipped, content workflow, binding engineering rules                                                                                                         |
| `docs/TEAM.md`                  | The studio roster (dynamic): expert roles and model policy                                                                                                                                                                                               |
| `docs/CONTENT.md`               | Article backlog and content pipeline                                                                                                                                                                                                                     |
| `docs/VOICE.md`                 | Brian's writing style guide, binding for all published copy                                                                                                                                                                                              |
| `docs/drafts/`                  | Article drafts with editorial meta (title options, open questions) awaiting review; approved bodies move to `src/content/articles/`                                                                                                                      |
| `docs/design/`                  | Design deliverables + the approved prototypes (`lab/build-log-v3.html`, `lab/aurora-terminal.html`)                                                                                                                                                      |
| `docs/reference/`               | Source material: resume PDF, prior-project conventions brief, chat feasibility research, the LLM-terminal build plan                                                                                                                                     |
| `chat/`                         | Production chat: the prompt, the facts pack, and the eval harness (formerly `poc/chat/`). The build bundles `chat/system-prompt.md` + `chat/facts.md` into the chat Function                                                                              |
| `.claude/agents/`               | Reusable sub-agent definitions for the studio experts                                                                                                                                                                                                    |

## Working model

This project is run like a design studio: Claude acts as studio lead/CEO, delegating to specialist sub-agents (design, engineering, copy, SEO/a11y) and logging all decisions and delegations so any session can resume from `docs/STATUS.md` at any point.
