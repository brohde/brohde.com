# The scene module

The production spec for the ASCII "glyph tide" background: the drifting field of monospace glyphs that sits behind every page, brightens on navigation, and forms a per-page "mark" (the BR letterform on the homepage, a company logo or letterform on an article). This is the one genuinely novel system in the codebase. If you are here to fix a scene bug, read this before `src/scripts/scene/index.ts`; the code is dense and every magic number below is grounded in it.

The module is a production port of demo 04 from the frozen design lab (`docs/design/lab/aurora-terminal.html`). The lab is the reference for the visual intent; this document and the code are the truth for what ships. Do not build against the lab structure.

## Files

```
src/components/Scene.astro          The static facade (server-rendered, zero JS)
src/styles/scene.css                Facade styles (gradient sky + the text pour)
src/scripts/scene/
  index.ts                          The engine, the mount, and the handle API
  palettes.ts                       Data: ink ramps, per-theme peaks, THEME_SOURCE
  placements.ts                     Data: the placement spec + content-column geometry
  sources.ts                        Data: the procedural mark drawers (the seam)
  live.css                          Live-layer styles, adopted at init (never critical)
```

The bridge that drives the module from page to page lives in `src/scripts/terminal.ts` (`syncSceneState`, and the `astro:before-swap` matrix gate). The scene never listens to navigation itself beyond re-binding on `astro:page-load`.

## 1. Architecture: facade, then live canvas

The scene obeys the `#70` facade contract (see `docs/ENGINEERING.md` section 10). It costs **zero bytes on the pre-paint path**.

**The facade** (`Scene.astro`) is server-rendered, `aria-hidden`, `position: fixed`, and `transition:persist`. It paints a CSS gradient stand-in for the resting home sky plus the "pour" (the gradient that keeps the content column’s text AA-legible over the field), and it reserves the whole background layer up front, so the live layer causes zero layout shift when it arrives. It carries the page’s identity as data attributes: `data-scene-placement`, `data-scene-theme`, `data-scene-mark` (omitted unless a page overrides its theme’s default mark), and `data-scene-state`.

**The live layer** (`src/scripts/scene/`) is lazy-imported from `terminal.ts`’s idle hook (`requestIdleCallback`, with a `setTimeout` fallback for Safari), which fires the import exactly once per full page lifetime. `initScene()` finds the facade by `[data-scene]`, builds the tide `<canvas>` and the drifting sky slots inside it, and crossfades them in over the facade. Because the facade is `transition:persist`, once every page renders it the same live DOM survives a `ClientRouter` swap and `initScene()` is a no-op; a page without a facade tears the scene down, and returning to one mounts fresh.

**Staged boot** (`mount` -> `defer`). Init is split into three stages so no single task crosses the long-task line inside the Lighthouse window (TBT must stay near 0 even though the scene boots during it):

1. sizing + sampling the mark off the paint path;
2. the first painted frame (a settled still), the facade handoff (`container.classList.add("live")`), and starting the runner;
3. the canvas opacity fade-in target (so the 400ms CSS transition actually runs) and arming the wake surge.

Each stage races a `requestAnimationFrame` against a wall-clock timeout (300ms, 300ms, 600ms) and the first to fire wins. This matters because rendering opportunities are suppressed in backgrounded tabs and can be starved right after a client-side navigation; a purely rAF-gated boot stuck at opacity 0 was caught twice in validation. A hidden tab completes the boot on the timers with one cheap settled frame, while the runner itself stays paused until the tab is visible.

## 2. The tide engine

The field is a grid of monospace cells. Each cell picks a glyph from a 9-step ramp (`RAMP = [" ", ".", "·", ":", "~", "+", "x", "8", "#"]`) by its brightness `v`, and `v` is the sum of two fields:

- **The tide**: three sines (per-column, per-row, per-diagonal) that drift over time. In the lab these were three `sin` calls per cell per tick; the production port precomputes them into `sinCol`/`sinRow`/`sinDiag` per-tick arrays (separable by column, row, and diagonal), identical math at a fraction of the cost.
- **The mark**: a luminance sample of the current source figure, contain-fit into the mark region and mapped to the cell grid (`sample`/`lum`). Its weight rides the `m` envelope (section 4).

Cell geometry: `CW = 15`, `CH = 18` css px, `FONT_PX = 12`, scaled up by a factor `k` on large fields (section 8). The tick runs at `TICK_MS = 110` (9fps), rAF-gated in `loop()`. Colors are bucketed (4 buckets) so the canvas `fillStyle` changes at most a few times per row.

## 3. The data tables

Extracted from the engine (`#106`) so `index.ts` is about behavior and the tables are about values. All values are the lab’s, verbatim.

### `palettes.ts`

