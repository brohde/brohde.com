# Fix batch, Phase 1 handoff

Branch: `worktree-agent-ad6af6147452dc227`. Base: main @ `0b888b0`.
Five commits, `f3d0e7b` .. `2e27df7`. `npm run build` (astro check + build) green: 0 errors, 0 warnings, 15 hints (pre-existing). Zero em/en dashes in the added diff (scanned). No "terminal" introduced in copy. Files fenced off (terminal.ts, functions/, chat.astro, ChatBar.astro) untouched.

## What changed

### 1. About page (`src/pages/about.astro`)
- Eight Angle sentence now uses the new article-title phrasing and links to `/eight-angle-ml` (internal, no target/rel, no arrow). The `eightangle.com` external anchor is removed from the visible copy. Retained metrics kept accurate (47-class, 92.2% cross-validated, ~20fps).
- Beyond/Facebook/Google paragraph rewritten: Beyond is now plain text (bynd.com anchor removed); Facebook mention carries Brian's copy ("...including their Newsroom site, its first WordPress site and a platform Meta continues to invest in today") with the "Newsroom site" phrase linking to `/facebook-newsroom`; Google mention "Google's Android for Work website" links to `/google-android-for-work`. Gong and Twilio sentences unchanged (still external).
- Final full-time/freelance paragraph removed. In its place a quiet standalone link line: `Contact me using my AI ->` (real character U+2192) linking to `/contact`. Styled by reusing the existing `.cco` + `.dimlink` quiet-standalone-link grammar (rest dim, hover/focus accent, dim underline affordance) so no new CSS was added for it. The arrow is wrapped `aria-hidden`.

### 2. Article retitles (frontmatter `title` only)
- gold-coast: "New client type: ChatGPT designer x banker: using AI to build from PNG visual design files"
- eight-angle-ml: "I built a native iOS SwiftUI app with a custom yoga pose detection model that runs on-device." (trailing period kept as written in the brief; see flags)
- twilio-hackpack-v4: "Twilio.com Blog: Introducing Hackpack v4"
- google-android-for-work: "Google's Android for Work Website"
- Both styleguide.astro ledger specimens synced to the new eight-angle + twilio titles.

