# Handoff: matrix page-transition choreography (fixbatch Phase 3)

Engineer: Opus frontend, isolated worktree `agent-a3eaa7b2f88a28126` (cut fresh from
main after the contact-flow terminal.ts rework). Scope: implement the approved
matrix page-transition choreography, gated on a theme change.

## Governing rule (Brian's explicit order)

The choreographed sequence runs ONLY when the destination scene theme differs
from the current one. Same-mark crossings (home <-> /about, both "default")
keep today's fast concurrent fade EXACTLY as is. No same-theme dissolve/reform.
Implemented as a per-navigation gate that compares live theme vs destination
theme and either stamps `data-vt-matrix` + travels, or does neither.

## What the sequence is

On a cross-theme navigation, three things happen in lockstep during the swap:

1. The reading column snapshots clear fast and hold off: `data-vt-matrix` on
   `<html>` overrides the column timing to old = 140ms out, new = 200ms in after
   a 460ms delay. That opens a ~140-460ms window where neither column snapshot
   is painted, so the live persistent scene beneath is the visible event.
2. The scene's MARK travels on a compressed envelope (200/140/300 vs the ambient
   1400/900/1400), dissolving to pure tide and reforming as the destination
   page's mark. The sky crossfade and peak lerp stay on the untouched slow 2.6s
   clock, so only the mark compresses. The new column lands (~660ms) just as the
   mark finishes forming (~640ms).
3. The existing nav surge preset fires once (brightness/density swell).

A same-theme crossing does none of this: no stamp, no travel (setTheme no-ops on
equal theme), the fast concurrent 160/220+40 fade is unchanged.

## Files changed (only the files I own)

### `src/styles/global.css` (view-transition block only)
- Kept the default `::view-transition-old/new(main)` rules exactly (160ms /
  220ms+40ms), the root instant-swap rules, the keyframes, and the group(main)
  rules untouched.
- Added, scoped to `html[data-vt-matrix]`, higher-specificity overrides:
  old = `vt-main-out 140ms ease both`; new = `vt-main-in 200ms ease 460ms both`.
  Present while the stamp is set, yields to the defaults when absent.
- Extended the reduced-motion snap block to also cover
  `html[data-vt-matrix]::view-transition-old/new(main)` with `animation: none`
  (equal specificity, later in source, so it wins under reduced motion even with
  the stamp present). Reduced motion still snaps under the stamp.

### `src/scripts/scene/index.ts`
- New constants `NAV_OUT_MS=200, NAV_HOLD_MS=140, NAV_IN_MS=300`.
- Made the mark-travel envelope durations mutable (`outMs/holdMs/inMs`,
  initialized to the ambient `OUT_MS/HOLD_MS/IN_MS`); `advance()` now reads the
  mutable versions, and resets them to ambient on the phase -> idle transition.
  `settle()` (the snap path) resets them too.
- Extracted the theme-travel body into an internal `travelTheme(name)` (shared
  by setTheme and navTravel). `setTheme` keeps its same-theme guard.
