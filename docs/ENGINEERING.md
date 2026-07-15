# Engineering documentation

This is the build reference for brohde.com: how the site is put together, how to run and ship it, and the rules that bind future changes. Read `CLAUDE.md`, `docs/DECISIONS.md`, and `docs/STATUS.md` first; this file assumes you already know why the project exists and covers only how it's built.

Everything below was checked against the source in this repo, not assumed from the decision log. Where a documented decision and the shipped code disagree, both are stated plainly and the gap is called out, so you don't waste time hunting for code that isn't there.

## 1. Architecture

### Pages (`src/pages/`)

| Route | File | Notes |
| --- | --- | --- |
| `/` | `index.astro` | Home screen. Renders `TerminalHeader`, `CommandMenu`, `Prompt` (id `home`), `ArticleLog`, a status footer. JSON-LD: `Person` + `WebSite`. |
| `/about` | `about.astro` | Prose bio screen behind `Topbar`. JSON-LD: `ProfilePage`. |
| `/chat` | `chat.astro` | Chat screen. Currently a **static stub**, `noindex: true`, excluded from the sitemap. See section 5 for what "stub" means concretely. |
| `/log/<slug>` | `log/[...slug].astro` | One page per article. `getStaticPaths` filters out `draft` and `external` entries, so no page is ever built for either (see the content collections section). JSON-LD: `BlogPosting`. |
| `/styleguide` | `styleguide.astro` | Design-token and component specimen, `noindex`, excluded from the sitemap. Forces both grounds side by side via `.theme-night`/`.theme-light` overrides of the same token names, independent of the visitor's system preference, per the "living styleguide" convention adopted from prior projects (D4). |
| `/404` | `404.astro` | `noindex`. |
| `/rss.xml` | `rss.xml.ts` | API route (`GET`). Filters `draft` only; `external` entries are included, linking to their off-site URL instead of an internal one. |

### Layout

`src/layouts/BaseLayout.astro` is the single shared shell for every page: charset/viewport meta, favicon, the RSS `<link rel="alternate">`, two static `<meta name="theme-color">` tags (one per `prefers-color-scheme`, see the styles section), the `SEO` component, the boot-gate pre-paint script (inline, runs before first paint), `<ClientRouter />` (Astro View Transitions), a skip-to-content link, the page's `<slot />`, `Analytics`, and the `terminal.ts` script import. Every page passes its own `title`/`description`/`ogType`/`noindex`/`jsonLd` through as props.

BaseLayout's frontmatter also carries a binding comment block, the perceived-load contract (decisions #62, #70): the pre-paint critical path is exactly the HTML document, the one inlined stylesheet, and the boot-gate script, nothing else, and a facade pattern that every future heavy layer (the aurora canvas, the glyph tide, live chat) must follow: a cheap static facade at first paint, real init deferred to idle, visible, or first interaction via a lazy `import()`, reduced motion respected, layout reserved up front. `astro.config.mjs` sets `build.inlineStylesheets: "always"`, which is the mechanism behind the stylesheet half of that contract: the site's one stylesheet (about 5 KB gzip) is inlined into every document's `<head>` instead of shipping as a separate render-blocking request, so a full page load never waits on a second round-trip for CSS. Verified per decision #70: Lighthouse mobile on the built `dist/` output scores Perf 100, TBT 0, CLS 0.

### Components (`src/components/`)

