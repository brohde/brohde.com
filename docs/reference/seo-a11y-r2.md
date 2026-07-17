# SEO + accessibility sweep, round 2

Post merge sweep of the built `dist/` output at commit 4d7c450 (10 pages). Served locally via `npx serve dist -l 4450` and audited with curl (raw HTML, no JS), Lighthouse 13.4.0 (mobile), and direct source reads for anything the rendered surface can't show (reduced motion, gated logic). Scope follows the brief: SEO, WCAG 2.2 AA accessibility, LLM readability, performance. Findings are grouped by severity; every item cites a file and line or a rendered artifact.

## Verdict

**Ship gate: PASS, with one blocker to clear first.**

- 1 ship blocker: the homepage's boot reveal sequence delays the page's real content (and the Lighthouse LCP element) by roughly four seconds, dropping mobile Performance from the site's established 100 baseline to 87 and landing Largest Contentful Paint in Google's "poor" band. Every other page (article, /chat) scores a clean 100/100/100/100 (or 100/100/100/66 on /chat, expected and accepted for a noindex page).
- 3 should fix items: the skip link is invisible even when focused, the homepage's article dates aren't marked up as machine readable `<time>`, and the sitemap's URLs disagree with the canonical tag's trailing slash convention.
- Everything else audited (see the pass list at the end) is clean: robots meta, sitemap contents, JSON-LD, Open Graph and Twitter cards, external link hygiene, contrast on every new surface asked for, the aria-live setup in the chat flow, reduced motion coverage, heading order, landmarks, alt text, and touch targets.

---

## Ship blocker

### 1. Homepage boot sequence delays real content ~4s, Performance 87 not 100, LCP in "poor" territory

**Page:** `/` only. **Evidence:** Lighthouse mobile run against `http://localhost:4450/`: Performance 0.87, LCP 4033ms, LCP breakdown audit reports `elementRenderDelay: 4027.277ms` against a `timeToFirstByte` of 5.985ms. The flagged LCP element is `main#main > section#log > a.lentry > span.lttl`, the title text of the first article row. TBT and CLS both hold at 0. The article page (`/log/facebook-newsroom`) and `/chat` both score a clean 100/100/100 Performance/Accessibility/Best-practices in the same run (LCP 1655ms and 1519ms), which isolates the regression to the homepage.

**Root cause, confirmed in source:** every element carrying the `.bseq` class (`src/components/SiteHeader.astro:55`, `:76`; `src/components/HomeIntro.astro` bio lines; `src/components/ProfileLinks.astro` row; all six `.lentry` rows in `src/components/ArticleLog.astro:39` and `:59`) is set to `visibility: hidden` while `<html class="boot">` is present, and only flipped to `visibility: visible` one at a time by `runBoot()` in `src/scripts/terminal.ts:1056-1120`, gated behind a typed "hello" animation (`T_HOLD` 500ms + per character typing + a 460ms beat) before the reveal even starts, then stepping through all 12 `.bseq` elements 50ms apart. Content is real and server rendered throughout (good for crawlers and LLMs, `terminal.css:1298-1300` says as much), but it is invisible to a human or to Lighthouse's paint timing until the JS timer un-hides it, and under Lighthouse's throttled mobile CPU/network profile that reveal doesn't finish until ~4s in.

This is a direct regression against the site's own standing bar: decision #70 in `docs/DECISIONS.md` names "Lighthouse mobile: Perf 100, TBT 0, CLS 0" as the accepted baseline, and decision #62 makes "visitors see content immediately" a standing requirement. Decision #139 already flags the boot sequence as live-but-unreviewed pending a fresh motion pass ("withdrawal frees the design, it does not order a removal"); this sweep supplies the missing performance number that makes the pending review time sensitive.

**Not a regression in accessibility or CLS:** `visibility: hidden` (not `display: none`) preserves layout, so CLS stays 0, and the reduced motion path is already correct (`terminal.css:1311-1316` forces `.bseq` visible under `prefers-reduced-motion: reduce`; `terminal.ts:1147` gates `runBoot()` on `!RM()`). The defect is specifically that the default, non-reduced-motion experience (what most visitors and what Lighthouse both get) hides the homepage's actual content for multiple seconds.

**Proposed fix (either closes the gate):**
- (a) Exercise decision #139's standing option and retire or shorten the boot sequence now, or
- (b) keep the boot but exempt the first viewport's real content (at minimum the first `.lentry` row, ideally the whole `.clog` list) from `.bseq` gating so it paints immediately while lower-priority rows still stagger in behind it.

---

## Should fix

### 2. Skip link is clipped to 1px even when it has keyboard focus