- **`INKS`** (`Record<GroundKey, Record<SceneState, number[][]>>`): the three-bucket text ink ramp, one calm ramp shared by every theme, per ground (`night`/`lite`) and per state (`home`/`chat`). The engine lerps `home -> chat` on the sky clock.
- **`PEAKS`** (`Record<ThemeName, Record<GroundKey, number[][]>>`): the brightest bucket, the page theme’s "voice", as `[home, chat]` per ground. The seven themes are `default`, `eight`, `news`, `android`, `atg`, `goldcoast`, `twilio`. Chat peaks stay in the golden-hour amber family under every theme (a house rule from the lab). New peaks were contrast-checked against both grounds (worst combo 5.44:1, above the existing floor of 4.84:1 = android lite/home).
- **`THEME_SOURCE`** (`Record<ThemeName, SourceName>`): which mark each theme carries. `default -> br`, `eight -> logo`, `news -> f`, `android -> robot`, `atg -> atg`, `goldcoast -> gccm`, `twilio -> twilio`.
- **`isThemeName`**: the type guard, re-exported through `index.ts` for the `terminal.ts` bridge.

### `placements.ts`

A placement owns three things: geometry (the CSS box the canvas fills), the mark region (where the mark contain-fits), and strength (tide intensity). `PLACEMENTS` currently has one entry, `ambient`:

- `intensity: 0.7` (the tide strength).
- `markRect(w, h, edge)`: the mark centers, both axes, in the gutter to the right of the content column, starting at `edge + MARK_PAD` (`MARK_PAD = 20`). If the resulting width is under `MIN_GUTTER - 2*MARK_PAD`, it returns `null`, which puts the placement into **background mode** (mark centered in the full field, whisper intensity).
- Geometry constants: `CONTENT_SEL = ".wrap"`, `CONTENT_W = 760` (the fallback when no column is found), `MIN_GUTTER = 160`.

The engine is geometry-agnostic: it fits whatever box the placement hands it. A future hero-band placement is another entry here.

### `sources.ts`

The procedural marks, ported verbatim from the lab: `480x300` canvases, white ground, black figure. Sampling inverts (dark source areas become bright glyphs on the night ground). See section 9 for the drawer contract.

## 4. Identity and the theme/state system

Two independent axes color the scene, and both matter for how the mark and colors move.

**Ground** (`night`/`lite`) follows the site theme resolution: `html[data-theme]` wins, `prefers-color-scheme` otherwise. The engine watches it live via a `MutationObserver` on `data-theme` plus a `matchMedia` listener, so it survives the `astro:after-swap` re-stamp that `theme.ts` performs (see `ENGINEERING.md` section 6). A ground change repaints (or lands instantly on the settled still if the runner is paused).

**Theme identity** (the `ThemeName`) is per-page: it selects the sky palette, the tide peak (`PEAKS`), and the mark (`THEME_SOURCE`). The homepage and the chat surface are always `default` (the BR letterform); article pages declare a `theme` in frontmatter (`content.config.ts`), which `[slug].astro` stamps as `data-scene-theme` on its own `.screen` section.

### Why the persisted node cannot carry the truth

The facade element is `transition:persist`. On a client-side navigation the **old page’s** `[data-scene]` node survives the swap, dataset and all, so its `data-scene-theme` still names the page you just left. Reading identity off it would pin the mark to the wrong theme (this was the `#150` bridge bug). Therefore:

- The **fresh** `.screen` section of the arriving page (which is *not* persisted, so it is the new server HTML) is the source of truth for the destination theme. `terminal.ts`’s `currentScreen()` and the scene bridge read `document.querySelector(".screen")?.dataset.sceneTheme`, never the persisted `[data-scene]` node, and never the bare `[data-screen]` (the persisted global header matches that first and carries no theme).
- `syncSceneState` (in `terminal.ts`, fired on `astro:page-load`) reads that fresh stamp and calls `handle.setTheme(...)`, which no-ops when the theme is unchanged and otherwise travels the sky, peak, and mark together.

`SceneState` (`home`/`chat`) is the warmth tint: `home` is the cold sky, `chat` is golden hour. `handle.setState` retargets the `mix` accumulator, which lerps on the sky clock.

## 5. Travel envelopes and the sky clock

There is one master clock and one mark-travel envelope, and a navigation can compress the second without touching the first.