- `SEO.astro`: title, description, canonical URL, Open Graph, Twitter card, robots meta, and a JSON-LD slot. Ported in spirit from a prior project's `SEO.astro`.
- `Analytics.astro`: PostHog wiring. See section 5 for the env var and the View Transitions pageview gotcha it works around.
- `TerminalHeader.astro`: the homepage header (wordmark, bio lines with company links, profile/resume/X links). Its blocks carry the `.bseq` class the boot sequence reveals in order.
- `Prompt.astro`: the reusable command input plus its autocomplete popover. Used on both the home screen (id `home`) and the chat screen (id `chat`); both call it with no `placeholder`/`label` overrides, so both show the same default "ask me anything..." invitation copy (#65). The `boot` prop it accepts is an intentional no-op: the prompt is exempt from the boot hide (see the boot sequence bullet below).
- `CommandMenu.astro`: the visible `[bracket]` command buttons. Each carries `data-cmd`; `terminal.ts` delegates clicks to run the command.
- `ArticleLog.astro`: the build.log list itself. Queries the `articles` collection, filters `draft`, and renders `external` entries as `target="_blank"` links with an outbound-arrow glyph instead of an internal `/log/<id>` link.
- `Topbar.astro`: the sticky top bar on every screen except home. Its `[esc] back` link is a real `<a href="/">`, so it works by keyboard, click, or the Escape key without depending on JS.

### The terminal controller (`src/scripts/terminal.ts`)

One bundled module, imported once from `BaseLayout`'s body, drives every interactive behavior on the site:

- **Command router** (`run()`): `work`, `home`/`exit`, `about`, `clear`, `help`, `contact`, `resume` are handled deterministically (instant, no network), and so is `hello`/`hi`/`hey`, which prints a short natural-language tour of the site's core pages (#68) rather than going anywhere near chat. Anything else is treated as a free-form question and routed to the chat screen (`toChat()`). In production that prints the canned `STUB_HTML` reply described in section 5; on `localhost`/`127.0.0.1` only, a dev bridge (decision #54, `askLive()`) sends it to the real model at a local POC server instead. See section 5 for what that bridge does and does not cover.
- **Autocomplete** (decision #48): matches the typed text against a fixed `COMMANDS` list, first by prefix then by substring, and renders matches as chips above the prompt. Tab or ArrowRight accepts the top match, ArrowUp/ArrowDown cycle, Enter runs the highlighted command, and chips are tap targets on touch.
- **Prompt history** (decision #44): an in-memory array of typed commands for the current page session (not persisted across reloads). ArrowUp/ArrowDown recall history when the autocomplete popover is closed.
- **Boot sequence**: `runBoot()` types `"hello"` into the home prompt (500ms hold, then 85ms per character), holds for a further 460ms, then reveals every `.bseq`-marked block in 50ms steps by adding a `.bon` class to each in turn. It's cancelable by any keydown or pointerdown (which also clears the typed "hello" if the user hasn't typed past it) or by the user typing their own text (which the boot leaves alone). All `.bseq` content is server-rendered and present in the DOM regardless of boot state, so nothing here affects crawlability. It plays on a genuine site entry only, never on an internal client-side navigation back to home, and the prompt itself is exempt from the hide, so the "$ hello" line is visible from first paint. See section 3 for the full mechanics.
- **View Transitions safety** (E5 in `docs/reference/prior-project-conventions.md`): every listener is delegated on `document`, attached exactly once behind a `window.__terminalInit` guard, and per-page setup runs from the `astro:page-load` event (fires on the initial load and after every client-side navigation) rather than binding to specific DOM nodes that get replaced by a swap.
- It also swallows the one benign `InvalidStateError` that `document.startViewTransition()` throws when a navigation fires against a backgrounded tab; the navigation still completes, only the animation is skipped.

### Styles and the token system (`src/styles/`)

`global.css` defines the whole color system as semantic CSS custom properties on `:root` (`--ground`, `--ink`, `--bright`, `--dim`, `--accent`, `--on-accent`, `--line`, `--line-strong`, `--well`), values for the dark/night ground by default, overridden inside `@media (prefers-color-scheme: light)` (decision #40). Those same names are re-exposed to Tailwind through an `@theme` block (`--color-ground`, `--color-ink`, ...), so component markup only ever reaches for semantic utility classes or `var(--token)`, never a literal "dark" or "light" branch. `color-scheme` is set alongside the tokens so native form controls and scrollbars follow too.

`terminal.css` holds every component class for the terminal UI (header, prompt, autocomplete, log entries, chat screen, prose, the boot visibility rules). Because every rule in it references the tokens above, one class works unmodified on both grounds.

Theme color in the browser chrome (the `<meta name="theme-color">` tag) is handled with two static tags in `BaseLayout.astro`, each scoped by its own `media="(prefers-color-scheme: ...)"` attribute, which the browser resolves natively with no JavaScript involved. `global.css`'s own header comment used to claim this was done "with a live matchMedia listener (see terminal.ts)"; no such listener ever existed. That comment was corrected in place (commit `aed70ef`) and now describes the two static meta tags accurately.

### Content collections (`src/content.config.ts`)

One collection, `articles`, using Astro's `glob` loader over `src/content/articles/**/index.md` (folder per article, per E1, so image assets can live beside a post later). `generateId` strips the trailing `/index.md`, so the folder name is the article's id and its URL slug.

Schema (Zod): `title: string`, `description: string` (optional), `date: coerced Date` (the pre-date, decision #3), `draft: boolean` (default `false`), `external: URL string` (optional).

**`external` frontmatter** marks a log entry whose canonical home is off-site (the one live example is `twilio-hackpack-v4`, a Twilio-blog co-authorship). When set:
- `log/[...slug].astro`'s `getStaticPaths` filter excludes it (`!data.external`): no internal page is ever generated, so a guessed `/log/twilio-hackpack-v4` URL 404s rather than serving stale or empty content.
- `ArticleLog.astro` (the homepage log) still lists it, as a `target="_blank"` link straight to the external URL, with a small outbound-arrow glyph after the title.
- `rss.xml.ts` includes it, using `post.data.external` as the item's `<link>` and `<guid>` in place of an internal URL.

**`draft` frontmatter** hides an entry from every reader-facing surface at once: `ArticleLog.astro`, `log/[...slug].astro`'s `getStaticPaths`, and `rss.xml.ts` all filter on `!data.draft` independently. The sitemap needs no separate draft handling: `@astrojs/sitemap` only sees routes Astro actually built, and a draft article's route is never built. Verified directly: `src/content/articles/brohde-com-build/index.md` ships `draft: true` and, after a real `npm run build`, is absent from `dist/log/`, `dist/rss.xml`, and `dist/sitemap-0.xml`.

## 2. Running and building

No `.nvmrc` or `engines` field is pinned in `package.json`; a current Node LTS works (verified here on Node 25 / npm 11).

```sh
npm install
npm run dev          # astro dev, http://localhost:4321
npm run build         # astro check && astro build -> ./dist
npm run preview        # serve the built ./dist locally
npm run format         # prettier --write .
npm run format:check
npm run check         # astro check alone: typecheck + Astro diagnostics, no build
```

`build` chains `astro check && astro build` (E12): a failing typecheck blocks the build outright. There is no separate CI workflow in the repo (no `.github/`), so `npm run build` is today's entire correctness gate before a deploy.

Verified in this repo: a clean `npm install && npm run build` produced 0 errors and 0 warnings from `astro check` (6 informational hints about the `z` re-export from `astro:content` being deprecated upstream in this Astro version; harmless, does not fail the build), then built 10 pages plus `rss.xml`, `sitemap-index.xml`, and `sitemap-0.xml` into `dist/`.

**Format scope.** `.prettierignore` scopes formatting to the actual site source, not Brian's authored content or generated output: `dist/`, `.astro/`, `node_modules/`, `docs/`, `poc/`, `assets/`, `.claude/`, `PLAN.md`, `CLAUDE.md`, `*.log` are all excluded. In practice `npm run format` touches `src/`, `README.md`, and root config files, and never touches docs, drafts, the design prototypes, or the chat POC.

### The content-layer staleness gotcha (discovered 2026-07-15)

Astro's content layer persists a cache to `node_modules/.astro/data-store.json` across dev server restarts (confirmed by inspecting the file directly). When an article's Markdown file gets written by something outside the dev server's own file-watch cycle, which is exactly what happens when a copywriter subagent writes finished article bodies into `src/content/articles/*/index.md` around the same time the dev server is running, the persisted store can keep serving the old body and description even after the server "syncs." A plain restart is not always enough, because the stale entry lives in the persisted store on disk, not just in memory.

**Symptom:** the rendered page (or a `curl` of it) still shows the old or stub content well after the source file has visibly changed on disk.

**Fix:**
```sh
# stop the dev server first
rm -rf .astro node_modules/.astro
npm run dev
```
This forces a full content re-sync from disk. Standing practice adopted after this was hit in production use: validate any content change against the actually rendered HTML, not an agent's self-report, before calling it done.

## 3. The interaction model, as decided

This section states, for each decision, what is actually shipped in `terminal.ts`, `terminal.css`, `global.css`, and `Prompt.astro` today, verified against the code and git history, not just the decision's wording. The interaction cluster merge (`343663d`) closed every gap this section used to flag; what follows describes shipped behavior, with anything still genuinely open called out as such.

- **Commands**: `work`, `home`/`exit`, `about`, `clear`, `help`, `contact`, `resume` are deterministic; `hello`/`hi`/`hey` is also deterministic, a scripted tour rather than a model call (see below); anything else is a free-form question routed to chat. Implemented as described in section 1.
- **Autocomplete** (#48): implemented as described above, including keyboard cycling and touch chips.
- **Prompt history** (#44): implemented as described above.
- **Boot on entry only** (#64, amending #41): matches the decision. `BaseLayout`'s inline pre-paint script sets `html.boot` only on a real document load of `/` under motion-OK conditions; that `is:inline` script does not re-run on client-side navigation, so `terminal.ts` never sets the class itself. Its `astro:after-swap` listener only ever *removes* `html.boot` after a swap, and `initPage()` only calls `runBoot()` when the class is already present. Net effect: navigating home via Escape, the `home` command, or the back link renders instantly complete, and the "hello" boot animation plays exactly once, on a genuine site entry. The prompt is exempt from the boot hide by construction: `Prompt.astro`'s `boot` prop is an intentional no-op (its outer `.promptzone` never carries `.bseq`), and the "$ hello" line in `TerminalHeader.astro` carries `.bseq-keep` instead of plain `.bseq`, which `terminal.css` keeps `visibility: visible` even while an ancestor `.bseq` block is hidden. So the prompt is interactive and "$ hello" is on screen from first paint; nothing waits for the boot sequence to reveal it.
- **Single-cursor navigation model** (#63, tradeoffs logged #75): implemented. `terminal.ts` maintains a roving-tabindex group over `ROVE_SELECTOR = "a[href], button[data-cmd]"` scoped to the active `[data-screen]`: exactly one element in the group is `tabindex="0"` at a time (`setRoveStop`), so the whole group is a single tab stop; the prompt input is the page's other tab stop, giving two tab stops total per screen, per #75's tradeoff (a). Arrow keys (`moveRove`/`moveRoveEnd`) walk the group only while one of its elements already holds focus, so page scroll is never hijacked when the cursor is at rest or focus sits in an input. The wordmark's block caret is the resting cursor; `html.cfocus .wordmark .caret { visibility: hidden }` in `terminal.css` hides it whenever the roving group or the prompt owns focus (`html.cfocus`, toggled on `focusin`/`focusout`), so exactly one cursor is ever visible. The focused prompt uses the browser's native text caret (`caret-color: var(--accent)` on `.prompt input`), never a fake block, per #75's tradeoff (b): a fake caret would lie the moment the user arrows within typed text. Escape is two-step per #75's tradeoff (c): the first Escape from a rove element or the prompt input blurs it, parking the cursor back on the wordmark; a second Escape, with nothing of the cursor group focused, leaves a non-home screen. A one-time hint ("# arrows move the cursor, enter opens") announces on the first focus-visible rove event.
- **Uniform wipe transitions** (#64): implemented, though not through the browser's native View Transitions crossfade. `global.css` still sets `::view-transition-old(root), ::view-transition-new(root) { animation: none; }` (that rule predates #64 and disables only the built-in crossfade); the actual ~140ms wipe is a JS-driven cover element (`#wipe`), appended to `<html>` rather than `<body>` so the router's body swap never removes it. `terminal.ts` drops the cover on `astro:before-preparation`, wraps the router's loader so the swap can't land before `WIPE_HOLD_MS` (140ms) has elapsed, and lifts the cover `WIPE_LIFT_MS` (50ms) after the destination's `astro:page-load` fires, so the new page is always visually complete when the cover lifts. Transitions resolve to a named kind (`type TransitionKind = "wipe" | "instant"`) via `resolveTransition()`: under reduced motion it resolves to `"instant"` and the cover logic is skipped entirely, matching "instant under reduced motion." The named-kind structure is deliberate: a comment in `terminal.ts` notes the future slab expand/collapse morph (#69) can slot in as a third kind without reworking this layer. Applies uniformly to every internal navigation direction (links, commands, Escape, back and forward all route through the same listeners).
- **Hover and focus unification** (no numbered decision, consolidated in the interaction merge): every bracket-style interactive element, profile links (`.blink`), the command menu and chat keybar buttons (`.cbtn`), the back button (`.backbtn`), shares one rule in `terminal.css`: on hover or focus-visible, the element's `.lbl` span fills with the accent color and flips to ground-colored text, while the brackets stay accent-colored (the prototype treatment from `build-log-v3.html`). Each of those components wraps its visible label text in `<span class="lbl">...</span>`, which is what the shared rule targets.
- **`hello` tour** (#68): `hello`/`hi`/`hey` all route to a deterministic, scripted five-line reply (`HELLO_HTML` in `terminal.ts`), not a model call, printed to the chat console the same way `help`/`contact`/`resume` are. Page-name links are underlined; the external-marker arrow convention is unaffected since none of the tour's links are external.
- **Dev-only chat bridge** (#54): on `localhost`/`127.0.0.1` (checked via `location.hostname`), free-form questions call `askLive()`, which posts to a local POC server (`poc/chat/`, `http://localhost:8787/chat`) and renders the model's real reply, restricted to markdown links on the five allowlisted slugs, with `open_page` triggering real navigation and a dim usage and cost comment line per reply. Any other hostname, which is every production visitor, always calls `askStub()` and gets the canned `STUB_HTML` reply. This bridge is a local development convenience only; it ships in the client bundle everywhere (the hostname check runs in the browser, not on a server), but it does nothing except fail closed to the stub off localhost, and it carries no secret since the model key lives only in the local POC server's own process. See section 5 for the still-unbuilt production chat path this does not replace.
- **Chat naming rules** (#58): "the chat" and "the prompt" are the only visitor-facing names; "terminal" is reserved for internal/code vocabulary. Still verified clean: every visitor-facing string in `chat.astro`, `terminal.ts`'s output strings, and the command list uses "chat" or a command name, never "terminal." The word "terminal" only appears in code comments and identifiers (`TerminalHeader.astro`, `terminal.ts`, comments), which is exactly the intended split.
- **"Ask me anything"** (#65): fully applied, the earlier gap is closed. `Prompt.astro`'s defaults (`placeholder="ask me anything..."`, `label="Ask me anything, or type a command"`) are used as-is by both the home screen and, now, the chat screen: `chat.astro` calls `<Prompt id="chat" />` with no overrides (its own comment says so explicitly), so the one place a visitor is mid-conversation shows the same invitation as everywhere else.

**Also worth knowing, not tied to a numbered decision:** the `resume` command's printed output still claims `# opens the PDF in a new tab on the live site`, but neither the `<a href="/resume.pdf">` it prints nor the equivalent link in the `hello` tour carries `target="_blank"`, unlike the header's LinkedIn/X links which do. Default anchor behavior without a `target` navigates the current tab. `docs/STATUS.md` still lists "resume command behavior (print link vs open PDF)" as an open question for Brian, so this remains unresolved rather than a broken decision, but the current comment still overstates what the markup does.

## 4. Content workflow

**Drafts** live in `docs/drafts/<slug>.md`, outside `src/`, so nothing there is ever built or shipped by accident. Every draft observed in the repo follows the same shape: a metadata header (`Status`, `Author`, `Suggested pre-date`), a "Title options" section with 2 to 3 alternatives, a one-line rationale per option, and a studio recommendation, then the "Draft body" itself, ending with image candidates and open questions for Brian.

**Article bodies** live in `src/content/articles/<slug>/index.md`: just the schema frontmatter (`title`, `description`, `date`, `draft`, optionally `external`) plus the prose, none of the draft's editorial scaffolding.

**Review flow**, reconstructed from `docs/COMMS-LOG.md` and the git history:
1. A copywriter subagent writes a draft to `docs/drafts/<slug>.md`.
2. The studio lead (and/or Brian) reviews the title options and any flagged open questions.
3. Once approved, the prose (not the editorial meta) is copied into `src/content/articles/<slug>/index.md` with real frontmatter. The draft file stays in `docs/drafts/` afterward as the editorial record; it is not deleted.
4. **Validate against the actually rendered page before calling it live.** This step became mandatory after the content-layer staleness incident in section 2: an earlier round declared five articles live based on a subagent's self-report, and the dev server was still serving stub content for all of them. The fix and the "rendered surface or it did not happen" rule are logged in `docs/COMMS-LOG.md`.

`draft: true` in an article's own frontmatter is the "written but not ready" state; `src/content/articles/brohde-com-build/index.md` ships this way today (a placeholder body for the site's own build-log meta-article, its full draft lives at `docs/drafts/brohde-com-build.md`).

**VOICE.md is binding** for anything a visitor reads. Two rules worth calling out explicitly because they're hard rules, not style preferences:

- **The dash ban is total** (#18, VOICE.md v1.1): no en dashes and no em dashes, anywhere a reader sees them, prose, UI copy, navigation, metadata, or design comps. Use a comma, a colon, a middot (metadata only, e.g. "Founder, Eight Angle · Full-Stack Engineer"), the word "to" for ranges, or split the sentence. A plain hyphen in a tight metadata range ("2019-2021") or inside a normal compound word is fine; it's the en dash (–) and em dash (—) characters specifically that are banned.
- **No age or years-of-experience leakage** (#27, #29, #31): never state or enable computing Brian's age. That means no birth year, no graduation year, no career-start framing, and no aggregate years-of-experience claim, even an implied one built by summing individual project dates. Individual, already-public project dates are fine on their own (they're on the site); the constraint is specifically about anything that lets a reader do age math.

Also binding: copy speaks to both audiences, hiring managers and freelance clients (#55). Never frame Brian as freelance-only.

## 5. Deploy

**Host:** Cloudflare Pages (decision #5). Build command `npm run build`, output directory `dist`. Static output only, confirmed in `astro.config.mjs`: no server adapter is configured, matching the "pure static, no SSR" call made when Keystatic was skipped.

**Current state:** no Cloudflare Pages project exists yet against this repo, no `wrangler.toml`, no Pages Functions, no `.github/workflows` anywhere in the tree. Per `docs/STATUS.md`, connecting the repo in the Cloudflare dashboard is still an open step.

**Environment variables:** `PUBLIC_POSTHOG_KEY` (optional). `Analytics.astro` is a clean no-op when it's unset, so local dev needs no configuration at all. `PUBLIC_POSTHOG_HOST` is also optional and defaults to `https://us.i.posthog.com`. Both are `PUBLIC_`-prefixed Vite env vars, meaning their value gets inlined into client JS at build time; set them as ordinary build-time environment variables on the Cloudflare Pages project, not as secrets. PostHog wiring disables automatic pageview capture and fires exactly one `$pageview` per `astro:page-load` instead, to avoid the double-count View Transitions otherwise causes (E7).

**`public/_headers`:** Cloudflare Pages' native mechanism for security headers, no separate Worker needed for this part. Ships a CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a `Permissions-Policy`, HSTS (2-year max-age, `includeSubDomains`, `preload`), an immutable long-cache rule for hashed `/_astro/*` build assets (JS chunks only now that the stylesheet itself is inlined per decision #70, not a separate cached request), and revalidating cache headers (`max-age` with `stale-while-revalidate`) for the non-hashed static assets whose URLs stay stable across a redeploy: `favicon.svg`, `og-default.svg`, `resume.pdf`, `robots.txt`. The CSP is narrow by default (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`) with two deliberate carve-outs: `'unsafe-inline'` on `script-src`/`style-src` (required for the `is:inline` boot-gate script, the JSON-LD blocks, and the inline PostHog snippet), and PostHog's two hosts allowed on `script-src`/`connect-src`. Any change that adds a new inline script or a new third-party host must update this file in the same change, or it will be silently blocked in production only; the dev server enforces no CSP at all, so this class of bug is invisible until after deploy.

**Chat, production plan (gate #49):** in production, chat is still a **static stub**: `src/pages/chat.astro` renders a fixed preview message, and `terminal.ts`'s free-form path prints the canned `STUB_HTML` reply pointing to email whenever the visitor's `location.hostname` is not `localhost`/`127.0.0.1`. On localhost only, a dev bridge (`askLive()`, decision #54, see section 3) sends free-form questions to the real model at a local POC server instead and renders its actual reply; that bridge is a development convenience gated by a client-side hostname check, not a production path, and it fails closed to the stub the moment the POC server is unreachable or the check fails. The real behavior is validated separately at `poc/chat/` (its own README covers running it): real Claude Haiku 4.5 calls, the actual facts pack and deny-list, a page-vs-prose tool-use router, and an eval harness that was signed off 38/38 per decision #61. None of that server-side infrastructure is wired into the production site yet. The documented plan (`docs/reference/llm-terminal-plan.md`) was originally a standalone Cloudflare Worker; decision #73 supersedes that shape with a Cloudflare Pages Function (`functions/api/chat.ts`) porting the frozen POC behavior verbatim, key as a Pages secret, `ANTHROPIC_BASE_URL` pointed at Cloudflare AI Gateway as pure config, Turnstile verification, and KV-backed per-IP rate limiting with an in-memory fallback. Decision #49 makes that entire stack, plus a headers/CSP review and a check that no secret reaches client code, a hard gate before chat goes live publicly. Since none of it exists yet in this repo (verified: no `functions/` directory, no Turnstile reference, no rate-limit code anywhere in `src/` or at the repo root), building the production chat is still a from-scratch task governed by that plan and gate; it is tracked as its own in-flight phase per `docs/STATUS.md`, separate from the interaction cluster this section otherwise describes.

## 6. Binding engineering rules

These carry decision numbers because they were explicit calls, not defaults. New work should not contradict them without a new logged decision.

| # | Rule | What it means in practice |
| --- | --- | --- |
| #28 | Full keyboard accessibility | The terminal must work with no pointer: a visible `:focus-visible` ring everywhere, arrow keys that only act while a `.prompt input` is focused (never hijacking page scroll), the prompt's ARIA combobox/listbox pattern, and real `<a>` elements for every navigable item (log entries, the back link) so keyboard and assistive-tech users never depend on JS running. Any new interactive element needs this before it ships. |
| #40 | Both themes, matched to system preference | Never branch on "dark" or "light" in component code. Add a new color as a token pair in `global.css` (`:root` plus the `prefers-color-scheme: light` override) and consume it through the Tailwind `@theme` mapping or `var(--token)`. Check new UI on `/styleguide`, which forces both grounds side by side regardless of system preference. |
| #62, #70 | Perceived-load performance is a standing requirement, with a binding facade contract | Visitors see content immediately: static HTML, system fonts only (no webfonts shipped today), the site's one stylesheet inlined into every document via `build.inlineStylesheets: "always"`, theme and boot gates run pre-paint via `is:inline` scripts in `<head>`. Any future heavy layer (chat, aurora, etc.) must ship a cheap static facade at first paint and defer real init to idle, visible, or first interaction, per the facade contract documented in `BaseLayout.astro`'s frontmatter (decision #70). Check Lighthouse against the built `dist/` output, not the dev server, before calling a phase done; verified Perf 100, TBT 0, CLS 0. |
| #56 | Phased delivery | Large work lands and is reviewed in numbered phases stated up front in the brief, never as one monolithic change. Agent review counts as the review; it doesn't have to be Brian for every phase. |
| #60 | Worktrees for parallel work | Parallel finalization work runs on isolated git worktrees/branches, never directly on the shared `main` tree. The studio lead merges. This document was itself written from an isolated worktree under that rule. |
| #66 | Subagent-first execution | Execution work (building, writing, auditing) routes to subagents; the lead session stays open for orchestration, review, and talking to Brian. If you were dispatched as a subagent: do the work and report back, don't route open questions back through the lead unless you're genuinely blocked. |

## 7. The studio process, for newcomers

This project runs like a small studio, not a solo repo. If you're picking this up cold, in this order:

1. **`CLAUDE.md`** (repo root): the working agreement, read first every session.
2. **`docs/STATUS.md`**: the resume anchor. It states what's in flight, what's blocked, and what's next, and is expected to be current, not historical. If it and this file ever disagree about a build detail, trust this file for the "how the code works" question and `STATUS.md` for the "what's happening right now" question.
3. **`docs/DECISIONS.md`**: append-only, numbered, newest at the bottom, one row per decision with date and rationale. Settled decisions are not re-litigated; a change of mind gets a new row that supersedes the old one (several rows here explicitly amend an earlier decision, e.g. #46 and #50 both amend the model policy #14 set).
4. **`docs/COMMS-LOG.md`**: every substantive Brian-to-Claude exchange, summarized rather than transcribed, plus one line per subagent delegation stating what was asked and what came back.
5. **`docs/TEAM.md`** and **`.claude/agents/*.md`**: the studio's specialist subagents (`design-director`, `frontend-engineer`, `copywriter`, `seo-a11y-auditor` as of this writing), each with a bound model and a scoped brief. The roster is explicitly dynamic: new specialists get created, and old ones retired, as the work demands.
6. **`docs/VOICE.md`**: binding for anything a visitor reads, see section 4.

For engineering specifically: this file is the fourth read, after the three above, before touching `src/`.
