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

### Components (`src/components/`)

- `SEO.astro`: title, description, canonical URL, Open Graph, Twitter card, robots meta, and a JSON-LD slot. Ported in spirit from a prior project's `SEO.astro`.
- `Analytics.astro`: PostHog wiring. See section 5 for the env var and the View Transitions pageview gotcha it works around.
- `TerminalHeader.astro`: the homepage header (wordmark, bio lines with company links, profile/resume/X links). Its blocks carry the `.bseq` class the boot sequence reveals in order.
- `Prompt.astro`: the reusable command input plus its autocomplete popover. Used on both the home screen (id `home`) and the chat screen (id `chat`) with different `placeholder`/`label` props; see section 3 for a gap between the two screens' copy.
- `CommandMenu.astro`: the visible `[bracket]` command buttons. Each carries `data-cmd`; `terminal.ts` delegates clicks to run the command.
- `ArticleLog.astro`: the build.log list itself. Queries the `articles` collection, filters `draft`, and renders `external` entries as `target="_blank"` links with an outbound-arrow glyph instead of an internal `/log/<id>` link.
- `Topbar.astro`: the sticky top bar on every screen except home. Its `[esc] back` link is a real `<a href="/">`, so it works by keyboard, click, or the Escape key without depending on JS.

### The terminal controller (`src/scripts/terminal.ts`)

One bundled module, imported once from `BaseLayout`'s body, drives every interactive behavior on the site:

