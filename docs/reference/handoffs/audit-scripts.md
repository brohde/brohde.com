# Handoff: publish-readiness audit Phase A, domain CLIENT SCRIPTS

Auditor: Opus code auditor. Scope fence (edited nothing outside): `src/scripts/terminal.ts`,
`src/scripts/theme.ts`, `src/scripts/scene/index.ts`, `src/scripts/scene/sources.ts`.
`src/scripts/scene/live.css` was read for context but is not a `.ts` file and was not touched.
`poc/` and `functions/` untouched (other owners).

Bar: a strong engineer reads this cold and is impressed. Build green after the commit
(`npm run build` = `astro check && astro build`, 12 pages, 0 errors). House rules held:
zero em dashes in comments written, no co-author trailer, conventional commit.

Commit: `20c6fdd refactor(terminal): freshen stale-era comments, dedup contact retry, name type-settle beat`

---

## 1. Mechanical fixes applied (behavior unchanged, all in terminal.ts)

All changes are provable no-ops or comment-only. The diff moves exactly one behavior
literal (`120`), preserved verbatim as a named constant. No `setTimeout` value, threshold,
regex, or user-visible string changed. The #61 chat contract, contact flow, transitions,
and eval-graded strings are untouched.

| # | Kind | What | Why |
| - | ---- | ---- | --- |
| 1 | Stale comment (Q2) | `startRedirect` focus-fallback comment said the fallback is "the header composer, /chat's input since #153" | The fallback is `CHAT_INPUT` = `#in-chat`, the docked panel composer since Phase 4B. The header input (`#in-site`) is explicitly NOT the /chat composer anymore (see the `CHAT_INPUT` doc block, and `syncHeaderChat`). Comment now reads "the docked /chat composer (#in-chat, Phase 4B)". |
| 2 | Stale comment (Q2) | `askLive` error-path comment said "502/503 offline text with the email" | The email came off every visitor surface in #183; the offline body is a try-again with no address. Comment corrected to "no email since #183, just a try-again". |
| 3 | Stale comment (Q2) | `run()` `chat` command comment said "The composer is the header input (#153), so that is where focus lands" | Same Phase 4B supersession as #1: it focuses `#in-chat`, the docked panel input, not the header. |
| 4 | Magic number to named const | `window.setTimeout(done, 120)` in `typeInto` | The file names every other timing (`PULSE_MS`, `CONTACT_PULSE_MS`, `REDIRECT_SECONDS`, `TYPE_BASE`). Extracted to `TYPE_SETTLE_MS = 120` beside `TYPE_BASE`; value byte-identical. |
| 5 | Duplicated logic (factors within file) | The post-send-failure retry block (`awaiting = "confirm"; append the chips`) appeared verbatim in both the server-not-ok branch and the network-throw `catch` of `doContactSend` | Factored into `reofferContactSend()`. Identical guard (`if (!contact) return` vs the old `if (contact) {...}`) so behavior is unchanged. |
| 6 | Shadowed local rename | `coerceHistory` named its accumulator `out`, shadowing the prominent module `out()` sink | Renamed to `hist`. Pure local rename, no-op. |

Comment audit against "today's changes" (contact flow rework, navTravel, arrow nav,
dropped features) came back otherwise clean:
- The `astro:before-swap` navTravel/`navChoreographed` gate comments are accurate.
- The article arrow-nav keydown block (bare Left/Right walk newer/older) is correctly
  attributed and matches behavior.
