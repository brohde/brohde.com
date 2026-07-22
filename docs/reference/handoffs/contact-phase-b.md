# Handoff: contact flow Phase B (#181/#182/#183/#184)

Branch `worktree-agent-a2d6523c1640fb600`, two commits on top of main @ 12d7b59:

- `e1e6954` feat(contact): in-chat contact flow + /api/contact, email off every surface
- `6b56b14` tune(contact): humanized typing base 20 + hesitation 0.05

Build green (`npm run build`), `tsc --strict` over `functions/` clean, zero dashes
in the branch diff, authored by Brian (no Claude trailer).

## READ FIRST: scope corrections applied mid-build (from the lead)

Items 5, 6, 7 of the original brief were dropped per the lead's mid-task messages:

- **Item 5 (focus-after-send)** and **item 6 (clear-with-no-greeting)** already landed on
  main. I did NOT write my own versions. Where the contact flow touches those functions I
  kept the lead's lines: the submit handler ends with `input.focus({ preventScroll: true })`;
  `clearChat` calls `removeGreeting()` and never `showGreeting()`. My ONLY additions there
  are the contact routing (submit handler) and `contact = null` (clearChat). See "Merge notes".
- **Item 7 (placeholder)** was reversed then re-landed by the lead as a SWAP (`ONGOING_PH` +
  `f.dataset.ph`, hooked at the end of `echo()` and restored in `clearChat`). I added NO
  placeholder logic. My contact flow uses a separate `contactEcho()` (ephemeral, never
  recorded), so it does not touch `echo()`; the lead's placeholder swap merges cleanly.

## What landed, file by file

### functions/api/contact.ts (NEW, self-contained, never touches chat.ts)

`POST /api/contact`, two ops chosen by `op`:

- `{op:"extract", text}` -> `{name, email, message}`. A small Haiku call (same Anthropic
  provider + AI Gateway wiring as chat.ts: `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`,
  `ANTHROPIC_GATEWAY_TOKEN`) with a forced `extract_contact` tool, strict nullable schema.
  Strips a malformed email server-side.
- `{op:"send", name, email, message}` -> `{ok:true}`. Validates (name <=100, valid email
  <=200, message 1..2000), writes a KV backup, then delivers via the Resend REST API
  (`https://api.resend.com/emails`) from `contact@send.brohde.com` to Brian's personal inbox
  with `reply_to` set to the visitor's email.

Shared patterns: content-type 415, 16KB body cap (413), per-IP rate limit (same shape as
chat, own `crl:` key prefix, 15/min + 40/day), `no-store` on every response.

Graceful degrade with no key: extraction returns `503 {offline:true}`, send returns
`503 {error:"delivery unavailable right now", offline:true}`. Never crashes.

