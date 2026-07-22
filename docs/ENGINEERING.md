# Engineering

The build reference for brohde.com: how the site is assembled, how to run and ship it, and where the load-bearing pieces live. It is written for an engineer opening this repo cold, and every path, command, port, and version below was checked against the source in this tree, not carried over from notes.

The site is a static Astro build hosted on Cloudflare Pages, with two Cloudflare Pages Functions (`/api/chat`, `/api/contact`) providing the only server-side surface. The distinctive part, an ASCII "glyph tide" background scene rendered on a canvas, has its own spec at [`reference/scene.md`](reference/scene.md); this document covers everything around it.

## Versions

From `package.json` (all ranges, pinned exactly in `package-lock.json`):

| Package | Range | Role |
| --- | --- | --- |
| `astro` | ^7.0.9 | Framework and static builder |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.2 | Styling, via the Tailwind v4 Vite plugin |
| `@astrojs/sitemap` | ^3.7.3 | Sitemap generation |
| `@anthropic-ai/sdk` | ^0.110.0 | Claude client, used in both Pages Functions and the local chat bridge |
| `@astrojs/check` + `typescript` | ^0.9.4 / ^5.7.3 | The typecheck gate in `npm run build` |
| `@cloudflare/workers-types` | ^5.x | Types for the Pages Functions |
| `prettier` (+ astro/tailwind plugins) | ^3.4.2 | Formatting |

No Node version is pinned (`package.json` has no `engines` field and there is no `.nvmrc`); a current Node LTS works. The build in this repo runs clean on the machine it was authored on.

## 1. Build pipeline

```json
"build": "node tools/build/build-chat-prompt.mjs && astro check && astro build"
```

Three stages run in order, and any one failing aborts the deploy.

### 1a. The prompt codegen seam (runs first, deliberately)

`tools/build/build-chat-prompt.mjs` runs before Astro touches anything. It exists to solve one problem: the chat Pages Function needs the system prompt and facts pack as a string it can `import`, but Cloudflare’s esbuild bundle for `functions/` has no reliable text/markdown loader, and hand-duplicating the prompt is banned (it is the single source of truth for what the chat says).

So the codegen reads the two canonical files in `chat/`:

- `chat/system-prompt.md`
- `chat/facts.md`

concatenates them exactly as the local bridge does (`SYSTEM = <system-prompt> + "\n\n# FACTS PACK\n\n" + <facts>`), and writes `functions/api/_chat-prompt.generated.ts` exporting a single `SYSTEM` string. That file is **gitignored** and regenerated on every build, locally and on Cloudflare. `functions/api/chat.ts` imports it; nothing else reads it. Edit the prompt or the facts in `chat/`, never in the generated file.

On a clean run the codegen logs `build-chat-prompt: wrote functions/api/_chat-prompt.generated.ts (9652 chars)`.

### 1b. `astro check` (the correctness gate)

`astro check` runs the TypeScript + Astro diagnostics pass across the whole project (43 files in this tree) and must report zero errors before the build proceeds. There is no separate CI workflow (`.github/` does not exist), so this gate is the entire pre-deploy correctness check. The current tree passes with 0 errors, 0 warnings, 0 hints.

### 1c. `astro build` (static output to `dist/`)

Static generation, no server adapter. `astro.config.mjs` sets:

- `site: "https://brohde.com"` and `trailingSlash: "ignore"`.
- `build.inlineStylesheets: "always"`: the site’s single stylesheet is inlined into every document’s `<head>` rather than shipped as a render-blocking request. This is the mechanism behind the critical-CSS half of the performance contract (section 10).
- `prefetch: { prefetchAll: true, defaultStrategy: "hover" }`: internal routes prefetch so `ClientRouter` swaps land instantly.
- the `@astrojs/sitemap` integration, whose `filter` excludes `/styleguide` and `/chat`, and whose `serialize` strips the trailing slash from every URL except the root so the sitemap agrees with the canonical tags emitted by `SEO.astro`.

A build produces 12 HTML pages plus `rss.xml`, `sitemap-index.xml`, and `sitemap-0.xml`, and copies the two Pages Functions through for Cloudflare to compile.

## 2. Directory map (post-reorg)

The repo was reorganized before going public: the former `poc/chat/` is now `chat/`, build tooling lives under `tools/`, the client controller was split into `src/scripts/terminal/` leaves, and the scene’s data tables were extracted into their own modules. Current shape:

```
astro.config.mjs         Astro config (static, sitemap, prefetch, Tailwind v4)
wrangler.toml            Cloudflare Pages config-as-code (vars + KV binding)
package.json             Scripts + deps; build chains codegen -> check -> build

chat/                    Source of truth for the chat model behavior (frozen, #61)
  system-prompt.md         The system prompt (read by the codegen + the bridge)
  facts.md                 The facts pack (the model's entire world)
  server.mjs               Local dev bridge: real Haiku over HTTP on 127.0.0.1:8787
  eval.mjs / eval-http.mjs   Behavior eval + HTTP parity harness
  index.html, make-review.mjs, transcript.md, verdicts-*.md, README.md

functions/api/           Cloudflare Pages Functions (the only server surface)
  chat.ts                  POST /api/chat  (the model call, hardened)
  contact.ts               POST /api/contact  (extract + send)
  _shared.ts               Non-routed helpers shared by both (leading _ = not a route)
  _chat-prompt.generated.ts   Codegen output (gitignored)

tools/
  build/build-chat-prompt.mjs   The prebuild codegen (section 1a)
  og/                      On-demand OG-card renderer (node tools/og/render.mjs)

src/
  pages/                   Routes (section 3)
  layouts/BaseLayout.astro   The one HTML shell
  components/              12 .astro components (section 5)
  scripts/
    terminal.ts            The client controller (command router, chat, bridges)
    terminal/{dom,typing,a11y}.ts   Extracted leaves
    scene/{index,palettes,placements,sources}.ts + live.css   The scene module
    theme.ts               The dark/light session model
  styles/                  global.css, terminal.css, scene.css
  content/articles/        One folder per article (<slug>/index.md)
  content.config.ts        The articles collection schema
  lib/                     site.ts, articles.ts, schema.ts (JSON-LD builders)
  assets/fonts/            LL Circular Pro woff2 subsets

public/                  _headers (CSP), _redirects, robots.txt, favicons, media, og.png
docs/                   STATUS / DECISIONS / COMMS-LOG / VOICE + reference/ + this file
```

## 3. Routes

Every page runs through `src/layouts/BaseLayout.astro` and passes its own `title`/`description`/`ogType`/`noindex`/`jsonLd` as props.