- Dropped-feature notices (autocomplete/history retired with the slab #160; the email card
  #183; `resume` no longer a command, item 6; the OFFLINE_HTML email note) are all accurate.
- `theme.ts` and both scene files: comments verified accurate; nothing edited there (see the
  conservatism note under the scene proposal). These three files are already at the "impress a
  cold reader" bar for comment quality.

---

## 2. STRUCTURAL PROPOSAL A: split terminal.ts (~2088 lines)

NOT built. This is a proposal for a later phase with Brian's sign-off, because every real
seam crosses the frozen #61/contact/transition surface and the payoff is readability, not
behavior.

### The core difficulty

terminal.ts is not 2088 lines of independent features; it is one tightly-woven state
machine. The hard coupling is **shared module-level mutable state** that many concerns read
and write:

- `transcript`, `llmHistory`, `activeTurn`, `replaying` (chat log + persistence)
- `contact` (contact flow, but read by the submit handler, Escape handler, `clearChat`, `dropThread`)
- `redirect` (countdown, but cancelled by the input handler, Escape handler, before-swap)
- `pendingAfter` / `pendingFocus` / `pendingEmulate` (navigation carry, set by router + contact + chat, consumed by `initPage`)
- `navChoreographed`, `sceneMod` (scene bridge)

And the call graph crosses concerns freely: `askLive` (chat) calls `startRedirect` +
`openSlug` (redirect/nav) + `renderReply` (log); the contact flow calls `beginTurn` /
`thinking` / `pulseThen` / `sink` (log + pulse); `run` (router) fans out to chat, contact,
console, and nav. A naive ES-module split would force exporting mutable bindings (an
anti-pattern) or threading a context object through everything.

### Recommended decomposition (leaf-first, staged)

Order matters: extract the low-coupling leaves first (they import from a core but nothing
imports THEIR mutable state), leaving the tightly-coupled core for last or never.

**Stage 1 (LOW risk, do first) - pure/near-pure leaves, ~250 lines out:**

- `scripts/terminal/typing.ts` - `humanDelay`, `typeInto`, `autoGrow`, `FIELD_SIZING`,
  `GROW_CAP`, `TYPE_BASE`, `TYPE_SETTLE_MS`, `prefersReducedMotion`.
  Exports those functions. Imports nothing from the rest. **Zero shared state.** This is the
  cleanest extraction in the file and a good proof-of-concept for the module boundary.
- `scripts/terminal/a11y.ts` - the roving cursor: `ROVE_SELECTOR`, `roveEls`, `isRove`,
  `setRoveStop`, `moveRove`, `moveRoveEnd`, plus `announce`/`hint`/`hintTimer`/`announcer`.
  Its only state (`roveHinted`, `hintTimer`, `announcer`) is self-contained. Exports the
  functions; the keydown/focusin glue in `setupOnce` imports them. LOW-MED (it owns the
  announcer that a few other places call, so `announce` moves with it and is imported back).
- `scripts/terminal/dom.ts` - `byId`, `currentScreen`, `chatlog`, `sink`, `beginTurn`,
  `scrollToNewest`, `activeTurn`, `replaying`. This is the **chat-log core** everything else
  renders through. Because `activeTurn`/`replaying` are shared mutable state, expose them via
  functions (`getActiveTurn()`, `beginTurn()`, `setReplaying()`), never as exported `let`.

**Stage 2 (MED risk) - feature layers on top of the Stage 1 core:**

- `scripts/terminal/persistence.ts` - `Entry`, `transcript`, `record`, `saveChat`,
  `purgeChat`, `coerceHistory`, `rehydrateChat`, `renderEntry`, `dropThread`, `STORE_KEY`,
  `MAX_ENTRIES`, `MAX_LLM`, `OUT_ALLOW`, `REDIRECT_HREFS`. Imports `dom.ts` + the render
  functions. Risk: `renderEntry` calls `echo`/`renderReply`/`out`/`line`/`renderRedirect`,
  so those render builders must already live in `dom.ts`/`chat.ts` (import direction stays
  acyclic: persistence -> render -> dom).
- `scripts/terminal/redirect.ts` - `redirect`, `renderRedirect`, `startRedirect`,
  `commitRedirect`, `cancelRedirect`, `redirectDest`, `isExplicitNav`, `REDIRECT_SECONDS`,
  `EXPLICIT_NAV`. Imports `dom.ts` + `record`.
- `scripts/terminal/chat.ts` - `askLive`, `ask`, `toChat`, `renderReply`, `thinking`, `out`,
  `line`, `echo`, `openSlug`, `SLUG_HREF`, `MD_LINK`, `CHAT_URL`, `IS_LOCAL`, `llmHistory`,
  the greeting builders, `pulseThen`, `PULSE_MS`. (The render builders `echo`/`out`/`line`/
  `renderReply` could equally live in `dom.ts`; keep them wherever `renderEntry` can import
  them without a cycle.)
- `scripts/terminal/contact.ts` - the entire contact flow (`contact` state, `ContactState`,
  `Awaiting`, all `contact*`/`ask*`/`mk*`/`extract*`/`merge*`/`collect*`/`advance*` fns,
  `reofferContactSend`, `CONTACT_URL`, `CONTACT_Q`, `CONTACT_PULSE_MS`). Biggest single
  block (~450 lines) and a natural module. Imports typing, dom, chat's `pulseThen`/`thinking`.

**Stage 3 (the glue, keep last):**

- `scripts/terminal/index.ts` - `setupOnce`, `initPage`, `syncHeaderChat`, `syncSceneState`,
  `requestScene`, `setupPin`, the `run()` router, the `pending*` carry, and all the
  `document.addEventListener` wiring. This stays the orchestrator that imports every feature
  module and owns the cross-cutting `pending*`/`navChoreographed` handoff state. The `pending*`
  vars are the one piece of shared state that genuinely belongs to the glue, so they stay here.

### Import graph (acyclic, arrows = "imports from")

```
index.ts (glue: setup, router, initPage, scene+header bridge, pending* state)
  |-- contact.ts --> typing.ts, dom.ts, chat.ts(pulseThen/thinking)
  |-- chat.ts ------> dom.ts, redirect.ts, persistence.ts(record)
  |-- redirect.ts --> dom.ts, persistence.ts(record)
  |-- persistence.ts --> dom.ts, chat.ts(render builders)   <-- watch this edge
  |-- a11y.ts ------> (self-contained)
  |-- typing.ts ----> (self-contained)
  |-- dom.ts -------> (self-contained core)
```

The one edge to design carefully is persistence <-> chat (renderEntry needs the render
builders). Resolve by putting the low-level render builders (`echo`/`out`/`line`/
`renderReply`/`renderRedirect`) in `dom.ts` (or a `render.ts`) that both import, keeping the
graph acyclic.

### Migration risk + effort

- **Risk: MED overall, dominated by the shared-state conversion.** Every `let` at module
  scope that is written by more than one future module must become a function-guarded
  accessor in its owning module. Get this wrong and you silently fork state (two modules each
  holding their own `activeTurn`). Mitigation: grep every module-level `let`/`const [] `/`{}`
  for cross-section writes before moving it; there are ~12 such bindings.
- **Behavior-freeze risk: the delegated listeners must stay attached exactly once** (`setupOnce`
  is guarded by `window.__terminalInit`). Keep ALL `addEventListener` calls in `index.ts`;
  do not let feature modules attach their own document listeners, or the once-guarantee (and
  the VT-safety invariant in the header comment) breaks.
- **Effort: ~1 to 1.5 focused days** for Stages 1+2, plus a full rendered-surface re-validation
  (the #61 eval is server-side and unaffected, but the client flows - contact, redirect
  countdown, rehydrate, roving cursor, arrow nav - each need a live pass). Stage 1 alone is a
  ~2 hour, low-risk win that proves the boundary and takes ~250 lines off the file.
- **Recommendation:** do Stage 1 (typing + a11y + dom core) as its own reviewable phase; hold
  Stages 2-3 for a dedicated session. Do NOT attempt a big-bang split. The file is long but
  exceptionally well-commented; the readability ceiling it's hitting is length, not clarity,
  so a partial extraction that pulls the two self-contained leaves already buys most of the
  benefit at a fraction of the risk.

---

## 3. STRUCTURAL PROPOSAL B: scene/index.ts (~1123 lines)

NOT built. Assessment only.

### Shape

Unlike terminal.ts, this file is already 60% clean data + 40% one big closure:

- Lines ~82-310: **pure data + types** - grid/timing/envelope constants, `INKS`, `PEAKS`,
  `THEME_SOURCE`, `PLACEMENTS`, the `Rect`/`PlacementSpec`/`ThemeName`/... types, `isThemeName`.
- Lines ~312-348: small pure helpers (`clamp`, `ease`, `lerp3`, `div`, `buildSkySlot`, `reduced`, `isLite`).
- Lines ~381-1064: **`mount()`** - one ~680-line closure holding the entire engine (tide
  math, boot staging, observers, the handle API) over ~40 shared local `let`s.
- Lines ~1066-1123: module init (`ensureLiveStyles`, `initScene`, the page-load bind).

### Recommended decomposition

**Worth doing (LOW risk, real win):**

- `scene/palettes.ts` - `INKS`, `PEAKS`, `THEME_SOURCE`, `ThemeName`, `GroundKey`,
  `SceneState`, `isThemeName`. Pure data + one type guard. ~180 lines of the file are these
  tables. Moving them makes the engine file about the engine. Zero behavior risk.
- `scene/placements.ts` - `PLACEMENTS`, `PlacementSpec`, `Rect`, `PlacementName`, and the
  geometry constants they use (`CONTENT_SEL`, `CONTENT_W`, `MIN_GUTTER`, `MARK_PAD`). Small,
  self-contained, zero risk.
- `scene/constants.ts` (optional) - the timing/envelope block (`CW`..`WAKE_DENSITY`). Marginal;
  could fold into the engine file since they are only read there.

`sources.ts` is already a clean separate module (good prior art for the boundary).

**NOT worth doing (HIGH risk, low payoff): splitting `mount()`.** The engine is one closure
by design - `step`/`advance`/`resize`/`loop`/`travelTheme` all share ~40 hot locals (`w`, `h`,
`cols`, `rows`, `canvas`, `phase`, `m`, `mix`, `tmix`, `surge*`, the precomputed `sin*`
arrays, ...). Breaking it apart means converting the closure to a class with ~40 instance
fields or threading a mutable state struct through every hot function. That:
1. touches the frozen `<4ms` tick and the staged-boot long-task avoidance (both measured in
   the B1 report),
2. adds property-access indirection to the innermost per-cell loop (a real, if small, perf
   cost on the exact code path that must stay fast),
3. buys little - the closure is already sectioned with clear banner comments and reads well.

If a future maintainer insists, the only defensible version is a `class SceneEngine` where
the current locals become private fields and the current inner functions become methods, done
as its own perf-gated phase with before/after `window.__scene.stats()` on dist. I would not
schedule it. Extract the data tables; leave the engine whole.

### Effort

palettes + placements extraction: ~1-2 hours, LOW risk, `astro check` + one `__scene.stats()`
glance closes it (imports only, no logic moves). The engine-class refactor, if ever: ~1 day +
full perf re-validation, and I recommend against it.

---

## 4. PERF assessment (flag only, nothing fixed)

No violation of the `<4ms` scene tick and no NEW main-thread work introduced by this audit.
Observations, all pre-existing and within budget:

- **The tick is `fillText`-bound** (`scene/index.ts` `step`): cost scales with the number of
  LIT cells, not total cells. The three sine terms are already separated into per-tick
  `sinCol`/`sinRow`/`sinDiag` arrays (the "production delta" over the lab), so the per-cell
  inner loop is array reads + one `Math.floor` + a bucket compare + occasional `fillStyle` +
  `fillText`. `CELL_CAP = 6000` scales the cell size up on large monitors to hold the budget.
  This is the intended design and is measured green in the B1 report. Not a regression; noted
  so a future editor does not add per-cell work casually.
- **The surge envelope adds one `smoothstep` eval per tick** (`surgeEnvelope`), constant cost,
  independent of grid size. Negligible.
- **`sample()` uses `getImageData` (`willReadFrequently`)** but runs lazily off the tick (only
  on a mark change / resize, cached in `LUM`), never per-frame. Correct.
- **`autoGrow` forces a synchronous reflow per input event** (`terminal.ts`: set height to
  auto, read `scrollHeight`, set height) - but ONLY on browsers without CSS `field-sizing`
  (guarded by `FIELD_SIZING`). On supported browsers it early-returns. Pre-existing, gated,
  acceptable; flagged because it is the one per-keystroke layout-thrash path in the client.
- **All terminal.ts DOM listeners are delegated on `document` and attached once** behind
  `window.__terminalInit`; scene observers (`IntersectionObserver`, `MutationObserver`,
  `matchMedia`, resize/DPR) are all torn down in `destroy()` / `cleanups`. No listener leak
  across VT navigations. Clean.
- **rAF discipline is correct**: the scene loop pauses when hidden / offscreen / reduced-motion
  (`update()`), and the settled still is painted on pause so no half-travelled frame is left.

---

## 5. Verification

- `npm run build` green before and after (12 pages, `astro check` 0 errors).
- Full `git diff` reviewed for behavior tokens: the only moved literal is `120`
  (-> `TYPE_SETTLE_MS = 120`, value preserved). No timeout value, threshold, regex, or
  user-visible/eval-graded string changed.
- `reofferContactSend` guard verified equivalent to the two inlined blocks it replaces.
- Zero em dashes in written comments; conventional commit; no co-author trailer.

Not done (out of approved scope): any module split (proposals only), any scene edit, any
`theme.ts` edit (verified clean).
