# Handoff: publish-readiness audit Phase A, domain ASTRO SURFACES

Date: 2026-07-21. Auditor: Opus code auditor (worktree `agent-a3670b6897b1a8534`).
Fence (edits): `src/pages/*.astro`, `src/components/*.astro`, `src/layouts/*.astro`,
`src/content.config.ts`. Read-everything, edit-only-those. Build green throughout.

Bar: "a strong engineer reads this cold and is impressed." Verdict on the Astro
surfaces: **strong.** Component boundaries are clean, comments are unusually
honest and decision-linked, a11y/SEO plumbing is deliberate. The mechanical debt
was small. Three files touched; behavior byte-identical except the two additive
debt items below.

## Files changed (3)

- `src/content.config.ts` — Zod deprecations (debt Q1)
- `src/layouts/BaseLayout.astro` — em dashes in comments (debt Q4)
- `src/pages/[slug].astro` — BreadcrumbList JSON-LD (A2) + responsive stub figures (A1)

## Mechanical fixes applied

1. **Zod deprecation warnings (Q1) — CLOSED.** The build emitted 15 `astro check`
   hints, not the 2 the debt note guessed. Root cause: `import { z } from
   "astro:content"` is deprecated in Astro 7 (the re-export is `@deprecated`, "use
   `astro/zod`"); every `z.*` reference inherited the warning. Plus `z.string().url()`
   carries its own Zod-4 method deprecation.
   - `import { defineCollection, z } from "astro:content"` split to
     `import { defineCollection } from "astro:content"` + `import { z } from "astro/zod"`.
   - `external: z.string().url()` to `external: z.url()` (Zod 4.4.3 top-level URL schema,
     behavior identical for an optional URL string; verified `z.url` exists and validates).
   - `z.coerce.date()` left as-is: it was never the problem (only the `z` symbol was
     flagged; the import move clears it). Schema output unchanged.
   - Result: `astro check` now **0 errors / 0 warnings / 0 hints** (was 0 / (warnings) / 15 hints).

2. **Em dashes in comments (Q4) — CLOSED.** BaseLayout carried exactly the 5 the note
   predicted, all in comment prose (the #18 ban covers comments). Replaced repo-convention
   style (colon / comma / semicolon, matching how every other comment block in these files
   separates clauses). Zero em/en dashes remain anywhere in the fence (grep-verified).

## Debt items folded in

3. **A2 BreadcrumbList JSON-LD — CLOSED.** Added `breadcrumbLd` (home to article) to
   `[slug].astro`, shipped alongside `articleLd` as `jsonLd={[articleLd, breadcrumbLd]}`.
   Gated exactly like `articleLd`: real articles only; stubs stay JSON-LD-free + noindex.
   Validated by temporarily publishing gold-coast and JSON-parsing the dist: **2 valid
   blocks, BlogPosting + BreadcrumbList**, trail `brohde.com -> https://brohde.com` then
   the article title -> its canonical URL. Reverted the temp publish.

4. **A1 responsive stub figures — CLOSED.** The stub-figure path rendered
   `<Image src alt />` with no `srcset`. Added `widths={[320,640,960,1280]}` +
   `sizes="(max-width: 700px) 92vw, 660px"` (660px = the ~62ch `.prose` column cap;
   portrait plates cap at 300px, so the smaller candidates cover them). Astro clamps to
   each source's intrinsic width automatically (Timeline-Mobile at 750w intrinsic emitted
   `320w/640w/750w`, dropping 960/1280; no upscaling). alt / width / height / loading /
   decoding all preserved; the ONLY article-page delta vs baseline is the added
   `srcset`/`sizes`. **Scope note:** this closes the gap for STUB figures only, but that
   was the whole gap: Astro 7's markdown pipeline already emits `srcset` for PUBLISHED
   body images (verified on a temp-published gold-coast, 1 img / 1 srcset), so both paths
   are now at parity and no `astro.config` change is needed.

## Verification

- `npm run build` (= `astro check && astro build`) green; 12 pages; 0 errors/warnings/hints.
- Stub-figure parser proven intact: dist figure/video counts unchanged
  (facebook-newsroom 3 fig / 1 video, google 2/1, eight-angle/gold-coast/atg 1/0).
- Diffed dist vs a pre-change baseline (content-hash-normalized): the **8 non-article
  pages (index, about, chat, contact, credits, 404, styleguide, rss.xml) are byte-identical**;
  the 5 article pages differ ONLY by the added `srcset`/`sizes` on each figure `<img>`.
- BreadcrumbList + BlogPosting JSON both `json.loads`-parse on a published article.
- `git status`: only the 3 fenced files modified; the temp gold-coast publish restored.

## Structural proposals (NOT applied — bigger than mechanical)

1. **`/chat` and `/contact` are near-duplicate templates.** `contact.astro` repeats the
   entire slab/composer/keybar markup of `chat.astro`; only `data-contact-arm`, the
   `aria-label`, and the sr `<h1>` text differ (~45 lines duplicated). Extract a shared
   `ChatPanel.astro` (props: `screen`, `label`, `arm?`) that both pages render. Removes the
   drift risk that any future chat-surface change has to be made twice.

2. **JSON-LD builders should live in `src/lib`.** The Person schema is hand-written in both
   `index.astro` and `about.astro` with genuine drift (index carries `address` +
   `knowsAbout`; about carries only `jobTitle`), and `jobTitle: "AI Product Engineer"` is
   hardcoded in three places. A `src/lib/schema.ts` with `personLd()`, `websiteLd()`,
   `profilePageLd()`, `articleLd()`, `breadcrumbLd()` single-sources the identity and the
   `@context` boilerplate. Mirrors the existing `src/lib/site.ts` pattern.

3. **The `.screen` + `.wrap` + `<main id="main">` scaffold is copy-pasted on every page**
   (`<section class="screen" id="scr-X" data-screen="X" tabindex="-1"><div class="wrap Ypad">
   <main id="main">`). A thin `<Screen screen pad>` wrapper (slotting content) would make the
   landmark + focus-target + skip-link-target invariants structural instead of per-page
   discipline. Low behavioral risk but touches all pages, so it wants its own pass.

4. **Stub-figure parser hardening.** The extractor in `[slug].astro` matches bare
   `/<figure>/` only: a future stub authored `<figure class="portrait">` would be silently
   dropped, and even if matched the rendered `<figure>` does not carry the `portrait` class
   (so the 300px plate cap is lost on stubs). All current figures are bare `<figure>`, so
   there is no live bug and no output change today; but tolerate attributes
   (`/<figure\b[^>]*>/`) and thread a `portrait` flag through `StubFig`. Best done while
   moving the whole regex extractor into `src/lib/articles.ts` (it is 25 lines of parsing
   sitting in a page frontmatter) with a small fixture test.

## Not changed, deliberately

- Comment accuracy across the fence is current: the "documenting removal" comments
  (hero band retired, `[home]`/`[log]` chips gone, top nav dropped, credits page,
  stub figures + videos) all match reality after today's churn. No stale comments found.
- a11y consistency is already clean: single `<main id="main">` per page, labeled landmarks
  (`nav aria-label`, footer contentinfo), sr `<h1>` on chat/contact, skip link to `#main`,
  aria-hidden decorative glyphs, alt-text convention consistent. Nothing to mechanically fix.
