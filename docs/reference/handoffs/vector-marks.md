# Handoff: vector-driven scene marks

_Scope: upgrade the glyph-tide scene marks from hand-traced canvas code to
build-time rasterized vector sources, fixing the two marks Brian flagged (the
Twilio circles and the Eight Angle logo) and replacing the two client
letterform stand-ins with the real logos. Built on branch
`worktree-agent-a302152ba8d83af28`; the lead merges. Written per the CLAUDE.md
handoff rule._

## What shipped

Files touched (nothing outside the fence):

- `src/assets/marks/*.svg` (new): the four true vector sources (twilio, logo,
  gccm, atg), single color, transparent ground, licensing noted in each file.
- `tools/build/build-marks.mjs` (new): rasterizes those SVGs into the scene's
  480x300 source frame at the #104 ink ratio and emits a compact grayscale grid
  module. Wired into `npm run build` before `astro`.
- `src/scripts/scene/marks.generated.ts` (new, COMMITTED): the emitted grids
  (base64, 80x50, 255 = ground, 0 = ink). See the gitignore note below.
- `src/scripts/scene/sources.ts` (edited): a `paintGrid` runtime drawer and a
  `gridOr` factory; the twilio/logo/gccm/atg entries in `DRAW` now paint the
  generated grid, with the old hand-drawers kept as per-mark fallbacks.
- `package.json` (edited): build-script wiring + `@resvg/resvg-js` devDependency
  (and its consequent `package-lock.json` update).

No change to `index.ts`, `palettes.ts`, `placements.ts`, `Scene.astro`, or any
page. The tide engine, the theme/state machinery, the PEAKS colors, and the
`THEME_SOURCE` map are all untouched: this rides entirely through the existing
`DRAW` seam (a drawer fills the 480x300 white-ground/black-figure frame; the
engine samples, inverts, and contain-fits it as before).

## Pipeline design

1. **Vector sources** live in `src/assets/marks/<sourceName>.svg`, filled solid
   black on a transparent ground. The build reads shape from the alpha channel
   only, so the source color is irrelevant (the tide recolors every mark from
   `PEAKS`); solid fill keeps that read clean.
2. **`build-marks.mjs`** (Node, build time): for each SVG, rasterize with
   `@resvg/resvg-js` at 1000px wide, take alpha as ink coverage, find the tight
   ink bbox, then contain-fit that bbox into the 480x300 frame per #104 (ink
   height ~= 0.84 of the frame, tall marks seated on the 8% bottom safe line,
   wide-short marks centered vertically, width capped at 0.92). Box-downsample
   the placed frame to an 80x50 grayscale grid and base64 it into
   `marks.generated.ts`. The step never fails the build: if the rasterizer is
   missing it logs and leaves the committed grids in place.
3. **Runtime drawer** (`paintGrid` in `sources.ts`, browser): decode the base64
   grid into an `ImageData`, put it on a tiny GRID_WxGRID_H canvas, and
   `drawImage` it up into the 480x300 frame with smoothing on. Fully synchronous:
   no fetch, no async, no flash. `sample()` in `index.ts` then contain-fits the
   frame into the mark region exactly as it does for a hand-drawer.

**Grid resolution (measured, not guessed).** `index.ts` samples the mark region
of the field at roughly 20x10 cells on a laptop gutter and ~31x16 at the
`CELL_CAP` ceiling on a large monitor. An 80x50 grid (8:5 like the frame, 6px
cells) is ~2.5x the finest real sampling, so box-averaged downsampling reads
clean while the module stays small. Going finer only bloats the bundle; the tide
re-averages it away.

**Rasterizer choice.** `@resvg/resvg-js` (devDependency): a well-known napi
wrapper around the resvg renderer, prebuilt binaries, no system deps, widely
used for build-time SVG rasterization (e.g. OG-image generation). `render()`
exposes raw RGBA pixels directly, so no PNG decoder is needed. It is a
build-only tool: nothing from it ships to the browser or the Worker.

**Committed, not gitignored (a deliberate deviation from the chat-prompt seam).**
`functions/api/_chat-prompt.generated.ts` is gitignored because it is server
only. `marks.generated.ts` is imported by CLIENT code (`sources.ts` -> the scene
runs in the browser during `astro dev`), so a fresh clone running `npm run dev`
without a full build would fail on a missing import. Committing the deterministic
grids keeps dev and CI dependency-free and makes `@resvg/resvg-js` a pure
local-regeneration tool. The build still regenerates the grids every time, so
they never drift, and the codegen never fails the build.

## Per-mark verdicts

Ratios are the emitted-grid measurement (ink bbox / grid, coverage > 0.5),
mirroring #104's method so they compare directly to the matrix-identities
numbers.

