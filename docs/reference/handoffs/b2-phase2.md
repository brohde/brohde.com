# B2 Phase 2 handoff: /chat joins the shell, the expand/morph retires

_Worktree branch from main @ 34813d8 (Phase 1 merged). Not merged, not pushed; the lead merges._

## What this phase is

Decision #108 made real: /chat stops being a full-window slab takeover and becomes a normal page in the global shell. Header on, footer on, the conversation in the left column with the right gutter preserved (#109), the scene mounted in its golden-hour chat state (#74/#111 direction), and the C2 expand/morph machinery removed. A send from the homepage slab or the header navigates to /chat as a normal page navigation carrying the question (the existing pendingAfter path, untouched); a send from the header while already on /chat submits into the conversation in place (this already worked through the router's currentScreen() branch; the page conversion is what exposes it).

## Scope delivered

1. **/chat in the shell.** `header={false}` and `footer={false}` removed; since no page uses the opt-outs anymore, the `header`/`footer` props were deleted from BaseLayout entirely (no dead API). The page is now `.screen > .wrap > main > .slab.slab-chat`: the same always-night slab object as the homepage (#67), grown to fill the first viewport, holding the conversation and the composer dock. The dock (keybar + prompt) is sticky at the viewport bottom while the thread grows past it, the Claude/ChatGPT arrangement (#116). Existing noindex kept. The sr-only h1 "Chat" stays (the header wordmark is a p off the homepage).
2. **Scene via props only.** `<Scene state="chat" />` added to chat.astro; theme and mark stay defaults until B3. The fenced files were not touched. Carrying the scene puts /chat on the #125/#126 full-width shell automatically (`body:has(.scene)`).
3. **Scene state follows the page (consumer-side bridge).** The scene facade carries `transition:persist`, so on client-side navigations the OLD page's DOM, dataset included, survives the swap: props alone cannot flip home/chat state mid-session. terminal.ts (which owns the idle-hook import) now stamps the arriving page's state through the module's public handle API (`initScene()?.setState(...)`, keyed on `currentScreen()`), on every `astro:page-load` and once when the lazy import resolves (covering a navigation that lands inside the idle window). First mounts still read their state from the server-rendered dataset; `setState` no-ops when equal and is safe pre-ready (staticFrame guards on the staged boot).
4. **Expand/morph retired (#108).** See "What was removed" below. Home <-> chat now rides the house 140ms wipe like every other internal navigation; deeper designed transitions are Phase 3 (per the brief: no gold-plating).
5. **Homepage surface untouched.** Boot, typing, commands, slab prompt: no behavior change. The only homepage-adjacent edit is Slab.astro dropping the now-meaningless `vtslab` class.

## Files touched and why

| File | Change | Why |
| --- | --- | --- |
| `src/pages/chat.astro` | rewritten | The page conversion itself: shell frame (no more opt-outs), `<Scene state="chat" />`, conversation + dock inside `.slab.slab-chat` in the left column. `#chatlog`, `#chat-note`, `#in-chat`, keybar commands, and the no-announcer comment all carried over verbatim so terminal.ts needed zero chat-flow changes. |
| `src/styles/terminal.css` | `.slab-full` block replaced by `.chatpad`/`.slab-chat`/`.chatbody`; `.vtslab`, `.backbtn`, `.chatwrap` removed; stale comments updated | The page-in-shell look: flex chain so the slab fills the first viewport; `overflow: visible` on the chat slab because `overflow: hidden` breaks the sticky dock (the pseudo layers carry the 12px radius themselves); golden-hour halo/glow overrides (decorative only). |
| `src/scripts/terminal.ts` | morph transition kind removed; scene-state sync added; comments | TransitionKind is `"wipe" \| "instant"` again; `stampMorph`/`MORPH_MS`/`vtTimer`/the after-swap re-stamp are gone. New: `syncSceneState()` in the idle-hook section (see point 3). |
| `src/styles/global.css` | the whole `[data-vt="morph"]` block + `vt-page-fade-*` keyframes removed | Morph CSS had no remaining stamper; the root view-transition stays `animation: none` under the wipe. |
| `src/components/Slab.astro` | dropped `vtslab` class; comment | No view-transition-name left in the codebase. |
| `src/layouts/BaseLayout.astro` | `header`/`footer` props deleted; SiteHeader/SiteFooter render unconditionally; comments | /chat was the only consumer; unconditional rendering is the "one frame" law with less API. |
| `src/components/SiteHeader.astro`, `SiteFooter.astro`, `ThemeToggle.astro`, `src/scripts/theme.ts`, `src/pages/log/[...slug].astro` | comment-only updates | Removed stale "except /chat", `footer={false}`, `.backbtn`, and morph references so no comment lies to the next agent. |
| `src/components/ArticleLog.astro`, `src/pages/styleguide.astro`, ledger rules in `terminal.css` | batch 77 change order | Label line removed, titles to body voice with date above, separators between rows only (see the change-order section below). |
| `README.md` | one row | `/chat` was still described as "(stub)" in the repo map. |

## What was removed of the morph machinery

- `terminal.ts`: the `"morph"` transition kind, home/chat pair detection in `resolveTransition` (now parameterless), `stampMorph()`, `MORPH_MS`, `vtTimer`, the `astro:after-swap` re-stamp, and the page-load morph cleanup.
- `global.css`: all `html[data-vt="morph"]` view-transition rules (group/image-pair/old/new timing, the 1:1 top-left snapshot pinning, the root fade pair) and both `vt-page-fade` keyframes; also the guard rules that kept the slab group inert on non-morph navigations (nothing carries the name anymore, so there is no group to guard).
- `terminal.css`: `.vtslab { view-transition-name: slab }`, the whole `.slab-full` family (full-window geometry, sticky blurred slabhead, ccstat gap), `.backbtn` (both its rule and its lines in the unified bracket-fill rule), `.chatwrap`.
- Markup: Slab.astro and chat.astro no longer carry `vtslab`; the chat slabhead's `[esc] back` button is gone (see judgment call 4).

No `data-vt`, `vtslab`, `slab-full`, or `backbtn` reference survives in source outside historical-context comments. The "raw material" clause of #108 is honored by the house wipe covering home <-> chat; nothing morph-specific was worth keeping for Phase 3, which can rebuild richer transitions from the view-transition primitives when it designs them.

## Design judgment calls (Brian can veto any of these)

1. **Golden hour is the scene's voice; the slab interior stays phosphor mint.** "Chat's golden-hour accent identity" (#74/#108) is carried by the sky (scene state) plus a decorative warming of the slab's halo and corner glow field to amber (rgba(255,170,51)) at the homepage slab's alphas. Interior inks, borders, the ready dot, and the focus border stay the one phosphor material, so every measured slab contrast ratio holds unchanged. The alternative (amber accent inside the slab) would fork the machine's material and force a full contrast re-audit; declined without a design phase.
2. **The slab fills the first viewport on /chat** (flex chain from `.screen`'s 100dvh). An empty conversation presents as a tall, quiet night surface with the composer pinned at the bottom, like Claude/ChatGPT, rather than a small homepage-sized card that grows. The footer sits below the first viewport, as on every other page.
3. **The composer dock stays sticky at the viewport bottom** (kept from the old page, now inside the card). This required `overflow: visible` on `.slab-chat` (hidden overflow kills position:sticky); the scanline/glow pseudo layers carry their own radius instead. Corner artifacts: none visible, the dock is inset by the slabbody padding and never reaches the card corners.
4. **The `[esc] back` button is gone from the slab head.** The head is now identical to the homepage slab ("brohde.com · chat" + ready). The way home is the header wordmark, the keybar's `[home]`, and the Escape key (unchanged in terminal.ts); the "# esc returns home" hint line stays. A dedicated back control on a normal shell page read as leftover full-window chrome.
5. **The slab head is no longer sticky** (it was pinned in the full-window layout as the way back). It scrolls away with the thread like the homepage slab head would; the sticky dock is the persistent affordance.
6. **BaseLayout's `header`/`footer` props were deleted**, not just left unused. One-line re-add if a future page genuinely needs an opt-out.
7. **Home <-> chat uses the plain house wipe.** No interim transition flourish; Phase 3 owns designed transitions (#108's "designed transition" clause), per the brief's no-gold-plating order.

## Brian's batch 77 change order (homepage list, rode this branch mid-flight)

Relayed by the lead while Phase 2 validation ran; delivered on the same branch:

1. **The "log" label line is removed** (`.loghead` in ArticleLog.astro, the styleguide's ledger specimen, and its CSS). It was decorative chrome: the list's semantics live in the existing sr-only h2 "Writing and project log", which stays, so nothing is unlabeled.
2. **Post titles restyled to the editorial body voice**: weight 400 (was 500), 15.5px (was 18.5px), line-height 1.5, tracking removed. The mono date now sits ABOVE the title at every width (Brian's example arrangement; this was previously only the <=560px stacking, desktop had date in a left column). Rows remain borderless standalone links with the hover/focus accent-color affordance (not underlined running-text links, so #99's underline rule does not bind; same G183 argument as the header nav tokens).
3. **Borders between rows only**: the ledger's top and bottom frame borders are gone; a hairline renders only between adjacent rows (`.lentry + .lentry`).

Judgment call inside the order: "body font size" was read as the homepage's own editorial body copy size (`.cco`, 15.5px) rather than article prose (17px) or the 13.5px mono base; it sits next to those `.cco` lines on the same page, so this is the size that reads as "body" there. Row padding (14px) kept as the existing rhythm. One step down (or up) is a one-line change if Brian wants it denser or roomier.

## Decision #141 (owner order, rode this branch): external entries show their destination domain

External log entries now render the destination domain with the ↗ arrow: `…badge post ↗ twilio.com`, small and lighter than the title (mono 12px, dim ink). Implementation in ArticleLog.astro: the domain is DERIVED from the entry's own `external` URL (`new URL(...).hostname`, leading `www.` stripped), never hardcoded, so any future external entry gets it for free. The arrow + domain are one non-wrapping inline-block unit (`.extmark`), so at phone widths the pair wraps to the next line together under the stacked date/title, and underlines can never propagate in (#68 held). The arrow stays aria-hidden decoration; the domain is real text, so assistive tech hears the destination exactly once, and the sr suffix was trimmed to "(opens in a new tab)" (the visible domain now says "external" on its own). The styleguide's ledger specimen shows the same pattern. Judgment calls: domain placed AFTER the arrow (Brian's example had the arrow already trailing the title; flipping to `twilio.com ↗` is a two-line swap), and the domain deliberately stays dim on row hover (destination is metadata; the title carries the hover voice).

## Known UX flag, kept as is (Brian's later call)

A send that resolves to `open_page` with empty prose (e.g. "What is Eight Angle?") still lands on /chat, echoes the question, shows thinking, prints "# Opening eight-angle…", then navigates to the article after 700ms (#61 signed-off; untouched). This now applies to header sends from every page too. **Recommendation:** switch the model contract to "always return at least one sentence of prose, with the page as an inline link" and demote `open_page` to explicit navigation requests ("open the eight angle article"). Prose-with-link keeps the visitor in the conversation they started, makes the reply screen-reader-visible, and removes the two-hop flash; the deterministic command layer already covers people who just want the page. It is a chat-behavior change (system prompt + eval rows re-run), not an engineering fix, so it needs a #61-style re-sign-off. Until then the behavior is consistent and signed-off.

## Loose ends for Phase 3 (and one gap report)

1. **Facade gap (fenced, reported not fixed):** `scene.css`'s static facade (`.scn-static`) always paints the HOME sky vars (`--sc-h*`), regardless of `data-scene-state`. On a fresh /chat load the first ~1-2s show the cold home sky, then the live module crossfades to golden hour. Fix belongs to the scene owner: a `.scene[data-scene-state="chat"] .scn-static` block remapping `--sc-h1..4` to `--sc-c1..4` in scene.css (4 declarations). Deliberately not worked around from un-fenced files: the matrix identity engineer is mid-flight in those exact files.
2. **Scene rollout to /about, articles, 404, styleguide** (Phase 3): those pages still tear the scene down and stay centered. The state bridge in terminal.ts already handles mounts/teardowns generically.
3. **Designed transitions** (Phase 3): everything is on the uniform wipe now; #108 still wants designed page-to-page transitions.
4. **Scene theme/mark per page** (B3): /chat rides default theme + mark; the identity build (#135) delivers sources/palettes separately.
5. **Header `transition:persist`** (Phase 1 loose end, still open): the header re-renders per navigation under the root swap; invisible under the wipe, revisit with Phase 3's transitions.
6. **ENGINEERING.md** is already flagged 84 commits stale by the docs audit; it now also predates this conversion (still documents `.backbtn`, the expanded slab, and the morph). Folded into the pending docs-audit work rather than patched piecemeal here.
7. **Styleguide** has no /chat-page specimen; the slab specimen there shows the shared material and stayed valid (build green, no retired classes referenced). Its ledger specimen was updated for batch 77 + #141.
8. **Conversation persistence across navigations** (validator flag): leaving /chat and coming Back lands on a pristine conversation; the thread lives in DOM state that the router swap replaces. Pre-existing behavior (the full-window chat did the same), untouched here. If Brian wants Claude/ChatGPT-style thread persistence within a visit, that is a Phase 3 design question (llmHistory already survives in module state; only the rendered log resets).

## Verification

- `npm run build` green in the worktree: 0 errors, the pre-existing content.config.ts `z` deprecation hints only; 10 pages.
- dist checks: /chat HTML carries `.shead`, `.sfoot`, `data-scene-state="chat"`, noindex; no `vtslab` in any built page; the ledger renders stacked date/title with `↗ twilio.com` and the trimmed sr suffix.
- Rendered surface (Sonnet subagent per #82, built dist on localhost:4401, POC bridge on 8787), 12-check round on the /chat conversion: **all functional checks PASS.** Highlights: /chat in the shell with an 879px gutter at 1720px; dock pinned at the viewport bottom without scrolling; CLS 0 on two independent /chat loads; console completely clean everywhere; deterministic help/clear instant; live round trip with a HELD NODE REFERENCE proving the thinking-to-reply swap is the same element at the same rect.top (#118 survives); header send while on /chat appends to the same conversation with no reload; homepage and /about sends land on /chat and answer; back/forward flips data-scene-state home/chat/home correctly with no boot replay; theme toggle on /chat flips the page ground while the slab stays night.
- Environment artifacts, not defects (same class as #124): (a) scene rAF ticks unverifiable because the automation tabs are never OS-visible (the "scene live paused" class proves the pause wiring is correct; one human check in a foregrounded tab closes it); (b) this session's Chrome floored at ~800px so true phone width is unverified for the /chat page (the ledger round below re-attempted narrow); (c) no reduced-motion emulation is exposed to the tool.
- Validator observations for the record: identity questions ("what does Brian do?") non-deterministically resolve to open_page(about), triggering the auto-navigate; this strengthens the prose-with-link recommendation above. And Back to /chat lands on a pristine conversation (DOM state does not persist across navigations); pre-existing behavior, unchanged by this phase, flagged as a Phase 3 question (persist the thread across the session or not).
- A second focused Sonnet round validated the batch 77 + #141 ledger changes on the rendered homepage (stacked date/title, weight/size, separators between rows only, domain unit, narrow width, boot + CLS regression checks); results in the phase report to the lead.
- House rules swept on the diff: zero em/en dashes added anywhere; no "terminal" in new naming or visitor copy; sentence case for human copy, lowercase tokens only for commands; the thinking indicator's same-slot swap is untouched (renderReply/thinking unchanged); the single polite announcer is untouched.
