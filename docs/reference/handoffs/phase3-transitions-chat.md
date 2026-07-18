# Phase 3 handoff: tide transitions + /chat top composer + homepage restructure

_Worktree branch `worktree-agent-a63802c859b71425e`, fast-forwarded to local main (9e8bd2e) before work began. Four feature commits, phased for review: 040d51d (Phase A), 109bce9 + bf0700a (Phase B), b0b9e2e (Phase C). Not pushed; the lead merges. Build green (`astro check` 0 errors + 10 pages) after every phase. Governing orders: #150 (motion-spec-r1), #153 (chat-top-spec + chat-surfaces-r1 for the /chat frame and input material), and the mid-build change orders #160 (homepage restructure Option A, superseding chat-surfaces-r1's slab section) and #162 (via Beyond). The #61 model contract is untouched: every change is client-side presentation; the /api/chat request shape and handling are byte-identical._

## Phase A (040d51d): the tide carries you

- The opaque 140ms wipe is fully retired: cover element, CSS, loader hold, transition-kind machinery, all gone. Nothing covers the persistent scene during a navigation.
- The reading column is the only thing that visibly transitions: `main` is its own view-transition group (global.css). Old content fades and lifts 8px over 160ms; new content fades in and settles from 8px over 220ms after a 40ms beat. Opacity and transform only, on snapshot layers, so CLS is 0 by construction. The group snaps to the arriving page's box (no positional morph) and snapshots keep intrinsic height (no stretch between short and long pages).
- Identity travel needed no new wiring: the interior-pages bridge already reads the DESTINATION theme from the fresh `[data-screen]` section stamp (never the persisted scene node, which carries the old dataset) and calls `setTheme()` on the scene's 2.6s clock. The wipe's retirement is what makes the travel visible. /chat resets to default + golden hour through the existing `setState` bridge.
- The header gained `transition:persist="shead"`: the same DOM node survives every navigation (validated by node identity across a four-page walk), so the wordmark caret literally never stops. Per-page state (data-hchat, data-screen) is re-stamped in `syncHeaderChat` on `astro:after-swap`, before the new frame paints.
- `ClientRouter fallback="swap"`: browsers without native view transitions get an instant swap rather than Astro's simulated whole-document fade, which would blink the scene.
- Reduced motion = snap: an explicit `::view-transition` override (the global kill switch cannot reach UA pseudo elements), the scene's own internal snap, no cover, no lift.
- Micro-adds at the spec's exact values: nav tokens ease color and text-decoration-color over 120ms; ledger rows answer the cursor with the date joining the title's accent and a 2px reading-direction title nudge (transform only, 120ms).

## Phase B (109bce9 + bf0700a): the /chat surface

- UNIFY per chat-top-spec: the header input row un-hides on /chat and IS the composer; sticky on /chat only (`.shead[data-screen="chat"]`, page ground behind it, z-index 40); the bottom dock is retired entirely, deleting the site's only bottom-fixed control and its keyboard-occlusion class along with its safe-area padding (the footer keeps the bottom inset).
- Newest-at-top transcript with the spec's exact pattern: `beginTurn()` prepends a `.turn` block per user turn, `sink()` routes every line builder into the active turn (with an isConnected guard so a stale turn from a previous page can never swallow output), `scrollToNewest()` replaces the old scroll-to-bottom with an instant scroll to top. DOM order equals visual order (no column-reverse); within a turn the flow stays natural: echo, thinking, reply, redirect.
- #118 thinking swap held: validated live that the SAME node (===) carries dots then the reply at an unchanged rect top. #143 countdown and #144 persistence keep their exact behavior rendered at the top: replay regroups by echo boundaries, restored redirect lines render settled (link only, never re-armed), the two intro lines hide when a stored thread exists (the CLS guard), and every `in-chat` focus target moved to `in-site`.
- Frame per chat-surfaces-r1 (which wins over chat-top-spec on `.slabhead`): phosphor panel kept, title bar + ready dot removed, panel sized to content with `min-height: clamp(280px, 40vh, 420px)`, `.turn + .turn` separated by the ledger's own hairline token (`var(--line)`, 16px padding + margin), golden hour as atmosphere only (scene sky + amber halo, zero ink changes).
- Keybar kept as `[help] [clear]` (chat controls only the chat provides); `[home]` dropped as redundant with the wordmark. `aria-controls="chatlog"` stamps onto the composer only while the log exists. The single polite announcer is untouched and now bridges the banner-landmark composer to the main-landmark transcript.
- Separate commit bf0700a: `interactive-widget=resizes-content` on the viewport meta (chat-top-spec Q3), individually revertable. The composer input stays 16px, the iOS no-zoom floor.

