# Handoff: low-risk script extraction (#213), SCRIPTS half

Engineer: Opus frontend engineer, isolated worktree `agent-abc442a77cfdaf083`.
Scope fence: `src/scripts/**` only. Nothing else touched.

Follows the audit handoff `docs/reference/handoffs/audit-scripts.md`: this is its
**Stage 1** for terminal.ts plus the LOW-risk scene data extraction (Proposal B
"worth doing"). Stages 2-3 of terminal.ts were explicitly NOT attempted (#213).

Bar held: behavior byte-frozen (imports/exports + comment moves + accessor
wiring only), `npm run build` green, `astro check` 0/0/0, zero em dashes in
written comments, no co-author trailer, module-level doc comment on every new
file.

---

## 1. What was extracted

### terminal.ts Stage 1 (the two self-contained leaves + the log-core)

`src/scripts/terminal.ts` (was ~2088 lines) now imports three new leaf modules
under `src/scripts/terminal/`. ALL `document.addEventListener` wiring, the
`setupOnce`/`initPage` glue, the `run()` router, the `pending*` carry, the
contact flow, chat bridge, persistence, and redirect countdown STAY in
terminal.ts per the freeze invariant (the once-guard `window.__terminalInit`
and the VT-safety "listeners attached exactly once" rule are untouched).

- **`src/scripts/terminal/typing.ts`** (self-contained, zero imports) -
  `prefersReducedMotion`, `autoGrow` (+ `FIELD_SIZING`, `GROW_CAP`), the
  humanized keystroke emulation `humanDelay` + `typeInto` (+ `TYPE_BASE`,
  `TYPE_SETTLE_MS`). terminal.ts imports `{ prefersReducedMotion, autoGrow,
  typeInto }`; the consts and `humanDelay` are module-private.
- **`src/scripts/terminal/dom.ts`** (self-contained, the chat-log core) -
  `byId`, `currentScreen`, `chatlog`, `sink`, `beginTurn`, `removeGreeting`,
  `scrollToNewest`, and the turn state (`activeTurn`, `replaying`). The shared
  mutable state is exposed as `setActiveTurn`/`setReplaying` accessors (per the
  audit's "never export a `let`" rule), NOT as bindings; `beginTurn`/`sink` read
  it internally. `removeGreeting` moved here beside the log core that
  `beginTurn` calls it from; `showGreeting` (which builds greeting text) stayed
  in terminal.ts.
- **`src/scripts/terminal/a11y.ts`** (imports only `byId` from `./dom`) -
  the polite live-region `announce` + transient `hint`, and the roving page
  cursor (`roveEls`, `isRove`, `setRoveStop`, `moveRove`, `moveRoveEnd`,
  `ROVE_SELECTOR`). The once-per-load rove-hint flag is exposed as
  `getRoveHinted`/`setRoveHinted` (the focusin handler in terminal.ts reads +
  writes it).

Import graph (acyclic): `terminal.ts -> typing, dom, a11y`; `a11y -> dom`;
`typing`, `dom` self-contained. Matches the audit's Stage-1 graph.

The only in-place edits to terminal.ts logic are the accessor swaps that the
state move forces, each a semantic no-op (same module-level binding, now behind
a function): `activeTurn = null` -> `setActiveTurn(null)` (x3, in clearChat /
dropThread / rehydrateChat); `replaying = true|false` -> `setReplaying(...)`
(rehydrateChat); `roveHinted` read/write -> `getRoveHinted()` / `setRoveHinted(true)`
(focusin). Everything else is a verbatim block move + an import line.

### scene/index.ts data tables (audit Proposal B, the "worth doing" part)

The pure data tables came out of `src/scripts/scene/index.ts` (was ~1123
lines). The `mount()` closure and the tick/`step`/`advance` path were NOT
touched (the audit's HIGH-risk "do not split the engine" call is respected).

- **`src/scripts/scene/palettes.ts`** - `INKS`, `PEAKS`, `THEME_SOURCE`,
  `isThemeName`, and the `GroundKey` / `SceneState` / `ThemeName` types. Pure
  data + one type guard. Imports only `type SourceName` from `./sources`.
- **`src/scripts/scene/placements.ts`** - `PLACEMENTS`, the `Rect` /
  `PlacementSpec` / `PlacementName` types, and the content-column geometry
  (`CONTENT_SEL`, `CONTENT_W`, `MIN_GUTTER`, `MARK_PAD`). Self-contained.

`index.ts` imports both back and **re-exports `isThemeName`**
(`export { isThemeName };`) so the terminal.ts scene bridge keeps importing it
from `@/scripts/scene` exactly as before (`sceneMod.isThemeName(...)`). The
`initScene` / `SceneHandle` / `SceneStats` surface is unchanged.

---

## 2. Verification

- `astro check`: **0 errors / 0 warnings / 0 hints** (37 files, was 32; +5 new
  modules). Baseline before the work was also 0/0/0.
- `npm run build`: **green, 12 pages**, before and after.
- **No behavior literal changed** (proved, not asserted):
  - Scene: the multiset of every numeric tuple `[...]` in
    `index.ts + palettes.ts + placements.ts` md5-hashes identical to the pre-split
    `index.ts` (`6274141429cefb6655ff8b62af09b972`). Every RGB triplet and array
    is byte-preserved.
  - Terminal: every string literal and numeric constant in the three new modules
    ("(prefers-reduced-motion: reduce)", "chatlog", ".slab-chat > .chatcomposer",
    "a[href], button[data-cmd]", 14/120/160/45/40/70/60/90/110/350/2600/0.7/0.6/0.05,
    etc.) exists verbatim in the original terminal.ts. The `git diff` of
    terminal.ts is exclusively: three import blocks, note-comments where code
    left, verbatim function/const removals, and the six accessor swaps above.
- **dist spot-check** (bundled/minified output): the terminal chunk
  (`dist/_astro/BaseLayout.astro_astro_type_script_index_0_lang.*.js`) contains
  a symbol from each new module - "Arrows move the cursor" (a11y), "Write a
  message" (typing path inlined), "slab-chat > .chatcomposer" (dom). The scene
  chunk (`dist/_astro/scene.*.js`) contains "246,78,94" (palettes, twilio peak)
  and ".wrap" (placements, CONTENT_SEL). Chunk hashes changed (comment moves are
  real bytes), which is expected and harmless.

The #61 chat contract is server-side and untouched; every change here is
client-module reorganization.

---

## 3. Human smoke test (rendered surface, not proven in the agent sandbox)

The extraction is import-wiring only, but the moved code drives live behavior;
one pass on `npm run dev` (or built dist) closes it:

1. **Chat send** (/chat and the homepage flow bar): type a question, Enter and
   [send] both submit; the turn opens newest-at-top; thinking pulse then reply.
   (Exercises dom `beginTurn`/`sink`/`scrollToNewest` + the turn-state accessors.)
2. **Contact flow arm**: click the Contact nav item / an inline [contact] link
   from an interior page -> lands on /chat, the composer TYPES the question
   (typing.ts emulation), then the greeting + [cancel] chip appears; typed
   "contact" enters directly. Confirm the humanized typing still reads natural.
3. **Roving cursor + hint** (keyboard): Tab into the page, arrow through links;
   the once-per-load "# Arrows move the cursor" hint fires on first focus-visible
   (a11y accessor path). Escape parks/leaves as before.
4. **Theme toggle**: flip light/dark; the scene ground follows (palettes.ts
   feeds the same engine).
5. **A transition**: navigate home <-> an article whose theme differs (e.g. the
   Android or Gold Coast piece) and watch the identity travel + nav surge
   (palettes/placements feed `mount()` unchanged); a same-theme crossing
   (home <-> /about) keeps the fast fade.

Reduced-motion and true-phone-width remain the usual environment-blocked checks.

---

## 4. Notes for the lead

- **`node_modules` in the worktree**: this worktree had none, so a symlink to
  the main checkout's `node_modules` was created to build. It is untracked and
  NOT ignored by `.gitignore` (the ignore pattern is `node_modules/`, which does
  not match a symlink). It was removed before handoff; if it reappears, do not
  commit it.
- **Stages 2-3 of terminal.ts NOT done** (persistence / redirect / chat /
  contact feature modules + the index.ts glue split), per #213. The audit's
  Stage-1 boundary is proven; the tightly-coupled core (transcript, contact,
  redirect, pending* shared state) is a dedicated later session.
- **`constants.ts` for the scene** (the timing/envelope block) was left folded
  into the engine file, as the audit called it "marginal" - those consts are
  read only inside `mount()`.
- No STATUS/DECISIONS/COMMS edits (outside the src/scripts fence; the lead owns
  those on merge).

## File map

New:
- `src/scripts/terminal/typing.ts`
- `src/scripts/terminal/dom.ts`
- `src/scripts/terminal/a11y.ts`
- `src/scripts/scene/palettes.ts`
- `src/scripts/scene/placements.ts`

Modified:
- `src/scripts/terminal.ts` (imports + note-comments + accessor swaps; ~264 lines lighter)
- `src/scripts/scene/index.ts` (imports + isThemeName re-export; data tables removed)