- **The sky clock**: `CLOCK_MS = 2600`. The sky crossfade, the state tint (`mix`), and the theme-peak travel (`tmix`) all move on this 2.6s clock. It never compresses.
- **The ambient mark envelope**: a mark never swaps, it *travels*, out to pure tide, hold, then in as the new mark. Durations `OUT_MS = 1400`, `HOLD_MS = 900`, `IN_MS = 1400`. `phase` walks `idle -> out -> hold -> in -> idle`; `m` is the envelope scalar (1 = fully formed mark, 0 = pure tide). `request(next, snap)` reroutes gracefully if a new mark is requested mid-flight (ported from the lab’s `request()`).
- **The navigation mark envelope**: `NAV_OUT_MS = 200`, `NAV_HOLD_MS = 140`, `NAV_IN_MS = 300`. On a choreographed cross-theme navigation, `navTravel` swaps the mutable `outMs`/`holdMs`/`inMs` to these compressed values for exactly one crossing, so the mark dissolves and reforms inside the reading-column swap window while the sky and peak stay on the slow 2.6s clock. When `phase` reaches `idle`, `advance()` resets the durations to the ambient values, so only the crossing that armed them runs compressed.

## 6. Surge and wake

A surge is a one-shot brightness/density lift, a scalar `S` in `0..1` on an attack/peak/release clock (`surgeEnvelope`), added to `advance()` so it costs no new rAF and no timer. It lifts mid-field density (an additive term `dens` on each cell’s `v`, so more cells cross the visible threshold and lit cells climb a bucket or two) and optionally quickens the drift clock at crest (`SURGE_DRIFT_MULT = 1.25`). Critically, a surge **never writes the travel accumulators** (`m`, `mix`, `tmix`) and never touches the peak color or its alpha, so it composes with an identity travel fired at the same instant without fighting it, and the pour keeps text AA. Two presets share the primitive:

- **The nav surge** (`#186` part 1): `NAV_SURGE_ATTACK_MS = 160`, `NAV_SURGE_PEAK_MS = 90`, `NAV_SURGE_RELEASE_MS = 720`, `NAV_SURGE_DENSITY = 0.18`. The field swells on every client-side navigation. Fired by `handle.surge()` from the `astro:page-load` path (the field rises as the old column clears, holds across the beat, exhales as text settles).
- **The wake** (`#186` part 2): `WAKE_HOLD_MS = 200`, `WAKE_SETTLE_MS = 1500`, `WAKE_DENSITY = 0.22`, no attack (the canvas opacity fade-in *is* the visual rise). Armed once at boot stage 3, direct load only, so the field is already at crest when the first live frame lands, then settles to ambient. Client-side navigations reuse the persisted handle (mount never re-runs), so the wake never re-arms.

`armSurge` is a no-op under reduced motion or while the runner is paused, so a reduced-motion or backgrounded load gets the settled still with no swell. `surgeArmed` is disarmed by `settle()`, so the reduced-motion still and paused frames land at ambient density.

## 7. The navigation gate (`navTravel` + `data-vt-matrix`)

The choreographed cross-theme crossing is gated in `terminal.ts`’s `astro:before-swap` handler, because during a swap the outgoing page is still the live document and the incoming document is available as `event.newDocument`:

1. Read the destination theme from `event.newDocument.querySelector(".screen")?.dataset.sceneTheme` (undefined -> `"default"`), never from the persisted node.
2. Get the live scene handle and compare `handle.getTheme()` to the destination.
3. **Governing rule (Brian):** the choreographed sequence runs **only when the destination theme differs** from the current one. A same-mark crossing (home <-> /about, both `default`) keeps the fast concurrent column fade with no stamp.
4. When they differ: stamp `root.dataset.vtMatrix = ""` (which opens the matrix CSS window in `global.css` for this swap), call `handle.navTravel(destTheme)` (the compressed mark envelope + the nav surge, both fired during the swap), and set `navChoreographed = true`.
5. On `astro:page-load`, if `navChoreographed` was set, `syncSceneState(false)` only syncs the chat/home tint (no second surge, `setTheme` no-ops on the already-applied theme); otherwise `syncSceneState(true)` runs the normal travel + surge (covers a same-theme crossing, the module not being loaded yet, and hard loads).

The stamp is recomputed on every before-swap and never mutated mid-transition; `documentElement` persists across the swap, so it survives the transition it governs.

## 8. Performance budget

The scene is held to the site’s TBT-0 / CLS-0 bar (see `ENGINEERING.md` section 10). The mechanisms:

