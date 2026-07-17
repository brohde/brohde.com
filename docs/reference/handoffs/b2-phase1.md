# B2 Phase 1 handoff: the global site header

_Branch: `worktree-agent-a4511b6ca9e0f8125`. Commit `c46f8d8` (predecessor implementation) + this doc. Base: `main` @ `73b4bae`/`03dcb1c` line. Not merged, not pushed._

## What this phase is

The first global, two-row site header on every page except `/chat` (#107/#110/#115/#119/#121, from the D1 shell spec `docs/design/lab/shell-d1.html`). Row 1 = the lowercase wordmark "brian rohde" linking home, plus quiet mono `about` / `contact`. Row 2 = a real chat input (placeholder "Ask me anything or type help") that sends to `/chat`. The old per-page chrome (`EditorialHeader` on home, the `.atop` `[home]` chip bar on interior pages) is retired in favor of this one frame.

## Review verdict

**The inherited implementation is sound and meets the Phase 1 spec on all six points. No code defects were found; no code fixes were required.** The predecessor died on an API error after committing but before validating; this session did the critical review, the build, and the full rendered-surface validation it never reached. Build is green; 20 of 21 rendered checks pass; the one "FAIL" is confirmed pre-existing, decision-backed chat behavior (see Defects).

## Scope delivered (verified against the diff, point by point)

1. **Two-row header on every page except /chat.** `SiteHeader.astro`, rendered by `BaseLayout` at body level (like the footer) so it can never drift per page. Row 1 identity + Row 2 real input at every width; mobile keeps the same arrangement (the `<=480px` / `<=360px` media queries only step down type, gaps, and padding, never the flex arrangement or the input). Static, not sticky (`.shead { position: static }`, confirmed on scroll). 48px input min-height (D1 call 7). Nav links rest `--dim`, hover `--accent` + 1px underline (D1 call 5).
2. **/chat gets no header.** `chat.astro`'s only change is one line: `header={false}`. `BaseLayout` gates `{props.header !== false && <SiteHeader />}`. There is no new "question-consume hook" in `chat.astro` and none is needed: the header hands the question to the **existing** chat surface via the already-shipped `pendingAfter` + `initPage()` machinery (C2/#85), untouched here. Verified: `document.querySelectorAll('.shead').length === 0` on `/chat`.
3. **Header send carries the question into the existing surface.** `.hchat` is a `<form data-screen-form action="/chat">`. Submit routes through `terminal.ts`'s existing capture-phase `submit` handler → `run(value, true)` → free-form → `toChat()` → `pendingAfter = () => ask(q); navigate("/chat")` → on arrival `askLive()` echoes the question, shows the thinking indicator, renders the reply. Verified live (see C1-C3). `action="/chat"` is a no-JS fallback only; with JS the capture handler always `preventDefault`s it. The homepage slab surface is unchanged (its own prompt, boot, and send all still work; expand/morph retirement is Phase 2 and was NOT done here).
4. **Old chrome retired cleanly.** `EditorialHeader.astro` → `HomeIntro.astro` (its `<h1>` wordmark moved into `SiteHeader`; it is now a `<section aria-label="Introduction">` carrying the surviving #77/#79/#80 identity lines). `.atop` bars removed from `404`, `about`, `log/[...slug]`, `styleguide`; `.atop` and `.tbl` CSS deleted; `.wordmark` styles renamed to `.wm`. Styleguide gained an inert "global header" specimen (`.snav-spec`, no ids/form/`data-cmd`, cannot collide with the real header). No dangling references to the retired names remain in source (only in code comments and the decision/status logs).
5. **Layout law preserved on both shells.** `body:has(.scene) .wrap` (>=1000px, left-anchor) is unchanged. The scene stays on the homepage only; `.scene` count is 1 on `/`, 0 on `/about` and articles (which use the separate static `TideBand` facade), so scene-less pages stay centered. The scene files (`src/scripts/scene/**`, `Scene.astro`, `scene.css`) were **not touched** (the fence held).
6. **House rules.** Zero em/en dashes in added lines. "terminal" appears only as the internal filenames `terminal.ts` / `terminal.css` in comments, never in user-visible copy or new naming. Wordmark lowercase; human copy sentence case (HomeIntro copy unchanged).

## Files touched and why

| File | Change | Why |
| --- | --- | --- |
| `src/components/SiteHeader.astro` | **new** | The global two-row header. `isHome ? <h1> : <p>` for the wordmark (one visual, two heading roles). Chat form + input. `.bseq` on both rows so the homepage boot reveals them. |
| `src/components/HomeIntro.astro` | renamed from `EditorialHeader.astro` | Wordmark/`<h1>` and the resting caret moved to `SiteHeader`; this keeps the role/founder/companies/profile lines as homepage content. `<header class="cid">` became `<section class="cid" aria-label="Introduction">` so the banner landmark is not duplicated. |
| `src/layouts/BaseLayout.astro` | added `header?: boolean` prop (default true) + renders `<SiteHeader />` before `<slot />` | One frame, rendered once like the footer, so it can't drift per page. |
| `src/pages/index.astro` | `EditorialHeader` → `HomeIntro`, moved inside `<main>` | The wordmark row is now the page `<h1>` in the header; the intro is body content. |
| `src/pages/chat.astro` | `header={false}` (1 line) | No header on the current full-window slab (Phase 2 converts it). |
| `src/pages/404.astro`, `about.astro`, `log/[...slug].astro`, `styleguide.astro` | removed the `.atop` chip bar | Retired chrome; the global header is the frame. `.aend` chips and the home-as-wordmark cover the way home. |
| `src/scripts/terminal.ts` | `.hchat input` added to the `focusin` (cfocus) and `Escape`-blur selectors; comments | Single-cursor model (#63) now covers the header input, so typing there never shows two carets and Escape blurs before it navigates. **No chat-routing logic changed.** |
| `src/styles/terminal.css` | `.shead` / `.idrow` / `.wmrow` / `.wm` / `.snav` / `.hchat` rules; retired `.atop` / `.tbl`; renamed `.wordmark` → `.wm`; phone media-query header rules | The header's look + the phosphor input material (fixed night values so contrast holds on either ground). |
| `README.md` | repo-map component list updated | Keep the map current. |

## Predecessor judgment calls — kept

All were kept; each is defensible and traces to a logged decision:

- **Wordmark is the homepage `<h1>`, a `<p>` elsewhere.** One h1 per page verified on every route (home = "brian rohde" in the banner; interior = the page title in `<main>`). The homepage h1 sitting in the banner landmark is unconventional but valid and matches #115 (the identity is the homepage's primary heading).
- **`contact` is a `<button data-cmd="contact">`, not a link.** It opens the chat's contact card through the command router (#107, chat is core navigation). The predecessor flagged in-code: swap to a `mailto:` if you veto. Kept.
- **Header input excluded from the prompt machinery** (autocomplete, history, the keydown-Enter path). It relies on native form submit → the capture `submit` handler. Correct for a chrome input; it keeps the header simple and the homepage slab keeps the full command UX.
- **`action="/chat"` as the no-JS fallback** (the homepage slab form has no action). Sends a no-JS visitor to the functional chat shell instead of reloading the current page. Fine, because chat needs JS regardless; there is no `?q=` server consumption and none is needed.
- **Header carries no `transition:persist`.** Consistent with the footer, which also re-renders per navigation and rides the root view transition. Left as-is for Phase 1.

## Predecessor judgment calls — reversed

None. No reversals were warranted.

## Defects found + fixed

**None requiring a code change.** The rendered-surface validation surfaced one item that reads as a bug without the decision context, investigated and reclassified:

- **Header send of a project-name question bounces through /chat to the project page (not a defect).** Sending "What is Eight Angle?" from the header lands on `/chat`, echoes the question and shows the thinking indicator, then auto-navigates to `/log/eight-angle-ml` before a prose reply renders. Root cause confirmed by hitting the backend directly: it returns `{ "text": "", "open_page": "eight-angle" }`. This is the **existing** tool-use router (#27) + internal-page routing (#54/#75): some questions are answered by opening a page, not by prose. `terminal.ts`'s `askLive` / `openSlug` / `open_page` handling was **not touched** by this phase, and the identical behavior occurs from the homepage slab prompt (same `run()` → `toChat()` → `askLive()` path). It is signed-off chat behavior (#61, 38/38 eval), out of B2 Phase 1 scope, and affects every entry into chat, not just the header. Left unchanged; surfaced below for Brian.

## Loose ends for Phase 2 (and Brian's call)

1. **open_page UX from the header (Brian's call).** When a header/slab send resolves to `open_page` with empty prose, the visitor sees a brief `/chat` flash (question echoed + thinking) then a hard hop to the article. During the Phase 2 `/chat` conversion + transition polish (#108), consider whether project-name sends should navigate directly to the page, or whether the model should return a short prose answer with an inline link instead of a bare `open_page`. This is a chat-behavior decision, not an engineering fix.
2. **/chat header + transition (Phase 2 proper).** `/chat` opts out via `header={false}` because the frame on the current full-window slab would read broken. Phase 2 converts `/chat` to a normal shell page (content left, gutter preserved) and adds the designed home→/chat and →interior transitions; the header opt-out goes away then. The C2 `.vtslab` morph machinery is still present (not removed) as raw material.
3. **Header behavior during view transitions.** The header rides the default root crossfade on navigation (fine between two header-bearing pages). Going to/from `/chat` (no header) it appears/disappears through the root transition. Watch this when Phase 2 wires the designed transitions; a `transition:persist` on the header may be wanted then.
4. **Scene not yet on interior pages** (Phase 3, unchanged). Articles/about stay centered until they gain the scene.

## Exact verification steps

Build (in the worktree):

```
cd /Users/brian/Projects/brohde.com/.claude/worktrees/agent-a4511b6ca9e0f8125
npm run build   # astro check && astro build -> 0 errors, 0 warnings, 12 pre-existing z hints; 10 pages
```

Rendered surface (browser via a Sonnet subagent only, per #82/#117 — never drive Chrome from the Fable lead):

```
# serve the built dist on 4370-4379
cd <worktree> && npx astro preview --port 4370
# live chat replies on localhost need the POC bridge on 8787, started from the MAIN checkout
# (the gitignored .env with the key lives only there; it modifies nothing):
cd /Users/brian/Projects/brohde.com/poc/chat && npm start   # if 8787 is already up from another session, reuse it
```

Then, at desktop (1280/1600) and mobile (390 if the tool allows; this run was floored at ~500px):

- Header present on `/`, `/about`, `/log/*` (wordmark = h1 on home, p elsewhere); absent on `/chat` (`.shead` count 0).
- Nav rest dim / hover accent+underline; header static (scrolls away, not pinned).
- Two-row arrangement with a real full-width input at narrow widths; no horizontal overflow.
- Header send from `/about`: type a neutral question ("tell me a joke") → lands on `/chat`, question echoed, thinking, real reply. (A project-name question like "What is Eight Angle?" will instead open the article by design — see loose end 1.)
- Homepage slab prompt still sends ("help" renders the help list on the chat surface) and the boot sequence still plays.
- Single cursor: focusing the header input hides the wordmark caret (`html.cfocus .wm .caret { visibility:hidden }`).
- Scene edge intact: on `/`, `document.querySelector('[data-scene]').style.getPropertyValue('--scene-edge')` equals both `header.shead .wrap` and `#scr-home .wrap` right edges within ~1px (confirmed 863.19 across all three at 1720px). Mark centered in the right gutter; column legible. Full-background whisper at phone width.
- CLS = 0 on `/` (PerformanceObserver, 6s past boot).

## Residual verification gap (honest)

True 390px mobile was not reachable: the shared Chrome automation window enforced a ~500px minimum in this environment. The two-row arrangement + real input + zero horizontal overflow were confirmed at ~500px, and the `<=480px`/`<=360px` CSS only reduces type/gaps/padding (the header gets *more* compact below 480px, so overflow risk *decreases*; the flex arrangement and the input are never altered). A single human check at 390px and 320px closes it. Everything else was verified on the rendered surface.
