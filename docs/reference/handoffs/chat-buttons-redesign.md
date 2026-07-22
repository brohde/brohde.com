# Handoff: chat-surface button redesign

Brian's order: "Improve the button design in the chat. Make it look more like a
button. I don't like the bracket treatment." Design change, shipped to code
(house rule #126). Skin only: markup classes and CSS. No flow logic, no /api,
no scene files, no contract-shape change (#61 held).

## What changed

The chat-surface controls dropped the literal `[bracket]` grammar and became
real buttons: a rounded rect, a fill or hairline, comfortable padding, a 44px
touch target, and the global 2px accent focus-visible ring.

Two roles, one grammar (`.cbtn`):

- **PRIMARY = send** (contact confirm). Accent-filled button, `--on-accent`
  text. The one loud control on the surface. Hover/focus brightens 6% and
  lights the accent's own glow, matching `.btn-send` (the composer send) so the
  two send controls read as one family.
- **SECONDARY = cancel / edit / clear** (the lone cancel on every ask line, the
  confirm cancel, the three edit chips, the /chat + /contact keybar clear).
  Transparent ground, a muted-ink hairline, dim label rising to accent ink +
  accent edge on hover/focus. Clearly subordinate to send.

The composer send button (`.btn-send` in `ChatBar.astro`, three placements:
header / homepage flow bar / /chat composer) already WAS a real
bracket-free accent-filled button (#161), so it was left as-is. It is the
design target the chip round now matches; the chip radius (8px) is aligned to
it so the whole chat uses one button radius.

## Design values

| Property        | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| Radius          | 8px (matches `.btn-send`; in the brief's 6-8px button family)  |
| Touch target    | min-height 44px (preserves the old `.cbtn` 44px; house rule)   |
| Padding         | 0 16px horizontal, content vertically centered in the 44px box |
| Font            | var(--font-mono), 13px, letter-spacing 0.01em, lowercase label |
| Row gap         | 8px (`.contact-actions` / `.contact-edits` / `.keybar`)        |
| Transition      | color / border-color 120ms ease (secondary); filter 120ms + box-shadow 160ms (primary glow) |
| Reduced motion  | covered by the global universal switch (`transition-duration: 0.001ms !important` on `*`, global.css) |
| CLS             | 0 (buttons already occupied 44px min-height rows; only paint changed) |

### Colors + measured contrast (WCAG 2.x, computed from the tokens)

Tokens read from the panel scope: dark ground `#0b110e`, light ground
`#fbfaf6`. Ratios are text-vs-fill for the primary and label-vs-ground for the
secondary; the secondary border is a supporting cue, not the sole affordance
(the dim text label always carries the control), so its ratio is reported for
completeness, not as a gate.

**PRIMARY send (`--on-accent` on `--accent` fill):**

- Dark: `#0b110e` on `#7ee787` = **12.5:1** (AAA)
- Light: `#fbfbf8` on `#086148` = **7.2:1** (AAA)

**SECONDARY label at rest (`--dim` on ground):**

- Dark: `#8fa79a` on `#0b110e` = **7.5:1** (AAA)
- Light: `#3f5348` on `#fbfaf6` = **7.9:1** (AAA)

**SECONDARY label on hover/focus (`--accent` on ground):**

- Dark: `#7ee787` on `#0b110e` = **12.5:1** (AAA)
- Light: `#086148` on `#fbfaf6` = **7.1:1** (AAA)

**SECONDARY hairline border** `color-mix(in srgb, var(--dim) 70%, var(--ground))`:

- Dark ≈ **4.1:1** vs ground (>= 3:1)
- Light ≈ **3.7:1** vs ground (>= 3:1)
- Old-browser fallback (no color-mix): lightningcss emits `var(--dim)` (the full
  dim, 7.5/7.9:1). Safe, just a touch louder. The hover-background wash was
  dropped precisely because its color-mix fallback collapsed to full accent
  (accent-on-accent) in pre-2023 browsers; hover feedback is carried by the
  text + border accent shift instead, which needs no fallback.

## Files touched (all in the worktree)

- `src/styles/terminal.css`: rewrote the `.cbtn` base (was the bracket-fill
  grammar) into the real secondary button; added `.contact-send` primary;
  simplified the now-redundant `.chatcmds .cbtn` and `.contact-cancel/-edit`
  override blocks (base handles them); bumped `.keybar` / `.contact-actions` /
  `.contact-edits` gaps to 8px. The shared `.br` color rule (line ~46) was
  LEFT ALONE: it still serves the out-of-scope bracket surfaces (homechips,
  anavchips).
- `src/scripts/terminal.ts`: `mkContactBtn()` no longer emits the two `.br`
  bracket spans; it appends just the `.lbl` label span. `data-contact`,
  `data-field`, `aria-label`, the `cbtn contact-${action}` class, and the click
  routing are byte-identical.
- `src/pages/chat.astro`, `src/pages/contact.astro`: the keybar clear button
  lost its two `.br` bracket spans; `data-cmd="clear"` and the `.lbl` label
  unchanged.
- `src/pages/styleguide.astro`: added a "chat controls" specimen (inert,
  aria-hidden) showing the new primary send + secondary cancel/clear/edit, so
  the styleguide documents the redesign. The existing composer specimens use
  `.btn-send`, which did not change.

## Accessibility note (unchanged behavior)

Accessible names are byte-identical: the contact chips take their name from the
explicit `aria-label` (untouched); the keybar clear takes its name from the
`.lbl` text "clear" (untouched). The brackets were always `aria-hidden`
decoration, so removing them changes nothing a screen reader hears. Keyboard
focusability, the delegated click routing (`data-cmd` / `data-contact` /
`data-field`), and the polite announcer are all untouched.

## Verification done

- `npm run build` (astro check + build): **green**, 12 pages.
- Em/en-dash scan on all five touched files: **clean**.
- Built dist grep: **no bracket spans** left inside the restyled controls
  (keybar server-rendered clean; the JS builder emits no `[`/`]` textContent).
- Built JS grep: `dataset.contact`, `className=\`cbtn contact-${e}\``, and the
  `contact-cancel/-edit` routing classes **preserved unchanged**.
- Built CSS grep: the primary `.contact-send` fill, the secondary hairline +
  its safe `var(--dim)` fallback, and the 8px radius / 44px target all present.

## Human eyeball checklist (static screenshots were not available to me)

Look at both themes (system pref + the session toggle) at desktop and 390px:

1. `.btn-send` in all three placements: interior-page header jump-to-chat bar,
   homepage flow bar, /chat docked composer. (Unchanged, but confirm it still
   reads as one family with the new chips.)
2. /chat: the keybar **clear** at the panel footer, right-aligned, reads as a
   quiet secondary button, not a primary.
3. /contact and in-chat contact flow: the lone **cancel** on ask lines; the
   confirm turn's filled **send** + quiet **cancel**; the **edit name / edit
   email / edit message** row. Send should be the only loud control; cancel and
   the edits clearly subordinate.
4. Keyboard-tab each control: the 2px accent focus-visible ring shows.
5. 390px: the chip rows wrap cleanly with the 8px gap, no overflow, 44px targets.
6. Reduced motion: hover/focus color + glow snap instantly (global switch).
7. Styleguide "chat controls" specimen matches the live surfaces in both themes.

## Flags / open questions for Brian

- **Site-wide debracketing is a SEPARATE decision.** This round debracketed
  ONLY the chat controls (send/cancel/edit/clear). The bracket grammar still
  lives on: homepage `[home]/[log]` homechips, article `.anavtop` nav chips,
  and the styleguide non-chat bracket specimens. If Brian wants the brackets
  gone everywhere, that is its own sweep with its own review. **Recommend
  deciding this before it drifts** (mixed bracket/no-bracket is a coherence
  risk).
- **Secondary buttons are 44px tall; the composer `.btn-send` is 34px.** They
  sit in different zones (chips in the flow, composer send in the input row), so
  the mismatch is not adjacent. Kept 44px on the chips to honor the touch-target
  rule and preserve the old `.cbtn` height. Flag if Brian wants them unified to
  one height (would mean either expanding the composer send hit area or shrinking
  the chips with a pseudo-element hit expansion).
- Dropped the faint accent hover-wash (old-browser fallback was unsafe); hover
  is carried by text + border accent. If Brian wants a resting or hover fill on
  the secondaries, it can be added with a theme-scoped solid token (no color-mix
  fallback trap).
