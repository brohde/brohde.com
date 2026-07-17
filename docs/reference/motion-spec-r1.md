# Motion direction, round 1

_Design-director spec for Brian's review (#112: reviewed before any build). Docs only. Grounds on the CURRENT shell as it stands after B2 Phase 2 merges (global header on every page, /chat as a normal shell page, the expand/morph retired, one uniform 140ms wipe, the scene bridged to page state). Decision #139 handed motion to the studio fresh; this is that pass._

## The one idea

The site already has its motion signature, and it is not an effect we add on top: it is the **one persistent scene**. Per #109/#120 there is a single aurora and glyph tide drifting behind every page, and pages swap through the left column in front of it. The whole motion language should follow from that: the scene is the constant, the reading column is what changes, and the wordmark caret is the heartbeat that never stops. Everything else is small and in service of reading, because the audience is potential clients scanning long-form work and the site sells credibility, not spectacle.

One thing works against that idea today: the uniform 140ms wipe covers the whole viewport with an opaque ground-colored rectangle on every navigation, so the persistent scene is hidden exactly when its continuity would sell the concept. Fixing that is the center of the Phase 3 proposal below.

---

## 1. Boot sequence: verdict

**Recommendation: kill it.** The typed-"hello" reveal was built for the old homepage (a single surface that greeted you like a machine booting). Three things have changed under it, and none of them was there when it was designed:

