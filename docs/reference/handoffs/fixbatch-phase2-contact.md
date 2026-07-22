# Handoff: fixbatch Phase 2, contact-flow UX repair

Engineer: Opus frontend, isolated worktree `agent-a5f532ce3ce0fe8b8`.
Scope: the approved contact-flow UX repair (abandon everywhere, edit before send,
speed, caret-at-top fix, new /contact route). Build green, browser-validated on a
local `astro preview` with Chrome automation.

## What shipped

### 1. Abandon, discoverable everywhere in the flow

- Factored a single `[cancel]` bracket button out of the confirm chips into
  `contactCancelChip()` (data-contact="cancel", the existing `.cbtn` grammar,
  aria-label "Cancel and return to chat"). It is appended to EVERY contact ask:
  the greeting turn, each message/name/email ask in `advanceContact`, and the
  edit re-asks. The chip row is ephemeral like all contact turns (never
  recorded, so it never rehydrates). Shared button maker is now `mkContactBtn`
  (send | cancel | edit); `contactChips()` and `contactCancelChip()` and
  `contactEditChips()` all build on it.
- Escape branch inserted after the redirect guard, before the blur branch: while
  the flow is armed on /chat (or /contact, same data-screen), an Escape with an
  EMPTY composer calls `cancelContact()` immediately (the spoken "Cancelled"
  line flows through the existing announcer). With typed text present, Escape
  only blurs the composer, so the draft is never discarded and Escape never
  navigates away mid-flow. No second-Escape confirm, no persistent mode strip.

### 2. Edit before send

- `renderConfirm` now also emits `[edit name] [edit email] [edit message]`
  (`contactEditChips()`, data-contact="edit" + data-field), sitting between the
  field list and the `[send] [cancel]` row.
- Click handler branch: data-contact="edit" routes to `editContactField(field)`,
  which guards `contact && awaiting !== "sending"`, nulls the one field, sets
  `awaiting = field`, opens a turn, and after a short `CONTACT_PULSE_MS` pulse
  re-asks with the SAME copy string `advanceContact` uses (the ask strings are
  now shared constants: `ASK_MESSAGE`/`ASK_NAME`/`ASK_EMAIL`), plus the cancel
  chip, then focuses the composer. The visitor's answer flows through the
  existing `mergeContact`/`advanceContact` machinery, which walks straight back
  to the confirm because every other field is still filled. No typed "edit"
  grammar. Round-trip verified in the browser: `[edit name]` then "Jane Q. Doe"
  returned to the confirm with only Name changed.

### 3. Speed

- New `CONTACT_PULSE_MS = 180`. `pulseThen(render, ms = PULSE_MS)` gained an
  optional ms param; general chat/command pulses keep 450, and every contact
  path (greeting, asks, confirm nudge, edit re-asks) passes `CONTACT_PULSE_MS`.
- `collectContact`: the thinking spinner now runs ONLY on the first blob (the
  real `/api/contact` extraction round trip). Every follow-up answer (name,
  email, message, edit re-asks) merges synchronously with no network call and
  advances through the short `CONTACT_PULSE_MS` pulse, so name/email asks no
  longer show the multi-second spinner.
- Entry emulation sped up: `TYPE_BASE` 20 -> 14, `typeInto` trailing beat
  220 -> 120ms. `humanDelay` jitter/bonuses unchanged. Reduced-motion and
  blocked-storage skip paths are untouched (they still short-circuit the typing
  and `pulseThen` still renders instantly under reduced motion).

### 4. Caret-at-top fix

- New CSS token `--chat-pin-gap: 10px` on `.slab-chat`; the docked composer's
  sticky `top` moved from `0` to `var(--chat-pin-gap)`.
- `scrollToNewest` now only pulls the page to the top when the /chat composer's
  `getBoundingClientRect().top < 0` (it has actually scrolled above the
  viewport, taking the newest turn with it). When the composer is onscreen (its
  common state), a new turn blooms directly beneath it and no scroll fires, so
  the caret keeps its resting gap below the panel border instead of jamming at
  the very top. Verified: composer rect.top holds at 93 after sends, scrollY
  stays 0, document.activeElement stays `in-chat`.
- Pin-sentinel logic left as-is and still flips the `.pinned` hairline sensibly.
  Only cosmetic note: with the 10px inset the sentinel's `top < 0` test flips
  `.pinned` about 10px of scroll after the composer actually sticks, which is
  imperceptible; I did not adjust the threshold (the spec allowed leaving it).
- CLS stays 0: the scroll guard only ever scrolls, never changes layout.

### 5. New /contact route

- `src/pages/contact.astro` replicates the /chat surface (BaseLayout + Scene +
  a `.screen` section with `data-screen="chat"` so every `currentScreen()` gate,
  the pin observer, and the scene state behave identically), plus the additive
  `data-contact-arm` attribute on the section. Title "Contact", description
  "Send Brian a message. His AI helps you write it.", `noindex` like /chat. The
  docked ChatBar keeps `inputId="in-chat"` (the flow targets that composer).
