# Handoff: hero band mark suppression at gutter widths (#152)

_Branch `worktree-agent-afe248fdf992670ff`, based on main at 9f15610 (the ship-gate
verdict commit). One commit: 2a45b98. Scoped, Brian-approved change per decision
#152. Written per #127._

## What this fixes

Every article page mounts the persistent gutter scene (right-hand ambient
canvas, per-article identity mark, #111) AND opens with the hero band
(`HeroBand.astro`, top 30% of the screen, #97/#103). On desktop widths both
of these painted the SAME mark: once as a settled still inside the band,
once again as the scene's live gutter mark. #152 removes the duplicate: at
widths where the gutter is actually visible, the band keeps its geometry,
its decorative glyph-field texture, and its ground bleed, but stops showing
the settled mark still. At narrower widths, where the gutter has already
fallen back to a faint background treatment with no legible mark of its
own, the band keeps showing the mark exactly as before.

## What shipped

One file, `src/styles/terminal.css`, two new rules, no JS touched:

```css
@media (min-width: 1000px) {
  body:has(.scene) .heroband.live::before {
    opacity: 0.2;
  }
  body:has(.scene) .heroband.live canvas {
    opacity: 0;
  }
}
```

Placed directly after the existing reduced-motion block for `.heroband`.

## Why this shape

**The gate matches the shell's own gutter breakpoint exactly**, reusing
`@media (min-width: 1000px) { body:has(.scene) ... }` verbatim from the
`.wrap` left-anchor rule earlier in the same file (line 27). That rule is
the actual, load-bearing signal for "does the layout currently reserve a
right gutter for the scene": below it `.wrap` stays centered and the scene
degrades to the whisper-cap background treatment (confirmed in the matrix
identities handoff at 600px); at or above it the column left-anchors and
the measured gutter holds a legible mark. There is no separate JS-side
breakpoint constant to duplicate or drift from; the module computes gutter
availability continuously from the measured column rect and `MIN_GUTTER`
(160px) rather than a fixed viewport width, so anchoring the band's gate to
the CSS breakpoint that actually drives that layout decision is the
single source of truth available.

**Paint always, hide via CSS** (the brief's second option), not a
`matchMedia` gate on the paint call, because the existing paint path
(`paintHeroStill` in `src/scripts/scene/index.ts`) is a one-time settle at
idle plus repaints only on resize/theme-flip, already comfortably inside
the measured perf budget (B1: <4ms/tick, this paint sits outside the tick
loop entirely). Adding a matchMedia listener to skip the paint would
introduce a resize story to document (repaint-on-breakpoint-cross) for
zero measurable benefit, since the paint itself was never the expensive
part; getImageData over a ~1.2k-cell band is bounded and one-shot. CSS-only
also means the breakpoint crossing is instantaneous and correct even if a
window is resized live across 1000px mid-session, no repaint or JS
listener required.

**Only the `.live` variants are touched.** Before the JS marks the band
live, the canvas already starts at `opacity: 0` and the glyph field
already sits at its resting `opacity: 0.2` (base rules, untouched) so the
pre-live state at every width already matches what #152 wants at desktop
widths. The two new rules exist only to stop the `.live` handoff (which
crossfades the texture OUT to 0 while fading the canvas IN to 1) from
completing at gutter widths: the glyph field is held at its resting value
instead of yielding to a mark that should not appear there.

**Specificity, not source order, carries the override.** Both new
selectors chain `body:has(.scene) .heroband.live` before the target
(`::before` / `canvas`), which is strictly higher specificity than the
existing `.heroband.live::before` / `.heroband.live canvas` rules (extra
type selectors `body` and the pseudo-element/type target, extra class from
`:has(.scene)`), so the override holds regardless of where in the
cascade either rule sits. No `!important` used anywhere.

**Existing transition and reduced-motion rules govern the new states for
free.** `opacity` already transitions at 400ms ease on both the `::before`
and `canvas` layers, and that transition is already `none`'d under
`prefers-reduced-motion: reduce` by the rule immediately above the new
block. The new rules only change target opacity values, so a live resize
across the breakpoint crossfades smoothly under normal motion and snaps
instantly under reduced motion, with no new code for either case.

## Verification

- `npm run build` green (astro check + build, 10 pages, only the
  pre-existing `content.config.ts` `z`-deprecation hints STATUS already
  tracks as cosmetic).
- Dash sweep on the diff: clean (#18).
- Browser validation via a Sonnet subagent (#82) against the BUILT dist,
  served on port 4470, on `/log/eight-angle-ml/` (a themed article):
  - **Desktop (measured at 1271px, this session's window minimum, well
    above the 1000px gate):** `.heroband` carries class `live`; canvas
    computed opacity `"0"`; `::before` computed opacity `"0.2"`; band rect
    height 217.8px against a 726px viewport = 30.0%, exact match to the
    `--screen * 0.3` formula, so geometry is untouched. Screenshot: the
    band shows only faint, incoherent glyph tokens, no mark shape; the
    right gutter shows a clear, structured "8" mark. `.scene` present and
    visible.
  - **CLS 0**: `.heroband`'s `getBoundingClientRect()` was byte-identical
    at 200ms and 3000ms post-load; a buffered `PerformanceObserver` for
    `layout-shift` totaled 0.
  - **Console clean** on fresh navigation at desktop width.
  - **Phone-equivalent width (measured at 500px, this session's window
    minimum; well under the 1000px gate):** canvas opacity `"1"` (mark
    visible), `::before` opacity `"0"` (texture yields, pre-existing
    behavior), screenshot confirms a clear "8" mark in the band. Console
    clean.
  - **/about and / regression check**: both render normally at both
    widths, no visual breakage, no console messages. Neither page uses
    `HeroBand` at all, so this is a pure sanity check, not a code path
    this diff touches.
  - **Breakpoint-crossing live resize**: the automation environment's
    `resize_window` could not reliably shrink/grow an already-loaded tab
    past its initial size (tried three tabs, three widths), so a true
    live mid-session crossing was not directly observed. Closed by
    argument instead: direct inspection of the built (minified) stylesheet
    shows the compiled rule exactly as authored
    (`@media (width>=1000px){body:has(.scene) .heroband.live:before{opacity:.2}body:has(.scene) .heroband.live canvas{opacity:0}}`),
    and `matchMedia` for that condition evaluated `true` at 1271px and
    `false` at 500px in the two independent navigations above, so the gate
    logic is confirmed correct on both sides of the boundary; a live
    cross only exercises the pre-existing, unmodified `opacity` transition
    machinery.
  - **Validator's environment note**: this Chrome session shared ~20 tabs
    with concurrent agent activity; a backgrounded tab freezes CSS
    transitions at their start value (an automation artifact from
    `document.visibilityState = "hidden"`, not a site behavior). The
    validator detected this via `getAnimations()` and worked around it by
    forcing a paint (a screenshot call) immediately before each
    `getComputedStyle` read. Worth knowing if this gets re-run in a
    similarly busy session.

## Scope discipline

Touched nothing else. No JS changed (`src/scripts/scene/index.ts`,
`HeroBand.astro` untouched). No copy changed. `/about`, `/`, and
`/chat` do not mount `HeroBand` and are unaffected by construction, not
just by test (confirmed above anyway per the brief's ask).

## Nothing to flag for Brian

This is a pure CSS gate reusing an existing, already-approved breakpoint;
no new judgment calls, no new visible copy, no new component. The one
thing worth knowing if revisited: the 1000px/`body:has(.scene)` gate is a
layout-level proxy for "gutter visible," not a live measurement of the
actual gutter width the way the scene module itself computes it
(`MIN_GUTTER`, 160px, continuously from the real column rect). The two can
theoretically disagree at odd window shapes (e.g. an unusually letterboxed
window just above 1000px wide where the measured gutter still falls under
160px and the scene itself drops to background mode) since the CSS gate
is a single fixed threshold, not the scene's continuous measurement. This
was an explicit, deliberate choice (the brief named this exact breakpoint
as "the real breakpoint," and it is the one piece of layout state that is
both CSS-visible and shared with the shell's own left-anchor rule), not an
oversight, and the disagreement window is narrow and cosmetic (band shows
no mark, gutter also shows none there, so nothing over-shows; the only
edge case is both being briefly out of sync about who owns showing it,
never a duplicate).