- Added `getTheme(): ThemeName` accessor and `navTravel(name)` to the handle +
  the `SceneHandle` type. `navTravel`: under reduced motion or while paused it
  snaps (travelTheme's `request()` takes the settle path, armSurge no-ops); else
  it sets the compressed nav envelope, travels the theme, and fires the nav surge
  preset once. Only ever called when themes differ, so no force/same-theme
  machinery.

### `src/scripts/terminal.ts` (astro:* hook section only)
- New module flag `navChoreographed`.
- `astro:before-swap` handler: after the existing cancelRedirect + dropThread,
  it recomputes the gate. Reads the destination theme from
  `event.newDocument.querySelector(".screen")?.dataset.sceneTheme` (undefined ->
  "default", validated via `sceneMod.isThemeName`), never off the persisted
  `[data-scene]` node. If the module is loaded AND `handle.getTheme() !==
  destTheme`: set `document.documentElement.dataset.vtMatrix = ""`, call
  `handle.navTravel(destTheme)`, set `navChoreographed = true`. Otherwise
  `delete document.documentElement.dataset.vtMatrix`. The attribute is
  recomputed every before-swap and never mutated mid-transition.
- `astro:page-load` scene dispatch: when `navChoreographed` is set, call
  `syncSceneState(false)` (setState still runs for chat/home tint; setTheme
  no-ops on the already-applied destination; NO second surge) and clear the
  flag; else the existing `syncSceneState(true)` fallback (covers same-theme
  crossings, module-not-yet-loaded, and hard loads).

Did NOT touch the contact flow, chat logic, theme.ts, or any page/component.

## Why it can't wedge / double-fire

- Double-surge guard: navTravel fires the surge; page-load's choreographed
  branch calls syncSceneState(false) which passes surge=false and whose
  setTheme(dest) no-ops (theme already == dest after navTravel). Verified
  setTheme early-returns on equal theme.
- Rapid double-nav: a second before-swap recomputes the stamp and calls
  navTravel again with the new destination. The scene's existing `request()`
  rerouting handles a travel arriving mid-flight (out -> queue pending, hold ->
  swap cur, in -> restart out); the envelope stays compressed and resets to
  ambient only when the chain reaches idle. No wedge by construction.
- Back/forward: before-swap fires on popstate, so the same gate + treatment
  applies.
- Fallback (`fallback="swap"`) browsers still fire the lifecycle events, so
  navTravel runs and the mark snaps/travels; there are no ::view-transition
  pseudos, so the CSS overrides are simply inert there.
- CLS 0: opacity/transform only on snapshot layers; the scene layer is
  position:fixed + aria-hidden; no new rAF or timers (the surge and the
  compressed envelope both ride the tide's existing single rAF tick).
- `documentElement` persists across the swap, so the stamp set at before-swap
  survives the very transition it governs.

## Verification

- `npm run build` (astro check + build): GREEN, 0 errors (15 pre-existing hints,
  1 pre-existing content.config zod deprecation warning; none in my files).
- Em-dash / en-dash scan across all three files: CLEAN.
- Built CSS (dist): the two `html[data-vt-matrix]::view-transition-old/new(main)`
  overrides present (`.14s both vt-main-out` / `.2s .46s both vt-main-in`) plus
  the reduced-motion `html[data-vt-matrix]...{animation:none}` coverage, on every
  page.
- Built JS: scene chunk exports `getTheme(){return n}` and `navTravel(`; the
  BaseLayout/terminal bundle has the full gate wired
  (`newDocument.querySelector(".screen")?.dataset.sceneTheme`, `isThemeName(r)`,
  `.getTheme()`, `.navTravel(i)`, `vtMatrix=`` `` and `delete ...dataset.vtMatrix`).
- Page theme map (dist), confirming the gate fires on the right crossings:
  home / about / chat / contact / 404 = `default`;
  eight-angle = `eight`, facebook-newsroom = `news`,
  google-android-for-work = `android`, atg-llm-migration = `atg`,
  gold-coast = `goldcoast`. So home -> /about = no stamp (both default);
  home -> any article = stamp + travel; article -> article = travel.
  Every page carries `data-scene` and a `.screen[data-scene-theme]`.

### Not run: live browser pass (needs the human eyeball)

I could not complete an in-browser run. One local Chrome is connected, but the
Chrome automation tool contract requires an interactive browser-selection
confirmation (AskUserQuestion) that an autonomous subagent cannot perform, and
automation tabs throttle rAF, which would invalidate the surge/stats timing
checks anyway. The following need a foregrounded human pass on `npm run preview`
(localhost:4321):

1. home -> an article: `document.documentElement.dataset.vtMatrix` is set during
   the swap, the mark travels on the compressed envelope, exactly one surge.
2. home -> /about: attribute ABSENT, current fast fade, no travel, no surge.
3. article -> article: mark travels between the two identities.
4. Back / forward across a theme boundary: same treatment.
5. Rapid double-nav (e.g. home -> article -> another article fast): no wedge, the
   mark resolves to the final destination.
6. Reduced motion: everything snaps (attribute may be present, CSS forces snap).
7. Console clean; `window.__scene.stats().max` < 4ms during a nav.

## Knobs to flag for Brian

- Beat window (CSS, `html[data-vt-matrix]`): old 140ms, new delay 460ms, new
  200ms. This defines the dark window where the live scene is the sole visible
  event and where the new column lands relative to the mark reforming.
- Nav envelope (scene/index.ts): `NAV_OUT_MS=200 / NAV_HOLD_MS=140 /
  NAV_IN_MS=300`. The compressed mark dissolve/hold/reform. Sky + peak stay on
  the untouched 2.6s clock deliberately.