- `initPage`'s chat branch: when `.screen[data-contact-arm]` exists and no
  pending send/command/emulation is queued, it runs `routeContactEntry()`
  INSTEAD of `showGreeting()`: `beginTurn` -> `pulseThen(CONTACT_PULSE_MS)` ->
  greeting + `armContact()` + cancel chip, with NO fake user echo. This runs
  whether the panel is pristine or a thread was rehydrated below (the visitor
  came to contact, so the greeting is the newest turn). Because `initPage` fires
  on `astro:page-load`, a refresh of /contact re-arms deterministically
  (verified). /chat has no marker, so it keeps the normal greeting and is never
  armed (verified: not armed, normal "I'm Brian's AI" greeting).
- Existing contact entries (nav item, typed `contact`, open_page:contact) are
  untouched and still play their emulation on /chat. `openSlug`'s contact case
  and the model path now also route through the shared `speakGreetingAndArm`, so
  they gain the cancel chip too (discoverable everywhere).
- No /chat-specific machinery needed duplicating (chat.astro carries no IS_LOCAL
  or dev-only markup).

### Header parity (one file slightly outside the stated set, see flags)

`/contact` is not `/chat`, so `SiteHeader.astro`'s `ownsInput` and
`terminal.ts`'s `syncHeaderChat` both used to leave the header jump-to-chat
input VISIBLE there, stacking two composers. Fixed by adding `/contact` to both:
`ownsInput = isHome || /chat || /contact` (server) and the matching `ownsInput`
in `syncHeaderChat` (client). Both agree, stamped before paint, so a full
/contact load never flashes two composers (CLS 0). This is the only edit outside
the {terminal.ts, terminal.css, contact.astro} set; it is a one-line additive
change to the exact server/client toggle terminal.ts already co-owns. See flags.

## Files

- `src/scripts/terminal.ts` (constants, pulseThen, typeInto, scrollToNewest,
  syncHeaderChat, greeting/arm helpers, ask constants + askLine, advanceContact,
  editContactField, collectContact, chip builders, renderConfirm, handleConfirm,
  click + Escape handlers, initPage route entry)
- `src/styles/terminal.css` (--chat-pin-gap token + composer sticky top;
  .contact-edits / .contact-edit styling, sharing the quiet dim-to-accent
  secondary treatment with .contact-cancel)
- `src/pages/contact.astro` (NEW)
- `src/components/SiteHeader.astro` (one-line ownsInput additive change)

## Verify (done)

- `npm run build` green (11 pages; /contact/index.html generated).
  `npx astro check`: 0 errors, 0 warnings.
- No em/en dashes in any added line; no "terminal" in added user-visible copy.
- Static/dist: /contact/index.html carries data-contact-arm, data-screen="chat",
  robots noindex,nofollow, and server-side data-hchat="off"; /chat/index.html
  has NO data-contact-arm. New strings (edit name/email/message, "Cancel and
  return to chat") present in the JS bundle; --chat-pin-gap:10px +
  var(--chat-pin-gap) inlined in the built HTML.
- Browser round (astro preview :4455 + Chrome), console clean throughout:
  - /contact arms on load AND after refresh (greeting newest, cancel chip).
  - Single composer (header input hidden), no two-composer stack.
  - [cancel] chip on the greeting and on every ask (message/name/email).
  - Empty-composer Escape cancels immediately ("Cancelled. Ask me anything
    else, or type help."); typed-text Escape only blurs, draft preserved, flow
    still armed.
  - Edit chips round-trip a single field back to confirm (Name -> "Jane Q. Doe",
    email + message preserved).
  - No multi-second spinner on name/email asks (only the 180ms pulse); first
    blob still shows the extraction spinner.
  - Caret sits at its resting gap after send (composer rect.top 93, scrollY 0);
    document.activeElement stays in-chat.
  - /chat unchanged: normal greeting, not armed, header input hidden as before.
  - Note: /api/contact and /api/chat 404 under `astro preview` (functions do not
    run there); both degrade gracefully with no uncaught errors. A `wrangler
    pages dev` pass is the only way to exercise a real extraction/send end to
    end; recommend one human/validator confirmation of an actual send on a
    preview build if desired (the send path itself was not changed).

## Flags for Brian

- Empty-composer Escape abandons the flow immediately (no confirm step). Typed
  text present -> Escape only blurs, never discards. Whitespace-only counts as
  empty (`value.trim() === ""`).
- Three edit chips on the confirm: `[edit name] [edit email] [edit message]`,
  each re-asking that one field with the exact original ask copy ("Got it. And
  what is your name?" etc. read fine as re-asks; flag if a plainer edit copy is
  wanted).
- Timing constants (Brian veto knobs): `CONTACT_PULSE_MS = 180`, entry
  `TYPE_BASE = 14`, `typeInto` beat `120ms`. General chat pulse stays 450.
- The pinned composer gap is `--chat-pin-gap: 10px` (one token on `.slab-chat`).
- `SiteHeader.astro` got a one-line additive change (add `/contact` to
  `ownsInput`) to keep CLS 0; it is outside the {terminal.ts, terminal.css,
  contact.astro} set but is the server half of the header toggle terminal.ts
  co-owns. Nothing else was touched.
- /contact is a new noindex route reached by direct link/refresh; the existing
  nav "contact" button, typed `contact`, and open_page:contact still play the
  typed emulation on /chat (unchanged). If Brian wants the nav item to point at
  /contact instead, that is a separate one-line decision (SiteHeader), not made
  here.