**Page:** every page (shared `BaseLayout.astro`). **Element:** `<a href="#main" class="sr">skip to content</a>` at `src/layouts/BaseLayout.astro:185`. **Evidence:** `.sr` in `src/styles/global.css:259-269` is the standard visually hidden utility (`position: absolute; width: 1px; height: 1px; clip: rect(0 0 0 0); overflow: hidden;`) with no companion `:focus` rule anywhere in the codebase (confirmed by grep across `src/styles/*.css`). The site's generic `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` at `global.css:249` still applies, but drawing a 2px ring around a 1px by 1px box does not make the link legible or locatable on tab. Lighthouse's automated `bypass` audit reports "not applicable" here only because the page's landmark structure independently satisfies axe's rule, it isn't validating that the skip link itself works.

**Effect:** the skip link functions for anyone who activates it blind (focus does move to `#main`), but it delivers zero benefit to the sighted keyboard users it exists for, since a Tab press never visibly reveals it. This is the textbook WCAG technique gap (G1: bypass blocks via a link that becomes visible on focus).

**Fix:** give `.sr` (or a dedicated `.skip-link` class used only here) a `:focus` rule that un-clips it: reposition to a visible, high contrast box at the top of the viewport on focus, matching the site's existing accent/ground tokens.

### 3. Homepage article dates aren't marked up as `<time datetime>`

**Page:** `/` (and anywhere `ArticleLog.astro` is reused). **Element:** `<span class="lts">{isoDate(post.data.date)}</span>` at `src/components/ArticleLog.astro:43` and `:62`. **Evidence:** rendered homepage HTML confirms these are plain `<span>` nodes (`<span class="lts">2026-06-30</span>`, etc.), not `<time>`. This is inconsistent with the article page template itself, which does this correctly: `<time datetime={isoDate(date)}>{logStamp(date)}</time>` at `src/pages/log/[...slug].astro:80`. The homepage's list of dated entries is the single most date-heavy, most-crawled surface on the site (it's the whole content index), and it's the one place dates aren't machine readable.

**Fix:** wrap the `.lts` span content in `<time datetime={isoDate(post.data.date)}>…</time>` in both branches of `ArticleLog.astro`, mirroring the article template.

### 4. Sitemap URLs disagree with canonical tags on trailing slash

**Pages:** all 7 indexed URLs. **Evidence:** `dist/sitemap-0.xml` lists every entry with a trailing slash (`https://brohde.com/about/`), while every page's own `<link rel="canonical">` omits it (`https://brohde.com/about`, confirmed in rendered `about.html` and every article). Source: `astro.config.mjs` sets `trailingSlash: "ignore"`; `src/components/SEO.astro:31-34` explicitly strips the trailing slash when building the canonical, but the `@astrojs/sitemap` integration derives its URLs from the `dist/**/index.html` file layout, which always has the slash. Internal links (nav, homepage ledger) also omit the slash, matching canonical, not the sitemap. Both URL forms currently serve identical 200 content with no redirect either direction (verified via `curl -I` on `/about` and `/about/`), so this isn't a duplicate-indexing risk today because the canonical tag is present and correct on both, but it's a sloppy, easily fixed inconsistency that search engines' own guidance says to avoid (sitemap URLs should match the canonical form).

**Fix:** either set `trailingSlash: "never"` in the sitemap integration's URL normalization (or post-process `sitemap-0.xml`), or accept the slash as canonical everywhere and stop stripping it in `SEO.astro`. Either is a one-line change; just make the two agree.

---

## Nice to have

### 5. Robots.txt disallow + meta noindex both apply to /chat and /styleguide

**Pages:** `/chat`, `/styleguide`. **Evidence:** `dist/robots.txt` disallows both paths; both pages also carry `<meta name="robots" content="noindex, nofollow">`. Search engine guidance recommends picking one mechanism, not both, because a robots.txt disallow prevents a crawler from ever reading the noindex tag, so if a URL is discovered any other way (an external backlink, for instance) the disallow can leave it indexed with no snippet, while noindex alone would reliably deindex it once crawled. Verified this is currently low risk: no page in the built site links to `/chat` or `/styleguide` via a real `<a href>` (chat is form-submitted via JS, per `src/components/SiteHeader.astro:76`), so internal discovery can't trigger it. Leaving as a documented, low-priority cleanup rather than a should-fix given the near-zero current exposure.

**Fix (optional):** drop the robots.txt disallow lines and rely on the noindex meta tag alone, or keep both and accept the (currently small) theoretical risk.

### 6. Article hero images ship at full captured resolution with no responsive `srcset`

**Page:** `/log/facebook-newsroom`. **Evidence:** `<img src="/_astro/Homepage-Localized.EqQnfnPo_Zbq71W.webp" width="2559" height="1855" srcset="">` and a second image at 750x1334, both with an empty `srcset` attribute (harmless, browsers fall back to `src`, but confirms no responsive variants are generated). File sizes are already modest (94KB and 44KB) and both are `loading="lazy"`, so this isn't hurting Core Web Vitals today (article LCP measured 1655ms, clean), but a phone downloads the same 2559px-wide file a desktop does.

