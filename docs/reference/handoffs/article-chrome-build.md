# Handoff: article-chrome build (three approved picks)

Engineer: Opus frontend, isolated worktree `agent-ae9cb6b1eee581cd7`. Date 2026-07-21.
Source spec: `docs/reference/article-chrome-proposal.md` (items 1, 2b/3, and the chain-end note). Implemented exactly to the proposal's stated values.

## What shipped

### Pick 1 — drop the top chip row, "log" becomes the archive-return kicker
- `src/pages/[slug].astro`: removed the `<ArticleNav variant="top" ...>` render (and its comment). The word "log" already in the `.adate` line is now `<a href="/#log">log</a>`. Bottom prev/next is unchanged in behavior; its call is now `<ArticleNav newer older />` (no variant).
- `src/components/ArticleNav.astro`: removed the `variant` prop and the entire `top` branch. Component now renders only the `.anavmore` bottom nav. No dead code, no `variant` in the interface.
- `src/styles/terminal.css`:
  - `.artpad` gained `padding-top: clamp(16px, 4vw, 40px)` (proposal's masthead top-air value); `padding-bottom: 40px` kept.
  - `.adate` margin `0 0 8px` -> `0 0 12px` (proposal value).
  - New `.adate a` rule: rest `--dim`, hover/focus `--accent` + 1px underline + `text-underline-offset: 3px`, eased on the 120ms grammar. Matches `.snav` standalone-nav idiom (proposal contrast note: 7.19:1 night / 7.97:1 light at rest; G183 does not bind, standalone nav not running-text link).
  - `.anavtop`, `.anavtop .anavchip` (+ `.br`, hover/focus) rules removed. Nav comment block updated (TOP paragraph replaced with the retirement note).

### Pick 2 — Grammar Option C sweep (interior pages lose the bracket chips)
- `src/pages/about.astro`, `src/pages/credits.astro`, `src/pages/404.astro`: removed the `<footer class="aend">` blocks with their `.homechip` `[home]`/`[log]` chips. Per the proposal's Option C, the default clean ending applies: nothing replaces them; the way home is the header wordmark and the global `.sfoot` (which carries the `credits` link) follows, matching articles. Comments on each page updated to say so.
- `src/styles/terminal.css`: `.homechip` (+ `.br`, hover/focus) and `.aend` rules removed. Zero consumers remained after the sweep (verified: no styleguide specimens existed, so nothing to sync/remove there).
- Article chrome now lands on Option C for free: no bracketed interactive element remains on any article, about, credits, or 404. The only surviving bracket anywhere is the ledger `[coming soon]` status token (confirmed still present in the homepage dist).

### Pick 3 — chain ends stay thin
- Nothing built. No balanced counter-slot was added; `ArticleNav` still renders a slot only when the neighbor exists, so the first article keeps a lone "Older" and the last a lone "Newer". This is the honest asymmetric close the proposal's item 2a lists as its recommended option.

## Verification
- `npm run build` green (astro check + astro build, chained). 12 pages built.
- dist checks all pass:
  - No `anavtop`/`anavchip`/`homechip`/`aend` in any built HTML or in the inlined CSS.
  - Article `.adate` carries `<a href="/#log">log</a>` (checked eight-angle-ml + gold-coast).
  - Zero `homechip` occurrences in about/credits/404.
  - `[coming soon]` bracket token still in the homepage ledger.
  - `.adate a` rule and `.artpad{padding-top:clamp(16px,4vw,40px)...}` present in inlined CSS.
- Em/en-dash scan clean across all touched source files and all built HTML.
- No new straight apostrophes in reader-visible copy (the only `'` hits are in pre-existing code comments).

## Human-eyeball items (environment-blocked; need Brian or a browser subagent)
1. Spacing rhythm at the top of an article: the new top air (`clamp(16px,4vw,40px)`) + 12px date margin, with the nav row gone, so the run-up reads date -> title -> figure. Confirm it isn't "too much scroll before the words" (proposal's veto line: drop the clamp to a flat 16px if so).
2. Both themes (night default + light): the "log" kicker link at `--dim` rest / `--accent` hover, and that the interior pages (about/credits/404) read fine ending clean with no phosphor chips on the paper ground.
3. 390px width: masthead top air and the `.adate` line at phone width; interior-page clean endings into the global footer.

## Flags for the lead / Brian
- Interior pages (about/credits/404) no longer have any in-page "back to the log" affordance. Per the proposal that return re-homes to the header (wordmark = home) + the global footer; this was the accepted Option-C tradeoff (proposal item 2b, open question 3). Worth a glance that Brian is comfortable those pages lean entirely on the header wordmark for "home".
- The `.attrib` CSS rule (Android CC BY credit styling) was left untouched: out of scope, and the credit itself lives on /credits now. Not dead per this task's scope; flag only.
- DECISIONS/COMMS/STATUS not updated from the worktree (lead owns those on merge).
