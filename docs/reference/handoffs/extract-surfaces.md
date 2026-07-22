# Handoff: SURFACES half of the low-risk extraction bundle (#213)

Engineer: Opus frontend (worktree `agent-a36b2051168eabe5a`). Fence: `src/styles/**`,
`src/pages/*.astro`, `src/components/*.astro`, `src/lib/schema.ts` (new).

**Result: 3 of 4 items landed; item 4 (Screen wrapper) skipped with cause. Build
green (0 errors / 0 warnings / 0 hints). The whole bundle is refactor-only:
every one of the 12 built pages is byte-identical to baseline except the
inlined `<style>`, whose rule multiset is identical and whose only reorder is
proven cascade-neutral.** All 38 `_astro/` assets (JS bundle, fonts, images)
identical, so client behavior is untouched.

## Files (6 modified, 2 new)

- `src/styles/terminal.css` — CSS option A: in-file reorg + section-map header
- `src/lib/schema.ts` — NEW: JSON-LD builders
- `src/components/ChatPanel.astro` — NEW: shared /chat + /contact surface
- `src/pages/chat.astro`, `src/pages/contact.astro` — consume ChatPanel (now ~22 lines each)
- `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/[slug].astro` — consume schema.ts

## 1. CSS option A (in-file reorg of terminal.css) — DONE

Per the css-audit handoff. The chat surface was bisected: the ledger and footer
blocks were wedged in the middle of the chat cluster. Moved both, as one
contiguous unit, up to sit after the editorial-identity block and before the
chat-surface buttons, so the whole chat surface (buttons -> slab -> /chat object
-> screen bits -> contact -> redirect -> thinking -> keybar) is now one region.
Added a SECTION MAP comment header at the top listing all 18 sections in file
order.

Done as a deterministic script (exact block move by comment markers), not hand
edits. **One gotcha for future editors:** a glob token like `.contact-*/.cc-*`
inside a CSS comment contains `*/`, which closes the comment early and breaks the
Tailwind v4 parse. The section map spells those families out in words instead.

Verification (all five requested pages: `/`, an article, `/chat`, `/about`,
`/credits`, plus `/styleguide`):
- Extracted the inlined critical CSS before/after, split into top-level rules.
- **Rule multiset identical on every page** (302 rules on `/`, 299 elsewhere;
  none added/removed/changed) — only the order differs, from index 82.
- **Cascade-neutrality proven mechanically:** the block that jumped earlier
  (ledger + footer, 15 rules: `.clog .lentry .lts .lttl .lsoon .extmark .extdom
  .sfoot .homepad .wrap .ext`) and the block it leapfrogged (chat rules, 36:
  `.cbtn .hint .slab .slab-chat .chatpad .chatbody .chatcmds .turn ...`) share
  **zero selector atoms**. No element can be matched by both groups, so their
  relative order cannot change any cascade outcome. `.ext`/`.wrap` in the moved
  block are more-specific compound selectors (`.lttl .extmark .ext`,
  `.sfoot .wrap`) whose base rules stayed at file top, ahead of both groups, so
  their order is preserved too. The section-map + reorg comments are stripped by
  the bundler: **zero built-CSS byte delta from the comments.**

## 2. ChatPanel.astro (dedupe /chat + /contact) — DONE

`contact.astro` had repeated the entire slab/composer/keybar markup of
`chat.astro` (~45 lines). Extracted the whole surface — the golden-hour `Scene`,
the `.screen` section, the docked `ChatBar` composer, the `chatbody` transcript,
and the `[clear]` keybar — into `ChatPanel.astro`. Props: `screenId`, `label`
(sr `<h1>` + slab `aria-label`), `arm` (stamps `data-contact-arm`).

**Rendered HTML byte-identical on both pages** (full-page diff, `<style>` masked).
One non-obvious detail worth keeping: `data-contact-arm` is a **bare** attribute.
Astro renders `={true}` as `="true"` but `={""}` as bare, so the component uses
`data-contact-arm={arm ? "" : undefined}` to reproduce the exact `data-contact-arm`.
There is an inline comment saying so; do not "clean it up" to `true`.

Note: the header's `data-screen` still differs between the two (`chat` vs `page`)
— that is SiteHeader deriving from the route, outside this extraction, unchanged.

## 3. src/lib/schema.ts (JSON-LD builders) — DONE

Moved the hand-written Person / WebSite / ProfilePage / BlogPosting /
BreadcrumbList literals out of `index.astro`, `about.astro`, `[slug].astro`.
Exports `personLd()`, `websiteLd()`, `profilePageLd()`, `articleLd({...})`,
`breadcrumbLd({...})`, and `JOB_TITLE`. **jobTitle is now single-sourced** (was
hardcoded "AI Product Engineer" in the homepage Person and the about Person).
The two Person shapes stay genuinely distinct (homepage carries address +
knowsAbout; about is a leaner ProfilePage-nested Person) — the builders
reproduce each literal key-for-key because `SEO.astro` serializes with
`JSON.stringify`, so **key order is load-bearing**. There is a header comment
warning not to reorder keys.

The article builders were included because they stayed a pure move.

Verification:
- Homepage + about JSON-LD **byte-identical** in the live build.
- Article builders: all 5 articles are currently stubs (no JSON-LD), so the
  path isn't exercised by the normal build. Proven separately by
  **temp-publishing gold-coast and diffing new-builder output against the
  HEAD inline-literal output — byte-identical** (both emit BlogPosting +
  BreadcrumbList). State fully restored afterward (gold-coast back to stub,
  `[slug].astro` back to the builder version).

## 4. Screen wrapper (audit proposal 3) — SKIPPED (a page fights it)

The `.screen`/`.wrap`/`<main>` scaffold is **not actually uniform**, so a single
wrapper cannot emit byte-identical output across all pages:
- `styleguide.astro` nests `<main id="main" class="wrap aboutpad">` **directly** —
  no intermediate `<div class="wrap">`. Different DOM nesting from every other page.
- `[slug].astro` carries `data-scene-theme` and has **no** `id`.
- `id` is present on only 3 of the pages (home/about/credits), absent on
  `[slug]`/styleguide/404.
Reproducing all these variants byte-for-byte needs conditional structural
branches — more machinery than the 3-line scaffold it would dedupe, and the
audit itself flagged this as wanting its own pass. Per the task's guidance (skip
the most-optional item if any page fights it), left for a later dedicated pass
if desired (it would want a real render-diff gate, not just byte-identity).

## House rules

Zero em/en dashes in any touched file (grep-verified). Visible copy touched is
byte-identical to baseline; the one apostrophe in the copy (`Brian Rohde’s work`,
chat description) is the typographic form. No co-author trailer (no commit made;
working tree left for the lead: 6 modified + 2 new, all inside the fence).

## How to re-verify (scripts are throwaway; method for the record)

1. `npm run build` (green).
2. Per-page: mask `<style>`, diff full HTML vs a pre-change baseline dist → all
   12 byte-identical.
3. Per-page: extract inlined `<style>`, split top-level rules, confirm the
   multiset is identical and the only inversions are the disjoint ledger/footer
   vs chat blocks.
4. Article JSON-LD: temp-publish one article, diff new vs `git show HEAD:` output.
