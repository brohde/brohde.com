# Handoff: article prev/next log navigation

Previous/next ("newer"/"older") navigation on the article template, top and
bottom, plus a DRY refactor that makes the homepage ledger, RSS, and the
prev/next chain share one ordering source. Build green (`npm run build`:
`astro check` 0 errors, `astro build` 11 pages). Worktree
`agent-a9756b144acc58bef`, base `cbdf1d7`.

## What shipped

- **NEW `src/lib/articles.ts`** - the single source of ledger order. Exports
  `orderKey` (`(sortDate ?? date)` ms), `byLedgerDesc` comparator,
  `orderedArticles(filter?)` (getCollection + the one sort), `articleChain()`
  (internal, non-draft, non-external, ledger-ordered = exactly the pages
  `getStaticPaths` generates), and `neighborsOf(chain, id)` -> `{ newer, older }`.
- **NEW `src/components/ArticleNav.astro`** - one component, two variants, one
  data source (`newer`/`older` passed in). `variant="top"` = compact bracket
  chips; `variant="bottom"` = the primary nav landmark.
- **`src/pages/[slug].astro`** - `getStaticPaths` now builds the chain via
  `articleChain()` (so the generated set and the chain are literally the same
  list) and passes `newer`/`older` as props. Top nav renders right after the
  date line (before `<h1>`); bottom nav renders between `</article>` and the
  existing `.aend` home/log footer.
- **`src/components/ArticleLog.astro`** - dropped its inline `orderKey`+sort,
  now `orderedArticles((e) => !e.data.draft)`. Same output, shared source.
- **`src/pages/rss.xml.ts`** - same: `orderedArticles((e) => !e.data.draft && e.data.published)`.
- **`src/styles/terminal.css`** - one new section, "article prev/next log
  navigation" (`.anavtop`, `.anavmore` + slots), appended after `.attrib`.

## Chain and neighbor matrix (verified against `dist/`)

Chain = internal, non-draft articles in ledger order (newest first). External
entries own no page and are skipped; the hop lands on the next real page. Stub
(unpublished) entries stay in the chain (they have pages). Note: as of this
build every internal article is a stub (`published` defaults false, none set
it), so all five below currently render "Coming soon." + figures with the nav
present (intended, spec item 7).

| # | slug (theme) | order key | newer (above) | older (below) |
|---|---|---|---|---|
| 1 | atg-llm-migration (atg) | 2026-07-11 | none (first) | gold-coast |
| 2 | gold-coast (goldcoast) | 2026-06-30 | atg-llm-migration | eight-angle-ml |
| 3 | eight-angle-ml (eight) | 2026-02-12 | gold-coast | facebook-newsroom |
| 4 | facebook-newsroom (news) | 2026-02-11 (sortDate) | eight-angle-ml | **google-android-for-work** |
| 5 | google-android-for-work (android) | 2015-09-01 | facebook-newsroom | none (last) |

**The external-skip case is #4.** `twilio-hackpack-v4` is external, dated
2018-10-25, so in the *full* homepage ledger it sits between facebook-newsroom
(2026-02-11) and google-android-for-work (2015-09-01). Its page does not exist,
so facebook's "older" hops over it to google-android-for-work. Confirmed in
dist: `twilio-hackpack-v4` appears in no nav href on any page.

Excluded from the chain entirely: `twilio-hackpack-v4` (external),
`twilio-signal-pong` and `brohde-com-build` (`draft: true`).

## Verification (all on built `dist/`)

- `npm run build`: `astro check` 0 errors / 0 warnings (pre-existing `z`
  deprecation hints in content.config.ts only), `astro build` 11 pages.
- Bottom-nav hrefs grepped on all 5 pages: match the matrix exactly.
- First article (atg): no "newer" slot, top + bottom. Last article (android):
  no "older" slot. Empty slot omitted, not a disabled control.
- External skip confirmed (facebook older = google-android-for-work; no
  `twilio-hackpack` in any nav).
- Landmarks per article page: exactly two, `<nav aria-label="Site">` (header)
  and `<nav aria-label="More from the log">` (bottom). The top row is a
  `<div>`, not a landmark.
- Top chips match the bottom neighbors on every page; each chip carries an
  sr-only `": <title>"` suffix so the accessible name names the destination.
- em/en-dash scan clean across all touched source + the new CSS section.
- No images, no fixed heights, static markup: CLS 0 by construction.

### What a human / validator should eyeball (no screenshots available here)

- **Top-row placement**: the `[newer] [older]` chips sit on their own line
  right under the mono date line, above the title. Confirm it reads as quiet
  header metadata, not a heavy control.
- **Wrap at ~390px**: the bottom nav stacks to one column at <=560px (newer
  above older), and the long eight-angle title
  ("I built a native iOS SwiftUI app ... on-device.") wraps naturally with no
  truncation and no horizontal scroll. Also eyeball the two-column state just
  above 560px where both titles are long.
- **Both themes** (night default + light) and a couple of article identities
  (e.g. android, news): dim->accent on hover/focus for chips and the bottom
  titles, focus ring visible (global `:focus-visible` accent outline).

## Decisions and flags (for the studio lead to log / veto)

1. **Label language: "Newer" / "Older"** (not Prev/Next, not bare arrows).
   Matches a log better than pagination language; spec-recommended. Bottom uses
   full-word eyebrow labels + full titles; top uses lowercase `[newer]`/`[older]`
   bracket tokens (the `[coming soon]`/`[clear]` family, #76 lowercase). No
   directional arrows anywhere: the site reserves the arrow glyph (the ↗) for
   external links, and left/right position + the word already carry direction.
   Flag if Brian wants arrows or "Previous/Next".
2. **Placement: newer LEFT, older RIGHT** (LTR). Justification: the ledger
   reads top-down newest-first, so "back toward the newest" maps to the line
   start (left) and "deeper into the archive / older" advances rightward.
   Implemented with explicit grid columns so each slot keeps its side even when
   the other is absent. (This is the opposite of the "<- older / newer ->"
   time-travel convention some blogs use; flag if Brian prefers that.)
3. **Two landmarks, not three.** Bottom nav is the labeled landmark
   (`aria-label="More from the log"`). The top row is deliberately NOT a second
   `<nav>` (it is part of the article header) to avoid duplicate-landmark
   confusion; its destinations are still announced via the sr-only title suffix.
4. **Chip styling** reuses the existing `.br` bracket spans (aria-hidden) +
   quiet-link grammar (rest `--dim`, engage `--accent`), 120ms ease, matching
   `.snav`/ledger/`.lsoon`. No new tokens, no new colors. Bottom hairline is
   `1px solid var(--line)`, the ledger row rule.
5. **Long titles wrap, never truncate** (no line-clamp/ellipsis); bottom titles
   use `text-wrap: pretty`. Narrow breakpoint at 560px stacks the two slots.
6. **DRY refactor touched RSS and ArticleLog** as spec'd; both produce
   byte-identical ordering to before (same key, same comparator), now via
   `orderedArticles`. `getStaticPaths` shares the chain, so the generated pages
   and the prev/next chain can never disagree.

## Files

- `src/lib/articles.ts` (new)
- `src/components/ArticleNav.astro` (new)
- `src/pages/[slug].astro` (getStaticPaths + props + two render sites)
- `src/components/ArticleLog.astro` (sort refactor only)
- `src/pages/rss.xml.ts` (sort refactor only)
- `src/styles/terminal.css` (new "article prev/next log navigation" section)