| Route | File | Notes |
| --- | --- | --- |
| `/` | `pages/index.astro` | Home: `HomeIntro`, the flow `ChatBar`, the `ArticleLog` ledger, and the ambient `Scene`. JSON-LD `Person` + `WebSite`; `ogType="profile"`. |
| `/about` | `pages/about.astro` | Prose bio. JSON-LD `ProfilePage`. |
| `/chat` | `pages/chat.astro` | The live chat surface, rendered through `ChatPanel`. `noindex`, excluded from the sitemap. |
| `/contact` | `pages/contact.astro` | The same `ChatPanel` object as `/chat`, with `arm` set so the in-page contact flow opens on load. `noindex`. |
| `/credits` | `pages/credits.astro` | Colophon: the Android robot CC BY 3.0 attribution and the LL Circular type credit, linked from the footer. |
| `/styleguide` | `pages/styleguide.astro` | Token + component specimen forcing both grounds side by side. `noindex`, excluded from the sitemap. |
| `/<slug>` | `pages/[slug].astro` | One page per article, at a **bare root slug** (no `/log/` prefix, decision #179). See below. |
| `/404` | `pages/404.astro` | `noindex`. |
| `/rss.xml` | `pages/rss.xml.ts` | Hand-built RSS (`GET`). Published, non-draft entries only. |
| `/log/*` | `public/_redirects` | `301` to the bare slug (`/log/:splat -> /:splat`), preserving old shared URLs. |

**Article routing (`[slug].astro`).** `getStaticPaths` builds from `articleChain()` (internal, non-draft articles in ledger order). A `RESERVED` set (`about`, `chat`, `contact`, `credits`, `styleguide`, `404`, `index`, `rss.xml`, `api`, `log`) is checked against every article id, and a collision throws at build time rather than silently winning or losing the route race. Unpublished internal articles still generate a page: a "coming soon" stub that wears the article’s full scene identity (so the scene’s cross-page travel is live end to end) but renders no body prose, ships no JSON-LD, and is `noindex`. A stub does surface any figure blocks from its Markdown body so image assets can publish ahead of the text. External entries generate no page at all.

## 4. Content collection

`src/content.config.ts` defines one collection, `articles`, via Astro’s `glob` loader over `src/content/articles/**/index.md`, with the folder name as the id (and, since #179, the URL slug). Schema (Zod):

| Field | Type | Effect |
| --- | --- | --- |
| `title` | string | Required. |
| `description` | string? | Optional; used in meta, the article lede, and RSS. |
| `date` | coerced Date | The displayed pre-date (decision #3). |
| `sortDate` | coerced Date? | Ledger-sort override, independent of the displayed `date`. |
| `draft` | boolean (false) | Hides the entry from every reader surface at once (ledger, page, RSS). |
| `published` | boolean (false) | Gates the real page, the RSS item, and chat links. Unpublished entries still list on the homepage as a "coming soon" row and generate a stub page. |
| `external` | URL string? | Off-site canonical: the ledger links out, no page is generated, RSS uses the external URL. |
| `theme` | enum (default) | Per-article scene identity (sky palette + tide peak + mark); see `reference/scene.md`. |
| `stats` | array? | Up to four headline `{ n, label }` figures for the article’s stat band. |

Ledger order lives in one place, `src/lib/articles.ts` (`orderedArticles`, `byLedgerDesc`, `articleChain`, `neighborsOf`), so `ArticleLog.astro`, `rss.xml.ts`, and the prev/next chain in `[slug].astro` can never disagree about which entry sits above which. Sort key is `(sortDate ?? date)` descending; the displayed date is always `date`.

## 5. Components

All under `src/components/`. Every one is theme-agnostic: it reads semantic CSS tokens, never a literal light/dark branch.

- **`SEO.astro`**: title, description, canonical (trailing slash normalized), Open Graph, Twitter card, robots meta, and one `<script type="application/ld+json">` per passed JSON-LD block. The JSON-LD objects are built in `src/lib/schema.ts` (key order is load-bearing; the serialized output is kept byte-stable).
- **`Analytics.astro`**: PostHog, inline, shipped only when `PUBLIC_POSTHOG_KEY` is set (a clean no-op otherwise). It disables PostHog’s automatic pageview capture and fires exactly one `$pageview` per `astro:page-load`, to avoid the double-count `ClientRouter` navigations otherwise cause.
- **`SiteHeader.astro`**: the one header on every page, rendered by `BaseLayout` and marked `transition:persist` so the node itself survives navigations. Row 1 is identity (the lowercase "brian rohde" wordmark linking home, carrying the resting caret, plus quiet `about`/`contact` tokens and the theme toggle); row 2 is a `ChatBar`. Per-page state (`data-hchat`, `data-screen`, the wordmark tag) is server-stamped and re-stamped before paint by `terminal.ts` on every swap.
- **`ChatBar.astro`**: one input material, three placements (header jump-to-chat affordance, homepage flow bar, and the docked `/chat` composer). A `<textarea>` that auto-grows to a cap; Enter sends, Shift+Enter inserts a newline; `maxlength="2000"` (the larger of the two endpoint caps). The `<form>` carries `data-screen-form`, which `terminal.ts`’s one delegated submit handler routes.
- **`ChatPanel.astro`**: the shared `/chat` and `/contact` surface (the golden-hour `Scene`, the `.screen` section, the docked composer, the transcript log, and the `[clear]` keybar). `/contact` passes `arm` to stamp `data-contact-arm`, which opens the contact flow on load.
- **`HomeIntro.astro`**: the homepage identity block (role line, profile icons, founder + prior-companies credits). Company credits link to case-study pages only when that article’s `published` flag is true, so the homepage never links to a 404.
- **`ArticleLog.astro`**: the ledger. Newest first, date + title. Published internal entries link to the bare slug; unpublished ones link to their "coming soon" stub with a quiet `[coming soon]` token; external entries link off-site with a destination-domain marker.
- **`ArticleNav.astro`**: prev/next between adjacent article pages, fed by `neighborsOf`. Full destination titles, a slot per direction (no disabled controls at the ends).
- **`ProfileLinks.astro`**: LinkedIn + X as monochrome inline-SVG icons (path data single-sourced here). No brand color; `currentColor` drives the marks so they invert cleanly on both grounds.
- **`SiteFooter.astro`**: the single `contentinfo`, a copyright line plus a `credits` link.
- **`ThemeToggle.astro`**: the header sun/moon icon control (`#themectl`). Both icons ship; CSS keyed on `html[data-theme]` shows exactly one, and the accessible name (two `sr` spans, same key) always describes the current action. All behavior lives in `theme.ts`.
- **`Scene.astro`**: the static facade for the background scene (a CSS gradient sky plus the text "pour"), `position: fixed`, `aria-hidden`, `transition:persist`. The live canvas lazy-loads over it. Full spec: `reference/scene.md`.

## 6. Client script architecture

`BaseLayout` mounts exactly two deferred modules at the end of `<body>`:

```html
<script>
  import "@/scripts/terminal.ts";
  import "@/scripts/theme.ts";
</script>
```

Both are `type=module` (implicitly deferred) and do no network work and nothing that blocks paint. Everything heavier (the scene) is lazy-imported from inside `terminal.ts`, never added as another tag here.

### `src/scripts/terminal.ts` (the client controller)

One module, wired once behind a `window.__terminalInit` guard, drives every interactive behavior. Its listeners are all delegated on `document` and attached exactly once; per-page setup runs from `astro:page-load` (which fires on the initial load and after every client-side navigation), so nothing is bound to a node that a `ClientRouter` swap will replace. It owns:

- **The command router** (`run`): `work`, `home`/`exit`, `about`, `clear`, `chat`, `hello`/`hi`/`hey`, `help`, and `contact` are deterministic (with `/`-prefixed aliases); anything else is a free-form question routed to the live chat.
- **The live chat** (`askLive`): posts to the chat endpoint, renders the model’s prose (allowlisted internal Markdown links only, built as text nodes, never `innerHTML`), and handles an `open_page` tool result. Model-chosen navigation to another page runs a cancellable countdown (Escape, a visible "stay" control, or starting to type all cancel it); explicit "open X" asks skip it.
- **The chat transcript**: newest-turn-first, persisted per tab in `sessionStorage` so a refresh restores the thread, and dropped when the visitor leaves the chat surface.
- **The in-chat contact flow**: a deterministic state machine (message, name, email, explicit confirm, send) assisted by the `/api/contact` extraction call, with humanized typing emulation on entry.
- **The single-cursor keyboard model** (roving tabindex over links and command buttons), the two-step Escape behavior, and article-page left/right arrow prev/next.
- **The two page-transition bridges**: `syncHeaderChat` re-stamps the persisted header per page before paint, and `syncSceneState` travels the persistent scene’s identity and fires its surge on navigation (see `reference/scene.md`).

Three self-contained leaves are split out under `src/scripts/terminal/`, imported by the controller and nothing else:

- **`dom.ts`**: the chat-log DOM core (element lookup, `currentScreen()`, the turn sink, the newest-turn scroll, and the two pieces of turn state exposed through accessors).
- **`typing.ts`**: `prefersReducedMotion()`, the composer auto-grow fallback, and the humanized keystroke emulation.
- **`a11y.ts`**: the polite live-region announcer, the transient hint line, and the roving cursor (`ROVE_SELECTOR`, `setRoveStop`, `moveRove`).

### `src/scripts/theme.ts` (the session theme model)

The site **always loads dark**. There is no persistence. A pre-paint inline gate in `BaseLayout` stamps an explicit `html[data-theme="dark"]` before first paint (and clears any legacy `localStorage` `theme` key), and `global.css`’s `:root[data-theme]` blocks make that attribute beat `prefers-color-scheme` in both directions, so a system-light visitor still opens dark with no flash. The header toggle flips an in-memory `sessionLight` variable for the visit only; a full reload re-evaluates the module and returns to dark. Because a `ClientRouter` swap replaces the root element’s attributes with the incoming page’s server HTML (which carries no `data-theme`), the module re-stamps the resolved theme on `astro:after-swap`, keeping the in-visit choice across client-side navigations while a hard reload resets it. `data-theme` recolors the editorial surfaces only; the chat slab and the scene keep their own fixed night materials, and the scene follows `data-theme` on its own.

### The scene module (`src/scripts/scene/`)

The ASCII glyph-tide background. Lazy-imported from `terminal.ts`’s idle hook so it costs zero bytes on the pre-paint path, it renders a drifting canvas behind the reading column and a per-page "mark" (a letterform or logo). It is the one genuinely novel system in the codebase and has a dedicated spec at [`reference/scene.md`](reference/scene.md); read that before touching `scene/index.ts`.

## 7. The API surface (`functions/api/`)

Two Cloudflare Pages Functions, same-origin with the site. Files under `functions/` whose name starts with `_` are **not routed**, which is why `_shared.ts` and `_chat-prompt.generated.ts` are importable by their siblings without getting their own `/api/*` route.

### `POST /api/chat` (`chat.ts`)

A faithful port of the validated local bridge (`chat/server.mjs`), whose behavior is frozen (38/38 eval, decision #61). One Claude `claude-haiku-4-5` call acts as router and answerer, with a strict `open_page` tool (enum-constrained slugs) for model-chosen navigation. Request: `{ message (1-500 chars), history (last 8 turns), turnstileToken? }`. Response: `{ text, open_page }`, plus `{ usage, cost }` only when `CHAT_DEBUG` is set (never to visitors). A deterministic post-filter strips any dash the model slips past the prompt, since the dash ban (decision #18) is absolute.

### `POST /api/contact` (`contact.ts`)

Two operations on one endpoint, chosen by `op`:

- `op: "extract"` `{ text }` -> `{ name, email, message }`: a small Haiku call pulls the three fields out of one free-form blob so the client can skip asks it already has.
- `op: "send"` `{ name, email, message }` -> `{ ok: true }`: revalidates, writes a best-effort KV backup, then delivers to Brian via the Resend REST API from a `send.brohde.com` sender.

This file never touches `chat.ts`: the frozen chat contract is untouched. What the two share is only the pattern, factored into `_shared.ts`.

### `_shared.ts` (the shared machinery)

Helpers lifted verbatim from where both endpoints had duplicated them (audit `handoffs/audit-server.md`, proposal 1), parameterized only for the two deliberate per-endpoint differences (rate-limit tunables + KV key prefix, and a unified `retryAfterFor`):

- `makeAnthropic(env)`: constructs the SDK client, sending `baseURL` only when `ANTHROPIC_BASE_URL` is set and the `cf-aig-authorization` header only for an authenticated AI Gateway.
- `readValidatedBody`: rejects non-JSON (`415`) and bodies over 16 KB (`413`) before parsing.
- `rateLimit`: a two-gate per-IP limiter, a synchronous in-isolate counter (always on) plus a durable KV gate when `CHAT_RL` is bound; the tighter of the two wins. Chat uses `rl:` at 10/min + 60/day, contact uses `crl:` at 15/min + 40/day.
- `json`, `clientIp`, `normalizeBaseUrl`.

### Hardening posture

The endpoints implement the fixes tracked in `docs/reference/chat-security-audit.md` and `docs/reference/handoffs/chat-hardening.md`, and the code is annotated inline with the audit ids (H1 gateway wiring, H2 request-size + history caps, L2 usage/cost gated behind `CHAT_DEBUG`, L3 `no-store` on every API response, M1/M2 the rate-limit races and history validation). The authoritative cost ceiling is not the in-code rate limit; it is the Cloudflare AI Gateway hard spend cap in front of the Anthropic API (see section 8). Turnstile is wired but dormant: when `TURNSTILE_SECRET` is set, requests must carry a valid token; when unset, verification is skipped so dev and the current client keep working.

## 8. Deploy (Cloudflare Pages)

Build command `npm run build`, output directory `dist`. Static output; the two Pages Functions are compiled from `functions/` by Cloudflare.

**`wrangler.toml`** (config-as-code, secrets excluded):

```toml
name = "brohde-com"
pages_build_output_dir = "dist"
compatibility_date = "2025-05-01"
compatibility_flags = ["nodejs_compat"]   # any node: builtin the SDK reaches for

[vars]
ANTHROPIC_BASE_URL = "https://gateway.ai.cloudflare.com/v1/<account>/brohde-chat/anthropic"

[[kv_namespaces]]
binding = "CHAT_RL"      # per-IP rate-limit + contact-backup store
id = "<namespace id>"
```

**AI Gateway + spend cap.** `ANTHROPIC_BASE_URL` points the SDK at a Cloudflare AI Gateway endpoint (a pure-config wire-up; `_shared.ts` normalizes the URL, and the SDK appends `/v1/messages`). The gateway is authenticated (an `ANTHROPIC_GATEWAY_TOKEN` Pages secret is sent as the `cf-aig-authorization` header) and carries a hard monthly spend cap plus analytics and logging. This is the real cost ceiling: the in-code per-IP limiter sheds obvious floods cheaply, but the gateway cap is what bounds spend under a concurrent cross-PoP burst that the KV gate’s edge-cached reads would miss.

**Secrets** (set in the Cloudflare dashboard, never in `wrangler.toml` or the repo):

- `ANTHROPIC_API_KEY`: the Claude key, used by both Functions.
- `ANTHROPIC_GATEWAY_TOKEN`: the authenticated-gateway token.
- `RESEND_API_KEY`: contact delivery; unset locally, so a send degrades to a friendly "delivery unavailable" line.
- `TURNSTILE_SECRET`: reserved; enables the bot check once set.

If a key is missing the endpoint degrades gracefully (`503` with a friendly body) rather than crashing, so a half-configured project still serves the site.

**`public/_headers`** ships the security headers as Cloudflare Pages’ native mechanism (no Worker needed for this part): HSTS (2-year, `includeSubDomains`, `preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a `Permissions-Policy`, an immutable long-cache rule for hashed `/_astro/*` assets (JS chunks only, since the stylesheet is inlined), and a Content-Security-Policy. The CSP is narrow (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`) with deliberate carve-outs: `'unsafe-inline'` on `script-src`/`style-src` for the inline boot/theme gates, the JSON-LD blocks, and the PostHog snippet; PostHog’s hosts on `script-src`/`connect-src`; and `challenges.cloudflare.com` in `script-src` and `frame-src` for the Turnstile widget. Any change that adds a new inline script or third-party host must update this file in the same change, or it is silently blocked in production only (the dev server enforces no CSP).

## 9. Local development

```sh
npm install          # once
npm run dev          # astro dev, http://localhost:4321
npm run build        # codegen -> astro check -> astro build -> ./dist
npm run preview      # serve the built ./dist locally
npm run check        # astro check alone (typecheck + Astro diagnostics)
npm run format       # prettier --write .
npm run format:check
```

**Chat in local dev.** The client (`terminal.ts`) chooses its endpoint by hostname: on `localhost`/`127.0.0.1` it posts to the local bridge at `http://localhost:8787/chat`; anywhere else it posts to the same-origin `/api/chat`. The bridge is `chat/server.mjs`:

```sh
cd chat
npm install
npm start            # real Haiku 4.5, http://localhost:8787 (loopback only)
```

The key comes from `chat/.env` (gitignored) as `ANTHROPIC_API_KEY=sk-ant-...`. The bridge binds to `127.0.0.1` only (it holds a real key), speaks the same request/response shape as the production Function, and prints each reply’s real token usage and cost. It is never deployed.

To exercise the **real** Pages Functions locally (parity testing, or the contact flow, which the bridge does not speak), run `wrangler pages dev dist`, which serves `/api/*` at `http://localhost:8788`; `chat/eval-http.mjs` targets that endpoint by default. `/api/contact` only exists under `wrangler pages dev`; under plain `astro dev` the route is simply absent, so the contact flow degrades to its deterministic asks, which is the intended no-key path.

**Formatting scope.** `.prettierignore` keeps formatting to the actual site source: `dist/`, `.astro/`, `node_modules/`, `docs/`, generated output, and authored content are excluded, so `npm run format` never rewrites drafts or the design prototypes.

## 10. Performance discipline

The standing bar is Lighthouse mobile **Perf 100, TBT 0, CLS 0**, measured against the built `dist/` output (not the dev server), and it is treated as a regression gate, not an aspiration. Three mechanisms hold it:

- **Critical CSS inlining.** `build.inlineStylesheets: "always"` inlines the one stylesheet (about 5 KB gzip) into every document’s `<head>`, so first paint never waits on a second round-trip. The only things in the pre-paint critical path are the HTML document, that inlined stylesheet, and the tiny inline theme/boot gate. This contract is documented in `BaseLayout.astro`’s frontmatter and is binding on any new work.
- **The facade pattern.** Every heavy layer must ship a cheap static facade at first paint and defer real init to idle, visible, or first interaction via a lazy `import()`, reserving its layout box up front so nothing shifts (CLS 0 by construction). The scene is the built example: `Scene.astro` is a server-rendered CSS facade, and the live canvas lazy-loads from `terminal.ts`’s `requestIdleCallback` hook.
- **The scene tick budget.** The canvas runs at 9fps (a 110ms tick), rAF-gated, and pauses entirely when hidden, offscreen, or under reduced motion. The cell grid is capped at `CELL_CAP` (6000 cells) and the device pixel ratio at 2, so the worst per-tick cost stays inside a roughly 4ms budget even on a large monitor. The scene exposes a localhost-only `window.__scene` handle whose `stats()` reports live tick durations; details are in `reference/scene.md`.

The one shipped webfont is the editorial face (LL Circular Pro, three self-hosted woff2 subsets, roughly 88 KB total, `font-display: swap` behind a `size-adjust`’d fallback so the swap causes no layout shift). Monospace stays on the system stack. Do not add faces or weights, or any render-blocking `<link>`/`<script>` to the shell, without re-measuring Lighthouse on `dist`.
