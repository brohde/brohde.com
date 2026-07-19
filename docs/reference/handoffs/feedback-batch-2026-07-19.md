# Handoff: post-launch feedback batch (#177, comms 121)

_Opus frontend engineer. Eleven items implemented in the working tree, NOT committed (the lead reviews the diff, validates the built surface, commits, pushes, verifies live). Built twice (Phase A = items 1 to 10 with articles still generated so item 1 could be exercised against a real article; Phase B = item 11). `npm run build` green both times (astro check clean). Frozen chat contract (#61) untouched: no change to functions/api/chat.ts, the model config, or the request shape. Composer visuals (font, send/clear styling, the "$") untouched per the in-flight design concept; only the behavioral and content items below._

## House-rule checks

- Dash ban: `git diff -- src public docs/reference | grep -c` for em/en dashes prints **0**. My authored diff is dash-clean. The raw `git diff | grep -c` prints 2, both from PRE-EXISTING context lines in the lead's own concurrent edits to `docs/STATUS.md` (its `# STATUS ...` heading) and `docs/DECISIONS.md` (its `Format: date ... rationale` hunk-header line). No line I added anywhere contains a dash (`git diff | grep '^[+-].*(em/en dash)'` is empty). I did not touch those docs.
- Sentence case for visitor copy; wordmark stays lowercase; never "terminal" in visitor copy (the greeting says "Brian's LLM"; the coming-soon token is a bracket label).

## Item 1: scene identity travel bug (ROOT CAUSE FOUND)

**Root cause.** The `syncSceneState` bridge in terminal.ts read the destination scene theme from `document.querySelector("[data-screen]")`. Since Phase 4 (commit 109bce9) the global header carries `data-screen` (it drives the large home wordmark and the /chat state), and BaseLayout renders `<SiteHeader>` BEFORE the page `<slot>`, so a bare `[data-screen]` query returns the persisted HEADER, not the page section. The header has no `data-scene-theme`, so the stamp read as `undefined` and the scene re-themed to `"default"` on every navigation: the BR mark never traveled. The same helper `currentScreen()` had the same defect and reported `"page"` for every interior page (it happened to still work for the scene STATE because only `"chat"` is distinguished, but it made `redirectDest` and the about/work self-nav checks subtly wrong).

**Fix.** Both reads now target the page's own `.screen` section (the fresh, non-persisted element that carries `data-screen` and, on articles, `data-scene-theme`). Two one-line selector changes in `src/scripts/terminal.ts`: `currentScreen()` and the `syncSceneState` theme stamp.

**Files:** `src/scripts/terminal.ts`.

**Validation (browser, client-side navigations, the only path where the bug lives).** Home to /log/facebook-newsroom to /about to home:

| step | scene theme | active sky slot | .screen |
| --- | --- | --- | --- |
| home | default | default | home |
| article | **news** | **news** | log |
| about | **default** | default | about |
| home | default | default | home |

The mark and sky re-theme on every crossing (before the fix they stayed `default` the whole walk). Console clean. Note per the brief: articles 404 after item 11, so this was exercised in Phase A while facebook-newsroom was still generated.

## Item 2: remove the "#" intro lines from /chat

Removed the two `.cmt` intro lines and `#chat-note` from `src/pages/chat.astro` (the log ships empty; the greeting fills it, item 3). Removed the terminal.ts logic that fed them: the localhost note swap in `initPage`, the hide-on-thread block in `rehydrateChat`, and the return-on-clear unhide in `clearChat`. Homepage untouched.

**Files:** `src/pages/chat.astro`, `src/scripts/terminal.ts`.

## Item 3: greeting empty state

When /chat is pristine (empty transcript AND no pending send/command/emulation), terminal.ts injects a static greeting styled like an assistant reply (`.reply.greeting`), chosen by LOCAL time of day, no API call: "Good morning!" (5:00 to 11:59), "Good afternoon!" (12:00 to 16:59), "Good evening!" (17:00 to 4:59), each followed by "I'm Brian's LLM. Ask me anything about his work and I'll do my best to answer." It is injected in `initPage` AFTER `rehydrateChat`, so it never flashes before a restored or pending thread. `beginTurn` drops it on the first real turn; `clearChat` brings it back on return to pristine. Never server-rendered.

**Files:** `src/scripts/terminal.ts` (greetingText/showGreeting/removeGreeting, wired in beginTurn, clearChat, initPage), `src/pages/chat.astro`.

**Validation (browser):** pristine /chat showed "Good morning! ..." with 0 turns; after a send, greeting gone, 1 turn; a homepage flow-bar question arrived at /chat with NO greeting (the auto-ask rendered instead). All correct.

## Item 4: clear the chat between page navigations

Navigating AWAY from /chat now drops the whole thread (module transcript, model history, and the sessionStorage backup) via a new `dropThread()` fired on `astro:before-swap` when the outgoing screen is `"chat"`. So every fresh arrival at /chat is pristine and greets. The homepage flow-bar handoff is unaffected (it rides `pendingAfter`, a module closure, not the transcript). Staying on /chat still persists the thread in module memory.

Note on refresh-in-place: a hard reload of /chat without navigating away is not an `astro:before-swap` event, so a mid-conversation refresh still restores from sessionStorage (as before). This matches the literal ask ("navigating away drops it"). If Brian wants EVERY arrival including a refresh to be pristine, remove the sessionStorage persistence entirely (one flag to flip); flagged below.

**Files:** `src/scripts/terminal.ts`.

**Validation (browser):** built a turn on /chat, navigated to home, returned to /chat: pristine (greeting, 0 turns). The thread was dropped.

## Item 5: tighten the /chat top gap

The first exchange sat about 90px below the docked composer (10px body pad + the [clear] row + 16px log pad + 18px first-line margin). Tightened the empty margins so the first exchange reads as directly attached, keeping [clear] present and right-aligned: `.chatbody` top pad 10 to 6, `.chatlog` top pad 16 to 2, and the newest turn / greeting lose their top margin (`.chatlog > .turn:first-child > .uline, .chatlog > .greeting { margin-top: 0 }`). [clear] keeps its 44px tap target.

**Files:** `src/styles/terminal.css`.

**Validation (browser):** screenshot shows composer, [clear], and the first line (greeting) stacked tight as one unit.

## Item 6: remove the resume everywhere visitor-facing

- `ProfileLinks.astro`: dropped the resume document icon (LinkedIn then X remain); aria-label "Profiles".
- `about.astro`: dropped the `[resume.pdf]` chip.
- `terminal.ts`: removed `RESUME_HTML`, the `resume` help line, the resume line in the hello tour, the `resume` SLUG_HREF entry, the `resume` link-pattern token in MD_LINK, the `resume` command branch, the openSlug resume branch, and `RESUME_HTML` from OUT_ALLOW. A typed "resume" now falls through to free-form chat input.
- `lib/site.ts`: removed `LINKS.resume`.
- `public/resume.pdf`: deleted (recoverable via git). `public/_headers`: removed its cache rule.

`grep -rn "/resume.pdf" src public` prints nothing.

**Files:** `src/components/ProfileLinks.astro`, `src/pages/about.astro`, `src/scripts/terminal.ts`, `src/lib/site.ts`, `public/resume.pdf` (deleted), `public/_headers`.

**Flag:** the frozen model prompt (#61) may still, rarely, choose to emit a `/resume` markdown link. Per the literal ask I removed `resume` from the client link pattern, so if that ever happens the raw markdown would render as text. It is a frozen-contract concern (the model prompt lives in poc/chat and I did not touch it); a future contract change can drop resume from the model's allowlist.

## Item 7: theme toggle into the header, as an icon

`ThemeToggle.astro` rewritten as an icon-only control: an inline sun/moon in the site's quiet line style (stroke currentColor, no fill), 18px, at the far right of the header identity row (`margin-left:auto`), resting dim with hover/focus accent like the nav tokens. Removed from `SiteFooter.astro` (now copyright only). The button keeps `id="themectl"` so theme.ts's delegated click still works across the persisted header. Accessible name describes the action ("Switch to light theme" / "Switch to dark theme") via two sr-only spans keyed on `html[data-theme]`, correct from first paint; theme.ts still speaks the state through its polite region on toggle. The dead `.themectl .lbl` bracket rules were removed from terminal.css.

**Files:** `src/components/ThemeToggle.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/styles/terminal.css`.

**Validation (browser):** toggle sits at the far right of both the interior header and the large home header, aligned with the about/contact row; clicking it works.

**Flag (minor):** on the home header the row uses baseline alignment for the big wordmark; the icon centers within that row and reads aligned with the nav in the screenshot, but it is not pinned to a text baseline (an icon has no text baseline). It looks right; if Brian wants it seated a pixel or two lower on the home header specifically, that is a one-line `.shead[data-screen="home"] .themetgl` nudge.

## Item 8: default to the dark theme

New model: absent `localStorage("theme")` means DARK; stored `"light"` is the only override; the toggle is a two-state dark/light switch (going dark clears the key). The site always stamps an explicit `html[data-theme]` ("dark" unless stored "light") pre-paint and on `astro:after-swap`, so first paint is dark with no flash unless light is stored, and the brief attribute-less moment during a swap can never fall back to the system scheme. The `<meta name="theme-color">` pair collapsed to a single dark tag; the pre-paint gate flips it to the light color when light is stored, and theme.ts keeps it in step. The scene's `isLite()` reads `data-theme` (always present now), so the scene follows the toggle in both themes; global.css / scene.css token blocks needed no change (the `:root[data-theme]` blocks out-specify the dormant `prefers-color-scheme` media blocks).

**Files:** `src/scripts/theme.ts`, `src/layouts/BaseLayout.astro`.

**Validation (browser):** initial load with no stored value = data-theme dark, ground #0e1512, meta #0E1512, sun icon, stored (none). Toggle to light = data-theme light, ground #fbfbf8, meta #FBFBF8, moon icon, stored "light", scene pour re-derives from the light ground. Toggle back to dark = key cleared. Hard load with light stored = data-theme light already set at load (gate, no flash), full light coherence including the scene.

## Item 9: lighten "via Beyond" further

The "via Beyond" note now wears a `.cvia` color a step lighter than `--dim`, computed as `color-mix(in srgb, var(--dim) 80%, var(--ground))` so it re-derives in both grounds with no new token. The "Beyond" link keeps its full-strength underline (the non-color affordance) and still steps to accent on hover/focus.

**Contrast it lands at (measured, WCAG):** night 5.02:1, light 4.70:1 (both past the 4.5:1 AA floor). For reference `--dim` sits at 7.19:1 / 7.97:1, so this is a clear, deliberate step lighter while staying AA.

**Files:** `src/styles/terminal.css`, `src/components/HomeIntro.astro`, `src/pages/styleguide.astro` (specimen).

**Validation (browser):** "via Beyond" reads visibly lighter than the surrounding links in both dark and light.

## Item 10: retitle the ATG article

`src/content/articles/atg-llm-migration/index.md` title is now "Full replatform in 4 hours: how I upgraded a $20-a-month WordPress site and moved it to free hosting". The homepage listing and meta pick it up automatically (getCollection).

**Flag for Brian (per brief):** he wrote "4-hours"; normalized to "4 hours". The article body already reconciles this: it says the build ran "one morning ... about five hours at the keyboard" with "four of those hours ... the build proper", so "4 hours" matches the body's build-proper figure. The body still opens with "one morning / about five hours at the keyboard"; the title now leads with the tighter 4-hour build figure. Nothing in the body contradicts the new title, but if Brian wants the body's "one morning" framing to echo the new title, that is a copy pass, not done here.

## Item 11: unpublish all articles, keep the listing with "coming soon"

Added `published: z.boolean().default(false)` to the articles schema. All entries are unpublished today.

- `log/[...slug].astro` getStaticPaths generates only `published` (and non-draft, non-external), so every article URL 404s.
- `rss.xml.ts` includes only `published`, so the feed is empty.
- `ArticleLog.astro` still lists every non-draft entry; published internal entries render as links, unpublished internal entries render as plain text (a `<div>`, no anchor) with a quiet `[coming soon]` bracket token (dim mono, in-family with [clear], lowercase per #76). The ledger hover/nudge is scoped to `a.lentry` so the plain rows do not falsely read as clickable. External entries (Twilio Hackpack) keep their off-site link, since they never had a generated page and never 404.
- Sweep for other links to article pages: `HomeIntro.astro` Facebook/Google credits linked to `/log/...`; they now gate on the article's `published` flag and render as plain text while unpublished (republishing an article restores the link automatically). The chat router (terminal.ts) already handled: `eight-angle` stays matched by MD_LINK but is no longer in SLUG_HREF, so a model mention renders as a plain-text label instead of a 404 link; its redirect target and REDIRECT_HREFS entry were removed. SEO / structured data on the homepage and /about do not link article pages. The sitemap is generated from built routes, so no article URLs appear.

**How Brian republishes one later:** set `published: true` in that article's frontmatter. Its page regenerates, its RSS item returns, its homepage listing becomes a link, its HomeIntro credit (if Facebook/Google) relinks, and (for eight-angle) the chat can link it again. Single source of truth: the `published` flag.

**Files:** `src/content.config.ts`, `src/pages/log/[...slug].astro`, `src/pages/rss.xml.ts`, `src/components/ArticleLog.astro`, `src/components/HomeIntro.astro`.

**Validation (curl on the built Phase B dist):** all five interior article URLs return 404; /resume.pdf 404s; /rss.xml has 0 items; the homepage shows five `[coming soon]` tokens; the sitemap lists only `/` and `/about`; the bundle has no `/log/eight-angle-ml` and no `resume`. Screenshot confirms the coming-soon listing, the still-linked external Twilio entry, and Facebook/Google as plain text in the Prev line.

## Consolidated validation

- `npm run build` green (astro check clean) for Phase A (10 pages) and Phase B (5 pages: 404, about, chat, rss, styleguide, index).
- Built output served with `astro preview` on 4520; curl matrix and full browser round via the claude-in-chrome tools (own tab, closed when done; the user's tabs untouched); preview killed.
- Browser evidence above per item; console had zero errors across the whole session.

## Open flags for the lead / Brian

1. **Item 4 refresh-in-place:** a mid-conversation hard refresh of /chat still restores from sessionStorage (only navigating away drops the thread). If Brian wants every arrival pristine including refresh, remove sessionStorage persistence outright. Flagged, not done.
2. **Item 6 resume + frozen model:** the model prompt may still emit a `/resume` markdown link on rare occasion; the client no longer treats it as a link, so it would render as raw text. A model-prompt (frozen contract) change would fully close it.
3. **Item 7 home-header toggle baseline:** icon centers in the baseline-aligned home row; reads aligned, not pinned to a text baseline. One-line nudge available if Brian wants it seated lower on the home header.
4. **Item 10 ATG "4-hours" to "4 hours":** normalized per the brief; body already supports the 4-hour build figure but still opens with "one morning". Copy call for Brian.
5. **Item 11 external entry:** the external Twilio Hackpack entry stays LINKED and out of the coming-soon treatment (it is genuinely published off-site and never 404s), while its `published` flag is false. If Brian wants even the external entry to read "coming soon", say so; my read is that linking real off-site content is correct.
6. **Dash ban:** raw `git diff | grep -c` for em/en dashes prints 2, both from the lead's pre-existing `docs/STATUS.md` / `docs/DECISIONS.md` context lines, not my work. Scoped to my files it is 0.
7. **Related, out of scope (#179):** the queued /log-prefix removal (bare root slugs + 301s + slug-collision guard) rides `src/pages/log/[...slug].astro`, which this batch also edits (the getStaticPaths publish gate). The lead implements #179 after this merges; the publish gate and the URL change compose cleanly.
