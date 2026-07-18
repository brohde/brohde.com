# The three chat surfaces as one system: critique + direction (r1)

_Design-director spec, docs only (decision #126: direction goes straight to code; the
deliverable is the direction). Brian's prompt: "What does your design team think of our current
slab. The links in it are redundant with the rest of the site." He is right, and the redundancy
is a symptom of a larger fact: the slab interior is option-C vintage (designed for #67 when the
slab WAS the site), the header input row is D1-shell vintage (#121/#122), and /chat is a Phase 2
engineering conversion that never got a design pass. This treats all three as one system._

**What is already settled and NOT relitigated here:** the boot is killed (#149); page
transitions are option A, the tide carries you (#150); the /chat composer unifies with the
header input row at the top with a newest-at-top transcript (#153 + `chat-top-spec.md`, approved
direction); profile icons live on the role line (#151); the persistent per-identity scene sits in
the right gutter on every page (#111/#109). This spec **composes with** `chat-top-spec.md` (the
composer move) and `motion-spec-r1.md` (the transition); it consumes both. Where I contradict
chat-top-spec I say so in section 3 and defend it.

**House rules held:** zero em/en dashes, never "terminal" for the site's surfaces, sentence case
headings, WCAG AA (4.5:1 body). **No new color pairings are introduced anywhere in this spec:**
every pairing reuses the shipped, measured phosphor tokens (mint `#7EE787` 12.42:1, ink `#D6E5DC`
14.63:1, bright `#F2F7F3` 17.60:1, dim `#8FA79A` 7.41:1, all on the slab ground `#0B110E`). That
is a deliberate constraint so the Phase 3 build is fast and safe.

---

## The thesis the whole system serves

**brohde.com is a portfolio you can talk to.** The chat is not a feature bolted onto a portfolio;
it is the spine. Say that out loud and the three surfaces fall into place:

- The **homepage slab** gives the chat the **hero** treatment: it is the site's one signature
  object, the thing that makes this not look like every other portfolio, the gesture that says
  "ask this site anything."
- The **header input row** keeps the chat **one reach away** on every page: the same input,
  demoted to chrome.
- **/chat** is where the conversation **lives full length**.

One input material and one screen material, appearing at three scales. Everything below is in
service of making that legible. This is the search-engine pattern every client already
understands without being taught: a big box on the front door, a small box in the header of every
page after it, and a full page for the results. We are borrowing a mental model, not inventing one.

---

## 1. Critique, honestly

### 1a. The slab (homepage): a nav hub with no job left to do

The slab was designed (#67) to hold **everything interactive**: prompt, commands, chat, the whole
site's controls. Since then the site grew a global header, a work ledger, an about page, profile
icons on the role line, and a persistent scene. Four of the slab interior's five elements now
duplicate something else on the very same screen:

| Slab element today | Duplicated by |
| --- | --- |
| `[work]` command | the article ledger, directly below the slab |
| `[about]` command | the header nav `about` link, one row up |
| `[contact]` command | the header nav `contact` button, one row up |
| `[resume]` command | the `[Resume]` profile icon on the role line (#151) |
| the `$ hello` line | a vestige of the boot theater that #149 just killed |

That is Brian's observation, itemized. The **entire command menu is redundant navigation**, every
target reachable within one screen height. The `$ hello` line is a machine echo left over from a
sequence that no longer plays. The title bar (`brohde.com · chat`) and the green **ready** dot are
machine cosplay that #116 explicitly moved away from ("this is not a terminal, it mimics
Claude/ChatGPT"); neither Claude nor ChatGPT puts a filename title bar and a status LED over its
composer. **The one element that is not redundant and not vestigial is the prompt.** The slab is
carrying a title bar, a status light, a greeting to no one, and a four-item nav, all to frame the
single thing that earns its place. It is a hero object justifying itself with weight that has lost
its purpose.

### 1b. The global input row: chrome that is about to become a composer

The `.hchat` row was specced (D1 call 7, #122) as **chrome sizing, not hero sizing**: 48px, a
quiet "jump to chat" affordance on interior pages. Under `chat-top-spec.md` it is about to become
the **live /chat composer**, the thing a visitor types into every turn. The material is right (the
phosphor input, identical night values so contrast holds on either ground). What it lacks for its
new job is a **send affordance**: it relies entirely on the Enter key. As a "jump to chat" hint
that was fine; as the primary composer on a page that explicitly models itself on Claude/ChatGPT
(#116, both of which show a visible send control), a field with no send button reads as a search
box, not a composer, and gives phone users no tap target for the primary action. Placeholder,
focus glow, and the relationship to the wordmark row are all sound and stay.

### 1c. The /chat frame: converted, never designed

b2-phase2 did exactly its job (make /chat a normal shell page) and honestly flagged that it did
no design pass. The result is a surface assembled from homepage parts:

- **The slab "fills the first viewport"** (b2-phase2 judgment call 2). That rule made sense when
  the composer dock anchored the panel's bottom. `chat-top-spec.md` moves the composer to the
  header. Once the composer leaves, a viewport-tall night panel holding two intro lines at its far
  bottom is a **large empty void** with nothing to justify its height. The rationale for the
  fill-viewport call evaporates with the element that motivated it.
- **The title bar and ready dot** sit directly under what will now be a sticky header composer.
  chat-top-spec itself flags this as "somewhat redundant with the site header directly above it."
  It is worse than redundant: it is a second machine chrome stacked on the first.
- **Golden hour** (#74/#150) is currently "warm the decorative halo to amber," which is barely
  perceptible (0.12 alpha). /chat is the one page with its own non-article identity, and that
  identity currently does almost no visible work.

### 1d. What ties the three failures together

All three surfaces were designed at different times for different worlds, and none was asked to be
part of a **system**. The slab thinks it is still the whole site. The header input thinks it is
still a secondary hint. /chat thinks it is still a full-window takeover wearing shell clothes. The
fix is not three touch-ups; it is one decision about what each surface is FOR, applied
consistently. That is section 2.

---

## 2. Direction

### Q1. The slab is the hero chat invitation, and only that

**Recommendation: radical simplification.** The slab keeps exactly what makes it the site's
signature interactive object and sheds everything the rest of the site now carries.

**Sheds (load-bearing cuts):**

1. **The entire command menu** (`<CommandMenu />`, the `[work] [about] [resume] [contact]` row).
   This is the direct answer to Brian. Every target is reachable within one screen height (about
   and contact in the header one row up; work is the ledger below; resume is the profile icon on
   the role line). Removing the menu removes **duplication, not access**. Commands are not lost:
   they still type (`work`, `about`, `contact`, `help`, `clear` all run at the prompt), and the
   placeholder still names `help`. On the homepage the menu was pure NAVIGATION, which the site now
   provides four other ways.
2. **The `brohde.com · chat` title bar and the ready dot.** Machine cosplay #116 retired. The
   phosphor material (scanlines, corner glow, border, halo) already says "screen"; the title bar
   said "windowed application," which is the wrong metaphor now. The ready LED is a status light
   with no status to report.

**Keeps and elevates:**

3. **The prompt, promoted to hero.** With the clutter gone, the prompt is the dominant element by
   subtraction; give it a modest size bump to seal it (min-height 66px from 58, input `font-size:
   17px` from 16, still above the 16px iOS no-zoom floor, `$` sigil to match). It keeps its full
   machinery (autocomplete #48, history #44, ghost placeholder), because the hero should be the
   richest instance of the input. Add the send affordance from Q3.
4. **The screen material.** Night ground `#0B110E`, mint `#7EE787`, scanlines, glow field, border,
   halo. This is a large share of the site's distinctiveness under the no-logo constraint (#4:
   distinctiveness from type, color, layout, motion). It stays exactly as measured.

**Where the #149 "hello" survivor lives:** it becomes the slab's **greeting line**, one short warm
line directly above the hero prompt, replacing the `$ hello` machine echo. Its job is warmth plus
"this talks back," and it is where #149's static "hello" content now lives. (Face and exact words
are a copywriter/Brian call, flagged; my recommendation is in the flags.)

**What the slab IS, in one line:** the hero chat invitation. A warm greeting, one prominent input,
on the phosphor screen, with the aurora and the BR tide drifting behind it in the gutter. That is
Claude/ChatGPT's empty state rendered as brohde.com's front door, which is precisely the #116
target, and it is a credible, modern, distinctive hero. The slab earns its weight only as the
invitation; it does not earn weight as a nav hub, because the site now has a header for that.

**The Phase 2 "slab fills the first viewport" call:** that was a /chat decision (b2-phase2 judgment
call 2); it does not apply to the homepage slab, which is and stays a card in normal flow
(`margin-top: 40px`). Its resolution for /chat is in Q4. Naming it here to close the loop: the
homepage slab is never viewport-filling and never was.

### Q2. The homepage handoff, resolved

`chat-top-spec.md` left this open with three options (un-hide the header composer on home and
demote the slab; a designed morph; the honest cut) and recommended the honest cut (option c). #153
said the homepage half of #145 "stands for now" (header composer stays hidden on home). **I confirm
option c, and the Q1 simplification makes it materially cleaner than chat-top-spec could when the
slab still held a command console.**

Here is the resolution and why it is now airtight. With the slab stripped to a greeting plus a
prompt, **the homepage slab and the /chat header composer become the same gesture at two scales:**

- **Homepage:** the input at **hero scale**, inside the full phosphor screen, with a greeting and
  the send chip: 66px field, screen chrome, center of attention. This is "start here."
- **/chat and every interior page:** the same input material at **chrome scale**, the 48px header
  composer.

The home to /chat boundary is no longer a switch between two DIFFERENT KINDS of thing (a command
console vs a composer). It is one input, sized as hero on the entry page and as chrome everywhere
after. That is a deliberate, readable hierarchy, and it is the exact search-engine pattern from the
thesis. Continuity across the boundary is carried by three things that are already true or nearly
free (chat-top-spec's list, which I keep):

1. **The persistent scene** (option A, #150): the aurora and BR tide never blink across the
   navigation; it is visibly the same room.
2. **Identical input material:** same night ground, same `$`, same placeholder, same mint focus
   glow. The eye reads it as the same input relocating and shrinking, not a new control.
3. **The echoed question:** a home send navigates to /chat and echoes as the first line of the
   newest turn, directly under the composer. The thread you asked for is already there.

**The slab does NOT shed its prompt.** It sheds its command menu and its machine chrome and
elevates its prompt. So "what replaces the invitation" needs no answer: the invitation IS the slab
prompt, now purer, larger, and unmistakable. **Keep #145's homepage half** (header composer hidden
on `/`, `data-hchat="off"`). I explicitly reject option (a): un-hiding the header composer on home
would put two chat inputs on one screen (the "two inputs fighting" that #145 and chat-top-spec both
warn about) and would collapse the hero/chrome hierarchy that the whole handoff depends on. Option
(b) morph is rejected as contradicting #150 (already rejected by chat-top-spec, agreed). The CLS
story is unchanged from chat-top-spec Q2 (the `data-hchat` toggle happens under the covered swap,
zero CLS); my changes do not touch it.

### Q3. The global input row carries the composer weight

Material, placeholder, and focus states are right; keep them. Two changes give it the weight of a
live composer.

1. **Add a send affordance (recommended, one net-new element).** A phosphor `[send]` chip at the
   right end of the input row, reusing the site's bracket grammar and the exact unified bracket-fill
   hover (`.cbtn` rule: accent fill, ground-colored label on hover/focus). `type="submit"`,
   `aria-label="Send"`, 44px minimum target. Contrast: `[send]` is accent `#7EE787` on `#0B110E`
   (12.42:1) at rest, and accent-fill with `--on-accent` `#0B110E` label (12.42:1 inverse) on hover.
   This appears on the **shared input material**, so it shows wherever the input shows: the header
   composer (its primary justification) and the hero slab prompt (consistency). On interior pages,
   where the header input is a "jump to chat" affordance, the chip reads as "go," which is correct.
   Rationale, tied to #116 and to the composer-weight question: it makes the field read
   unmistakably as a composer rather than a search box, it matches Claude/ChatGPT, and it gives
   phone users a tap target for the primary action instead of hunting for the keyboard return key.
   `enterkeyhint="send"` already labels that key; the chip is the visible, tappable partner.
2. **Prominence on /chat comes from context, not a restyle** (this is what keeps the unify story
   intact). chat-top-spec makes the header sticky on /chat and puts the newest turn directly
   beneath the composer. So on /chat the composer is the first thing under a header that never
   scrolls away, and the answer blooms right under it. Its prominence is positional. **Do not fork
   the composer material between pages** (no amber-on-/chat, no bigger-on-/chat): the moment the
   header composer looks different on /chat than on /about, it stops reading as "the same input
   everywhere," which is the entire point of unifying. One material, everywhere.

**Placeholder copy** stays "Ask me anything or type help" on every instance (the unified-input
story wants one placeholder). A context-swapped placeholder on /chat mid-thread ("Reply, or ask
another question") is available and flagged, but it costs the single-placeholder coherence, so:
not recommended.

**Relationship to the wordmark row** is unchanged: row 2 under the identity row, 8px gap. On /chat
the two-row header (~110px) becomes sticky (chat-top-spec Q3); the sticky header takes the page
ground (`var(--ground)`, editorial) as its background so the transcript does not show through it
while scrolling, and the composer stays a night strip on that ground exactly as on interior pages.
No conflict with golden hour (which lives in the scene and the panel halo, never the page ground).

### Q4. The /chat frame, designed as a surface

The composer is in the header now (chat-top-spec). What remains in `main` on /chat is the
**transcript**. Design it as a real surface.

1. **Keep the phosphor transcript panel; remove its title bar and ready dot.** The panel stays the
   slab screen material (coherence: same screen as the homepage, "the conversation lives in the
   machine"). But `.slabhead` (the `brohde.com · chat` bar + ready dot) is removed on /chat, for the
   same reason it is removed on the homepage: it is machine cosplay, and here it is stacked
   redundantly under the sticky header composer. Without it the panel's top is simply the rounded
   night edge with the newest turn inside. This **contradicts chat-top-spec's "Keep `.slabhead`,"**
   defended in section 3.
2. **Size the panel to content; stop filling the viewport.** This resolves the b2-phase2 veto call
   directly: with the composer relocated to the header, the viewport-fill rule leaves a void, so
   drop it. Remove the `flex: 1` growth from `.chatpad main` and `.slab-chat`; the panel takes the
   height of its content and grows downward as turns accumulate. Keep `.screen`/`.chatpad` as a
   `min-height: 100dvh` flex column so the footer still sits at the natural bottom, and give the
   empty panel a comfortable minimum (`min-height: clamp(280px, 40vh, 420px)`) so a fresh /chat
   reads as an intentional surface, not a jammed strip. Empty state = a short panel holding the two
   intro `.cmt` lines (chat-top-spec keeps these, sinks them to the bottom, hides them once a
   transcript exists). One exchange = a bit taller. A long conversation = a long panel you scroll,
   with the sticky composer always in view above it. The panel is exactly as tall as the
   conversation, which is honest and never a void.
3. **Turn blocks, separated the way the ledger separates rows.** chat-top-spec Q1 groups output
   into `.turn` blocks, newest prepended. Give the separation a real spec instead of "only if it
   crowds": a hairline between turns, `.turn + .turn { border-top: 1px solid var(--line);
   padding-top: 16px; margin-top: 16px }`. This is deliberately the ledger's own idiom
   (`.lentry + .lentry` hairline): both are newest-first lists of records, so they share a
   separator grammar. Because newest is first in DOM, the newest turn has no top rule and older
   turns each carry a hairline above them, which reads correctly.
4. **Within a turn, keep the voice split, it is already good.** The echoed question is mono bright
   (`.uline`, `#F2F7F3`, the machine's font: the human types in the machine's voice). The reply is
   Circular-adjacent sans with the left rail (`.reply`, `#D6E5DC`, 16px/1.65, 62ch, the readable
   answer). Keep the rail (`border-left: 2px solid #33523F`). This is the site's type thesis in
   miniature: you TYPE in mono, you READ answers in prose. No change.
5. **Golden hour, made to mean something, without touching a single ink.** #150 says /chat resets
   to the default (BR) identity plus golden hour. Golden hour lives in exactly two places, both
   atmosphere: the **scene sky** in the gutter warms to amber (the scene's chat state, already
   wired), and the **panel's outer halo** warms to amber (`rgba(255,170,51,...)`, already shipped in
   `.slab-chat`). Everything a visitor reads (inks, borders, the rail, the reply text, the composer)
   stays phosphor mint, so every measured contrast ratio holds and the composer never forks. Make
   the sky warmth genuinely warm (this is /chat's only identity, let it be felt) and keep the halo.
   That is the disciplined maximum: golden hour is the room's light, not the type's color.
6. **Against the persistent scene and #109.** Unchanged and correct: content in the left column, the
   gutter preserved for the scene, the full-width shell via `body:has(.scene)` (#125/#126). The
   panel sits in the left column; the golden-hour BR scene sits in the gutter; the frame reads as
   the same room as every other page, tinted for conversation. The b2-phase2 cold-sky facade flash
   is already fixed by the interior-pages engineer's themed-facade work (STATUS: "kills the /chat
   cold-sky"), so /chat opens golden, not cold.

Thinking indicator (#118), countdown (#143), persistence (#144): behavior unchanged; chat-top-spec
already routes them into the newest turn at the top. Nothing here touches them.

### Q5. Coherence: the one system rule

**The rule:** there is one input material and one screen material, and the three surfaces are those
two materials at three scales. Everything else follows.

- **The input material** (night `#0B110E`, mint `#7EE787`, `$` sigil, mono, mint focus glow, and
  now the `[send]` chip) appears as the **hero slab prompt** (homepage) and the **header composer**
  (/chat + interior). Same material, two scales: hero and chrome.
- **The screen material** (phosphor panel: night ground, scanlines, glow field, border, halo)
  appears as the **homepage slab** (holds the invitation) and the **/chat transcript panel** (holds
  the conversation). Same material, two roles.

**State grammar, one set everywhere:** rest is mint-on-night with dim placeholders and labels;
hover and focus drive border to mint and lift the glow, and bracket controls fill accent with a
ground-colored label (the single unified `.cbtn` rule); the caret is the heartbeat that blinks and
yields to focus (#63). Every interactive target is at least 44px. The between-rows hairline
(`var(--line)`) separates ledger rows AND chat turns.

**Type grammar, one thesis everywhere:** you type in mono (the machine's voice: the `$`, the input,
commands, the echoed question); you read answers and editorial copy in Circular/sans (identity
lines, ledger titles, prose, chat replies). Mono for input, editorial for reading, on all three
surfaces.

**The command distinction that makes the cuts principled:** navigation commands are redundant with
site nav and get cut (the homepage slab menu); chat-control commands are not redundant and stay
(the /chat `[help] [clear]` keybar, kept per chat-top-spec, because `clear` has no other affordance
and neither is a place you can also reach from the header). "Cut nav that duplicates the site, keep
controls that only the chat provides" is the single test.

**What changes on each surface to comply:**

| Surface | Change to comply |
| --- | --- |
| Homepage slab | Shed the command menu and the machine title bar/ready dot; recast `$ hello` into a warm greeting; elevate the prompt to hero (66px/17px) and add the send chip. |
| Header composer | Add the send chip; keep the material identical on every page; sticky on /chat (chat-top-spec); never forked for golden hour. |
| /chat panel | Remove the title bar/ready dot; size to content (not viewport-fill); separate turns with the ledger hairline; golden hour as scene sky + panel halo only. |

---

## 3. Where this contradicts or extends chat-top-spec (explicit; the specs must compose)

The Phase 3 build consumes both documents, so every seam is named.

1. **CONTRADICTS: remove `.slabhead` on /chat.** chat-top-spec's change-list says "Keep `.slabhead`"
   and its flag 5 keeps the title bar "to frame the transcript as the phosphor screen object and
   host a status." **Defense:** chat-top-spec itself calls it "somewhat redundant with the site
   header directly above it," and both of its stated reasons fail on inspection. (a) The phosphor
   framing is already fully carried by the scanlines, glow field, border, and halo; the title strip
   adds a windowed-application read, which is the wrong metaphor post-#116. (b) There is no status
   worth hosting: the ready dot is a machine LED with nothing to report, exactly the cosplay #116
   retired. Directly beneath a sticky header composer, a second title bar is visual debt. So remove
   it, on /chat and on the homepage slab, for one consistent slab object. **Compose:** where
   chat-top-spec's change-list says "Keep `.slabhead`," read "remove `.slabhead`"; nothing else in
   its list depends on the title bar.
2. **EXTENDS: resolve "slab fills the first viewport."** chat-top-spec inherited b2-phase2's
   viewport-fill and did not revisit it (it was focused on the composer move). This spec resolves it
   (Q4.2: size to content). No contradiction; it fills a gap chat-top-spec left open.
3. **EXTENDS: the send chip.** Additive to chat-top-spec's change-list; it does not alter the
   composer's routing, sticky behavior, or the newest-at-top flow.
4. **EXTENDS: turn separators.** chat-top-spec says "add `.turn + .turn` margin only if validation
   shows crowding." This spec makes it a firm hairline (Q4.3) tied to the ledger idiom. A
   strengthening of the same rule, not a reversal.
5. **STRENGTHENS, does not contradict: the homepage handoff.** chat-top-spec recommended option (c);
   this spec keeps (c) and adds the hero-to-chrome scaling argument (Q2), which is a stronger reason
   for the same decision. #145's homepage half stands, as #153 already said.

Everything else in chat-top-spec (newest-at-top and its defense, the sticky header on /chat, mobile
keyboard behavior, persistence, the a11y section, the composer being `#in-site` and the dock
retiring) stands unchanged and is assumed here.

---

## 4. File-by-file change sketch

These deltas ride **on top of** `chat-top-spec.md`'s engineer change-list (which already moves the
composer to `#in-site`, retires the `.dock`, makes the header sticky on /chat, and regroups the
transcript into turns). Only the additions and reversals are listed here. Post-#149, `.bseq`, the
boot gate, and `runBoot` are already gone; treat the slab and header as visible from first paint.

| File | Change |
| --- | --- |
| `src/components/Slab.astro` | Remove `<CommandMenu />` and its import. Remove the `.slabhead` block (title bar + ready dot). Replace `<p class="slabhello"><span class="p">$</span> hello</p>` with a single greeting line (`<p class="slabgreet">…</p>`, copy + face flagged). Keep `<Prompt id={promptId} />` and the `.cmt.hint` line. Result: greeting, then hero prompt, inside the phosphor screen. |
| `src/components/CommandMenu.astro` | Becomes unused (only Slab imported it). Delete it, or keep solely as the styleguide specimen if the styleguide still references it (it inlines its own markup today, so deletion is clean). Flag either way. |
| `src/pages/chat.astro` | Remove the `<header class="slabhead">` block (title bar + ready dot). Per chat-top-spec the `.dock` and `<Prompt id="chat">` are already gone and the composer is the header input; keep the compact `[help] [clear]` keybar as the first child of `.chatbody` (chat-top-spec flag 4) and the two intro `.cmt` lines. The panel is now just the keybar + `#chatlog`. |
| `src/components/Prompt.astro` | Add the `[send]` submit chip as the last child of the `.prompt` form, after `.iwrap`: `<button type="submit" class="cbtn send" aria-label="Send"><span class="br">[</span><span class="lbl">send</span><span class="br">]</span></button>`. Applies to both `#in-home` (hero) and any Prompt instance. |
| `src/components/SiteHeader.astro` | Add the same `[send]` submit chip to the `.hchat` form, after the `<input>`. This is the composer's primary send control. |
| `src/styles/terminal.css` | (a) Hero prompt: bump `.slab .prompt` `min-height: 58px → 66px` and `.prompt input`/`$` `font-size: 16px → 17px` scoped to the slab (keep the header composer at 48px/16px chrome). (b) `.slabgreet`: the greeting line (face per flag; if editorial, `font-family: var(--font-edit)`, ink `#D6E5DC`, ~15px, one line, small bottom margin). (c) `.send`: reuse `.cbtn` (already accent + bracket-fill via the unified rule); add `min-width: 44px; justify-content: center` and a small left margin so it seats at the input's right edge; add `.send` to the unified `.cbtn:hover .lbl` selector list if the selector is enumerated rather than class-based (it is class-based today, so no change needed). (d) /chat panel: remove `flex: 1` from `.chatpad main` and `.slab-chat`; add `min-height: clamp(280px, 40vh, 420px)` to `.slab-chat`; keep `.screen`/`.chatpad` `min-height: 100dvh` so the footer stays anchored. (e) Turns: `.turn + .turn { border-top: 1px solid var(--line); padding-top: 16px; margin-top: 16px }`. (f) `.slabhead`/`.slabhello` rules become unused once both surfaces drop them; remove, or keep only if the styleguide specimen keeps showing them (flag). Golden-hour `.slab-chat` halo rules are untouched. |
| `src/pages/styleguide.astro` | Follow: update the slab specimen (lines ~103-111) to the new interior (greeting + hero prompt + send chip, no title bar/ready dot) so the styleguide is not lying; add a `[send]` specimen if it enumerates controls. |

No change to `global.css` (no new tokens, no new colors). No change to the server, prompt, facts,
eval, or model (#61 held): this is presentation only, and the composer POSTs through the same path
chat-top-spec already routes.

---

## 5. Taste-level flags for Brian (separated from the load-bearing recommendations above)

None of these block the build; the load-bearing direction is sections 2 to 4. These are the calls
where Brian's taste should decide.

1. **Retiring the slab title bar and the ready dot.** This is the most visible departure from the
   approved #67 slab. Studio recommends removing it on both the homepage slab and /chat (machine
   cosplay #116 retired; the phosphor material already reads as a screen). If Brian likes the window
   frame, the conservative middle path is: keep a slim top strip but drop the green ready LED (it is
   a status light with no status) and change or empty the `brohde.com · chat` label. Studio: remove
   it. This shapes the slab's interior, not its existence, so it is within the design remit, but it
   is a big enough visual change to want his eye.
2. **The greeting copy and its face.** `$ hello` is recast into one warm line above the hero prompt,
   where #149's "hello" now lives. Words are the copywriter's/Brian's call; a candidate that keeps
   "hello," invites, and does not duplicate the placeholder ("Ask me anything or type help"):
   something like **"Hi. Ask me about the work below, or just say hello."** Face: studio recommends
   the **editorial (Circular)** face, because it reads as Brian greeting you (warm, human, on the
   #116 Claude/ChatGPT model) rather than a mono machine echo, while the input below stays mono. If
   Brian prefers the slab to stay all-mono as "the machine," the greeting can be mono; that is the
   arguable call.
3. **The `[send]` chip.** The one net-new UI element. Studio recommends it (it makes the header
   input read as a composer, matches #116, gives phones a tap target). It appears on both the slab
   prompt and the header composer for consistency, including on interior pages where it reads as
   "go." Removable in one place if Brian wants Enter-only; the fields still submit on Enter with
   `enterkeyhint="send"`.
4. **Deleting `CommandMenu.astro` outright.** With the homepage menu gone it has no consumer.
   Studio: delete it (dead code); the styleguide inlines its own specimen. Keep only if Brian wants
   a live command-menu specimen in the styleguide.
5. **/chat empty-state minimum height.** Studio picks `clamp(280px, 40vh, 420px)` so a fresh /chat
   is an intentional surface, not a jammed strip and not a viewport void. A different minimum is a
   one-value change.
6. **Golden-hour intensity on /chat.** Studio keeps golden hour as atmosphere only (warm scene sky
   + amber panel halo, no ink change, so contrast and the unified composer are protected). If Brian
   wants /chat's identity to read harder, the honest next lever is a warmer, stronger sky, not amber
   type (amber ink would fork the composer material and force a contrast re-audit; studio advises
   against it).
7. **Single placeholder vs a /chat-contextual one.** Studio keeps one placeholder ("Ask me anything
   or type help") on every instance for the unified-input read. A mid-thread /chat variant ("Reply,
   or ask another question") is available but costs that coherence; not recommended.

---

## Open questions to take to Brian (studio lead's list)

- **The title-bar retirement (flag 1)** is the one call studio most wants Brian's eye on before the
  Phase 3 build consumes this, because it changes an approved object (#67/#87).
- **Greeting copy (flag 2)** should route through the editorial workstream, not be invented in the
  build; the structural slot (one warm line above the hero prompt) is set, the words are not.
- **Does the styleguide keep a command-menu specimen** once the homepage menu is gone (decides
  whether `CommandMenu.astro` is deleted or kept)?
- All three surface changes assume the #149 boot-kill and #153 composer-move branches have landed;
  the Phase 3 transitions build (#150) should consume this spec, `chat-top-spec.md`, and
  `motion-spec-r1.md` together, in that dependency order.