Message cap: **2000 chars** (documented; contact messages are longer than chat's 500).

### src/scripts/terminal.ts (the client flow + humanization)

- Contact flow state machine (`contact: ContactState | null`, `Awaiting` union). Every TYPED
  send while armed routes to `contactSend` (submit handler), which echoes ephemerally and:
  deterministic email regex always; the FIRST blob is sent to `/api/contact` op extract to
  fill gaps; missing pieces asked **message, then name, then email** (Brian's order); an
  explicit **confirm turn** (`renderConfirm`, all values as text nodes) with `[send]`/`[cancel]`
  chips + a typed-yes path always precedes delivery; invalid/missing email uses the `--warn`
  token via `contactLine(..., warn=true)`; on success or cancel the composer returns to normal
  chat. The flow's turns are EPHEMERAL (never recorded), so a `/chat` refresh leaves no
  half-finished flow and `dropThread()` (leaving /chat) cancels it.
- Entry points all open the flow instead of the old email card: the contact nav item and
  inline `[contact]` link (`contactMoment` -> typed emulation), the typed `contact` command
  (`enterContactTyped`, echoes the visitor's word), and the model's `open_page:contact`
  (`openSlug` renders greeting + arms in place).
- Typing humanization (`humanDelay`/`typeInto`): per-char jitter, longer pause after spaces
  and punctuation, occasional micro-hesitation. `TYPE_BASE=20`, hesitation 0.05; simulated
  total for "How do I contact Brian?" is ~887ms vs the old flat 805ms (**+10.2%**, inside the
  ~20% envelope). Applies to all emulated typing.
- Email off surfaces: `HELLO_HTML` Contact becomes a `[contact]` cmdlink (opens the flow),
  `CONTACT_HTML` (the email card) deleted, `OFFLINE_HTML` drops the address.
- `timeGreeting()` factored out so the flow greeting and the pristine greeting share the
  time-of-day word.

### Other files

- `src/components/ChatBar.astro`: textarea `maxlength` 240 -> **2000** (larger endpoint cap).
- `src/styles/terminal.css`: contact flow styles (`.contact-warn` amber rail, `.contact-confirm`
  label/value grid, `.contact-actions` chips with `[send]` accent / `[cancel]` dim).
- `src/lib/site.ts`: `SITE.email` REMOVED. Consumers updated: `index.astro` + `about.astro`
  JSON-LD drop the `email` field; `about.astro` prose replaces the mailto link with a link to
  `/chat`.
- `functions/api/chat.ts`: the three operational-error strings (OFFLINE/BLOCKED/THROTTLED)
  drop `brian@brohde.com`. **This is content, not the frozen #61 request/response SHAPE, and
  the eval harness never exercises these error paths, so behavior/eval parity is unaffected.**
  Flagged for veto below.
- `poc/chat/system-prompt.md` + `facts.md`: the unknown/deny deflection template no longer
  hands out the email; it points to `[contact](/contact)` (kept indistinguishable between
  deny and unknown). New `## Contact` section instructs the model to answer contact questions
  with the in-chat flow, third person, never claim read-only. Prompt bundle regenerated
  (`node scripts/build-chat-prompt.mjs`; the generated file is gitignored, rebuilt every
  `npm run build`, verified email-free).
- `poc/chat/eval-http.mjs`: the `deflects` grader now matches the new deflection ("don't know
  that one" opener or the `(/contact)` link) instead of the email.
- `poc/chat/transcript.md`: hand-scrubbed of the address (see owed item on regen).

## Verified

- **Endpoint** (curl vs `wrangler pages dev dist`, no keys): 415 (bad content-type), 413
  (>16KB), 400 (unknown op / invalid email / empty message), 503 offline for both extract and
  send (the no-key graceful path), 429 rate limit after the window.
- **Browser round** (Chrome, wrangler + POC, all screenshotted): contact nav emulation types
  the humanized question then the exact greeting "Good afternoon! You can contact Brian right
  here. Simply write your message, and include your name and email address."; order-of-asks
  message->name->email; blob-with-email deterministic fallback; confirm turn with the summary
  + chips; no-key send -> the amber "delivery unavailable" notice + retry chips; `[cancel]` ->
  "Cancelled..." + back to normal chat; invalid email "bob-at-nowhere" -> amber `--warn`
  re-ask, valid email recovers to confirm; typed `contact` enters the flow; `[clear]` -> empty
  panel with NO greeting + placeholder shown + focused; newest-first turns with hairline
  separators; console had zero errors.
- Normal chat send routing verified (a non-contact send goes to the chat path, echo +
  thinking + reply slot). See the limitation below on the live reply.

## Not verifiable locally (owed / prod-verified)

1. **The keyed eval (35/38) parity re-run is OWED.** It needs a live ANTHROPIC key, which is
   unreadable here (the `.env` is permission-blocked and I did not touch it). The `deflects`
   grader change is correct by construction. Command for Brian: build, put the key + `CHAT_DEBUG=1`
   in `.dev.vars`, `wrangler pages dev dist --port 4581`, then
   `CHAT_URL=http://127.0.0.1:4581/api/chat node poc/chat/eval-http.mjs` (expect 35/38, the
   contact rows now pass on the flow-pointing deflection). `transcript.md` regenerates
   email-free from a keyed `node poc/chat/eval.mjs` run (my scrub is a stopgap).
2. **Real email delivery + the KV backup write** need `RESEND_API_KEY` and a verified
   `send.brohde.com` in Resend (Brian's setup, #181). Backup only runs on the send-success
   path, so it was never exercised locally. Verify on production after merge.
3. **The live model reply for normal chat** could not run in the browser sandbox: Chrome's
   Private Network Access blocks the browser -> `localhost:8787` POC preflight (curl bypasses
   it). Production chat is same-origin `/api/chat`, unaffected; the chat code path is
   byte-unchanged and rendered correctly (echo + offline fallback). This is the usual #124-class
   localhost-bridge artifact.

## Flags / decisions for the lead + Brian

1. **chat.ts error-string sweep (VETO-ABLE).** I removed `brian@brohde.com` from the chat
   OFFLINE/BLOCKED/THROTTLED strings for consistency with "off every surface". These were NOT
   in decision #183's explicit catalog. They are error-path content (not shape, not eval-graded),
   so this is safe, but it is my judgment call. One-line revert per string if you want the
   address kept there.
2. **No-extraction degrade leaves the email inline in the message.** Without an ANTHROPIC key
   (or if extraction fails), the first blob becomes the whole message, so a visitor who writes
   "reach me at x@y.com ..." has that text in the delivered message body (the email is still
   captured separately for reply_to). With the key, extraction strips it. This is the accepted
   graceful degrade, visible in the validation screenshots.
3. **Contact mode is not persisted.** A `/chat` refresh mid-flow restores the recorded chat but
   disarms the flow (module-only state). Deliberate for Phase B; flagged rather than fixed.
4. **`/api/contact` reuses the `CHAT_RL` KV binding** (rate limits under `crl:`, backups under
   `contact:`, 90-day TTL) rather than provisioning a new namespace, so nothing new is owed at
   the Cloudflare account. Split into its own binding later if desired (repo reorg #158).
5. **Textarea `maxlength` is now 2000** (the larger cap). `/api/chat` still caps a question at
   500 server-side, so a 501..2000-char CHAT (not contact) message would 400. Rare; flagged.
6. **Humanization knobs** (`TYPE_BASE=20`, hesitation 0.05, space/punct bonuses) are vetoable.
7. **about.astro** now links "start a conversation" to `/chat` (no-JS safe) rather than firing
   the flow directly; the header `contact` nav still opens the full emulated flow.

## Merge notes (main moved ahead on terminal.ts + terminal.css)

The lead landed items 5/6/7 + composer/`.out` CSS after my base (12d7b59). Expect conflicts in
`terminal.ts` on `clearChat` and the submit handler; resolution recipe:

- **clearChat**: take main's version (removeGreeting, no showGreeting, placeholder restore,
  refocus) and add the one line `contact = null;`.
- **submit handler**: take main's version (which ends with `input.focus({ preventScroll: true })`)
  and add, after the value is captured/cleared:
  `if (contact && currentScreen() === "chat") contactSend(value); else run(value, true);`
  (value must be captured before clearing the input).
- `dropThread` gains `contact = null;`.
- `terminal.css` contact-flow block is a new section (inserted between `.cmdlink` and the
  redirect countdown); no overlap with the dock/`.out` changes.

## Production go-live checklist (gated on Brian)

- Create the Resend account, verify the `send.brohde.com` sending domain, set `RESEND_API_KEY`
  as a Pages secret. Confirm the from address `contact@send.brohde.com` matches the verified domain.
- Redeploy (any push). Then send a real test message through the flow and confirm it arrives at
  Brian's personal inbox and a `contact:` KV key was written.
- Optional: run the keyed eval parity (owed item 1).
