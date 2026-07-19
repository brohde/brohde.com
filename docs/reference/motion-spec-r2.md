# Motion spec, round 2: make the matrix present

_Design-director tuning spec for Brian's review. Docs only; an Opus engineer implements after Brian reacts. This is a tuning pass on the machinery R1 already shipped (the one persistent aurora + glyph tide, the identity travel, the view-transition column swap), not a rebuild. R1 (`docs/reference/motion-spec-r1.md`) is the grammar; this changes three levels, adds one small primitive, and touches no page layout._

## What this round must not break

Brian wants the scene far more present, especially on mobile, without redesigning pages and without the Lighthouse cost that killed the old boot. The boot was killed (#149) for one reason: it gated first content paint and cost ~4s of LCP render delay (mobile Perf 87 on `/` vs 100 elsewhere). So the hard floor for everything below:

- Content paints first and is never gated. Nothing here overlays, delays, or dims text.
- No new pre-paint JS. Every knob below lives in the lazy live module that already arrives at idle (the facade contract, #70).
- The tide's worst tick stays under 4ms (9fps, 110ms cadence, rAF-gated).
- Reduced motion snaps to the settled state, as today.

Everything in this spec is a bigger number or a short envelope inside a draw loop that already runs. There is no new surface.

## The shared primitive: one surge envelope

Parts 1 and 2 are two presets of a single new primitive; part 3 raises a resting level so parts 1 and 2 become legible on phones. Defining it once keeps the whole round cheap.

The **surge envelope** is a scalar `S` from 0 to 1, driven by a `surgeT` clock the engineer adds to the runner's existing `advance(dt)` (alongside the `tmix` and `mix` accumulators, so it adds no rAF and no timer). Three named durations shape it: attack (rise), peak (hold), release (fall). A gain maps `S` onto the draw:

- `SURGE_DENSITY`: an additive lift on the per-cell value `v` before the glyph ramp (or equivalently a scale on tide weight `tideW`; same intent). It makes more cells cross the visible threshold and pushes lit cells one to two ramp buckets brighter. The peak color and its alpha are never touched, so the surge is a swell of the mid field, not a new bright color. Reads on both desktop and mobile.
- `SURGE_OPACITY` (mobile only, optional): a lift on the canvas opacity, via the canvas's existing `opacity` transition. On desktop the ambient canvas is already at 1.0 (no headroom, no-op); on mobile it sits below 1.0 (part 3), so a crest shows.
- `SURGE_DRIFT` (optional): a brief multiplier on the drift clock so the tide quickens at crest.

`surge()` is a new handle method: it resets `surgeT = 0` and arms the envelope, and early-returns under reduced motion or when the runner is paused (so reduced motion gets no surge and the settled still is unchanged). It never writes the travel accumulators (`m` mark, `mix` state, `tmix` peak). Surge is brightness and density only; travel is shape and color only. That orthogonality is what lets both fire at once without fighting.

---

## Part 1: surge transitions on navigation

**Concept.** On every client-side navigation the field swells: as the new reading column settles, the tide briefly brightens and thickens, then exhales back to ambient over about three quarters of a second. When the destination also changes identity (home to an article), the mark is already dissolving to pure tide and reforming as the new mark on the scene's own slow clock underneath the swell, so the brighter field is exactly where the new symbol is being drawn.

### Where it fires, and why not earlier

`surge()` fires from the scene bridge's `syncSceneState`, the `astro:page-load` handler that already calls `setState` and `setTheme`, so the swell and the identity travel share a start. Firing there beats firing at `astro:before-swap` for two reasons: rAF is reliably alive at page-load, whereas R1 documented that rendering is starved right after a navigation while the view-transition snapshots animate (a surge armed at before-swap would stall its attack in that gap); and co-starting with the travel is the point, since the swell and the mark reforming want the same origin instant.

### The envelope against the swap timeline

The column swap is untouched: R1's view-transition on `main` still runs old column out over 160ms, a 40ms beat, new column in over 220ms. The surge lives entirely in the canvas draw loop, so it cannot delay or reshape that CSS transition. The rule is structural, not a promise: the swap is a UA view-transition on the `main` group, the surge is a scalar inside the tide's own rAF tick, and the two never share a variable.

| knob | value | what it does |
| --- | --- | --- |
| `NAV_SURGE_ATTACK_MS` | 160 | field rises to crest as the old column clears |
| `NAV_SURGE_PEAK_MS` | 90 | crest holds across the 40ms beat and the first breath of the new column |
| `NAV_SURGE_RELEASE_MS` | 720 | field exhales to ambient as the new column becomes readable |
| `SURGE_DENSITY_PEAK` | +0.18 | additive lift on `v` at crest (0 at rest) |
| `SURGE_DRIFT_MULT` | 1.25 | drift clock speed at crest (open pick; 1.0 = off) |

Total perceptible event about 970ms, most of it the release. The attack and peak sit under the tail of the column swap; the release is the part the eye actually reads, so the swell peaks as you land and settles as you start reading. That ordering is deliberate.

### Composing with the 2.6s identity travel

The travel is unchanged: `setTheme` still crossfades the sky and lerps the peak on the 2600ms clock, and the mark still travels its 1400ms out, 900ms hold, 1400ms in envelope. The surge sits on top as a pure brightness and density gain. When both fire (home to article):

- The surge (about 1s) is a fast swell; the travel (2.6s sky and peak, 3.7s mark) is the slow story underneath.
- Because the surge lifts the mid field and never the peak color, the dissolving mark and the shifting palette stay legible through the crest; the field just gets denser around them.
- On a same-identity navigation (home to about, home to chat) no travel fires, so the surge is the whole scene event. That is intended: even a lateral move gets a small breath, which is what sells the one-scene continuity on pages that share a mark.

Reduced motion: `surge()` is a no-op, `setTheme` and `setMark` snap as today, the column swap is the instant swap R1 already specifies. No swell, no travel, one settled frame.

**Files the engineer touches:** `src/scripts/scene/index.ts` (the surge accumulator in `advance`, the density lift in the draw, the `surge()` handle method, the drift multiplier); `src/scripts/terminal.ts` (one `handle.surge()` call in `syncSceneState`).

---

## Part 2: loud wake on direct load

**Concept.** Content paints instantly, as now. A beat later the live tide crossfades in already dense and bright, then settles to ambient over about 1.5 seconds, so a fresh arrival gets the matrix at full voice before it calms to the reading level. The static facade stays a whisper; the loud wake is entirely a live-layer event.

### Facade versus live layer, explicitly

- **The facade** (server-rendered, first paint) is the sky gradient plus the pour. It carries no glyphs and it does not get louder. Making the facade louder would mean pre-paint work and a contrast risk on the LCP frame, both forbidden. It stays the calm placeholder it is.
- **The live layer** (the lazy canvas, arriving after idle) is where the wake happens. Today it crossfades in and lands at ambient. Instead it lands at crest and settles. The wake is the same surge primitive with a longer, one-shot preset, armed once when the live layer first goes `.live` (the same boot stage that adds the class and runs `applyAlpha`).

| knob | value | what it does |
| --- | --- | --- |
| `WAKE_HOLD_MS` | 200 | crest holds as the canvas finishes fading in |
| `WAKE_SETTLE_MS` | 1500 | field settles from crest to ambient (open pick, 1200 to 1800) |
| `WAKE_DENSITY_PEAK` | +0.22 | additive lift on `v` at first live frame |

The wake has effectively no attack: the canvas's existing opacity fade (0 to its resting value) is the visual rise, and the density is already at crest when it lands, so the first live frame the visitor sees is the loud one. The facade sky fade-out (about 1200ms) and the wake density settle (1500ms) overlap and read as one event: the scene waking loudly and breathing out.

### The hard constraints, held

- **Nothing overlays or delays text.** The ambient scene is `z-index: -1`, behind all content; the pour sits over the tide and under the column. The wake raises glyph density behind the pour, never over the text.
- **The pour keeps text AA throughout.** The pour alpha is unchanged (0.78 night, 0.80 light of ground). The wake lifts mid-field density but never the peak color or its alpha, and the B1 worst case already measured the peak glyph at full alpha under the pour. Re-verify at `WAKE_DENSITY_PEAK` on the built dist, both grounds, both states, worst backdrop (peak glyph plus all four blobs stacked, under the pour):
  - night `--dim` #8FA79A over the poured night ground (the B1 floor pair, measured 4.81:1 at desktop intensity 0.7)
  - night `--ink` #D6E5DC over the same
  - light `--dim` #3F5348 and light `--ink` #14211A over the poured light ground
  - the brightest themed peak under the pour (goldcoast night 233,186,64; twilio night 246,78,94) as the worst decorative backdrop
  A density lift adds mid-ramp cells; it does not raise the peak-bucket ceiling the harness already cleared. Expected to pass with margin, but a required re-check, not an assumption.
- **Reduced motion gets the settled state instantly.** The wake preset early-returns under reduced motion; the boot renders its settled still exactly as today.
- **No new pre-paint JS.** The wake arms inside the live module's existing boot stage, at idle, in the same place `applyAlpha` already runs. Zero pre-paint bytes added.

**Files the engineer touches:** `src/scripts/scene/index.ts` (arm the wake preset at the `.live` boot stage; the density lift is shared with part 1).

---

## Part 3: mobile ambient presence

**Concept.** The phone fallback currently caps the tide near invisible (the background whisper, #114 era). Raise it to a clearly-visible drift that reads as the same living field the desktop gutter shows, protected by the same pour. Keep it a background wash: no legible mark on the phone scene, because the article hero band already carries the mark at phone width (#152) and a mark is not legible in the tide at that scale anyway.

### The one knob that moves it

On a phone the measured gutter is too narrow to hold a mark, so the scene runs its background mode: the intensity is capped (`eff()` returns `min(intensity, 0.12)`) and the pour degrades to a uniform full-viewport wash. Raising that one cap moves both the density and, through the existing `applyAlpha` formula, the canvas opacity together.

| knob | from | to | effect |
| --- | --- | --- | --- |
| `MOBILE_INTENSITY` (the background-mode cap) | 0.12 | 0.34 | denser, brighter drift |
| canvas opacity (via `applyAlpha`, derived) | ~0.36 | ~0.79 | the field reads clearly, not as a ghost |

One knob because `applyAlpha` already keys the canvas opacity off the effective intensity; raising the cap raises both in step. 0.34 roughly doubles the visible presence and lands the canvas opacity near 0.79, present but calm.

**Open pick, per ground.** The dark ground shows a mint-family drift on near-black, which reads strongly at 0.34. The light ground shows a dark-green drift on near-white through an 80% white pour, which reads fainter at the same number. If Brian wants the two grounds to match in presence, split the knob: `MOBILE_INTENSITY_LIGHT` at about 0.38 to 0.40 against `MOBILE_INTENSITY` (dark) at 0.34. Default is the single knob at 0.34 for simplicity; the split is a one-line follow-up.

### Why this stays AA, and the pairs to re-verify

The architecture bounds it. On the phone the uniform pour is the same alpha as the desktop column pour, and the tide behind it at 0.34 is weaker than the desktop tide at 0.7 that the B1 harness measured to 4.81:1 (night dim, the floor). Weaker tide behind the same pour means more contrast, not less. So `MOBILE_INTENSITY` has a hard ceiling of 0.7 (desktop parity, the measured floor) and 0.34 sits well under it. Re-verify on the built dist at phone width, over the uniform pour, both grounds, both states:

- night `--dim` #8FA79A and `--ink` #D6E5DC over the poured night ground
- light `--dim` #3F5348 and `--ink` #14211A over the poured light ground
- the brightest themed peak (goldcoast, twilio) under the uniform pour as the worst backdrop

### Phone-width calls, each ground

- **Dark (night ground #0E1512):** `MOBILE_INTENSITY` 0.34, canvas opacity about 0.79. A soft mint drift over near-black, clearly present, calm to read over. Background wash, no mark. This is the level Brian is asking for: visible, not spectacle.
- **Light (paper ground #FBFBF8):** the same 0.34 default gives a faint pencil-texture drift of dark-green glyphs on paper through the 80% pour. If it reads too quiet next to the dark ground, take the `MOBILE_INTENSITY_LIGHT` split (about 0.38 to 0.40). Background wash, no mark.

Raising this baseline is also what makes parts 1 and 2 land on phones: the mobile canvas has real opacity headroom (desktop is already at 1.0), so the surge and wake read there as an opacity-and-density swell, not just a density flicker. `MOBILE_SURGE_OPACITY` (about 0.95, via the canvas's existing opacity transition) crests the phone opacity and settles back to 0.79 if Brian wants more than the density lift alone.

**Files the engineer touches:** `src/scripts/scene/index.ts` (the background-mode cap in `eff()`; optionally the per-ground split and the mobile surge opacity).

---

## Lighthouse impact: why each part is score-neutral

Argued from architecture, not from a code read.

- **First content paint is untouched.** Every knob lives in the lazy live module that arrives at idle (the facade contract), and the part 2 facade is deliberately left calm. FCP and LCP are the same frame as today; the #149 lesson (never gate content) holds by construction.
- **No new bytes on the pre-paint path.** The surge primitive and both presets are logic inside a module already in the lazy chunk; part 3 changes one numeric constant. Nothing new is imported, requested, or inlined into critical CSS.
- **No layout, so CLS stays 0.** The scene is `position: fixed`, `z-index: -1`, `contain: strict`. Everything here is a canvas draw plus at most one canvas opacity transition (a compositor property). No box changes.
- **No new main-thread work in the Lighthouse window.** The presets run only when the runner is already ticking (visible, not reduced); the surge adds to an existing tick, not a new task, so TBT is unchanged.

Net: the three parts change how present the layer feels, not when or whether content and assets arrive. Perf 100 / TBT 0 / CLS 0 on dist should hold; validate per phase on the built output, per the house method.

## Performance: staying inside the 4ms tick

The tide's worst tick was measured under 4ms (B1: hero about 1.8ms, big-monitor band about 1.6ms, cell grid capped, DPR capped at 2). This round adds three things to a tick, all cheap:

1. One envelope evaluation per tick (a clamp plus a smoothstep on `surgeT`), shared by parts 1 and 2. Constant cost, independent of grid size.
2. One additive term on the per-cell value `v` inside the loop that already runs. No new trig, no new per-cell branch of consequence.
3. One optional drift multiplier on the existing clock advance. Constant cost.

No resample and no `getImageData` is added. The one heavy step, resampling a mark, still happens only inside the travel envelope (about 1400ms in), off the navigation frame, unchanged.

The one honest cost: at crest the density lift makes more cells light, so more `fillText` calls fire during the roughly 1s surge and 1.5s wake. This is bounded (the grid is capped at 6000 cells; the fully-lit case is the same envelope the reduced-motion still and a fully-formed mark already draw) but real. The gate: confirm `window.__scene.stats().max` stays under 4ms during a surge and during the wake, on the built dist with a focused localhost tab, per the B1 and #124 method. If a peak pushes a crest tick over budget, lower it; the tick budget wins any tie.

---

## Headline numbers and open picks for Brian

**What the studio chose per part:**

- **Part 1, surge transitions:** envelope 160 / 90 / 720ms (attack / peak / release), `SURGE_DENSITY_PEAK` +0.18, fired at page-load with the identity travel; column swap (160 / 40 / 220) untouched.
- **Part 2, loud wake:** live layer lands at crest and settles over `WAKE_SETTLE_MS` 1500ms, `WAKE_DENSITY_PEAK` +0.22; facade stays calm; pour alpha unchanged.
- **Part 3, mobile presence:** `MOBILE_INTENSITY` 0.12 to 0.34, lifting phone canvas opacity from about 0.36 to about 0.79; background wash, no mark; hard ceiling 0.7 (the measured desktop floor).

**Open picks, each vetoable per knob:**

1. **Drift surge, in or out.** `SURGE_DRIFT_MULT` 1.25 gives the tide a brief quicken at crest. At 9fps a speed change can read slightly choppy; 1.0 turns it off and leaves the swell as pure density. Studio: keep it light at 1.25, drop to 1.0 the moment it reads as jitter in review.
2. **Wake settle length.** `WAKE_SETTLE_MS` 1500ms is the "about 1.5s" target; 1200 feels brisk, 1800 feels grand. Studio: 1500.
3. **Mobile per-ground split.** One knob at 0.34, or split `MOBILE_INTENSITY_LIGHT` to about 0.38 to 0.40 so the paper ground matches the dark ground in presence. Studio: ship the single knob, split only if the light ground reads too quiet on a real phone.
4. **Mobile surge opacity.** Whether the nav surge and wake also crest the phone canvas opacity (`MOBILE_SURGE_OPACITY` about 0.95) or ride the density lift alone. Studio: density alone first, add the opacity crest if the phone swell wants more.
5. **Surge on lateral moves.** The surge fires on every navigation, including same-identity ones (home to about). If Brian wants the swell reserved for identity changes only, gate `surge()` on whether `setTheme` actually travels. Studio: keep it on every navigation; the small breath is what sells the one-scene continuity.

**One flag for the studio lead to take to Brian:** the mobile numbers and both density crests are contrast-bounded by argument (weaker tide behind the same pour than the measured desktop floor), but they have not been re-measured on a real build. The implementing engineer owns that re-verification before this ships; it is the one thing in this spec that is reasoned rather than measured.