**Fix (optional):** wire the markdown image pipeline through Astro's `<Image>`/`getImage` with a `widths`/`sizes` set so smaller viewports fetch a smaller variant.

### 7. No BreadcrumbList structured data

**Pages:** articles, `/about`. **Evidence:** JSON-LD present is `Person`/`WebSite` (home), `ProfilePage`/`Person` (about), and `BlogPosting` (all 5 articles), all valid and correctly dated, but no `BreadcrumbList`, despite a clear home to log to article hierarchy. Low priority since the site has no deep nesting to disambiguate, but it's a cheap, standard win for search result breadcrumb display.

---

## Pass notes (explicitly checked, clean)

**SEO**
- Titles and meta descriptions: unique per indexable page, no duplicates, no truncation issues seen.
- Canonical tags: present and correct-path on all 10 pages (see should-fix #4 for the trailing slash nuance, which doesn't break correctness).
- Robots meta: `index, follow, max-image-preview:large` on all 7 indexable pages; `noindex, nofollow` on exactly `/404`, `/chat`, `/styleguide`, and nothing else.
- `sitemap-index.xml` → `sitemap-0.xml` contains exactly the 7 indexable URLs (home, about, 5 articles); no noindex pages present, no missing articles.
- `robots.txt`: valid, points at the sitemap index, disallows `/chat` and `/styleguide`.
- Open Graph / Twitter cards: present and correct on all 10 pages; `og:image`/`twitter:image` point at `dist/og.png`, confirmed 1200x630 on disk, matching the declared `og:image:width`/`height` meta exactly; the gating logic in `src/components/SEO.astro` (dimensions only render for the default image) never actually triggers since every page currently uses the default image, so it's untested in the gated-off state but correct in the state that ships.
- JSON-LD: valid JSON on every page that carries it (parsed programmatically, zero errors); `BlogPosting` dates match the pre-dated convention exactly, including the corrected 2015-09-01 Android date and the historical 2014-07-01 Facebook date.
- External links: every external `<a>` site-wide carries `rel="noopener"` (checked all 10 pages, zero exceptions) and `target="_blank"`.
- `.extmark` external-domain markup: the ↗ glyph is `aria-hidden`, the destination domain (e.g. "twilio.com") is a real, un-hidden text node, and a `.sr`-only "(opens in a new tab)" suffix rides inside the same accessible name. Exactly the pattern the brief asked to verify.
- RSS (`rss.xml`): valid RSS 2.0, all 6 log entries present including the external Twilio entry with its real external link and guid, correct `pubDate` formatting.
- 404 handling: unmapped paths return HTTP 404 and render the noindex 404 page correctly.

**Accessibility**
- Heading order: single `h1` per page, sequential `h2`s in every article body, no skipped levels, on all 10 pages.
- Landmarks: one `banner` header, one `main`, one `contentinfo` footer per page; multiple `nav` elements each carry a distinct `aria-label` ("Site", "Commands", "Article log" as a labeled section) so they're distinguishable to assistive tech.
- Decorative hero band: `src/components/HeroBand.astro` renders an empty, `aria-hidden="true"` div with the glyph texture painted via a CSS `::before content` custom property, never as real text, so it's invisible to screen readers, reader mode, and find-in-page, and adds zero noise for an LLM reading the page.
- Alt text: both article images carry detailed, specific, non-generic alt text (not "screenshot of website").
- Profile icons row (`src/components/ProfileLinks.astro`): each link has a real accessible name via `aria-label` ("LinkedIn", "Resume, PDF", "X, @brianxbuilds"), the decorative SVGs are `aria-hidden` + `focusable="false"`, and `.cprofiles a` in `terminal.css:288-296` confirms a 44x44 minimum target with a visible `focus-visible` ring.
- Header nav touch targets: `.snav :is(a, button)` in `terminal.css:136-142` is `min-height: 44px` with 8px horizontal padding, well past the WCAG 2.2 minimum.
- Contrast, computed against the actual CSS custom properties in both grounds:
  - `.attrib` (Android CC BY attribution line, `terminal.css:1226-1233`) and `.extmark`/`.extdom` (external domain markup) both use `color: var(--dim)` on `var(--ground)`: 7.19:1 on the night ground (`#8fa79a` on `#0e1512`), 7.98:1 on the light ground (`#3f5348` on `#fbfbf8`), both independently recomputed and clearing 4.5:1 with wide margin.
  - `.redirect .rdx-clock`/`.rdx-count` (chat countdown line) live inside `.slab`, which fixes its own token set to always-night values (`terminal.css:509-519`) regardless of site theme; the codebase's own measured ratios (dim 7.41:1, mint accent 12.42:1 on the slab ground, cited in `terminal.css:505-506`) hold since nothing here overrides those tokens.
  - `.snav` nav links: dim-on-ground 7.19:1 night / 7.97:1 light, matching the code comment at `terminal.css:127-129` almost exactly.
- Reduced motion: verified in source, not just claimed. The homepage boot script checks `matchMedia("(prefers-reduced-motion: reduce)")` before ever adding `.boot` to `<html>` (`BaseLayout.astro` inline script) and again before running the reveal (`terminal.ts:1147`); `terminal.css:1311-1316` is a second, independent safety net forcing `.bseq` visible under reduced motion regardless. The ambient scene listens for `prefers-reduced-motion` changes live and jumps to a static frame (`src/scripts/scene/index.ts:288, 616, 728`). The chat thinking dots swap to a static "Thinking…" label under reduced motion per the existing, already-accepted decision #118. The redirect countdown's ticking number is plain text updated by a timer, not a CSS animation, so it needs no reduced-motion branch and has none.
- Chat aria-live: exactly one lazily-created, body-level `aria-live="polite"` announcer (`announcer` singleton in `terminal.ts:171-184`) is reused for every chat-flow state (reply arrival, "Thinking…", the redirect announcement, and the "Staying here." cancel announcement). The ticking countdown number itself is `aria-hidden`, so it is never re-announced per tick, only the one state-change sentence is spoken. `theme.ts` maintains a separate, unrelated `#theme-announce` region for the theme toggle and `Slab.astro`'s `#hint-top` is a separate one-time cursor-navigation hint; neither overlaps the chat flow's announcer, so there's no double-announcement risk across the three.
- Redirect countdown WCAG 2.2.1 (Timing Adjustable): the 5s auto-navigate is cancellable via Escape, a visible "Stay here" button, or simply typing, satisfying the "turn off" exception; verified wired end-to-end in `terminal.ts` (Escape at line 1278/1284, typing at 1264, button click at 710).
- Keyboard: skip link present (see should-fix #2 for its visibility bug, not its function), single shared roving-cursor/tab-stop model documented and consistent across header, ledger, and chat composer, focus never leaves the originating input across a cancelled redirect (`terminal.ts:776-778`), no keyboard traps found.
- Header chat input dedupe: `data-hchat="off"` on `/` and `/chat` maps to `display: none` (`terminal.css:208-210`), confirmed in rendered HTML on both pages; `display: none` correctly removes the duplicate input from both the render tree and the tab order, no dead focus stop.

**LLM readability**
- All 10 pages fetched with plain `curl` (no JS execution) and every heading, paragraph, list, figure/figcaption, date, and link was present and correct exactly as shown to a browser; nothing depends on client-side rendering.
- No stray unconverted markdown syntax found in any rendered article body (checked all 5 articles).
- Article body semantic HTML: real `<figure>`/`<figcaption>` pairs, real `<h2>` section headings, ordinary `<p>`/`<ul>` content, confirmed on `/log/facebook-newsroom`.
- No content locked inside `<canvas>` or script-only rendering; the ambient scene and hero band are both explicitly `aria-hidden` decoration layered behind real, static HTML content, never a substitute for it.

**Performance (beyond the one blocker)**
- `/log/facebook-newsroom`: Lighthouse mobile 100/100/100/100, TBT 0, CLS 0, LCP 1655ms.
- `/chat`: Lighthouse mobile Performance 100, Accessibility 100, Best Practices 100, SEO 66 (expected: the noindex meta tag on a JS-driven chat surface is exactly what decision #87 already accepted as the correct, by-design score for this page). TBT 0, CLS 0, LCP 1519ms.
- Fonts: Circular preloaded with `crossorigin`, `font-display: swap` on every `@font-face`, system-font fallback metrics tuned (`size-adjust`/`ascent-override`/`descent-override`) to avoid a reflow when the webfont swaps in.
- CSS: fully inlined per page (`build.inlineStylesheets: "always"`), zero render-blocking stylesheet requests on any page.
- og.png: exactly 1200x630 on disk, matching every page's declared `og:image:width`/`height`.

---

## What I did not do

- Did not test with a live screen reader (VoiceOver/NVDA); findings on the aria-live setup, landmark structure, and the skip link are source-verified and Lighthouse-checked, not screen-reader-verified.
- Did not load-test or fuzz the `/api/chat` endpoint; this sweep is static-output/SEO/accessibility only, not the #49 chat security audit (a separate, already-tracked gate).
- Did not re-run the 38-question chat eval; out of scope for this sweep.
- Local server (`npx serve dist -l 4450`) was killed at the end of this session; nothing was left running.