- **The homepage is no longer pretending to be a machine that boots.** #116 settled that the surface mimics Claude/ChatGPT, and docs/copy dropped the machine framing. Auto-typing "hello" into itself on load is exactly the theater #116 moved away from. Claude and ChatGPT do not perform a boot at you.
- **It animates the wrong input, and hides the right one.** There are now two chat entries on the homepage: the global header input (#121, the persistent one on every page) and the slab prompt. The boot types into the slab prompt while the header input, carrying `.bseq`, stays hidden for the first ~1.3s. So the primary, always-present way to chat is suppressed on entry while a secondary field performs.
- **It delays the actual content on every visit, against #62.** The reveal hides the header, the identity lines, and the entire work list behind ~1.3s of typing plus a staggered cascade (roughly 1.8s to full reveal). The content is server-rendered and crawlable, so SEO and LLM readers are fine, but a client arriving from a link waits for the substance to appear. For a portfolio optimizing perceived load and reading, that is a real cost paid on every entry.
- **It competes with the better arrival cue we already ship.** The scene wakes on its own: the static facade sky crossfades into the live drifting sky over 1200ms. That is a tasteful, on-brand "the page is alive" moment. Stacking a typed-boot on top of it is two different wake-up animations fighting on first paint.

Killing the boot removes the pre-paint `html.boot` gate and the `.bseq` hide, so **all content paints immediately**. The word "hello" survives as static content in the slab and as the `hello` command; only the auto-typing animation dies. The arrival feeling is carried by the scene wake (already there), the blinking wordmark caret, and one optional whisper: a single 300ms fade-up of the content column that never hides the work titles for more than a breath (a fade from ~0.6 opacity, not from hidden). If Brian wants zero content motion, drop even that; the scene wake alone is enough.

| option | what it is | recommend |
| --- | --- | --- |
| **kill** | Remove the typed-hello and the `.bseq` content hide. Content paints instantly. Arrival = the scene wake + caret, plus an optional 300ms content fade-up that never hides titles. | **Yes** |
| **rework** | Keep a deliberate entrance but strip the theater: no typed hello, never hide the header or work list; instead stagger a gentle 200 to 400ms fade-up of the editorial sections once on entry, scene waking underneath. | If Brian wants a choreographed arrival |
| **keep** | Leave the typed-hello boot as built. | No (reasons above) |

Reduced motion already skips the boot entirely; killing it makes the reduced-motion path the path for everyone, which is the honest tell that it was never load-bearing.

---

## 2. Page transitions on the persistent scene (B2 Phase 3)

**Two-sentence concept.** Retire the opaque full-viewport wipe and let the one scene persist and keep drifting through every navigation while only the reading column cross-fades and lifts a few pixels; when the destination page carries its own identity (an article), the persisted scene runs its built-in travel, dissolving the current mark into pure tide and reforming it as the new page's mark while the sky crossfades to the new palette on the scene's 2.6s clock. The header holds still and the wordmark caret keeps blinking, so navigation feels like the same room quietly changing what it is showing, not a cut to a new screen.

### How each surface behaves

- **The scene** never gets covered. It already carries `transition:persist`, so between two scene-bearing pages the same live canvas and sky survive the swap untouched: the aurora does not blink or restart. On a navigation that changes page identity it runs the travel it was built for (see the mark/palette handoff below). On mobile there is no gutter, so the scene is the faint full-background whisper and the identity travel is subtle by design; the content transition carries the nav feel there.
- **The reading column** is the only thing that visibly transitions. Give the page's `<main>` a view-transition group and animate just that group: old content fades and lifts up 8px over ~160ms, new content fades in and settles down from 8px over ~220ms (40ms delay). Opacity and transform only, no horizontal slide, so there is never horizontal overflow on a phone and never a layout shift.
- **The header** holds still (add `transition:persist`). It is the same frame on every page; the only per-page difference is the wordmark's heading role and the (now removed) boot class, both invisible. Keeping it fixed makes the caret a literal through-line across the navigation.
- **The pour and the mark stay put.** Every scene-bearing page uses the same left-anchored column law (`body:has(.scene) .wrap`), so the measured gutter edge does not move between pages: the pour edge and the fixed mark position are stable across a nav. The mark stays exactly where it is and re-letters itself to the page you landed on. That stillness is what makes the travel read as elegant rather than busy.

### The mark and palette handoff: it already animates

This is the nicest part: the handoff the brief asks about is **already built and perf-proven**, it is just not called on navigation yet. The scene handle exposes `setTheme(name)`, which crossfades the whole sky between two stacked slots, lerps the tide's peak color, and travels the mark through a real envelope: out to pure tide over 1400ms, hold 900ms, reform as the new mark over 1400ms. Phase 3's job is to **call it on navigation**, keyed to where you land (default/BR for home, about, 404; eight, news, android, atg, goldcoast per article). Home to chat keeps using `setState` (the golden-hour sky), which Phase 2 already bridges. So the "how does the palette handoff animate" answer is: it travels, on the scene clock, and it is the showpiece moment of an article opening. We do not snap; snapping would throw away the one thing that makes the persistent scene worth having.

### The three options

| option | content column | scene | recommend |
| --- | --- | --- | --- |
| **A. the tide carries you** | fade + 8px lift/settle (~160/220ms) | persists, never covered; identity travels on nav | **Yes** |
| **B. clean cut** | a 120ms cross-dissolve, or a hard cut | persists, never covered; identity travels on nav | Fallback if any content motion reads as too much |
| **C. keep the wipe, bridge the scene** | the existing 140ms cover, made translucent so the scene shows through | still a full-viewport veil; identity travels underneath | No (fights the whole idea; a veil over a live canvas muddies) |

Recommend **A**, with **B** as a one-line fallback (turn the content choreography off; keep everything else). Both A and B share the two moves that matter: stop covering the scene, and call the identity travel on nav. C is documented only so the "do the least" path is on the table; it keeps the very thing worth removing.

---

## 3. Micro-interaction inventory

Small, specific, few. Most of the shipped set is right and stays; two tiny additions and one deliberate non-addition.

| element | today | proposal |
| --- | --- | --- |
| wordmark caret | block caret, blinks on 1.1s, hides under `html.cfocus` | **Keep, no change.** It is the heartbeat and the transition through-line (header persists, so it never stops during a nav). |
| nav tokens (about, contact) | rest dim, hover/focus accent + 1px underline | **Keep**; add a 120ms ease on `color` and `text-decoration-color` so the state change reads intentional, not snapped. |
| homepage list rows (date above title) | title goes accent on hover/focus | **Keep the color**; add the date going accent too and a 2px nudge of the title in the reading direction (transform only, 120ms). Gives a long work list a "the cursor landed here" response that ties to the single-cursor model (#63). |
| header chat input | focus-within: border to mint + glow lift | **Keep, no change.** |
| slab | focus-within wakes the screen (border + glow) | **Keep, no change.** |
| command menu, keybar, autocomplete chips, homechip | accent fill on hover/focus, brackets hold | **Keep, no change** (one consistent bracket-fill grammar). |
| focus-visible ring | 2px accent outline, offset 2px, everywhere | **Keep, no change** (a11y baseline, #28). |
| send feedback | thinking dots pulse on the caret's clock in the reply slot | **Keep as the only send cue.** Do NOT add a submit-time input pulse; the arrival transition plus the thinking dots are the feedback, and a third cue would be noise. |

No new color pairings are introduced; every hover, focus, and token color above is a shipped token already checked at AA or better. Motion here is opacity, transform, and existing color tokens only.

---

## 4. Reduced motion and performance policy

Non-negotiable, and mostly already true; the point is that anything Phase 3 adds must not break it.

**Reduced motion.** Everything honors `prefers-reduced-motion` through the existing global kill switch (all animation and transition collapse to ~0). New rules must be authored so the kill switch fully neutralizes them: under reduced motion the content transition is an instant swap, the scene snaps its identity to the destination (the handle already snaps `setTheme`/`setMark` and renders a settled still), no cover animates, the caret is static, and the thinking dots give way to a static "Thinking..." label. If killing the boot lands, the reduced-motion entry and the default entry become the same thing, which is the cleanest possible state.

**The scene frame budget is inviolable.** The tide must keep its measured ceiling of a worst tick under ~4ms (9fps, 110ms cadence, rAF-gated, dpr capped at 2, cell grid capped). The transition may not add per-tick cost and may not force a synchronous resample on the navigation frame. The one heavy step (resampling a mark via `getImageData`) already sits ~1400ms into the travel envelope, off the nav frame; keep it there. The content transition uses compositor-only properties (opacity, transform), so it cannot reflow against the scene's rAF.

**Never cover the scene with an opaque full-viewport layer during a nav.** Beyond contradicting the concept, the current wipe wastes ticks (the scene keeps drawing behind an opaque cover, since it is still on-screen for the intersection observer). Removing the cover makes those ticks visible work instead of wasted work.

**Hold the shipped numbers.** Perf 100 / TBT 0 / CLS 0 on the built dist (#62/#70). The content view-transition names only the `<main>` group and reserves its box, so it introduces no CLS. Validate on dist, measured, per phase (browser checks via a Sonnet subagent, #82).

**Mobile honesty.** On phones the scene is the whisper background and the identity travel is barely perceptible; the content transition is what the visitor actually feels. That is acceptable and expected, not a defect; the showpiece travel is a desktop-gutter reward.

---

## 5. What to confirm with Brian

1. **Boot: kill, rework, or keep** (section 1). Studio: kill, with the optional 300ms content fade-up. Sub-question if kill: fade-up on, or no content motion at all.
2. **Transition option A, B, or C** (section 2). Studio: A, B as fallback.
3. **Identity travel on nav: travel or snap.** Studio: travel (it is built and it is the point). Snap only survives as the reduced-motion path.
4. **Does /chat inherit the theme of the page you came from, or always reset to default plus golden hour?** Studio: always default identity plus the golden-hour state; /chat is a global surface, not tied to an article. (Appendix C covers the article-to-chat case.)
5. **The two micro-interaction additions** (section 3): nav-token easing, and the list-row date-accent plus 2px nudge. Both are tiny and reversible.

Depth, the current-shell inventory, the full navigation matrix, and the engineer wiring are in the appendices and the handoff (`docs/reference/handoffs/motion-spec-r1.md`).

---

## Appendix A: what actually runs today (measured against source)

- **Boot** (BaseLayout pre-paint gate + `runBoot()` in terminal.ts): on a genuine load of `/` and not reduced motion, `html.boot` hides `.bseq` blocks. 500ms hold, "hello" types into the slab prompt `in-home` at 85ms/char, a 460ms beat, then at ~1300ms the input clears and `.bseq` blocks reveal at 50ms/step. First frame is the slab alone; the header rows, identity lines, and work list are `.bseq` and hidden. Skippable by any keydown, pointerdown, or input. 6s failsafe. Reduced motion never adds the class.
- **Wipe** (terminal.ts + `#wipe` in terminal.css): opaque `var(--ground)` cover, z-index 99, with a resting block caret top-left. Drops before the swap, holds 140ms, lifts 50ms after the new page renders. Instant under reduced motion. This is what covers the scene.
- **Scene** (scene/index.ts + live.css + scene.css): facade sky crossfades to the live sky over 1200ms on wake. Tide is 9fps (110ms tick), rAF-gated, pauses when hidden, offscreen, or reduced (settled still). One clock at 2600ms drives sky crossfade, state tint, and theme-peak travel; the mark travel envelope is 1400 out + 900 hold + 1400 in. Blob drift keyframes run 47 to 82s. Grain overlay kills banding. `transition:persist="scene"`.
- **Scene state bridge** (Phase 2): terminal.ts calls `initScene()?.setState(...)` on every `astro:page-load`, keyed on `currentScreen()`. `setTheme`/`setMark` are NOT called on navigation yet; that is Phase 3.
- **Caret**: 1.1s steps(1) blink, `animation: none` under reduced motion.
- **Thinking dots** (#118): three phosphor dots on the 1.1s clock, in the reply slot, zero layout shift; removed under reduced motion for a static label.
- **Header**: static (not sticky), no `transition:persist` yet, so it re-renders per nav under the root view transition (invisible today because root is `animation: none` and the wipe covers everything).
- **Hover and focus**: nav tokens dim to accent + 1px underline; slab and inputs light their border and glow on focus-within; cbtn/chips/homechip fill with accent; `:focus-visible` is a 2px accent ring site-wide. None of these currently ease; they snap.

## Appendix B: navigation matrix (post Phase 3, Option A)

| from -> to | scene identity | scene state | content column | notes |
| --- | --- | --- | --- | --- |
| home <-> about | default/BR, no travel | home | fade + lift | same identity, so only the column moves |
| home <-> chat | default/BR, no travel | crossfade home <-> golden hour (`setState`, already bridged) | fade + lift | the sky warms; the mark does not change |
| home -> article | travel default/BR -> article theme (`setTheme`) | home | fade + lift | the showpiece: mark dissolves and reforms as the article's mark, sky crossfades to the article palette |
| article -> article | travel theme A -> theme B | home | fade + lift | envelope reroutes mid-flight gracefully (built in) |
| article -> home | travel back to default/BR | home | fade + lift | the persisted scene still shows the article theme until the bridge sets default |
| article -> chat | travel back to default/BR | crossfade to golden hour | fade + lift | studio: /chat resets to default identity; open question 4 |
| any -> any under reduced motion | snap to destination identity | snap | instant swap | no cover, no travel, settled still |

## Appendix C: reduced-motion and perf evidence (references, not re-derived)

- Frame budget and measured ticks: #105 and the B1 report (hero worst tick ~1.8ms, big-monitor band ~1.6ms with the cell cap, all inside 4ms).
- CLS 0 / TBT 0 / Perf 100 on dist: #62, #70; the facade contract keeps heavy layers off the pre-paint path.
- Reduced-motion coverage in place: global kill switch (global.css), boot gate skip (BaseLayout), wipe returns "instant" (terminal.ts), scene settles and snaps (scene/index.ts), thinking dots swap to a static label (terminal.css).
- New color pairings: none. Motion reuses shipped tokens, all previously checked at AA or better.
</content>
</invoke>
