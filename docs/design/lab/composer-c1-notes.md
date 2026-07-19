# C1: the composer, and a light chat panel (notes)

Concept for Brian to react to. Mock: `docs/design/lab/composer-c1.html`.
Nothing in `src/` is touched. Designed against the near-future build (no "#"
intro lines, a time-of-day greeting empty state, tighter composer-to-transcript
spacing, dark as the default).

Every color is copied exact from `terminal.css` / `global.css`. Every text pair
below was contrast-checked; all clear WCAG AA (4.5:1) on their real ground.

---

## The four calls

### 1. The input face: Circular, not mono. Mono was the problem.

**Recommendation: set the input in Circular Book, 16px, and take the whole
conversation Circular with it.** Mono leaves the chat body entirely; it survives
only for controls and meta (the `send` label, `[clear]`, timestamps).

Why: mono reads as a command line, a machine waiting for a command. The chat is
a person asking a person a question. Circular is the face the site already reads
in (the about copy, the ledger, the replies), so the composer, the placeholder,
and the answer become one editorial voice. The panel keeps the screen identity
in its material (night ground, mint, glow, scanlines), so the type does not have
to carry it. See tile 01 for the side by side: same line, mono vs Circular.

This is less of a change than it looks: replies are **already** set in the
system sans today (`.reply` uses `--font-sans`), not mono. So we are not adding a
face, we are unifying on the one editorial face whose fallback is already
metric-tuned (Circular Fallback), so the swap stays CLS-free.

Turn hierarchy without a second face:
- The visitor's echoed question: Circular **Medium (500)**, bright.
- The model's reply: Circular **Book (400)**, ink, on the 2px assistant rail.
- Weight plus the rail separate the two voices; the face never switches.

Contrast (night ground): question 17.60:1, reply 14.63:1, placeholder 7.41:1.

### 2. `[send]` becomes a real primary button.

**Recommendation: a filled accent button, no brackets.** Mint fill with night
text on dark (12.42:1), deep-green fill with paper text on light (7.20:1), 8px
radius to match the field. Hover brightens and intensifies the glow the panel
already has; active nudges 1px. Mono lowercase label keeps it in the control
family; the accent fill and the radius keep it in the theme.

Dropping the brackets is deliberate, not a loss. The house rule is already on the
books: bordered or filled form means the container carries the affordance and the
brackets recede (#102); a filled accent is the affordance (#161, the theme
toggle dropped its box for the same reason). So `[send]` graduates from a
bracket chip to a filled button, and the bracket vocabulary stays the vocabulary
of quiet controls. One primary action per surface earns the fill.

### 3. `[clear]` stays a quiet secondary, not a twin.

**Recommendation: keep the bracket token, drop the fill.** `[clear]` rests dim
and steps to accent on hover (the nav-token grammar the ledger and header links
already use); it never fills. That is what makes it read as secondary: the
primary is the only filled thing on the surface, and `[clear]` is a quiet
control that happens to sit near it. Right-aligned, as today.

Change from today: `[clear]` loses its bracket-fill-on-hover (currently a
`.cbtn`, so its label fills accent on hover, which reads as a second button). It
joins the quiet dim-to-accent family instead.

### 4. Drop the "$" sigil.

