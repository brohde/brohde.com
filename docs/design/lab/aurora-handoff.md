# Aurora lab handoff (demo 04 system knowledge)

_Context saved 2026-07-15 from the outgoing design-director (demo 04 refinements). Any new designer picking up `aurora-terminal.html` reads this first instead of re-deriving the system. Source of truth: `docs/design/lab/aurora-terminal.html` (committed `8971c33`), published artifact `9b0b7ddf-75b3-4e68-bd36-d6b76647bd71`._

## What demo 04 is

The composed homepage scene: glyph **tide canvas UNDER the aurora blob layers, glass terminal on top**. That layer order is the core trick: translucent blurred blobs tint the glyphs in the compositor for free, so every color change (state, theme) recolors the tide with zero per-cell JavaScript. Three tide placements audition against the full page: full sky (whisper cap), right gutter (full voice, studio pick for homepage), hero band (studio pick for article pages).

## Mechanisms (all in the one file's `glyph4` IIFE + stage 4 CSS)

- **Two-slot sky crossfade**: the sky lives in two stacked `.skyslot` divs; a theme change stamps the incoming slot's `data-sky` (scoped custom properties in CSS) and crossfades opacity over **2.6s**, the same clock as the home↔chat warm/cool morph. JS: `setTheme4()`.
- **Tide peak lerp**: the 3 ink buckets are one calm shared text ramp (home/chat lerped); the 4th "peak" bucket is the page theme's voice. `PEAKS[theme][ground][home|chat]`; theme travel (`tmix`) reroutes gracefully mid-flight by freezing current interpolated peaks as the new start. State tint (`mix`) and theme travel both ease on the 2.6s clock.
- **Source travel, never swap**: envelope `m` goes out to pure tide over 1.4s, holds 0.9s, forms the next source over 1.4s (`request()`/`advance()`; auto-cycle dwell 4.6s). Reduced motion: `settle()` renders a still instantly.
- **Contain-fit sampling** (`sampleOne`): every 480×300 source contain-fits the tide area, centered both axes, computed in stage pixels and mapped back to the non-square cell grid (15×18px cells); the white letterbox samples to zero = pure tide. Sources re-sampled once per resize into `LUM`, never per tick.
- **Sources are procedural** (lab rule: no external assets): `drawSrcEight` (the 8), `drawSrcLogo` (Eight Angle mark traced bold from `assets/images/case-studies/eight-angle/hero-live-2026-07.png`: the A, hip ring, big O), `drawSrcPose` (astavakrasana silhouette), `drawSrcLetter` f/G stand-ins (real brand marks pending trademark check, #45/#59). Production swaps `drawImage(asset)` through the same seam.
- **Phone background fallback**: below 700px with gutter placement, CSS drops the mask and the canvas goes full-bleed; JS `setBgCap(true)` holds the field at whisper (`eff()` caps intensity at 0.12) regardless of the slider. `applyAlpha()` bottoms canvas opacity near a third of full strength (dark-on-light texture carries more edge contrast, so light ground needs the deeper cut).
- **Placement defaults**: `PLACE_DEFAULT = { sky: 12, gutter: 70, hero: 60 }`; slider stays live after selection.
- **Glass**: stage-4 glass pours stronger than demo 01 because a picture lives under it: `rgba(8,13,10,0.78)` night / `rgba(252,252,250,0.8)` light, backdrop blur, stronger solid fallbacks without backdrop-filter. Standing rule: **text only ever sits on glass, never on bare tide**.
- **Shared runner**: `wire()` + IntersectionObserver; 9fps tide (interval 110ms), pauses offscreen/hidden/user-paused/reduced-motion. dpr capped at 2.

## Theme palettes as shipped (sky blobs in CSS `.skyslot[data-sky]`, peaks in JS `PEAKS`)

- **default**: violet/teal/indigo home, amber/gold/coral chat; peaks mint `#7EE787`→gold `#F5B968` night, deep green `#086148`→brown `#8A4D0F` light.
- **eight**: brand teal family pixel-sampled from the live-site hero (mark `#40A090..#50B098`, cream `#F6F3EE`).
- **news**: Facebook blue `#1877F2` family; luminous `#7AA7FF` night peak, deep `#1D4ED8` light peak.
- **android**: full Google quartet re-weighted by state (blue+green lead cold home, yellow+red lead warm chat) so it never reads as all four at once.
- **Rose anchor rule**: blob 4 (rose) is the continuity thread, never overridden by themes; only overriding blobs 1-3 is structural. Exception: android trades rose for the quartet (flagged to Brian).
- **Chat stays golden hour under every theme** by design: page identity lives in the reading state; the warm chat sky only takes the theme's cast.

## Audit + perf methods (repeat these after any visual change)

- **Contrast**: sweep every theme × both grounds × both states × six backdrop candidates per combo: peak glyph and dense ink mass, each with all four blobs stacked at center alpha, each bare (the bare night peak is a real frame and was the actual worst), plus blobs alone and bare ground, all under the glass. Checker script pattern: `scratchpad/contrast04-themes.js` (session-scoped scratchpad; rewrite if gone). Shipped worst: secondary `#8FA79A` at **4.6:1** (default night home over bare mint peak); android night 4.9/4.7; light glass worst 4.7:1 (brown tag). All AA+, body inks AAA.
- **Perf**: headless Chrome, full sky at full strength (~2,400 cells), a deliberately busy minute (source travel, four theme crossfades, state recolor, ground toggle, two placement switches), dpr 1 and 2. Shipped: avg 0.8-1.5ms, p95 1.1-2.3ms, max 2.6ms vs 4ms budget. Zero runtime errors.

## Open taste flags (awaiting Brian)

1. Landscape sources present small in the tall gutter; portrait/square per-page assets would present larger.
2. Newsroom-blue chat instead of golden hour = one-line palette change if wanted.
3. Android pair-split variant can keep the rose anchor if continuity wins.
4. Phone fallback deliberately near-invisible on light ground; cap can rise to ~0.2 with a contrast re-measure.

## Production wiring notes

Placement, theme, and source are per-page (a class, a palette, an asset); state follows the route. Integration is decision #59's phase (after Option C), governed by the facade contract (#70): server-rendered/static facade first, tide inits at idle/visible, zero pre-paint bytes.
