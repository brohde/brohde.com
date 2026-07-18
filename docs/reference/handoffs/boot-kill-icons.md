# Handoff: kill the boot + profile icons onto the role line

Scope: two Brian-approved homepage changes in one build (#149 boot kill, #151
icons on the role line). Branch `worktree-agent-a826c5d858598c7a6`, base
9f15610, latest `main` (df155b2) merged in before this handoff. Not pushed;
the lead merges. Build green (`npm run build`: 0 errors, 0 warnings) before
and after the main merge.

## Commits (small, conventional, on the branch)

- `5f1b81f` perf: kill the homepage boot reveal (#149)
- `6a07733` feat: move the profile icons onto the role line (#151)
- (this handoff commits on top)
- merge commit: `main` (df155b2) merged into the branch, clean auto-merge

## Task 1: kill the boot (#149, seo-a11y ship-gate blocker)

The homepage boot reveal (typed "hello" + staged `.bseq` visibility gate) hid
real content long enough to push a ~4s LCP render delay, dropping mobile
Lighthouse Performance to 87 on `/` while every other page scored 100
(seo-a11y-r2). The motion spec (motion-spec-r1 section 1) already recommended
killing it. Done: all homepage content now paints from the first frame, no
reveal choreography, no blank-first-frame risk.

### What "hello" keeps (nothing broke)

- The `$ hello` line stays as static slab content.
- The `hello`/`hi`/`hey` command still runs its deterministic tour: on the
  homepage it navigates to `/chat` and renders the five-line natural-language
  page tour there (via `pendingAfter`), exactly as before. Verified in the
  browser (see validation).
- Untouched by design (#61 model contract frozen, presentation only): the 140ms
  wipe, the roving cursor / resting caret (#63), the thinking indicator (#118),
  the whole chat send flow, and the scene.

### Removed (the dead machinery, completely)

- `BaseLayout.astro`: the pre-paint inline boot gate script (added `html.boot`
  + 6s failsafe). The perceived-load contract comment and the body hydration
  comment updated to drop their boot references.
- `terminal.ts`: `runBoot()`, `cancelBoot()`, the `bootCancel` module var, the
  `cancelBoot()` call and boot `if/else` in `initPage()`, and the two
  `astro:after-swap` / `astro:before-swap` boot listeners. The file-header
  bullet listing the boot sequence removed.
- `terminal.css`: the entire `html.boot .bseq { ... }` block (and its
  reduced-motion safety net). Two stale comments corrected (the build-log-v3
  provenance line and the `.hchat` placeholder note).
- Component boot flags: `.bseq` removed from `SiteHeader` (idrow + hchat),
  `HomeIntro` (role line + the two `.cco` lines + profile links), and
  `ArticleLog` (both `.lentry` branches). `ArticleLog` and `CommandMenu` drop
  their now-dead `boot` prop; `index.astro` drops `<ArticleLog boot />`.
  `Prompt.astro` drops its always-no-op `boot` prop. `Slab.astro`'s
  booting-screen comments updated.

Sweep confirmed zero `bseq` / `bon` / `html.boot` / `runBoot` / `cancelBoot`
references remain in `src`. (`scene/index.ts` has its own internal "staged
boot" for the canvas warm-up, unrelated to the homepage boot, left untouched.)

### Lighthouse, before and after (mobile, on `/`, built dist)

| metric | before (seo-a11y-r2) | after |
| --- | --- | --- |
| Performance | 87 | 100 |
| LCP | 4033 ms (render delay 4027 ms) | 1.5 s |
| FCP | n/a | 1.2 s |
| TBT | 0 | 0 |
| CLS | 0 | 0 |

The LCP element was the first article title, blocked behind the `.bseq`
reveal; it now paints in the first frame. Ship-gate blocker cleared.

## Task 2: profile icons onto the role line (#151)

The role line "AI Product Engineer · San Francisco" now carries the
LinkedIn / Resume / X icons inline, directly after "San Francisco", separated
by the same middot:

    AI Product Engineer · San Francisco · [in] [doc] [X]

### Structure and validity

- The role line was a `<p>`; a `<ul>` cannot live inside a `<p>`. It is now a
  flex row `<div class="crole">` with three children: `<span class="crole-txt">`
  (the role text as one inline unit so the phrase never splits across flex
  items), a decorative `aria-hidden` middot, then the existing `ProfileLinks`
  `<ul>`. `align-items: center` centers the icons against the text.
- `ProfileLinks.astro` is unchanged as a component; it just renders inline on
  the role line now (and the separate `<ProfileLinks class="bseq" />` at the
  bottom of `HomeIntro` is gone).
- Accessible names kept exactly: `aria-label` "LinkedIn", "Resume, PDF",
  "X, @brianxbuilds"; svgs `aria-hidden="true"`; group label "Profiles and
  resume" on the `<ul>`. Verified in the rendered DOM.

### Tightened rhythm (WCAG 2.5.8)

- Was 44x44 boxes with a 4px gap (too airy). Now 30x44 targets (`min-width`
  30px, `min-height` 44px) with a 2px gap. Every target is >=24px wide and
  >=44px tall, so it clears the WCAG 2.5.8 24px target-size minimum outright;
  the tight spacing is not a concern because the targets are not undersized.
  Measured rects in the browser: three 30x44 links, 2px between each, no
  overlap. Reads as one snug cluster.

### Styleguide

`styleguide.astro`'s editorial-identity specimen was updated to mirror the new
structure (role line as the flex `.crole` with icons inline; the separate
`<ProfileLinks />` below it removed), so the specimen matches reality.

## Validation

- `npm run build` green (astro check + build), before and after the main merge.
- Static HTML (JS disabled): all content present, `<html lang="en">` has no
  boot class, zero `.bseq` nodes.
- Browser pass on the built dist (Sonnet subagent, `serve dist` on :4461):
  - First paint with JS on: content visible immediately, `documentElement`
    has no `boot` class, `document.querySelectorAll('.bseq').length === 0`,
    resting caret present, no reflow. PASS.
  - Role line: `.crole` is a `<div>` flex row, `<ul>` is a direct child (not
    in a `<p>`), aria-labels exact, svgs aria-hidden, group label present. PASS.
  - Tap targets: 30x44 each, 2px gaps, no overlap. PASS.
  - Hello command: types into `#in-home`, navigates to `/chat`, deterministic
    tour renders with its underlined internal links, console clean. PASS.
  - Console: clean on load and after hello. PASS.
- Mobile Lighthouse on `/`: Performance 100, LCP 1.5s, TBT 0, CLS 0 (table
  above).

Harness note for the next validator: serve the dist WITHOUT the `-s`/`--single`
SPA flag (`serve dist -l 44xx`). With `-s`, `serve` rewrites `/chat` to the
homepage HTML, which breaks the hello -> /chat tour (it looks like a regression
but is a server artifact). A first pass hit exactly this and was re-run clean.

## Flags for Brian (vetoable)

1. Icon box width: 30px (down from 44px), 2px gap. This is the "tighten the
   spacing" call; it clears WCAG 2.5.8 and keeps 44px-tall tap comfort. If it
   still reads a touch tight or a touch airy, the two knobs are
   `.cprofiles a { min-width }` and `.cprofiles { gap }`.
2. The role line grows to ~44px tall (the icons' invisible tap targets set the
   row height), so the identity block gains a few px of height versus the old
   text-only line. This is the honest cost of keeping real 44px targets on the
   line; flagged so it is a choice, not a surprise.
3. The middot separator before the icons is `aria-hidden` (a purely decorative
   separator between the role text and a labeled icon group). The dots inside
   the role text and the companies line are not hidden, matching the shipped
   convention; only this one lone separator is.
4. Boot kill removes the last homepage entrance motion. The motion spec's
   optional 300ms content fade-up (section 1) was NOT added; arrival is now the
   scene wake + the caret alone. Add it later if Brian wants a whisper of
   entrance. The tide-transition build (#150) is the separate workstream and
   was deliberately not touched here (140ms wipe intact).
