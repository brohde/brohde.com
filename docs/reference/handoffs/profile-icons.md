# Handoff: homepage profile links as icons (#146)

Branch: `worktree-agent-a8db0f5eb47e482d0`. Small scoped build. The homepage
profile row (LinkedIn / Resume / X) now renders as monochrome inline-SVG icons
instead of the text words.

## What shipped

- **New component `src/components/ProfileLinks.astro`**: the three profile
  links as inline SVG icons (LinkedIn "in" bug, a document glyph for Resume,
  the X logo). It owns the markup and the glyph path data, imports `LINKS` from
  `@/lib/site`, and accepts an optional `class` prop (the homepage passes
  `bseq` so the row still joins the boot reveal).
- **`src/components/HomeIntro.astro`**: the inline `<ul class="cprofiles">`
  block is replaced by `<ProfileLinks class="bseq" />`. `LINKS` dropped from
  its import (now used only inside the component). Header comment updated.
- **`src/pages/styleguide.astro`**: the old two-item text specimen under
  "editorial identity" now renders the real `<ProfileLinks />`, so the
  styleguide stays honest and the SVG paths live in exactly one place.
- **`src/styles/terminal.css`**: `.cprofiles` split off from the `.cco a`
  underline grammar and given the icon treatment (see "styling" below).

## The icon-only vs labeled call (yours to veto)

**Shipped: icon-only.** This is Brian's literal ask ("rendered as ICONS instead
of text words"). LinkedIn and X are near-universally recognized marks; every
link keeps a full accessible name (aria-label) and a `title` tooltip, so the
name is one hover or one screen-reader stop away.

**Honest cost:** the document glyph for Resume is the least self-evident of the
three (a page icon can read generically). Its `title="Resume (PDF)"` and
`aria-label="Resume, PDF"` answer it on hover and to assistive tech, but a pure
silent visual scan by a sighted mouse user relies on recognizing "document =
resume." If Brian wants belt-and-suspenders clarity, the **labeled variant** is
a one-line-per-link change (mocked in the component's header comment):

```
<a ...><svg .../><span class="cplabel">LinkedIn</span></a>
```

with `.cprofiles a { gap: 7px; padding: 0 10px }` and
`.cplabel { font-size: 13px }`. Recommendation stands at icon-only; flag for his
veto.

## Styling (terminal.css)

- Icons rest at `--dim`, go `--accent` on hover and `:focus-visible`, driven
  through `fill="currentColor"` on the SVGs. This is the site's quiet
  standalone-link grammar (`.snav`, the ledger rows), not the `.cco` running-
  text grammar: these are not links in a block of text, so WCAG G183 / #99 does
  not bind and there is nothing to underline. The dim-to-accent shift plus a
  focus ring carry the affordance.
- `:focus-visible` draws a `2px solid var(--accent)` outline at
  `outline-offset: -2px` (contained inside the target, never overlapping a
  neighbor).
- Each 18px mark is centered in a 44x44 target built from `min-width` /
  `min-height`, no visible chrome. Row gap is `0 4px`. Icons are narrower than
  the old words, so the row gets tighter, not heavier. The 44x44 rule is
  unconditional (neither mobile breakpoint touches `.cprofiles`), so tap
  targets hold at phone widths.
- No brand color on the third-party marks: the phosphor ink system owns the
  site identity (#135 spirit). The marks read the same quiet mono on both
  grounds and invert cleanly to accent.
- Interim no-arrow rule kept: these links carry no external `↗` markers (#68
  covers the ledger arrows only).

## Accessibility

- `<ul aria-label="Profiles and resume">` semantics kept.
- Accessible names (verified on the live DOM by the Sonnet browser validator):
  LinkedIn -> "LinkedIn"; Resume -> "Resume, PDF"; X -> "X, @brianxbuilds"
  (reuses `LINKS.xHandle`). Each `<a>` also has a `title` tooltip.
- Each inner `<svg>` is `aria-hidden="true"` + `focusable="false"`, so the name
  is sourced once, from the link, and legacy engines add no second tab stop.
- Keyboard: the site's roving-cursor model (#75) walks the links in order
  LinkedIn -> Resume -> X; each shows the visible accent focus ring on
  `:focus-visible`.

## Icon sources and licenses

- **LinkedIn "in" bug** and **X logo**: standard brand-mark path data (the
  canonical 24x24 outlines also distributed by Simple Icons, whose SVG assets
  are CC0 1.0). The underlying marks remain the trademarks of their owners. Use
  here is **nominative and functional**: a direct link to Brian's own LinkedIn
  and X profiles, rendered in monochrome `currentColor` with no brand color,
  which is the most defensible kind of third-party-mark use and is consistent
  with #135's "third-party marks used quietly, mono, no brand color" spirit.
  Materially safer than decorative tide use because it identifies the very
  service each link points to.
- **Resume document glyph**: hand-authored in-house (a clipped-corner page with
  a folded corner and three text lines, `fill-rule="evenodd"` knockouts). No
  license considerations.
- Everything is inline SVG in `currentColor`: vector-crisp on retina, theme-
  independent (no brand color to re-audit per ground), zero network requests,
  and fixed `width`/`height` so no layout is reserved late.

## Verification

- `npm run build` passes clean (chat-prompt codegen + `astro check` + `astro
  build`; 10 pages, 0 type errors).
- Sonnet browser validator (no-Chrome-on-Fable, #82), both grounds via
  `/styleguide` + the live homepage, all six checks PASS:
  - both grounds render three legible dim icons in order;
  - hover brightens only the hovered icon to accent, no underline;
  - `:focus-visible` shows a clear 2px accent ring, order LinkedIn/Resume/X;
  - accessible names exact (list above); svgs aria-hidden; no `↗` in the row;
  - tap targets measured 44x44 each, confirmed viewport-unconditional in CSS,
    row reads compact not bloated;
  - CLS 0 (no layout-shift entries; the `bseq` reveal animates opacity only,
    the row reserves its space through boot).
  - Tooling caveats noted by the validator (native Tab and viewport resize did
    not register in the shared automation session); both were worked around
    with equivalent verification (direct keydown-handler traversal, CSS source
    inspection), no defect surfaced.

## Loose ends / for Brian

1. **icon-only vs labeled** (above): recommendation icon-only; veto open.
2. The **document glyph** is the one icon that trades a little immediate
   legibility for the cleaner row; call it if you want the label back for
   Resume only, or a different Resume glyph.
3. D3's homepage adaptation may relocate or restyle this block; the component
   makes that a one-import move.