- **Tick rate**: `TICK_MS = 110` (9fps), rAF-gated. The runner pauses (`update()`) whenever the container is offscreen (an `IntersectionObserver` at threshold 0), the document is hidden (`visibilitychange`), reduced motion is on, or the handle is destroyed. A pause never leaves a half-travelled frame: it renders one final `staticFrame()`.
- **Cell cap**: `CELL_CAP = 6000`. On a field larger than that (full-viewport on a big monitor), `resize()` scales the cell (`cw`/`ch`/`fontPx` up by `k = sqrt(base / CELL_CAP)`) so the grid never exceeds the cap. This is the one deliberate departure from the lab (flagged in the B1 report), and it keeps the worst tick inside the lab’s ~4ms budget.
- **DPR cap**: `Math.min(window.devicePixelRatio, 2)`. DPR changes (window dragged between displays, zoom) re-arm a self-renewing `matchMedia` watcher and re-rasterize.
- **Opacity/whisper**: `applyAlpha()` sets canvas opacity to `0.12 + 0.88 * min(eff / 0.45, 1)`. In background mode `eff()` caps intensity at `MOBILE_INTENSITY = 0.34`, dimming the whole field so it can sit behind a page. When the document is hidden the transition is suppressed and the value lands instantly (a hidden document never ticks CSS transitions, so the fade would otherwise stall at 0).
- **Resize** is debounced 180ms; every resize re-measures the content column, re-positions the mark, re-stamps `--scene-edge` (which the pour tracks), and re-evaluates background mode.

`stats()` on the handle returns `{ ticks, avg, p95, max }` over the last ~240 tick durations (recorded in `loop()` via `performance.now()`), for perf audits.

## 9. Adding a new mark (the `sources.ts` seam)

A mark is a **drawer**: a function `(sctx: CanvasRenderingContext2D) => void` that fills the `480x300` (`SRC_W`x`SRC_H`) source canvas with a white ground and a black figure. Register it in the `DRAW` map under a `SourceName`, and the engine samples, inverts, and contain-fits it into the mark region automatically. A production image asset swaps in through the same seam: any drawer that fills the frame (for example `ctx.drawImage(asset, ...)`) is a valid source.

To wire a mark to a page: add its `SourceName` to the union in `sources.ts`, add a `PEAKS` entry and a `THEME_SOURCE` mapping in `palettes.ts` under a `ThemeName`, and set that theme in the article’s frontmatter. A page can also override its theme’s default mark with an explicit `mark` prop on `Scene.astro` (rendered as `data-scene-mark`, which `mount` treats as the stronger word).

**The ink-trim lesson (`#104`, binding).** Dead margin inside the `480x300` frame presents the mark small on the coarse cell grid. Trim the figure toward its ink box, keeping roughly an 8% bottom safe area for the future hero band. The known-bad example is the pose drawer at a 0.610 ink-to-frame ratio; the good one is the `f` letterform at 0.840. Letterforms use stroke-over-fill (`drawLetter`/`drawWord`) to beef the glyph into a mass the coarse grid can hold. Two live examples of grid-driven tuning: the Twilio dots run slightly small so they do not merge into blobs at gutter scale, and `drawWord` seats deep ink on the 8% bottom safe line.

**Currently drawable but unmapped**: `eight` (the "8", hero-variant material) and `g` (the G letterform, superseded by the robot). They stay in the file unused. The `twilio` theme is fully wired but **dormant**: no public page consumes it yet (the Twilio piece is an external ledger entry with no interior page).

**Attribution note**: the Android `robot` drawer carries a CC BY 3.0 attribution requirement for Google’s Android robot mark. The user-visible credit lives on `/credits`, linked from the global footer on every page.

## 10. Reduced motion and fallback paths

- **Reduced motion**: the runner never starts (`update()` gates on `!reduced()`); the scene renders a single **settled still** via `staticFrame()` -> `settle()`, which jumps every envelope to its destination (mark formed, tints arrived) and disarms any surge. A theme change under reduced motion snaps (`request(snap)` + `settle()`) instead of travelling, and `navTravel` takes the snap path. Watched live via a `matchMedia` listener, so toggling the OS setting re-renders.
- **No live column / no content column found**: `measureEdge` falls back to a centered `CONTENT_W` (760px) wrap.
- **Narrow viewport**: background mode (mark centered in the full field, whisper cap), triggered whenever the measured gutter is under `MIN_GUTTER`.
- **Hidden / backgrounded tab at load**: the boot completes on timers with one settled frame; the runner stays paused until visibility.
- **`ClientRouter` fallback swap** (`fallback="swap"` in `BaseLayout`): browsers without native view transitions get an instant swap, the same honest path reduced motion takes. The default `"animate"` fallback would fade the whole document, which would blink the persistent scene, exactly what the transition system exists to prevent.

## 11. The `__scene` debug handle

On `localhost`/`127.0.0.1` only, `initScene()` exposes the live handle as `window.__scene`. From the console you can drive the scene directly for audits:

```js
__scene.stats()            // { ticks, avg, p95, max } tick durations (ms)
__scene.getTheme()         // the live page theme
__scene.setTheme("android")
__scene.setState("chat")   // golden-hour tint
__scene.setMark("robot")
__scene.surge()            // fire the nav-surge preset
```

The handle is never exposed off localhost (the hostname check runs at mount), so production ships no debug surface. Its primary audit use is reading live tick stats from the built `dist` output to confirm the perf budget holds.
