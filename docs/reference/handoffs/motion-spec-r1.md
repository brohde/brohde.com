# Handoff: motion direction round 1

_Design-director motion pass (#139). Full spec: `docs/reference/motion-spec-r1.md`. This handoff is the short version plus the concrete wiring the Phase 3 engineer needs. Nothing is built; the spec is reviewed with Brian first (#112). Grounds on the shell AFTER B2 Phase 2 merges (uniform 140ms wipe, morph gone, scene state bridged, header + footer on every page including /chat)._

## What was decided (studio recommendation, pending Brian)

1. **Kill the typed-"hello" boot.** It is machine-boot theater that #116 moved away from, it hides the header's persistent chat input while performing in the secondary slab prompt, and it delays real content ~1.8s on every entry against #62. Content should paint instantly; the scene wake (facade to live sky, already shipped) plus the caret carry arrival, with an optional single 300ms content fade-up that never hides titles. "hello" survives as static slab content and as the command; only the auto-typing dies.
2. **B2 Phase 3 = the persistent-scene page transition.** Retire the opaque wipe; the one scene persists and drifts through every nav; only `<main>` cross-fades and lifts; the header holds still; on an identity change the scene runs its built-in travel. Studio pick is Option A (fade + 8px lift on content), with Option B (dissolve or cut, scene still persists and travels) as the fallback.
3. **The mark/palette handoff travels, it does not snap.** The travel is already built (`setTheme`); Phase 3 only has to call it on navigation. Snap survives only as the reduced-motion path.

## What is open (Brian's calls, do not build ahead of them)

- Boot: kill vs rework vs keep (studio: kill). If kill: content fade-up on, or no content motion.
- Transition: A vs B vs C (studio: A, B fallback).
- Does /chat inherit the previous page's theme or reset to default plus golden hour (studio: reset).
- The two micro-interaction additions (nav-token easing; list-row date-accent + 2px nudge).

## Engineer wiring for Phase 3 (once Brian signs off)

**1. Retire the wipe cover for scene-bearing navs.** The `#wipe` element (`background: var(--ground)`, z-index 99, inset 0) is opaque and hides the persistent scene, which is the exact thing the transition should show. Remove `dropWipe`/`liftWipe` from the wipe path for scene pages (or keep a hidden failsafe that never paints opaque). The scene's `transition:persist` plus the `<main>` view-transition replace it.

**2. Name only the content group.** Put `view-transition-name: content` on the page's single `<main>` (verify one per document; do NOT name `.wrap`, which also exists in the header and footer, or the whole transition aborts on the duplicate name). Author `::view-transition-old(content)` and `new(content)` with the fade + 8px lift (Option A) or a short dissolve (Option B). Keep `::view-transition-*(root)` at `animation: none`. The scene and header persist, so they are excluded from the snapshot swap and never appear in the group set.

**3. Add `transition:persist` to the header** so it holds still across navs (Phase 1/Phase 2 loose end). If an active-page nav indicator is ever added, update it via JS after swap, because a persisted node keeps its old DOM.

**4. Drive the identity travel from the page-state bridge.** Extend the Phase 2 bridge in terminal.ts (`initScene()?.setState(...)` on every `astro:page-load`) to also call `handle.setTheme(destTheme)` and, if used, `handle.setMark(destMark)`.

   **Critical gotcha:** the scene node carries `transition:persist="scene"`, so on a client-side nav the OLD scene node survives and the destination page's `<Scene theme="...">` markup is discarded. You therefore CANNOT read the destination theme from `[data-scene]` (it still holds the old theme). Read it from a FRESH, non-persisted element the new page renders, exactly as the existing bridge reads `currentScreen()` from `[data-screen]`. Recommended: stamp `data-scene-theme` (and optionally `data-scene-mark`) on the `[data-screen]` wrapper per page in B3, and have the bridge read it and call the handle. First loads still initialize correctly, because a fresh mount reads the server-rendered `[data-scene]` dataset directly.

**5. Map pages to identity** (matches the matrix identities handoff): home, about, 404, brohde-com-build -> `default` (BR). eight-angle -> `eight`, facebook-newsroom -> `news`, google-android-for-work -> `android`, atg -> `atg`, gold-coast -> `goldcoast`. /chat -> `default` theme + `chat` state (pending open question). Twilio is external, no interior page, dormant.

**6. Micro-interactions** (small): add a 120ms ease on `color`/`text-decoration-color` for `.snav` tokens; on `.lentry:hover`/`:focus-visible` add the date to accent and a 2px `translateX` on the title (transform only). Both must drop cleanly under the global reduced-motion switch (the transform goes, color stays).

## Reduced motion and perf gates the build must hold

- Everything collapses under `prefers-reduced-motion`: instant content swap, scene snaps identity (the handle already snaps and paints a settled still), no cover animates, caret static, thinking dots to static label. Author new rules so the existing kill switch fully neutralizes them.
- Scene worst tick stays under ~4ms; no per-tick cost added; never force a synchronous mark resample on the nav frame (the envelope already defers `getImageData` ~1400ms in, off the nav frame). Content transition is compositor-only (opacity, transform).
- Hold Perf 100 / TBT 0 / CLS 0 on built dist; the `content` group names `<main>` and reserves its box, so no CLS. Validate on dist via a Sonnet subagent (#82).

## House rules (carried into any copy or naming)

Zero em and en dashes anywhere a reader sees (#18). Never the word "terminal" in user-facing copy or new naming (#116); the filenames `terminal.ts`/`terminal.css` stay as-is. Sentence case for human copy; lowercase only for tokens the shell already lowercases ("brian rohde", command names, "brohde.com").

## Source read for this pass

BaseLayout.astro, SiteHeader.astro, HomeIntro.astro, Slab.astro, SiteFooter.astro, index.astro, Scene.astro, terminal.ts, scene/index.ts, scene/sources.ts, scene/live.css, terminal.css, global.css, scene.css; STATUS.md, DECISIONS.md (#36/#41/#42/#63/#64/#69/#75/#108/#112/#116/#120/#139 among others), handoffs b2-phase1, b2-phase2 (worktree), matrix-identities.
</content>