- **Command router** (`run()`): `work`, `home`/`exit`, `about`, `clear`, `help`, `contact`, `resume` are handled deterministically (instant, no network). Anything else is treated as a free-form question and routed to the chat screen (`toChat()`), which today prints the stub reply described in section 5.
- **Autocomplete** (decision #48): matches the typed text against a fixed `COMMANDS` list, first by prefix then by substring, and renders matches as chips above the prompt. Tab or ArrowRight accepts the top match, ArrowUp/ArrowDown cycle, Enter runs the highlighted command, and chips are tap targets on touch.
- **Prompt history** (decision #44): an in-memory array of typed commands for the current page session (not persisted across reloads). ArrowUp/ArrowDown recall history when the autocomplete popover is closed.
- **Boot sequence**: `runBoot()` types `"hello"` into the home prompt (500ms hold, then 85ms per character), holds for a further 460ms, then reveals every `.bseq`-marked block in 50ms steps by adding a `.bon` class to each in turn. It's cancelable by any keydown or pointerdown (which also clears the typed "hello" if the user hasn't typed past it) or by the user typing their own text (which the boot leaves alone). All `.bseq` content is server-rendered and present in the DOM regardless of boot state, so nothing here affects crawlability. See section 3 for exactly when this is supposed to run versus when it actually runs.
- **View Transitions safety** (E5 in `docs/reference/prior-project-conventions.md`): every listener is delegated on `document`, attached exactly once behind a `window.__terminalInit` guard, and per-page setup runs from the `astro:page-load` event (fires on the initial load and after every client-side navigation) rather than binding to specific DOM nodes that get replaced by a swap.
- It also swallows the one benign `InvalidStateError` that `document.startViewTransition()` throws when a navigation fires against a backgrounded tab; the navigation still completes, only the animation is skipped.

### Styles and the token system (`src/styles/`)

`global.css` defines the whole color system as semantic CSS custom properties on `:root` (`--ground`, `--ink`, `--bright`, `--dim`, `--accent`, `--on-accent`, `--line`, `--line-strong`, `--well`), values for the dark/night ground by default, overridden inside `@media (prefers-color-scheme: light)` (decision #40). Those same names are re-exposed to Tailwind through an `@theme` block (`--color-ground`, `--color-ink`, ...), so component markup only ever reaches for semantic utility classes or `var(--token)`, never a literal "dark" or "light" branch. `color-scheme` is set alongside the tokens so native form controls and scrollbars follow too.

`terminal.css` holds every component class for the terminal UI (header, prompt, autocomplete, log entries, chat screen, prose, the boot visibility rules). Because every rule in it references the tokens above, one class works unmodified on both grounds.

Theme color in the browser chrome (the `<meta name="theme-color">` tag) is handled with two static tags in `BaseLayout.astro`, each scoped by its own `media="(prefers-color-scheme: ...)"` attribute, which the browser resolves natively with no JavaScript involved. **Note:** `global.css`'s own header comment claims this is done "with a live matchMedia listener (see terminal.ts)". No such listener exists anywhere in `terminal.ts` or elsewhere in the codebase (verified by grep across `src/`); the comment is stale. Treat the two static meta tags in `BaseLayout.astro` as the actual mechanism.

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

This section states, for each decision, what is actually shipped in `terminal.ts`/`global.css` today, verified against the code and git history, not just the decision's wording.

- **Commands**: `work`, `home`/`exit`, `about`, `clear`, `help`, `contact`, `resume` are deterministic; anything else is a free-form question routed to chat. Implemented as described above.
- **Autocomplete** (#48): implemented as described above, including keyboard cycling and touch chips.
- **Prompt history** (#44): implemented as described above.
- **Boot on entry only** (#64, amending #41): decided as "the boot sequence plays only on a genuine site entry (URL, refresh, external link), never on internal client-side navigation; back-to-home renders instantly complete." **The code does not fully match this.** The hard-load case works as decided: `BaseLayout`'s inline pre-paint script sets `html.boot` only on a real document load of `/`. But `terminal.ts`'s `astro:after-swap` listener unconditionally re-adds `html.boot` whenever a client-side (View Transitions) navigation lands on `/`, and `initPage()` then calls `runBoot()` again if the boot class is present. Traced through git history: this behavior was already present in the original Phase 1 scaffold commit (`0bb427b`), and decision #64 (`125bb7f`) only touched `docs/COMMS-LOG.md` and `docs/DECISIONS.md`, no source file, so the code was never updated to match. **Net effect: navigating home via Escape, the `home` command, or the back link currently replays the full "hello" boot animation, contrary to the decision.**
- **Single-cursor navigation model** (#63): decided as a block caret resting on the wordmark by default, with arrow keys moving that cursor through interactive elements and highlighting links terminal-style, and the prompt's own caret appearing only when the prompt is focused. **Not implemented.** There is no cursor/caret-movement code anywhere in `terminal.ts` (checked by grepping for "cursor" across `src/`; the only hits are unrelated `cursor: pointer` CSS declarations). Keyboard navigation today is plain Tab order plus the global `:focus-visible` ring (which does satisfy #28's a11y requirement on its own); arrow keys only do anything while a `.prompt input` element is focused, where they drive autocomplete cycling or history recall, not page-wide cursor movement.
- **Uniform wipe transitions** (#64): decided as "all internal navigations share one transition: the ~140ms terminal wipe... instant under reduced motion." **Not implemented.** `global.css` explicitly disables all View Transitions animation: `::view-transition-old(root), ::view-transition-new(root) { animation: none; }`. This rule predates decision #64 (present since the original scaffold commit) and was never revisited, so every internal navigation today is instant with zero animation for all visitors, not a 140ms wipe for motion-OK visitors and instant only for reduced-motion ones.
- **Chat naming rules** (#58): "the chat" and "the prompt" are the only visitor-facing names; "terminal" is reserved for internal/code vocabulary. Verified clean: every visitor-facing string in `chat.astro`, `terminal.ts`'s output strings, and the command list uses "chat" or a command name, never "terminal." The word "terminal" only appears in code comments and identifiers (`TerminalHeader.astro`, `terminal.ts`, comments), which is exactly the intended split.
- **"Ask me anything"** (#65): decided as the chat invitation copy "everywhere the prompt invites input." Mostly applied: `Prompt.astro`'s default `placeholder`/`label` say "ask me anything…" (used as-is on the home screen), and the command list/help text say "ask me anything" for the `chat` command. **One gap:** `chat.astro` passes explicit overrides, `placeholder="ask or type a command…"` and `label="Ask a question or type a command"`, so the chat screen's own prompt, the one place a visitor is actively mid-conversation, never shows "ask me anything" at all. Confirmed by git history: the commit that landed #65 (`e855157`) changed `Prompt.astro`'s defaults and the command copy but never touched `chat.astro`.

**Also worth knowing, not tied to a numbered decision:** the `resume` command's printed output claims `# opens the PDF in a new tab on the live site`, but the `<a href="/resume.pdf">` it prints has no `target="_blank"`, unlike the header's LinkedIn/X links which do. Default anchor behavior without a `target` navigates the current tab. `docs/STATUS.md` already lists "resume command behavior (print link vs open PDF)" as an open question for Brian, so this is unresolved rather than a broken decision, but the current comment overstates what the markup does.

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

**`public/_headers`:** Cloudflare Pages' native mechanism for security headers, no separate Worker needed for this part. Ships a CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a `Permissions-Policy`, HSTS (2-year max-age, `includeSubDomains`, `preload`), and an immutable long-cache rule for hashed `/_astro/*` build assets. The CSP is narrow by default (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`) with two deliberate carve-outs: `'unsafe-inline'` on `script-src`/`style-src` (required for the `is:inline` boot-gate script, the JSON-LD blocks, and the inline PostHog snippet), and PostHog's two hosts allowed on `script-src`/`connect-src`. Any change that adds a new inline script or a new third-party host must update this file in the same change, or it will be silently blocked in production only; the dev server enforces no CSP at all, so this class of bug is invisible until after deploy.

**Chat, production plan (gate #49):** the site as built ships chat as a **static stub**: `src/pages/chat.astro` renders a fixed "this is a preview" message, and `terminal.ts`'s free-form path prints a canned `STUB_HTML` reply pointing to email. There is no live model call anywhere in `src/`. The real behavior is validated separately at `poc/chat/` (its own README covers running it): real Claude Haiku 4.5 calls, the actual facts pack and deny-list, a page-vs-prose tool-use router, and an eval harness that was signed off 38/38 per decision #61. None of that is wired into the production site yet. The documented plan for doing so (`docs/reference/llm-terminal-plan.md`) is a Cloudflare Worker behind Cloudflare AI Gateway (provider swap, spend cap, logging, response caching), with Cloudflare Turnstile and per-IP rate limiting enforced in the Worker. Decision #49 makes that entire stack, plus a headers/CSP review and a check that no secret reaches client code, a hard gate before chat goes live publicly. Since none of it exists yet in this repo (verified: no Worker code, no Turnstile reference, no rate-limit code anywhere in `src/` or at the repo root), there's nothing partially wired to be careful around: building the production chat is a from-scratch task governed by that plan doc and gate.

## 6. Binding engineering rules

These carry decision numbers because they were explicit calls, not defaults. New work should not contradict them without a new logged decision.

| # | Rule | What it means in practice |
| --- | --- | --- |
| #28 | Full keyboard accessibility | The terminal must work with no pointer: a visible `:focus-visible` ring everywhere, arrow keys that only act while a `.prompt input` is focused (never hijacking page scroll), the prompt's ARIA combobox/listbox pattern, and real `<a>` elements for every navigable item (log entries, the back link) so keyboard and assistive-tech users never depend on JS running. Any new interactive element needs this before it ships. |
| #40 | Both themes, matched to system preference | Never branch on "dark" or "light" in component code. Add a new color as a token pair in `global.css` (`:root` plus the `prefers-color-scheme: light` override) and consume it through the Tailwind `@theme` mapping or `var(--token)`. Check new UI on `/styleguide`, which forces both grounds side by side regardless of system preference. |
| #62 | Perceived-load performance is a standing requirement | Visitors see content immediately: static HTML, system fonts only (no webfonts shipped today), theme and boot gates run pre-paint via `is:inline` scripts in `<head>`, and any future heavy layer (chat, aurora, etc.) must init lazily/idle, not eagerly. Check Lighthouse against the built `dist/` output, not the dev server, before calling a phase done. |
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
