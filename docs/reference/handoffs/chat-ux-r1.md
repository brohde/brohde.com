# Chat UX cluster r1: redirect countdown, /chat persistence, header input dedup

Date: 2026-07-17. Branch `worktree-agent-a61bc34d359954b5a` (from main, re-merged to
main's tip before this report). Not pushed, not merged: the lead merges. Client-side only;
the frozen chat contract (#61: system prompt, facts pack, server, model, tools) was NOT
touched. Scope covers three owner orders that all live in the chat client:

- **#143 redirect countdown** for model-chosen `open_page` navigation
- **#144 conversation persistence** for the /chat thread
- **#145 header chat-input dedup** on pages that carry their own input

Everything is in `src/scripts/terminal.ts` (open_page/reply path + a small header-stamp
helper), `src/components/SiteHeader.astro` (one server attribute), and `src/styles/terminal.css`
(two additive blocks). No scene mounting/state code was touched; the merge preserved the
new `data-scene-theme` bridge, which still fires per page.

---

## 1. Copy strings, FLAGGED FOR BRIAN'S VETO

All sentence case, zero em/en dashes, never the word "terminal", destination named in plain
words. Every string below is client code, not model output.

| Where | String |
| --- | --- |
| Announcement lead (visible) | `Let me take you to <the about page>.` (the bracketed part is the real inline link) |
| Countdown tail (visible) | `Heading there in <N>s. [Stay here]` (N ticks 5..1; `Stay here` is the visible cancel control) |
| Destination names (the link text) | about -> `the about page`; eight-angle -> `the Eight Angle article`; work -> `the work log` |
| aria-live announcement (once) | `Taking you to <name> in a few seconds. Press escape, or select stay here, to stay.` |
| Cancel announcement (once) | `Staying here.` |

Notes for Brian:
- Brian's phrasing was "reply with 'Let me take you to that page...'". The shipped lead
  ("Let me take you to the about page.") follows that; the design-req example was "Let me
  take you there: about". Either is a one-line change if Brian prefers the example form.
- The tail could read "Redirecting in Ns" instead of "Heading there in Ns" (warmer vs
  plainer). Flagged; current is the warmer house voice.
- `Stay here` is the control label; alternatives: `Stay`, `Cancel`, `Not now`. `Stay here`
  reads as the plainest intent.

## 2. Countdown duration rationale (WCAG 2.2.1)

`REDIRECT_SECONDS = 5`, one constant in terminal.ts. Defense:

- The countdown is a time limit on auto-navigation, so WCAG 2.2.1 (Timing Adjustable)
  applies. The success criterion is met when the user can **turn off** the limit before it
  completes. We give **three** ways to turn it off (Escape, the stay control, start typing),
  any one of which stops it and keeps the visitor on /chat, so the 5s is never a hard limit.
- 5s is the design-req starting point and is comfortably reachable by keyboard users (one
  Escape) and switch users (the stay control is a normal button in the tab order, and the
  input the send came from keeps focus so a switch user is already one activation away).
- Because the limit is fully cancellable, shortening it does not weaken conformance; Brian
  can drop it to 4s or 3s by editing the one constant. Going below ~3s starts to feel like
  an instant redirect for slower users, so 5s is the conservative default.
- Reduced motion: the ticks are plain text updated by script, **not** a CSS animation, so
  there is no pulsing/animated treatment to suppress. The countdown reads the same under
  `prefers-reduced-motion`, and the navigation itself uses the site's existing instant path
  under reduced motion (no wipe). No RM-specific branch was needed; this is a code-level
  guarantee (there is no `@keyframes` or transition on the countdown nodes).

## 3. Cancel matrix (#143 req 2)

| Trigger | Wired at | Result |
| --- | --- | --- |
| **Escape** | keydown handler, a new first branch inside the Escape block (before the blur/leave logic) | Countdown stops; announcement line + inline link REMAIN; ticker + stay control removed; focus stays on the input (Escape does NOT blur while a countdown runs) |
| **Stay control** (click/tap) | direct listener on the `.rdx-stay` button | Same; focus returns to the origin input after the click |
| **Start typing** | the delegated `input` listener, for `.prompt input` and `.hchat input` | Same; the keystroke is NOT swallowed (the character the visitor typed stays in the input) |
| Navigate away (any link/command) | `astro:before-swap` | Timer stopped silently; nothing preserved (the page is leaving). Prevents a timer firing after the visitor already left, and closes the Back-loop |

After any user cancel, `announce("Staying here.")` fires once. Focus never leaves the input
(the `input` field the send came from is captured at `startRedirect` and refocused only when
the active element is not already it, so typing is never disrupted).

## 4. Which navigations get the countdown (and which stay instant)

`open_page` is produced by the frozen model for a free-form message. Presentation branches
client-side:

- **Countdown** only when the slug is a real cross-page navigation AND the visitor's input
  was a QUESTION: `redirectDest(slug)` returns a destination for `about` (not already on
  about), `eight-angle`, and `work` (not already home); `isExplicitNav(q)` is false.
- **Instant** (`openSlug`, unchanged behavior) when:
  - the input was an explicit navigation phrasing (`/^(open|go to|goto|take me to|bring me
    to|navigate to|jump to|show me|visit)\b/i`), honoring the visitor's clear intent (#143 req 3);
  - the slug is in-place (`contact`, `resume` print their card) or a same-page scroll
    (`work` while already home): there is nothing to redirect to.
- Deterministic commands and clicked links never reach this path, so they never count down.

The navigation still goes through the existing `navigate()` (the house 140ms wipe, instant
under reduced motion). The auto-navigate pushes history, so **Back lands on /chat** and,
because the countdown was nulled at commit and the thread is restored from persistence, there
is **no re-redirect loop** (rehydrate never starts a countdown).

## 5. Conversation persistence (#144)

- **What is stored**: a structured display `transcript` (echo/reply/out/cmt/redirect
  entries) AND the model-facing `llmHistory`, in `sessionStorage["brohde.chat.v1"]`.
  `sessionStorage`, deliberately not `localStorage`: per-tab, cleared on tab close, so a
  genuinely fresh tab starts pristine (a browser "duplicate tab" copies it, which is an
  explicit user action).
- **Save**: every recorded line writes through `record()` -> `saveChat()`; the model history
  is also saved after each exchange's `llmHistory.push`.
- **Rehydrate**: on every /chat mount, `rehydrateChat()` restores from module memory
  (authoritative within a live tab, since the module outlives client-side navigations) or,
  on a cold load / refresh, from `sessionStorage`, then replays the transcript into the fresh
  DOM below the server-rendered intro lines. Replay does not re-record, re-announce, or
  per-line scroll (a `replay` flag on echo/out/reply/line), and the roving tab stop is
  recomputed after replay so restored links do not create extra tab stops (#63/#75).
- **Redirect line persistence**: the announcement is recorded, so after an auto-navigate and
  Back (or a refresh), the thread still shows "Let me take you to <link>." with the inline
  link. On replay it renders **settled** (link only, no ticker), so a restored thread never
  re-triggers a countdown.
- **Caps and server-bound safety**: `MAX_ENTRIES = 60` display lines, `MAX_LLM = 12` history
  entries. The send already slices history to the last 8. Main's hardened server
  (`validateHistory`, audit H2/M2) rejects any `history` that is not an array of <= 8
  entries, each `{role: user|assistant, content: non-empty string <= 2000 chars}` with
  strictly alternating roles. `coerceHistory()` runs on restore and enforces exactly that
  (drops malformed entries, truncates content to 2000, preserves alternation), so a
  rehydrated or tampered history can never be rejected on the next send. A live session only
  ever produces alternating pairs, so this is defense in depth.
- **Clear**: the `clear` command already existed (wipes DOM + `llmHistory`); it now also
  purges `sessionStorage` and the in-memory transcript, and the "# Cleared" marker is shown
  but not stored, so a cleared chat stays cleared across navigation and refresh.
- **Tamper hardening on replay**: stored `out` bodies are re-inserted via innerHTML only when
  they match a first-party constant (`OUT_ALLOW`), else rendered as inert text; a stored
  redirect href is only made a live link when it is one of the known destinations
  (`REDIRECT_HREFS`), else rendered as plain text. `echo`/`reply` replay is text-node only.

## 6. Header chat-input dedup (#145)

- The header's chat row (`.hchat`) is hidden on the two pages that carry their own input
  (homepage slab, /chat composer) and shown on every other page. The identity row is never
  affected.
- **Two layers, both CLS-safe**: SiteHeader server-renders `data-hchat="off|on"` from the
  request path (trailing slash normalized, so the built `/chat/` matches), so the row's
  presence is correct at first paint. `syncHeaderChat()` re-stamps `data-hchat` on
  `astro:after-swap` (before paint, under the wipe cover) and `astro:page-load`, so if the
  header is ever made `transition:persist` it can never strand a stale state across a
  client-side navigation. `display:none` drops the row and its top margin entirely, so there
  is no reserved space and no shift.
- **Focus model stays coherent** (#63/#75): homepage focus lands on the slab input, /chat on
  the composer, interior pages on the header input (the only input there). The header input
  is `display:none` on home/chat so it is never a focus target there. The
  interior-page header send still navigates to /chat and auto-asks via the unchanged
  `pendingAfter` carry.
- Consequence, by design: a header send "in place on /chat" is no longer reachable via the
  UI (the header input is hidden on /chat); the /chat composer is the entry there. The code
  path is untouched and harmless.

## 7. Files touched

| File | Change |
| --- | --- |
| `src/scripts/terminal.ts` | redirect countdown (redirectDest/isExplicitNav/renderRedirect/startRedirect/commitRedirect/cancelRedirect); persistence (Entry/transcript/save/record/purge/coerceHistory/renderEntry/rehydrateChat + replay flag on echo/out/renderReply/line + clearChat purge); header stamp (syncHeaderChat); askLive open_page branch rewritten; Escape + input + before-swap + after-swap/page-load listeners. Scoped to the open_page/reply path and a standalone header helper; scene mounting/state/theme code untouched |
| `src/components/SiteHeader.astro` | `data-hchat` server attribute (path-normalized) |
| `src/styles/terminal.css` | `.shead[data-hchat="off"] .hchat { display:none }`; `.redirect` / `.rdx-clock` / `.rdx-count` / `.rdx-stay` styles (additive, near the header and reply blocks) |

## 8. Judgment calls (Brian can veto any)

1. **Countdown scope = about / eight-angle / work only.** contact/resume `open_page` stays
   an instant in-place card (nothing to redirect to); `work` while already home just scrolls.
2. **Explicit-nav phrasing skips the countdown.** The verb list is conservative; add/remove
   verbs in one regex if Brian wants it looser or tighter.
3. **5s duration** (section 2). Shorten in one constant.
4. **The announcement is a `.reply` line** (rail + assistant voice), reusing the thinking
   slot when no prose fills it, so the #118 same-slot swap survives. With prose + open_page,
   the redirect is a separate line below the prose.
5. **Redirect line persists in settled form** (link only) after Back/refresh, never
   re-arming a countdown.
6. **Header dedup hides the row with `display:none`** (no reserved space) rather than
   visibility. This is why there is zero CLS on the home/chat side.

## 9. Loose ends / not in scope

- **#147 usage/cost-to-everyone was ordered then countermanded** (#148): the usage/cost line
  stays `IS_LOCAL`-gated exactly as before. No change shipped.
- Reduced-motion **media emulation** is not exposed to the browser automation, so the RM
  path was validated by code inspection, not in-browser (there is no animation on the
  countdown; the nav already has an instant RM branch). One human check under an OS-level
  reduced-motion setting closes it.
- The homepage-slab -> /chat -> countdown chain could not be validated end-to-end in
  automation because the CDP tab reports `document.hidden === true`, which aborts the
  view-transition `navigate()` (the standing #124/#85 environment artifact; plain link
  crossings are unaffected). The countdown itself is proven on /chat, and the slab -> /chat
  carry is the unchanged `pendingAfter` machinery validated in b2-phase2. One human check in
  a foregrounded tab closes it.

## 10. Validation

Built dist served by `astro preview` on 127.0.0.1:4430; all browser work via a Sonnet
subagent (#82). Two rounds: a full 16-check matrix on the feature branch, then a focused
6-check re-validation on the state after re-merging main (themed scene + hero band + the
data-scene-theme bridge).

Round 1 (16 checks, deterministic open_page via a client fetch stub): **15/16 PASS.**
Highlights: question -> countdown line with real /about link -> count 5..1 -> auto-nav;
all three cancel paths (Escape, stay control, typing) keep the line + link and hold focus on
the input; explicit "open about" navigates instantly with no countdown; prose + open_page
render as two lines; the single aria-live announcement is the shaped message and does not
tick (count is inside an aria-hidden clock wrapper); Back after auto-nav lands on /chat with
the thread intact and no re-redirect; persistence survives client-side nav, refresh restores
from sessionStorage, a new tab is pristine, clear purges storage; CLS measured 0 across
link crossings; console clean. The one non-pass is the homepage-slab environment artifact in
section 9 (not a code defect).

Round 2 (6 checks on the state after re-merging main's themed scene + hero band +
data-scene-theme bridge): **6/6 PASS.**

- R1 header dedup markers correct on fresh loads of /, /chat, /about, and the article,
  with the scene present (/ and /chat `data-hchat="off"` + header input hidden, the /chat
  composer visible; /about and the article `on` + visible).
- R2 countdown on /chat: count 5..1, auto-navigated to /about. Notably this fired
  correctly even in the backgrounded automation tab, confirming the round-1 test-15 abort
  is specific to the slab-send path's view transition, not the countdown.
- R3 Escape cancel: no nav for 6.5s+, redirect line + inline link remain, ticker + stay
  control gone, focus held on the composer.
- R4 persistence: thread restored from sessionStorage after a full reload, no resend.
- R5 CLS = 0 across link crossings with the scene, hero band, and theme bridge running.
- R6 console clean on a four-page tour with the scene idle-import fired: zero
  console.error/warn; the only unhandled-rejection traffic was the expected-and-swallowed
  InvalidStateError "Transition was aborted" (amplified by the backgrounded CDP tab). The
  data-scene-theme bridge flipped eight -> default -> default across crossings with no
  errors, confirming my terminal.ts edits coexist with the interior-pages merge.
