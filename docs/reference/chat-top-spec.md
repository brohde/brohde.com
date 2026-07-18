# Chat composer to the top (UNIFY): implementation spec

_Design-director spec, docs only. Brian approved moving the /chat composer from the bottom
sticky dock to the top so one input reads as continuous across the site, and wants it to
transition nicely from /chat to the homepage and to interior pages. This spec adopts the
studio's UNIFY concept, resolves the parts of it that are not free, and hands an engineer a
buildable plan._

_Grounds on the current shell: global two-row header on every page (`SiteHeader.astro`), /chat
a normal page in the shell (`chat.astro`), boot killed (#149), tide transition option A
approved (#150: scene persists, the reading column cross-fades and lifts), header input row
hidden on / and /chat by #145. House rules held: zero em/en dashes, never "terminal" for the
site's surfaces, sentence case headings. Frozen: the #61 model contract (client-side only),
the #143 countdown, the #144 persistence, zero CLS, reduced motion._

---

## Verdict on UNIFY: adopt it, with three costs named honestly

**Adopt.** On /chat, un-hide the persistent header input row (#121, `.hchat` / `#in-site`) and
make it the composer; retire the bottom dock (`.dock` + `<Prompt id="chat">` / `#in-chat`)
entirely. This is the faithful reading of Brian's intent ("one continuous input at the top"),
and it is the cheapest possible answer to "transition nicely from /chat to interior pages":
the composer is the header input, the header is the same frame on every page (and gains
`transition:persist` in motion Phase 3), so the input node literally does not move between
/chat and /about or an article. There is no morph to design and nothing to animate; the
reading column does the option-A cross-fade underneath a composer that holds still. The
plumbing already exists: the header form carries `data-screen-form`, and a send while
`currentScreen() === "chat"` already asks in place (SiteHeader.astro documents this; #145 is
the only reason it is currently unreachable on /chat).

UNIFY is not literally "zero work," though. Three things it touches, stated plainly so nobody
is told a win they will not get:

1. **The header input is a lighter control than the dock composer was.** `#in-site` has no
   command autocomplete (#48), no up/down history recall (#44), and no ghost placeholder;
   those are gated to `.prompt input` in `terminal.ts`, and the header input is `.hchat input`.
   Retiring the dock drops those affordances on /chat. This is acceptable for core UNIFY (on
   /chat people mostly ask free-form questions, where autocomplete matters least, and commands
   still run: typing `help` or `clear` and pressing Enter works through the capture-phase submit
   handler and `run()`). Full parity is specified as an optional Phase B below and flagged for
   Brian.

2. **The header has to become sticky on /chat.** A top composer that scrolls away with a
   static header (D1 call 6) is unreachable mid-thread. So on /chat only, the header sticks to
   the top. Interior pages keep the static header (the header input there is a "jump to chat"
   affordance, not a live composer). This reverses D1 call 6 for one page, deliberately.

3. **The transcript has to flip to newest-at-top.** A composer at the top with the newest turn
   growing at the bottom puts your input and the answer at opposite ends of the thread, which
   is the exact anti-pattern that bottom composers exist to avoid. Q1 specifies newest-at-top
   and defends it.

Net: UNIFY makes the hard transition (/chat to interior, the common case) free, and localizes
the real work to three well-bounded places. Adopt.

---

## The new /chat surface

**Before** (today): header with `.hchat` hidden (`data-hchat="off"`); `main > .slab.slab-chat
> .slabhead + .chatbody`, where `.chatbody = #chatlog + .dock`, and `.dock` (sticky
`bottom:0`) holds the keybar and `<Prompt id="chat">`.

**After** (UNIFY):

```
header.shead[data-hchat="on"][data-screen="chat"]   (sticky, top:0)
  .wrap
    .idrow            wordmark "brian rohde" + caret, about link, contact button
    .hchat            the composer (un-hidden): $ + #in-site
main  (in .screen[data-screen="chat"] > .wrap.chatpad)
  h1.sr "Chat"
  .slab.slab-chat                              (night panel, golden-hour halo; no dock)
    .slabhead         "brohde.com · chat" + ready dot
    .chatbody
      nav.keybar.chatcmds   [help] [clear]     (compact; optional, see flags)
      .chatlog#chatlog       turns prepend here; intro .cmt lines sink to the bottom
footer.sfoot
```

The composer leaves `main` for the header; the transcript stays in the night slab (#67), now
just a transcript panel. Golden hour (#74) is unchanged. The slab loses only its dock.

---

## Q1. Transcript flow with a top input: newest-at-top

**The pattern.** The composer is the sticky header input at the top. Each send inserts a new
"turn" block **at the top of the transcript, directly beneath the composer**. Older turns flow
downward. Within a turn the order is natural top-to-bottom: the echoed question, then the
thinking indicator, then the reply (and, when the model navigates, the redirect line). The two
server-rendered intro `.cmt` lines sit at the very bottom, as the oldest content. The document
scrolls; the header is the only sticky element. There is no fixed-height inner scroll region
(nested scroll containers are a mobile hazard) and no auto-scroll to a far end.

**What the visitor sees on send:** they are looking at the composer (top). Their question
echoes immediately below it, the thinking dots appear in the same spot, and the reply swaps in
in place. The answer blooms exactly where their eyes and focus already are. No scroll chase, no
hunting to the bottom of a long page. Older exchanges have quietly moved down and out of the
way.

**Defense against the bottom convention.** Chat inputs sit at the bottom (Claude, ChatGPT, and
#116 says our surface mimics them) for one ergonomic reason: to keep the newest turn adjacent
to where you type, so the answer appears where you are looking. Moving the composer to the top
and keeping newest-at-bottom throws that property away (input and answer end up at opposite
ends, and each send auto-scrolls a long document, which fights the site's restrained motion).
Moving the composer to the top and flipping to newest-at-top **keeps** that property: adjacency
of input and newest turn is preserved, just mirrored. Newest-at-top is the faithful translation
of the ChatGPT ergonomic to a top composer, not a break from it. It is also consistent with the
site's own idiom: the homepage puts the input at the top of the slab with results below, and
the work ledger is newest-first. The site already reads "newest and primary on top, older
below." /chat now matches.

The one genuine cost is that turns run reverse-chronological (newest exchange on top, older
below). Within a turn, order stays natural, and the overwhelming majority of sessions are a
single short exchange where the ordering is imperceptible. For multi-turn sessions the mental
model is the email-thread / feed model (newest on top), which is familiar. This is the taste
call to put in front of Brian; the alternative (newest-at-bottom in a bounded scroll region) is
in the flags.

**Thinking indicator (#118), unchanged in behavior.** `thinking()` still builds the three
phosphor dots inside a `.reply.thinking` box, and `renderReply` still reuses that same node so
arrival is a content swap with zero shift. The only change is where the box is created: inside
the current turn block, which sits at the top. So the dots appear directly under the composer,
in view, and the reply replaces them in place. Reduced motion still swaps the dots for the
static "Thinking..." label (unchanged CSS). The single polite announcement is unchanged.

**Redirect countdown (#143), unchanged in behavior.** `renderRedirect` appends into the current
turn, after the prose, so the announcement line ("Let me take you to the about page.") with its
real inline link, the aria-hidden ticking clock, and the "Stay here" control all render inside
the newest turn at the top, in full view (an improvement on today, where it landed at the
bottom). The 5s constant, the three cancel paths (Escape, Stay here, typing), the single spoken
announcement, focus never leaving the input, and the settled-on-replay rendering are all
untouched. The only edit the countdown needs is that its focus-return fallback stops pointing at
`#in-chat` (retired) and points at `#in-site` (the composer); when the send came from the
composer, `startRedirect` already captures the active `.hchat input`, so the common path is
already correct.

**Long-thread behavior.** Both the composer and the newest turn are always in view at the top
with no scrolling, because the composer is sticky and the newest turn is pinned right below it.
Scrolling down reviews history; the footer is at the very bottom, below the oldest turn and the
intro lines. There is no jarring auto-scroll on any send.

**Scroll behavior.** `scrollChatBottom()` (which scrolled the document to `scrollHeight`) is
replaced by a scroll-to-top that keeps the newest turn under the sticky composer visible even
if the visitor had scrolled down into history before sending:

```
function scrollToNewest() {
  if (currentScreen() === "chat") window.scrollTo({ top: 0 });   // instant, no smooth
}
```

Instant (no `behavior: "smooth"`), so it is reduced-motion-safe by construction and adds no
motion. Rename the calls once; every call site (`line`, `echo`, `out`, `renderReply`,
`thinking`, `startRedirect`, `rehydrateChat`) points at the new function.

**Implementation (terminal.ts).** Introduce a turn block and route output into it:

```
let activeTurn: HTMLElement | null = null;

function beginTurn(): HTMLElement {
  const log = chatlog();
  const t = document.createElement("div");
  t.className = "turn";
  log?.prepend(t);        // newest turn on top, above any prior turns and the intro lines
  activeTurn = t;
  return t;
}

function sink(): HTMLElement | null {
  return activeTurn ?? chatlog();   // stray lines (e.g. "# Cleared") fall back to the log
}
```

- `echo`, `out`, `line`, `renderReply`, `thinking`, `renderRedirect`: change their one
  `log.appendChild(...)` / `log.append...` to append to `sink()` instead of `chatlog()`
  directly. Their record/announce/scroll tails are otherwise unchanged.
- Call `beginTurn()` at the very start of `askLive(q)` (before `echo(q)`) and at the start of
  `toConsole`'s `run` closure (before its `echo(cmd)`), i.e. once per user turn that produces
  output while already on /chat.
- `clearChat()` sets `activeTurn = null` before/after wiping, so the "# Cleared" note lands in
  the log directly (a standalone top line), not inside a stale turn.
- `.turn` needs no special CSS; the lines inside carry their own margins. Add only vertical
  breathing room between turns if validation shows they crowd (`.turn + .turn { margin-top: 6px }`).

The `transcript` array stays strictly chronological and its storage format is untouched (Q4);
only render grouping changes.

---

## Q2. The homepage handoff

The homepage keeps its own slab prompt (`#in-home`) and, per #145, the header composer stays
hidden there (`data-hchat="off"` on `/`). So the input is continuous across /chat and interior
pages, but the homepage is a boundary where the input "changes place" (slab hero on home, header
top on /chat). Three ways to handle it were on the table:

- **(a) Un-hide the header composer on home too and demote the slab prompt.** Truest continuity,
  but it guts the homepage's signature object: the slab is the site's hero chat surface (#67),
  and stacking a header composer above a slab-that-looks-like-a-composer reads as two chat inputs
  fighting. Escalation option only.
- **(b) A designed morph** (shared `view-transition-name` so the slab prompt animates into the
  header input). Elegant in isolation, but it contradicts #150 (option A is a scene-persist plus
  reading-column cross-fade, no per-element morph) and reintroduces exactly the
  view-transition-name morph machinery that #108 / b2-phase2 deliberately deleted. Reject.
- **(c) An honest cut carried by the tide.** Recommend.

**Recommendation: (c).** Leave the homepage as is (slab is home's input; header composer hidden
there). Continuity across the home to /chat boundary is carried by three things that are already
true or nearly free:

1. **The persistent scene (#150 option A).** The one aurora and glyph tide never blink across
   the navigation; it is visibly the same room. This is the primary continuity cue and it costs
   nothing new here.
2. **Identical input material.** The header composer is, by construction, "the homechip idiom
   grown into a field" (SiteHeader.astro): same night phosphor, same `$` sigil, same
   placeholder "Ask me anything or type help" as the slab prompt. Even though it sits in a
   different place, it is visibly the same kind of object, so the eye reads it as the same input
   relocating, not a new control.
3. **The echoed question.** On a home send, the visitor's question navigates to /chat and echoes
   as the first line of the newest turn, directly under the composer. The thread they wanted is
   already there.

So the mental model is clean and honest: the homepage greets you with the large slab; the moment
you are in a conversation or reading a page, the input lives in the header. Home is the one
distinctive entry; everything else (including /chat) shares the header composer.

**Behavior and CLS at the boundary.** The header composer row is toggled by `data-hchat`, which
is server-rendered per page and re-stamped on `astro:after-swap` (before paint, under the
transition cover) by `syncHeaderChat`. So on home to /chat the composer row is present the moment
/chat paints, and on /chat to home it is gone the moment home paints; the header simply renders
taller on /chat and shorter on home, each from its own first frame. Because the toggle happens
under the covered swap, never after paint, this is zero CLS. The composer row appears without its
own animation (option A holds the header still); that clean reveal is the honest cut. If Brian
wants it softened, a 150ms opacity-only fade on the row's appearance is a one-liner, but the
row's height must be reserved instantly (opacity only, never a height animation) to keep CLS 0,
and it must be gated off under reduced motion. Flagged, not recommended.

---

## Q3. Mobile: a top composer with the on-screen keyboard

Moving the composer to the top does not create the classic mobile keyboard failure; it **removes
it.** The failure mode is a bottom-anchored input (`position: sticky` / `fixed; bottom: 0`, which
is exactly the dock today) getting occluded or mis-floated when the on-screen keyboard opens and
the visual viewport shrinks. A top-anchored composer sits above the keyboard, which always
occupies the bottom of the visual viewport, so it is never covered. Retiring the dock deletes
the site's only bottom-fixed control and with it the whole failure class.

Concrete mobile behavior of the top composer:

- **Sticky header on /chat.** `.shead[data-screen="chat"] { position: sticky; top: 0 }`. On iOS
  Safari and Chrome the sticky element anchors below the browser's top chrome. Focusing the
  composer keeps it at the top of the usable area; the keyboard opens at the bottom; the newest
  turn (right under the composer) stays above the keyboard. The keyboard covers only the bottom
  of the thread, which is older history and the footer, which is fine.
- **Visual viewport vs layout viewport.** By default (`resizes-visual`) iOS does not shrink the
  layout viewport when the keyboard opens, so `sticky top:0` stays glued to the top of the
  usable area and the focused composer is scrolled into view by the platform. Because the
  composer is at the very top and the newest content sits immediately below it, nothing the
  visitor needs is ever under the keyboard. To make the layout math exact (so `100dvh`, sticky,
  and scroll offsets all account for the keyboard) add `interactive-widget=resizes-content` to
  the viewport meta:

  ```
  <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
  ```

  This is a one-line change in `BaseLayout.astro` and it is global, so validate the homepage and
  an article after it (they have no bottom-fixed UI, so the risk is low). Recommended, but keep
  it as a separate, validated commit.
- **No zoom on focus.** The composer input is already `font-size: 16px` (`.hchat input`), the iOS
  no-zoom floor, so focusing it never zooms the page. Already compliant; do not reduce it.
- **Safe areas.** With the composer at the top there is no bottom-anchored control, so the dock's
  `env(safe-area-inset-bottom)` padding retires with it; the footer already handles the bottom
  inset. The sticky header sits below the browser chrome, not under the notch, so no top inset is
  needed.
- **Header height cost.** The two-row header (~110px) is sticky on /chat, so it holds ~110px at
  the top of a phone. Acceptable; the transcript scrolls beneath it. A scroll-collapse of the
  identity row (leaving only the composer stuck) is possible later but is motion and gold-plating;
  do not build it now. Flagged.

Net: the top composer is the mobile-safe choice, and it fixes a latent bug in the current bottom
dock rather than introducing one.

---

## Q4. Persistence (#144) with a top input

Persistence behavior is preserved; only render order and the scroll target change.

- **Storage is byte-identical.** `transcript` stays strictly chronological (push order), and
  `saveChat` / `coerceHistory` / `MAX_ENTRIES` / `MAX_LLM` and the server-bound coercion are all
  unchanged. A session saved before this change rehydrates fine, because the replay simply
  regroups the same entries.
- **Replay regroups into turns.** In `rehydrateChat`, start a new turn at each user line so the
  rebuilt DOM matches a live session:

  ```
  for (const e of transcript) {
    if (e.t === "echo") beginTurn();   // a new turn begins at each user message
    renderEntry(e);                    // appends into the active turn via sink()
  }
  ```

  Because `beginTurn()` prepends, replaying oldest-to-newest lands the newest turn on top and
  keeps natural order within each turn. Entries before the first `echo` (rare) fall to the log via
  `sink()`'s fallback, above the intro lines. `renderEntry` for a `redirect` still renders the
  settled link-only form (no ticker, no re-armed countdown), so a restored thread never
  re-triggers a navigation. The countdown's "persists in settled form" guarantee is unchanged.
- **Rehydration scroll position.** Replace the trailing `scrollChatBottom()` with
  `scrollToNewest()` (scroll to top), so a restored /chat opens with the composer and the newest
  turn both in view. On a cold load the document is already at scroll 0, so in the common case no
  scroll is even needed; the call is a safety net for a browser that restored a prior scroll on
  Back.
- **CLS on cold-load restore.** The restore still inserts after first paint (the transcript lives
  only in sessionStorage, so the server cannot render it), the same timing #144 validated at CLS
  0. Newest-at-top with no auto-scroll actually reduces shift risk, because we never move the
  document after inserting. To remove even the small risk that the empty-state intro `.cmt` lines
  shift when turns prepend above them, hide those intro lines when a stored transcript exists:

  ```
  if (transcript.length) { /* in rehydrateChat, before replay */
    for (const el of document.querySelectorAll("#chatlog > .cmt")) el.setAttribute("hidden", "");
  }
  ```

  This is also better UX (the "ask about Brian's work / type help" hint is an empty-state prompt;
  once there is a real conversation it is redundant). Re-validate CLS 0 on a reload with stored
  history.
- **clear** still purges storage and module memory; with `activeTurn` reset in `clearChat`, the
  cleared state is a single "# Cleared" note and stays cleared across navigation and refresh.

---

## Q5. Accessibility

- **Focus order.** DOM order on /chat is skip-link, then header (wordmark link, about, contact,
  composer input), then `main` (transcript), then footer. Tab reaches the composer first, which
  is right for a chat page. The composer input is `.hchat input` in the header, so, exactly as on
  every other page today, it is a normal tab stop and not part of the roving cursor group
  (`roveEls()` only selects inside `[data-screen]`). No change to the cursor model (#63).
- **DOM order vs visual order.** With DOM-prepended turns, DOM order equals visual order equals
  newest-first-by-exchange, so there is no reorder mismatch to reconcile (this is why the spec
  prepends real turn blocks rather than reversing a flat log with `column-reverse`, which would
  have split DOM order from visual order and inverted within-turn order). Screen-reader and
  roving-cursor traversal move newest-exchange-first, chronological within a turn, which is a
  meaningful sequence (WCAG 1.3.2, 2.4.3): the feed model. The reply text is not focusable; only
  inline links and the contact `cmdlink` are rove targets, and they remain rare, so the practical
  traversal is short and coherent.
- **The composer sits in the banner landmark.** The header is `<header>` at body level, so on
  /chat the composer lives in `banner` while its output lives in `main`. This is acceptable
  because the composer is early in tab and reading order, it has a clear accessible name ("Ask me
  anything or type help", label plus placeholder, label-in-name satisfied), and the single polite
  announcer surfaces every reply, the thinking state, the redirect announcement, and "Staying
  here" without requiring the user to travel to `main`. The announcer becomes more load-bearing
  under UNIFY (it is what bridges a composer in `banner` to a transcript in `main`); keep it
  exactly as is (one polite region on `document.body`, dots and the ticking clock `aria-hidden`,
  announced once each). Recommended small enhancement: stamp `aria-controls="chatlog"` on the
  composer input on /chat via the same `syncHeaderChat` bridge (only when the log exists, to keep
  the reference valid), programmatically linking input to output. Flagged; not required for AA.
- **Label.** The composer keeps its site-wide accessible name; no /chat-specific relabel is
  needed. Do not add a second visible label.
- **Reduced motion.** No new animation is introduced. Sticky positioning is not motion; the
  scroll-to-newest is instant (no smooth behavior); the thinking dots and redirect countdown keep
  their existing reduced-motion paths; the optional home-boundary row-fade (Q2) and any future
  scroll-collapse must be gated off under reduced motion if built. The global reduced-motion kill
  switch in `global.css` continues to cover everything.
- **Keyboard reachability of the composer mid-thread.** Guaranteed by the sticky header: the
  composer is always on screen, so a keyboard or switch user is never scrolled away from it. This
  is the same reachability the bottom dock gave, relocated to the top.

---

## Engineer change-list

| File | Change |
| --- | --- |
| `src/components/SiteHeader.astro` | `ownsInput = path === "/"` (drop `\|\| path === "/chat"`), so the composer row shows on /chat. Add a `data-screen` attribute on `.shead` (map `/chat` to `"chat"`, `/` to `"home"`, else `"page"`) for the sticky selector. |
| `src/pages/chat.astro` | Remove the entire `.dock` (keybar + `<Prompt id="chat">`). Optionally keep a compact `nav.keybar.chatcmds` with `[help] [clear]` as the first child of `.chatbody`, above `#chatlog`. Keep `.slabhead`, `h1.sr`, and the two intro `.cmt` lines (they sink to the bottom / hide on restore). |
| `src/scripts/terminal.ts` | `syncHeaderChat`: `ownsInput = p === "/"` (drop the `/chat` cases); also `header.dataset.screen = currentScreen()`. Add `activeTurn`, `beginTurn()`, `sink()`; route `echo`/`out`/`line`/`renderReply`/`thinking`/`renderRedirect` appends through `sink()`; call `beginTurn()` in `askLive` and in `toConsole`'s run closure; reset `activeTurn` in `clearChat`. Rename `scrollChatBottom` to `scrollToNewest` (scroll to top, instant). Regroup `rehydrateChat` replay by `echo` boundaries and hide intro `.cmt` lines when a transcript exists; final scroll to top. Retarget every `"in-chat"` reference to `"in-site"` (the two `pendingFocus` assigns for chat, the `chat` command's `byId("in-chat")?.focus()`, and `startRedirect`'s `byId("in-chat")` fallback). |
| `src/styles/terminal.css` | Add `.shead[data-screen="chat"] { position: sticky; top: 0; z-index: 40; background: var(--ground) }` (sticky composer on /chat; background keeps it legible over the scrolling transcript; z-index clears the transcript and stays under `#wipe` at 99). Remove the `.dock` rules and the `.slab-chat { overflow: visible }` comment/relaxation (restore `overflow: hidden` now that no sticky child needs the document as scroll ancestor). Style `.chatcmds` as a thin top command row if the keybar is kept. Add `.turn + .turn { margin-top: 6px }` only if validation shows turns crowd. |
| `src/layouts/BaseLayout.astro` | Optional (Q3): add `interactive-widget=resizes-content` to the viewport meta. Separate, validated commit. |

No server, prompt, facts, eval, or model change: the #61 contract is untouched (the composer
POSTs to the same `/api/chat` through the same `run` to `toChat` to `askLive` path). The #143
countdown and #144 persistence keep their behavior; only line placement and the focus/scroll
targets move.

---

## Phase B (optional, flagged): autocomplete and history parity on the header composer

If Brian wants the /chat composer (and, consistently, the header input site-wide) to regain
command autocomplete (#48) and up/down history recall (#44), this is the self-contained follow-up.
It is separable from core UNIFY and is not required for /chat to work.

- Give the header composer the prompt machinery: either render it via the `<Prompt>` component or
  add a `.promptzone` / `.ac` structure and the ghost placeholder around `#in-site`. Extend the
  two gates in `terminal.ts` that currently read `.prompt input` to also match `.hchat input`:
  the `input` listener (so `refreshAC` runs) and the `keydown` handler's early return (so Enter,
  autocomplete cycling, Tab-accept, and ArrowUp/Down history run). Enter must still resolve the
  same way and clear the field.
- Flip the autocomplete popover to open downward for the header composer, since it sits at the
  top, not above a bottom dock:

  ```
  .hchat .ac { top: calc(100% + 6px); bottom: auto; }
  ```

  Keep the `.slab .ac` upward variant for the homepage slab. The popover is `position: absolute`
  within the composer's `.promptzone`, so it overlays the top of `main`; give it a z-index above
  the transcript and below `#wipe`.
- Reduced motion and CLS are unaffected (the popover is `hidden` at rest and reveals on input, an
  existing pattern).

Taste call for Brian: do we want command autocomplete chips appearing in the header on every
page, or is the lighter header input preferable everywhere with autocomplete reserved to the
homepage slab? History recall is the higher-value half and the lower-risk half (no popover), and
could ship alone.

---

## Flags for Brian (taste-level, none block the build)

1. **Reverse-chronological transcript (newest turn on top).** This is the core taste call. It is
   the right ergonomic for a top composer (the answer appears where you are looking). The
   alternative, if Brian dislikes reverse order, is newest-at-bottom inside a bounded, sticky-top
   scroll region with a small auto-scroll on send; it keeps conventional read-down order but puts
   the input and the newest answer at opposite ends on long threads and is a noticeably worse
   multi-turn experience. Studio: newest-at-top.
2. **Homepage handoff = honest cut (option c).** Leave the homepage slab as the home input;
   continuity carried by the persistent scene, identical input material, and the echoed question.
   Escalation to option (a), one input everywhere including a demoted slab prompt, is available if
   Brian wants literal continuity onto the homepage; studio advises against it (it guts the
   signature slab). Option (b) morph is rejected as contradicting #150.
3. **Optional 150ms opacity fade** on the composer row appearing at the home to /chat boundary
   (opacity only, height reserved, reduced-motion off). Studio: not needed; the honest cut reads
   clean.
4. **Keybar on /chat.** Studio keeps a compact `[help] [clear]` row at the top of the transcript
   (dropping `[home]` as redundant with the wordmark), since commands are still discoverable and
   tappable. It can be dropped entirely (commands remain typeable, and the intro hint names
   `help`). Brian's call.
5. **The slab title bar (`.slabhead`, "brohde.com · chat" + ready dot)** is now somewhat
   redundant with the site header directly above it. Studio keeps it (it frames the transcript as
   the phosphor screen object and can host a status). Removable for a cleaner panel.
6. **Autocomplete / history parity (Phase B)**, and specifically whether command autocomplete
   should appear in the header site-wide. Studio: ship core UNIFY without it; add history recall
   first if anything.
7. **`interactive-widget=resizes-content`** viewport change (Q3): global, low-risk, recommended,
   but worth Brian knowing it touches every page's keyboard behavior.
8. **Sticky header height on phones** (~110px on /chat). Accepted as is; a scroll-collapse of the
   identity row is possible later but is deliberately not in scope.