**Recommendation: drop it, replace it with nothing.** The input line is already
marked three ways: the composer container (the docked top edge of the panel),
the placeholder text, and the caret when focused. A prompt glyph is exactly the
machine cosplay the site has been retiring (#116), the `$` already lost its last
job when the favicon replaced it (#164), and Brian's own read is human, not
terminal. Tile 02 shows the line with nothing in front of it; it reads fine.

### 5. A light chat panel that can actually stand in daylight (the big one).

Today the panel stays a dark phosphor object even when the page is light, a
screen sitting on a white page. **Recommendation: give the chat panel a light
variant that engages under the light theme.**

The material: a warm sheet of paper in late sun, the daylight counterpart to the
night screen.
- Ground: `#FBFAF6`, one warm step off the `#FBFBF8` page white, so it reads as a
  raised object, not a hole in the page.
- Ink: the site's light palette unchanged (`#14211A` text, `#3F5348` dim,
  `#086148` deep-green accent).
- Golden hour (the scene's own atmosphere) carried into a warm top-corner wash
  and a warm shadow, never into the ink.
- No scanlines: the light tokens already zero them (`--crt-alpha: 0`), because
  they read as dirt on paper.
- Same geometry as the night panel: 12px radius, docked composer, the 2px
  assistant rail, the `[clear]` token, the filled primary.

The framing: night is a screen glowing in a dark room; day is a warm page in the
last hour of sun. One object, two times of day.

Scope: this revises #67's "always-night object" **for the chat surface only.**
Article terminal excerpts (`.prose pre`) and any literal machine output stay
always-night, because they are showing terminal output; the chat is a
conversation, so it earns the paper.

Contrast (warm paper panel): reply 15.93:1, dim 7.91:1, accent as text 7.15:1,
primary button text 7.20:1.

---

## Revision round (Brian's review of C1)

### R1. The input can never be mistaken for the greeting.

Brian: the greeting "Ask me anything about Brian's work, or type help." read too
much like the field, because both were Circular 16px dim. Two fixes, belt and
suspenders:

- **The composer is now a field well.** The `--pwell` token (defined for the
  panel but unused until now) recesses the input from the panel ground, and a
  hairline border plus a 10px radius make it unmistakably a place to type. On
  the night panel the well sits a step lighter than the ground; on paper a step
  darker. The border wakes to the accent on focus.
- **The placeholder diverges from the greeting.** The field now reads "Ask a
  question, or type help" (terse, a field instruction). The greeting keeps its
  fuller spoken line and its bright "Good afternoon." lead, on the open panel
  ground. A field sits in a well; a spoken line sits on the ground; they can no
  longer swap roles.

The greeting itself is unchanged: Brian approved that copy.

### R3. [clear] moves to the panel footer.

Bottom, right aligned (Brian's position call, supersedes the top-right spot).
The transcript is newest first, so the bottom is the oldest end of the thread,
which is why the footer is the honest home for [clear]: it is not the first
control you meet before you have said anything. It sits under a hairline, never
fills, rests dim, and steps to accent on hover and focus (the nav-token
grammar). Section 03 of the mock shows the rest and hover states on both
grounds; section 02 shows the footer seated in a full panel.

### R4. A conversational contact flow (new scope).

Contact runs inside the chat instead of publishing Brian's address. Starting a
contact-like message, or invoking contact, always collects the same three
things in order, then confirms. My microcopy:

1. name: "Glad to help. What's your name?"
2. email: "Thanks, [name]. What email should Brian reply to?"
3. message: "Great. What would you like to say?"
4. sent: "Sent. Thanks, [name], your note is on its way to Brian. He'll reply to
   [your email]."

The composer placeholder becomes the current ask, and the assistant voice
carries every prompt and correction, so nothing is a color-only signal. An
invalid email is corrected in voice ("Hmm, that email doesn't look right. Mind
checking it?") and the field takes a soft golden-hour amber border, because the
palette has no red (see the pick). The sent state echoes the VISITOR's email,
where the reply goes, never Brian's. Section 04 shows the email ask, the
invalid-email moment, and the sent state, both grounds.

Voice note: Brian's draft said "us" ("Tell us your name"). This is a personal
site with one name on it, so the mock speaks as "Brian" to "you"; "us" would
imply a team that is not there. Flagged as a pick.

## The picks Brian must make

1. **Conversation face.** Circular for the whole conversation, question and reply
   and input (recommended), or Circular for the human's side only with replies
   staying in the system sans?
2. **`[send]` brackets.** Filled button with no brackets (recommended), or keep a
   single bracket echo on the filled button?
3. **`[clear]` hover.** Drop its fill-on-hover for the quiet dim-to-accent step
   (recommended). This changes the established `.cbtn` hover on this one control;
   OK?
4. **Light chat panel.** Approve the daylight panel, which revises #67's
   always-night rule for the chat surface (article terminal excerpts stay night).
   Yes or no.
5. **Golden-hour strength.** The subtle warm wash shown, or push it warmer so the
   time-of-day cue reads harder on paper.
6. **Placeholder copy.** The field becomes "Ask a question, or type help" so it
   diverges from the greeting (supersedes #89's "Ask me anything or type help").
   Keep, or a different terse line.
7. **Contact-flow voice.** Speak as "Brian / you" (recommended, personal site)
   or keep Brian's drafted "us".
8. **Invalid-email signal.** The palette has no error red. Use the golden-hour
   amber as a soft attention tone on the field (shown), or add a dedicated error
   color to the system.
9. **Contact-flow shape.** Reuse the one composer with contextual placeholders
   (shown), or a distinct step UI. And: after sending, does the composer return
   to normal chat (shown), or does the panel close the flow.

---

## Open questions for the studio lead

- The greeting empty-state copy ("Good afternoon. Ask me anything about Brian's
  work, or type help.") belongs to the implementation agent already in flight;
  the mock uses a representative line only, to show the Circular voice in the
  empty state. Copywriter should own the final wording and the time buckets.
- Code in replies stays mono: fenced blocks and inline code spans keep the mono
  face; only conversational prose goes Circular. Nothing here changes that.
- Light-panel placeholder uses dim (`#3F5348`, 7.91:1). If Brian wants it to read
  softer, more like a true placeholder, `#5A6B60` (5.42:1) is the lighter option
  and still clears AA.
- If the light panel is approved, the slab stops being categorically
  always-night, so `#67` gets an amendment note (chat surface follows the theme;
  literal terminal material does not). Flagging so the decision log stays honest.