### 3. Ledger reorder via `sortDate`
- Added `sortDate: z.coerce.date().optional()` to the articles schema (`src/content.config.ts`).
- `ArticleLog.astro` and `rss.xml.ts` now sort by `(sortDate ?? date)` descending; displayed dates everywhere remain `date`.
- facebook-newsroom gets `sortDate: 2026-02-11` (one day under eight-angle-ml's 2026-02-12); its displayed date stays 2014-07-01.
- Verified dist ledger order: atg-llm-migration, gold-coast, eight-angle-ml, facebook-newsroom, twilio-hackpack-v4, google-android-for-work. Exactly the target order.

### 4. Homepage AI panel prominence (`src/styles/terminal.css`, mini-panel scope only)
Scope: `.hchat:not(.chatcomposer)` (header mini panel + homepage flow bar; shared, intended). The `/chat` composer is excluded.

| token | theme | before | after | contrast (border vs well) |
| --- | --- | --- | --- | --- |
| `--line-strong` | dark | `#33523f` | `#4e7a61` | 1.93:1 -> 3.47:1 |
| `--line-strong` | light | `#c7d0c4` | `#97a693` | 1.35:1 -> 2.27:1 |

Focus color unchanged: dark `--accent #7ee787` measures ~10.9:1 vs the well, light `--accent #086148` ~6.6:1; both frames stay well below, so `:focus-within` still reads as a distinct state change, not just a brighter border.

Placeholder: `.hchat:not(.chatcomposer) textarea::placeholder` opacity `0.4 -> 0.8` (color stays `var(--dim)`). Effective placeholder-vs-well contrast: dark ~4.68:1 (`#8fa79a` over `#12201a`), light ~4.47:1 (`#3f5348` over `#f1f2ec`), both at/above the ~4.5:1 target. The `/chat` composer keeps opacity 0.4.

All ratios computed with the WCAG relative-luminance formula (alpha-composited placeholder over the well). Not measured in a live browser; a human/Sonnet glance on both surfaces + both themes would confirm the look.

### 5. Article hero matrix band removed
- `src/pages/[slug].astro`: removed the `<HeroBand>` render + import. The stub-figure rendering for unpublished articles (the recent images-only publish path) is preserved exactly; verified facebook-newsroom's stub still renders its 2 figures + "Coming soon".
- Deleted `src/components/HeroBand.astro`.
- `src/scripts/scene/index.ts`: removed `initHeroBand`, `paintHeroStill`, `wireHero`, `heroDefer`, `HERO_INTENSITY`, and the `heroEl`/`heroCanvas`/`heroWired` module state, plus the `astro:page-load` hero call and the idle-time `initHeroBand()` bootstrap. No dead hero code remains. The main scene engine (mount/tick, `isThemeName`, PEAKS, INKS, etc.) is untouched; the transitions module is untouched.
- `src/styles/terminal.css`: removed the `.heroband` rule set and the `>=1000px` hero-mark responsive gate.
- Grep confirms zero `heroband` / `HeroBand` / `initHeroBand` / `--glyphs` / `hb-night` references in `src/` and zero `heroband` strings in `dist/`.

Article top rhythm: `.artpad` was left unchanged. About and articles both use `.wrap.artpad` directly under the same global header (`.shead` padding `14px 0 24px`); About leads with `.atitle` (margin 0), articles now lead with `.adate` (margin `0 0 8px`) then `.atitle`. Both start at the identical y-offset below the header, so the rhythm already matches About/homepage. Worth a human glance to confirm, but no measurable gap change was warranted.

### 6. Theme: always load dark
- `BaseLayout.astro` pre-paint inline script now always stamps `data-theme="dark"` (dropped the localStorage read and the light theme-color meta flip) and clears the legacy `localStorage("theme")` key in a try/catch so previously-pinned light visitors get dark again. The dark theme-color meta is kept. Verified in dist: `data-theme", "dark"` present, zero `localStorage.getItem("theme")` reads, `removeItem("theme")` present.
- `theme.ts`: replaced localStorage persistence with a module-level `let sessionLight = false`. The header toggle flips it for the visit; `astro:after-swap` re-applies from the variable, so client-side navs keep the in-visit choice while a full reload re-evaluates the module and returns to dark. `apply()` meta syncing and the polite announcer are unchanged. Removed `KEY`, `storedLight()`, `store()`, `next()` (all localStorage-bound). ThemeToggle.astro untouched.

## Flags for Brian / the lead

1. **SwiftUI is not in the eight-angle-ml article body** (only "on-device" is; verified by grep). Per the brief I applied the new title + the About phrasing as given and did NOT invent any body claim. If Brian wants the body to corroborate "SwiftUI", that is a copywriter follow-up. Brian owns the underlying fact.
2. **eight-angle-ml title keeps a trailing period** ("...runs on-device.") exactly as written in the brief. It is the only title on the site that ends in a period, and it reads as a declarative sentence in the `<title>`, h1, and ledger. Trivial to drop if it looks off; kept as specified.
3. **About Eight Angle JSON-LD**: the ProfilePage `sameAs` array still includes `eightangle.com` (structured data, not a visible link). Only the visible anchor was removed per the brief. Left in place as a legit profile link; easy to drop if the intent was total removal.
4. **Description-vs-title check** (no rewrites made, per brief):
   - gold-coast: title now says "banker"; the description + body describe a wealth-management / registered-investment-adviser client. Close but not identical framing; may want a description pass.
   - The other three descriptions still read fine next to the new titles.
5. **Contact link styling reuse**: I reused `.cco`/`.dimlink` rather than adding a new class, to honor the "terminal.css touch only the mini-panel section" fence (task 5's heroband removal was the only other authorized terminal.css edit). If the studio would rather this CTA have its own semantic class or a more prominent treatment, that is a small follow-up. The `/contact` route is being built by the parallel agent; the link is wired regardless.
6. **Panel contrast numbers are computed, not browser-measured.** One rendered glance on the homepage flow bar + header mini panel, both themes, closes it.
7. **Article top spacing** after hero removal was reasoned to match About, not visually verified in a browser (no Chrome from this agent). A quick look at any article page top vs About confirms it.

## Verification summary
- `npm run build`: green (astro check + build), 10 pages.
- dist: About has the three internal links + `/contact`, no bynd.com, no visible eightangle.com anchor, contact copy present, old closing copy gone.
- dist ledger order correct; facebook display date still 2014-07-01.
- New titles present in ledger, article `<title>`s, styleguide specimens; RSS feed empty (all articles unpublished, as before).
- Zero `heroband` in dist; facebook-newsroom stub renders 2 figures + "Coming soon".
- Inline theme script stamps dark, no localStorage read, clears legacy key.