## Phase C (b0b9e2e): homepage restructure Option A (#160 + #162)

- Reading column, top to bottom: masthead, role line (#151 untouched), companies lines, flow chat bar, ledger. The slab is gone.
- Masthead: h1 `brian rohde` (lowercase #115) with the resting caret, restored to the recovered C-era scale byte-for-byte (`clamp(34px, 7.5vw, 50px)` / 1.05 / -0.03em / 700 / Circular / `var(--bright)`; caret 0.4em x 0.78em). It is the homepage's only h1 and yields under `html.cfocus` exactly like the header caret.
- Flow chat bar: the header input material extracted into `ChatBar.astro` (one source for both placements, they cannot drift), rendered in the flow with only spacing differing (`.flowchat`, 28px top margin). Fully functional: sends ride the unchanged pendingAfter carry to /chat (validated live). The hint line (`#hint-top`) moved beneath it, height reserved, so command nudges still have a visible surface on home.
- The `[send]` chip (chat-surfaces-r1 Q3) landed on the shared material, so it appears in the header row AND the flow bar: bracket-fill grammar, `type="submit"` through the one delegated submit path, `aria-label="Send"`, min-width 44px inside the 48px row. To make the chip's grammar resolve correctly on either page ground, `.hchat` now scopes the night tokens (`--accent`/`--on-accent`/`--dim`) exactly like the slab material always did; no visual change to the input itself.
- Header on home: the wordmark row hides and the nav tokens right-align, both driven by the same server-stamped + after-swap re-stamped `data-screen` the sticky /chat state uses. The wordmark is ALWAYS a `<p>` now (Phase A's h1/p tag fixup was deleted as obsolete); interior pages keep it as chrome + home link.
- #162: `(contract)` became `via Beyond`. "via" wears the old note's dim style (.cnote); "Beyond" is a QUIET link per Brian's refinement: dim ink + dim underline at rest (measured 7.19:1 night / 7.97:1 light, comfortably past AA; the underline carries the affordance so G183 never binds), stepping to accent on hover/focus.
- Consequence stated plainly: command autocomplete (#48) and prompt history recall (#44) lost their only surface (they were gated to the slab's `.prompt input`) and their machinery was removed from terminal.ts per the house no-dead-code standard. Deterministic commands still run from every input (validated: typed and clicked, on home, /about, and /chat). Revival path if ever wanted: chat-top-spec Phase B (parity on the `.hchat` inputs); the machinery is one `git show` away.
- Deleted: `Slab.astro`, `CommandMenu.astro`, `Prompt.astro`, and all their CSS (prompt, ghost placeholder, autocomplete popover, slab head/hello/menu). The `.slab` material itself survives with one consumer, the /chat transcript panel. Styleguide follows reality: slab + autocomplete specimens replaced by masthead + flow-bar + via-Beyond specimens, send chip added to the header specimen. README repo map updated.

## Spec deviations, with reasons

1. chat-top-spec said "Keep `.slabhead`" on /chat; chat-surfaces-r1 section 3 explicitly overrides it (remove); the brief ratified chat-surfaces as the winner. Removed.
2. chat-surfaces-r1's slab simplification (greeting line, hero prompt 66px/17px, CommandMenu cut) was first HELD by change order, then SUPERSEDED by #160: the slab is removed outright, so the greeting/hero-prompt work never shipped and the greeting copy question is moot.
3. The motion spec's optional 300ms content fade-up on home entry: not built (the boot-kill engineer also declined it; arrival = scene wake + caret).
4. `.chatcmds` got no extra chrome (chat-top-spec offered "a thin top command row" styling): the bare keybar above the log reads clean and any added hairline would re-introduce the head-strip look just removed. One-line addition if wanted.
5. motion-spec Appendix B note only: with the wipe gone, the brief moment between old-snapshot capture and swap shows a STILL of the scene (native view-transition behavior). At the tide's 9fps cadence and local fetch times this is sub-tick and imperceptible; named here so nobody rediscovers it as a mystery.

## Validation

Build: `npm run build` green after every phase (0 errors; the pre-existing content.config.ts `z` deprecation warnings only; 10 pages).

Lighthouse mobile on the built dist (astro preview, 127.0.0.1:4480):

| page | Perf | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| / | 100 | 1.1s | 0 | 0 |
| /log/facebook-newsroom/ | 100 | 0.8s | 0 | 0 |
| /chat/ | 100 | 0.8s | 0 | 0.001 (localhost-only, see below) |

The /chat 0.001 is the IS_LOCAL dev note swap (`# Live model via the local POC` is shorter than the shipped intro line, so the second intro line reflows). Production never rewrites that line, so production CLS is 0. Pre-existing dev behavior, not introduced here.

Sonnet browser round on the built dist (live POC replies), 13 checks: PASS on all structural checks. Highlights, all measured: home has one h1 (the masthead) + hidden header wordmark + right-aligned nav + flow bar with working [send] and NO slab; home to article crossing with the SAME scene node and SAME header node (===), no `#wipe`, CLS 0, destination stamp `news`; article/home/article history walk holds identity and flips themes; /chat has sticky header composer, `aria-controls`, no slabhead/dock, panel 311px on empty state; live newest-at-top with the same-node thinking swap at an unchanged rect; persistence restore newest-first with hidden intro lines at CLS 0; clear wipes and stays cleared, restore un-hides intro lines; commands run typed and clicked on every surface incl. the hello tour; send chip navigates and carries the question from /about; header stamp matrix exact on all five crossings incl. Back; console COMPLETELY CLEAN across the entire session.

One measured non-zero: a home to about to home soft-navigation round trip accumulated layout-shift 0.0114 (hard loads are 0 everywhere; the single home to article crossing measured 0). Sub-threshold by an order of magnitude but not literally zero; most plausibly the footer moving between pages of different heights during the swap frame. Worth one human DevTools look if the lead wants a true zero on soft navs.

### Environment-blocked, needs human close-out (the usual #124 class)

1. Escape-cancel of a LIVE countdown: the backgrounded automation tab throttles timers below the countdown's window, so four attempts lost the race. The cancel code paths are UNCHANGED from the chat-ux build (validated 15/16 there); only their render placement moved. One human check: trigger a countdown on /chat, press Escape, confirm no navigation + line and link remain + focus stays in the composer.
2. Phone width: `resize_window` had no effect in this session (viewport pinned 1400x779), so sticky-composer-with-keyboard at 390px, masthead wrap, and overflow checks need a human on a narrow window or real phone. The mobile logic is CSS-only and spec-per-book, but unverified rendered.
3. Reduced-motion snap: no emulation exposed; the paths are explicit code (view-transition override, scene snap, no animation on countdown) but unexercised in a browser.
4. The visible tide travel and scene drift through a crossing: rAF is dead in backgrounded automation tabs; attribute-level proof is complete, the actual 2.6s dissolve needs one foregrounded human eyeball (localhost:4480 is still serving the dist).
5. The 2px ledger title nudge: color half visually confirmed, the transform is the same selector but too subtle for raster diffing; one hover glance.

## Consolidated Brian veto list

Top-listed (his standing flags, now shipped):
1. **Newest-at-top transcript** on /chat (the headline taste call; fallback = bounded scroll region, specced in chat-top-spec flag 1).
2. **The [send] chip** on every input (removable in one place in ChatBar.astro; Enter still submits).
3. **Title bar + ready dot removed** on the /chat panel (the homepage half is moot: the slab itself is gone per his own #160).
4. **The flow chat bar replacing the slab** and **the masthead scale** (his Option A order, executed to the recovered values; both knobs are one-line changes).
5. **Header wordmark hidden on home** (+ the nav right-aligning there; `justify-content: flex-end` is the one line to veto if he wants the links left).

Added by this build:
6. Autocomplete (#48) + history recall (#44) retired with their surface; revival = chat-top-spec Phase B.
7. The sticky /chat header takes the opaque page ground, so the scene does not show through the header band on /chat (per chat-surfaces Q3; a translucent treatment would need a design + contrast round).
8. "via Beyond" hover steps up to ACCENT (the quiet-link grammar); stepping only to ink is the softer alternative, one line.
9. `[home]` dropped from the /chat keybar; wordmark, Escape, and the typed command remain the ways home.
10. /chat empty-state minimum `clamp(280px, 40vh, 420px)` (chat-surfaces flag 5; one value).
11. `interactive-widget=resizes-content` is global (own commit bf0700a, revert = one commit).
12. Flow bar top margin 28px and the hint line riding under it (spacing knobs).
13. The persisted header means typed-but-unsent input text now SURVIVES navigation (a nicety of persist; flagged in case it ever surprises).

## For the next agent

- Dist still serving at 127.0.0.1:4480 (astro preview, background process); kill when done.
- Scene files untouched; the bridge consumed as-is. ENGINEERING.md remains stale per the docs audit and now also predates this build; folded into the pending docs work, not patched here.
- The eight-angle / atg / goldcoast sky-palette gap, per-page grounds (#74), and the open_page prose-with-link model recommendation are all unchanged inherited items.
