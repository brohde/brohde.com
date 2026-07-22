# Article header & footer: design proposal

Design director, 2026-07-21. Read-only proposal per process rule #112 (recommendations reach Brian before any build). Nothing in the codebase changes on the strength of this doc.

Brief (Brian): "Have a designer propose improvements to the article header and footer."

Scope: the chrome around an article's reading column, top and bottom. Grounded in the live template (`src/pages/[slug].astro`), `src/components/ArticleNav.astro`, the global `SiteHeader.astro` / `SiteFooter.astro`, and `src/styles/terminal.css` as it stands after today's ships (#199 hero band removed, #204 prev/next nav, #205 credits page, #207 chat controls debracketed, ec711cc the `.aend` home/log chips removed from articles, 10f8b4d the "Coming soon." stub line dropped).

**Mid-round correction folded in:** Brian shipped part of the footer scope before this doc landed. As of ec711cc the article `.aend` block (`[home]` / `[log]` chips + their `border-top` rule) is gone from `[slug].astro`; the wordmark is home and the newer/older nav is the onward path. This proposal treats that post-removal state as the baseline and does not re-propose it. The `.aend` chips still live on `/about`, `/credits`, and `404`, which is now a consistency question, not an article question (see items 2 and 3).

---

## What an article actually renders today

Reading top to bottom, with the exact current values quoted:

**Global header** (`.shead`, `padding: 14px 0 24px`, mono): identity row (the "brian rohde" wordmark linking home, `about` / `contact` tokens, theme toggle) then a full chat mini-panel input row ("Ask Brian's AI anything"). Interior pages keep that input row (`data-hchat="on"`), so an article carries roughly 120px of header chrome before its own content starts.

**Article masthead** (inside `.wrap.artpad`, and `.artpad` has only `padding-bottom: 40px`, no top padding, so the masthead sits directly under the header's 24px):

1. `.adate`: mono 12.5px, `--dim`, `margin: 0 0 8px`. Reads `2026-07-11 · log`.
2. `ArticleNav variant="top"` (`.anavtop`): mono 12.5px, `--dim` chips `[newer]` `[older]`, `margin: 0 0 18px`. Same two destinations as the bottom nav, but title-less (titles live in an sr-only suffix).
3. `.atitle`: Circular 700, `clamp(28px, 5.6vw, 40px)`, `line-height: 1.12`, `letter-spacing: -0.02em`, `--bright`, `margin: 0 0 18px`, `text-wrap: balance`.
4. `.astats` when present: flex cards, `margin: 0 0 30px`.
5. `.prose`: Circular 17px/1.75, `--ink`, 62ch, carrying `style="margin-top:0"`. Published pieces open with the description paragraph then the body; stubs open straight into the article's figures (image or video).

**Article footer** (post ec711cc), two blocks:

1. `ArticleNav variant="bottom"` (`.anavmore`): `margin-top: 36px`, `padding-top: 18px`, `border-top: 1px solid var(--line)`. Newer LEFT / older RIGHT, full titles, `.navdir` mono 12px dim + `.navttl` Circular 16px bright.
2. Global `.sfoot`: `border-top: 1px solid var(--line)`, `padding: 18px 0 28px+safe`. "© 2026 Brian Rohde · credits" (Circular 13.5px dim).

One structural fact drives the footer discussion below:

- The closing zone now stacks **two** `border-top: 1px solid var(--line)` hairlines (`.anavmore`, then `.sfoot`) rather than the three it carried before ec711cc removed the `.aend` rule. `.anavmore` is now the de facto article footer, and the global `.sfoot` sits just under it.

Separately, `.homechip` (hard-coded always-night phosphor: `background: #0b110e; color: #7ee787; border: 1px solid #33523f`, `box-shadow: 0 0 14px rgba(126,231,135,.14)`, not theme tokens) is gone from articles but still renders on `/about`, `/credits`, and `404`. On the light/paper ground those are dark phosphor rectangles floating above a paper page. Post #199 (no hero band) they are the last always-night object in that chrome. This is a cross-page consistency point, addressed in items 2 and 3.

Token values used in the contrast notes below (night default / light), from `src/styles/global.css`: `--ink #d6e5dc / #14211a`, `--bright #f2f7f3 / #14211a`, `--dim #8fa79a / #3f5348`, `--accent #7ee787 / #086148`, `--line #2e4a3c / #dae0d6`.

---

## 1. The header zone

**Is the hierarchy right post hero band?** Almost. The date-as-quiet-metadata, title-as-bright-anchor relationship is correct, and with the hero band gone the title is now the page's top visual event, which is where the eye should land. One thing breaks it.

**The top chip row does not earn its place in the masthead.** `.anavtop` sits *between* the date line and the title, and it is the weakest possible content for that slot:

- It duplicates the bottom nav's destinations exactly (`neighborsOf` feeds both), so it is the same two links twice on one page.
- It is title-less by design (#204), so it teaches the reader nothing about where "older" goes. A reader deciding whether to hop cannot decide from it; they can from `.anavmore` at the bottom, which carries full titles.
- Visually it stacks a second dim mono 12.5px row directly under the date's dim mono 12.5px row, so the run-up to the title reads as one muddy two-line metadata block, and the date and title, which are the masthead couplet, are pushed apart by a navigation element that belongs to neither.

The pre-read hop is a fine idea; the placement is the problem. Editorially, prev/next is footer material (full titles, "read next"), and the one affordance that earns a spot at the top of an article is the return to the section it came from.

**Recommendation.** Replace the top newer/older chip row with a single archive-return kicker built from the word already sitting in the date line. Today `.adate` renders `2026-07-11 · log` with "log" as plain text; make that "log" the link back to the archive and drop `.anavtop` from the article. The reader keeps exactly one top affordance (back to the log), the date and title become an uninterrupted couplet, and the redundant title-less nav goes away. Full prev/next stays at the bottom where the titles are.

- **What changes:** stop rendering `<ArticleNav variant="top" ...>` in `[slug].astro`; make the "log" span in `.adate` an anchor to `/#log` in the `.adate` quiet-link idiom.
- **Files:** `src/pages/[slug].astro`, `src/styles/terminal.css` (a `.adate a` rule; `.anavtop` CSS can retire), `src/components/ArticleNav.astro` (the `variant="top"` branch becomes dead and can be removed).
- **Contrast:** no new pairing. The kicker link rests at `--dim` (7.19:1 night / 7.97:1 light on the ground, the same measured values the header `.snav` tokens and `.sfoot` copy already rely on) and goes `--accent` on hover/focus with a 1px underline, matching `.snav`. This is standalone navigation, not a link in running text, so G183's color-only trap does not bind (the same reasoning that set the header nav to dim-rest, D1 call 5), and we avoid the accent-in-text failure #99 measured (1.18:1 night / 2.23:1 light).
- **Effort:** S.
- **Veto line:** if Brian wants the pre-read hop kept as chips, move `.anavtop` *above* the date line (an eyebrow, not a couplet-splitter) rather than deleting it, and keep the "log" text plain.

**Spacing rhythm against the page top.** With no hero band capping the page and no top padding on `.artpad`, the masthead currently opens ~24px under a mono chat panel, which is tight for a 40px editorial title. Give the masthead air:

- **What changes:** `.artpad { padding-top: clamp(16px, 4vw, 40px) }`; nudge `.adate { margin: 0 0 12px }` (from 8px) so the date clears the 40px title comfortably once the nav row is gone.
- **Files:** `src/styles/terminal.css`.
- **Effort:** S.
- **Veto line:** if Brian reads the extra top air as "too much scroll before the words," drop the clamp to a flat 16px.

---

## 2. The footer zone

Brian already did the redundancy cut: the `.aend` `[home]` / `[log]` chips are gone from articles (ec711cc), correctly, since the wordmark is the standing way home and `.anavmore` (literally `aria-label="More from the log"`) is the onward path. This section takes the post-removal ending as the baseline and asks only whether it needs anything more.

**Does the new ending hold up?** Mostly yes, and it is a real improvement: two hairlines instead of three, no orphaned phosphor, and `.anavmore` reading as the de facto footer with full titles is a stronger close than a pair of title-less chips was. Two small things are worth a look.

**2a. The de facto footer is a touch quiet at the ends.** `.anavmore` is now the article's closing statement, but on the first and last articles one of its two slots is empty (a slot renders only when the neighbor exists, #204), so the last article closes on a single left-aligned "Older: ..." link sitting alone above the copyright. That reads thin for an ending. Options, in order of preference:

- Leave it (honest: there is nothing older, so nothing shows). Recommended if Brian is comfortable with the asymmetric close.
- When only one slot exists, add a quiet counter-slot back to the archive in the same `.anavmore` idiom (`.navdir` "More" + `.navttl` "All writing", or the house term "the log"), so the row always presents as a balanced two-up. This doubles as the archive return without reintroducing a chip.

- **What changes (option two):** `ArticleNav.astro` renders an archive-return slot in the empty grid column when one neighbor is null; a `.navdir`/`.navttl` pair, no new CSS.
- **Files:** `src/components/ArticleNav.astro`.
- **Effort:** S.
- **Veto line:** if Brian prefers the honest asymmetric ending, do nothing here.

**2b. Rhythm into the global footer.** `.anavmore` (`margin-top: 36px`) sits directly above `.sfoot` (`border-top`, `padding-top: 18px`), so two hairlines land about 54px apart at the very bottom. That is fine, but if 2a is vetoed and the last article ends on a lone link, consider lifting `.anavmore`'s bottom breathing room (a `margin-bottom` or a touch more `.artpad` bottom padding, currently `40px`) so the single link is not crowded against the copyright rule. Minor; only matters at the chain ends.

- **Files:** `src/styles/terminal.css`.
- **Effort:** S.
- **Veto line:** skip if 2a ships (a balanced row needs no extra air).

**Consistency note: `/about` and `/credits` still carry the `.aend` chips.** Articles now end clean; those two pages (and `404`) still close on the always-night `[home]` / `[log]` phosphor chips. That is a live inconsistency: the same footer idiom Brian just removed from articles survives on the interior pages, as dark rectangles on paper under the light theme. Recommend sweeping them to match the article ending (they have the same wordmark-is-home logic), which is one line in the phasing below. Called out, not assumed, because those pages have no prev/next nav to fall back on, so their "back to the log" affordance would need to move to the header kicker (item 1) or the global footer rather than simply vanish.

---

## 3. One control grammar for article chrome

**Where the grammar stands after #207.** The site currently runs three grammars at once:

- **Real buttons** (chat, #207): primary = accent fill (`.btn-send` / `.contact-send`, on-accent text at 12.5:1 dark / 7.2:1 light); secondary = transparent + `--dim` hairline rising to accent, 8px radius, 44px targets (`.cbtn`).
- **Bracket tokens:** `.anavtop` `[newer]` `[older]` (borderless, dim to accent) on articles, `.homechip` `[home]` `[log]` (bordered night phosphor) now only on `/about`, `/credits`, `404`, plus the ledger's `[coming soon]` status token.
- **Plain mono text links:** the header nav `about` / `contact`, and the bottom nav `.anavmore` (no brackets at all).

#207 flagged this mixed grammar as an open coherence risk. It is worth resolving on the terms #207 set: buttons are for the chat's actions, and the rest of the site already leans on quiet text links.

**Option A: debracket everything into #207 buttons.** Turn the homechips and nav chips into `.cbtn`-style buttons to match chat. Rejected: button chrome around "newer / older" is heavy for what is quiet navigation on a reading surface, and it over-applies the chat idiom to editorial nav that is not an "action."

**Option B: brackets are the nav idiom, buttons are the action idiom.** Keep brackets on all navigation, let chat buttons be the one exception. Rejected: it is not true today (the header `about` / `contact` and the bottom `.anavmore` are already bracket-free plain links), so "nav = brackets" would mean *adding* brackets to things that read fine without them.

**Option C (recommended): links look like links, buttons look like buttons, brackets survive only as a literal status token.** Resolve article chrome to the quiet text-link grammar the header nav and `.anavmore` already use (rest at `--dim` or `--ink`, hover `--accent` + 1px underline), and reserve #207's buttons for chat *actions* (send / cancel / clear / contact). Retire brackets as a general affordance from article chrome. The only bracket that stays anywhere is the ledger `[coming soon]`, which is honest: it is a status *label*, not an interactive control.

This is the smallest coherent set and it mostly composes for free: ec711cc already removed the article homechips, so the only bracketed element left on an article is `.anavtop`, and item 1 removes that. Once item 1 ships there are no bracketed interactive elements on an article at all, so article chrome lands on Option C without a dedicated restyle. Site-wide, the remaining bracket controls are the `/about`, `/credits`, `404` homechips (the item 2 consistency sweep) and the ledger `[coming soon]` status token (kept, it is a label not a control). The debracketing #207 started then finishes as a byproduct of the header cleanup and the interior-page sweep.

- **What changes:** nothing beyond item 1 for articles. If item 1 is vetoed, the residual `.anavtop` gets restyled to the quiet text-link idiom to hold Option C. The interior-page homechips are handled in item 2.
- **Files:** `src/styles/terminal.css`, `src/components/ArticleNav.astro`, `src/pages/about.astro`, `src/pages/credits.astro`, `src/pages/404.astro`.
- **Contrast:** the link idiom reuses the already-measured `--dim` rest (7.19:1 / 7.97:1) and `--accent` hover; no new pairing, and no accent-at-rest in running text (G183 safe, per the standalone-nav reasoning in #99 and D1 call 5).
- **Effort:** S (folded into 1 and 2), M only if Brian wants a deliberate site-wide bracket audit in the same pass.
- **Veto line:** if Brian likes the typed-token bracket flavor and wants to keep it as house character, fall back to Option B and *add* brackets to the header `about` / `contact` and `.anavmore` for consistency, accepting the heavier look; this is the opposite direction from #207 and should be an explicit call.

---

## 4. Serving the imagery-first article

Post #199 an article opens title, then (description for published, figures for stubs), then the figure family. Since 10f8b4d a stub drops the "Coming soon." line and the figures stand alone, so on a stub the title now runs straight into the lead image with nothing between them. The title is the masthead and the first figure is the lead visual, with no hero band and no placeholder line mediating.

The single biggest thing the header can do for image-forward pieces is get out of the way between the title and the first figure, which is exactly what item 1 delivers: dropping `.anavtop` turns the run-up from "date, nav, title, figure" into "date, title, figure," so the title reads as the lead image's masthead instead of sitting two mono rows above it. Item 1 and item 4 are the same fix seen from two sides, and it matters more now that the stub has no "Coming soon." line to absorb the gap.

Two supporting notes, no code change requested:

- `.prose` carries `style="margin-top:0"` and `.prose figure` has `margin: 26px 0`, so with the "Coming soon." line gone the title-to-first-figure gap on a stub is now a clean 26px. That is a reasonable masthead-to-lead-image coupling; leave it. Flag only if Brian wants the lead figure to sit tighter under the title (drop the first figure's top margin toward 18px).
- When `.astats` is present it sits between the title and the first figure (`margin: 0 0 30px`), so a numbers-forward case study and a visual-forward piece both want to be "first" under the title. `stats` is already optional (#86); the guidance is simply to omit it on pieces that lead with a strong image and keep it on pieces that lead with an argument. No code change; an editorial call per article.

---

## 5. Build phasing (for a later go, not now)

Each item is independently shippable and reviewable. All are S unless noted.

| # | Change | Files | Effort |
|---|--------|-------|--------|
| 1a | Drop `.anavtop` from the article; make the date-line "log" an archive-return kicker link | `[slug].astro`, `terminal.css`, `ArticleNav.astro` | S |
| 1b | Masthead top air: `.artpad` top padding, `.adate` margin 8px to 12px | `terminal.css` | S |
| 2a | Optional: `.anavmore` renders a balanced archive-return slot when only one neighbor exists (the chain-end thin-ending fix) | `ArticleNav.astro` | S |
| 2b | Sweep the surviving `.aend` `[home]`/`[log]` homechips off `/about`, `/credits`, `404` to match the clean article ending; re-home their archive affordance in the header kicker or global footer | `about.astro`, `credits.astro`, `404.astro`, `terminal.css` | S |
| 3 | Confirm Option C: once item 1 removes `.anavtop`, articles are bracket-free; item 2b clears the interior-page brackets. Restyle any vetoed remnant to the quiet-link idiom | `terminal.css`, `ArticleNav.astro` | S |
| 4 | No build; editorial guidance on stats vs lead image, optional first-figure margin tighten | (guidance) | S |

Suggested order: item 1 first (the header substance, which resolves 3 for articles), reviewed on a themed article and a stub in both grounds; then 2a and 2b as a small consistency pass. No implementation until Brian signs off on the plan.

---

## Open questions for the studio lead to take to Brian

1. **The top prev/next chips (#204 shipped them today).** This proposes replacing them with a single "log" kicker link and keeping full prev/next only at the bottom. That refines a same-day decision, so it needs Brian's explicit word. Keep, relocate above the date, or replace with the kicker?
2. **The chain-end thin ending.** The last article now closes on a lone "Older: ..." link above the copyright. Leave it honest and asymmetric, or add a balanced archive-return counter-slot (item 2a)?
3. **`/about` and `/credits` (and `404`) still carry the `.aend` `[home]` / `[log]` chips Brian just removed from articles.** Sweep them to match the clean ending (item 2b), or intentionally keep the chips as those pages' only "back" affordance since they have no prev/next to fall back on?
4. **Bracket grammar direction.** Option C (debracket article chrome, brackets survive only as the `[coming soon]` status token) is the recommendation and it finishes what #207 started. Confirm, or fall back to Option B (brackets become the site-wide nav idiom, added to header nav and `.anavmore`)?
5. **Always-night phosphor on editorial pages.** ec711cc removed the last always-night object from articles; the interior-page homechips are the last on the site. If Brian wants a phosphor accent to survive somewhere for house character, that is a deliberate choice to make rather than a thing to keep by inertia on three pages.