| mark | verdict | source | ink w x h | bottom | license posture |
|---|---|---|---|---|---|
| `twilio` | CONVERT (priority fix) | official Twilio mark via simple-icons (`simpleicons.org`) | 0.525w x 0.840h | 8.0% | Twilio trademark, nominative/documentary use per #98; Brian explicitly ordered the Twilio mark geometry (#135). Icon packaging is CC0. |
| `logo` (Eight Angle) | CONVERT (priority fix) | Brian's own mark from `eightangle.com/favicon.svg` (drop-shadow filter + teal gradients stripped) | 0.925w x 0.840h | 8.0% | Brian owns it outright (#10). |
| `gccm` (Gold Coast) | CONVERT (upgrade) | the five gold "skyline" peaks from `goldcoastcapm.com/favicon.svg` (navy plate + gradient dropped) | 0.450w x 0.820h | 8.0% | site Brian built, case-study consent #203; nominative use. |
| `atg` | CONVERT (upgrade) | the "A" mark from `anthonythomasgalante.com/favicon.svg` | 0.400w x 0.820h | 10.0% | site Brian built, consent #203; nominative use. |
| `robot` (Android) | KEEP hand-drawer | official simple-icons Android is head-only (dome + antennae + eyes, flat bottom); the existing hand-drawn full bugdroid (dome, antennae, eyes, body, arms, legs) is more recognizable and already CC BY 3.0-attributed on /credits | (unchanged) | Google CC BY 3.0, credit already live. |
| `f` (Facebook) | KEEP letterform | the official f-badge is a solid disc with a thin f cutout that washes to a plain bright blob at ~31-cell tide sampling; a bold letterform f reads more clearly as "f" and is imperceptibly different from the brand f at tide scale (already 0.863, cleared #104) | (unchanged) | n/a (letterform). |
| `br` | KEEP letterform | the house "BR" identity; no external logo exists, the letterform IS the mark | (unchanged) | n/a. |
| `pose`, `eight`, `g` | KEEP | unused/unmapped (silhouette + hero-variant material) | (unchanged) | n/a. |

**Why twilio was wrong.** The real mark clusters the four dots near center (in
the 24-unit official mark: centers at +/-2.96 from center, radius 2.48, well
inside the ring's 8.78 inner radius). The old hand-drawer placed them out at
0.405 of the ring radius, hugging the ring: too far apart, wrong proportion.
The vector source restores the true clustered 2x2.

## Validation evidence

- `npm run build` green: `build-marks` wrote 4 marks (80x50); `astro check`
  clean (0 errors, 0 warnings, 0 hints on the tracked files); 13 pages built.
- Built `dist` served on `:4399`, driven via `window.__scene` and hard page
  loads at 1440x900, dpr 2 (measured `--scene-edge` 857px, wide gutter):
  - **logo**: A chevron + swoosh + hollow O ring, night AND light ground, and on
    a hard load of the real `/eight-angle-ml` page (theme "eight", teal peak).
    Reads as the true Eight Angle mark.
  - **twilio**: hollow ring + four center-clustered dots (two upper, two lower),
    night AND light. The dots are distinct at gutter scale, not the old
    edge-hugging spread. The flagged fix, confirmed.
  - **atg**: the angular "A" with its detail element below, night. Recognizable.
  - **gccm**: five rising skyline columns, night. Distinct columns; reads as an
    uptrend, clearly better than the old four "GCCM" blocks.
  - No console errors on any surface; ground flip (dark/light) clean (INKS and
    PEAKS untouched, so contrast is the already-validated baseline).
- **Reduced motion / mobile background mode**: not separately screenshotted but
  safe by construction. Both paths call the same `DRAW[name]` -> `paintGrid`,
  which is fully synchronous; the reduced-motion settled still and the narrow
  background-mode full-field mark paint the grid identically to a hand-drawer.
- **CLS/Lighthouse**: unaffected. The scene is still lazy-imported off the
  pre-paint path (#70 facade contract); this change adds no critical-path bytes.

## Bundle delta

The grid data adds ~21KB raw / ~3.3KB gzipped to the deferred `scene.*.js`
chunk (total 45.6KB raw / 11.3KB gz), plus ~40 lines of `paintGrid`/`gridOr`.
Because the scene chunk loads at idle behind the facade, this is zero
critical-path cost (no FCP/LCP/TBT/CLS movement).

## Owed items / flags for Brian and the lead

1. **Decisions to log** (I am fenced out of `DECISIONS.md`/`STATUS.md`, so the
   lead should record): the four mark conversions and their sources/licenses;
   the `@resvg/resvg-js` build devDependency; and the committed-not-gitignored
   choice for `marks.generated.ts`.
2. **A dedicated single-color Eight Angle mark SVG from Brian** would upgrade the
   trace further. The current source is extracted from the live favicon (filter
   + gradients stripped); a clean master (or the logomark without the wordmark
   at a square viewBox) would be truer still. Same optional upgrade for a
   Gold Coast / ATG master if Brian has them.
3. **Facebook `f` and Android `robot` were kept on purpose** (see verdicts). If
   Brian wants the literal brand f, the honest path is a hand-traced bright-f
   glyph or a disc-minus-badge coverage step in the build (the official badge
   as-is blobs at tide scale). Flag if he wants it.
4. **`twilio` is dormant** (the Twilio piece is an external ledger entry with no
   interior page), so the fix is visible only via `__scene.setMark("twilio")` on
   localhost until that piece gets a page. The Android CC BY 3.0 user-visible
   credit requirement is unchanged and already satisfied on /credits.
5. **`gccm`/`atg` are naturally narrow** (0.40-0.45 frame width): a single "A" and
   a five-column skyline do not fill the frame horizontally the way a wide
   letterform did. They seat tall (0.82) and center, which is correct, but at the
   very coarsest gutter the gccm columns can read as a jagged mass rather than
   five countable peaks. The accent color continues to carry identity, same as
   the letterform era.
6. **`npm audit`** reports pre-existing vulnerabilities (present before this
   change, in the existing dependency tree); resvg did not introduce them.
