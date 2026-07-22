# source-assets (archive)

This is a private working archive, not live site content. It was the repo's root
`assets/` staging pen; nothing here is served or imported by the site. Astro
serves only `public/` and bundles only `src/assets/`, so a root `assets/` reached
no visitor. The live figures were copied into `src/content/articles/*/` and the
live fonts are the three subset `.woff2` files under `src/assets/fonts/`. This
directory is kept for provenance: the raw source captures behind the site's
figures and glyph-tide marks.

## What is here

- `fonts/circular/`: the raw licensed LL Circular Pro originals (`.ttf` plus a
  `web/` `.woff` mirror). See the license note below.
- `images/case-studies/`: full-resolution and alternate captures behind the
  article figures.
- `images/glyph-source/`: the photos used to trace the ASCII glyph-tide marks.
- `images/legacy-site/`: screenshots of the prior WordPress site.

## Flags (for the sensitivity/prune review, not resolved here)

- **Licensed font (open, conservative default applied):** the `fonts/circular/`
  originals are a licensed typeface (LL Circular Pro). They were relocated intact,
  not pruned, so nothing was lost. Before the repo goes public, confirm whether
  the raw originals should be removed entirely and whether the shipped `.woff2`
  subsets are cleared for public redistribution under the license. Do not assume
  redistribution is permitted.
- **Duplicates not pruned (conservative default applied):** several files here
  duplicate live copies under `src/content/articles/*/` (for example the
  `hero-live-2026-07.png` captures and `afw-still-15.jpg`), and some are unused
  alternates (`newsroom-still-45/75.jpg`, `afw-still-45/75.jpg`). The reorg move
  kept everything rather than delete, so the archive is complete and recoverable.
  A duplicate-and-alternate prune is available as a follow-up if a leaner archive
  is wanted; it was left for a human-reviewed pass.
