# Phase 4 handoff: header identity + joined chat object + aliveness

_Written by the LEAD, reconstructed from the branch diff: the Opus engineer was stopped by Brian at ~300K tokens after committing all three phases but before writing this doc (the wrap-up-order-to-an-over-cap-agent mistake is logged in the lead's memory; the committed work was complete and clean). Branch `worktree-agent-ab2822e75eec67dca`, three commits: fbc2a00 (4A), 30fc7af (4B markup), 64a1d81 (4C engine + styles). Merged to main by the lead; validation ran AFTER merge via a fresh Sonnet round (the engineer's own round was skipped by the wrap-up order). Governing order: decision #171 with its riders (mobile type reduction; Beyond at 13.5px)._

## What shipped

**4A, the header becomes the homepage identity (fbc2a00):**
- The reading-column masthead h1 is GONE from HomeIntro; on / the global header wordmark renders large and is the page h1 (p elsewhere, the one-visual-two-roles pattern in SiteHeader).
- Scale: `.shead[data-screen="home"] .wm` at clamp(34px, 7.5vw, 50px) / 1.05 / -0.03em; caret proportional; html.cfocus yield unchanged.
- Nav links share the name's line, baseline-aligned (align-items: baseline on .idrow for home).
- Brian rider: below 400px the wordmark steps to clamp(24px, 8.6vw, 34px) so name + links hold ONE line to 320px. Veto knobs: 24px floor, 400px start.
- Spacing (Brian, exact): 42px above the flow chat bar (.flowchat margin), 42px total below it to the first ledger title with the hint line inside that gap.
- Beyond rider: the "Beyond" dimlink now nests inside the .cnote span, inheriting 13.5px; quiet dim + underline treatment unchanged.

**4B, /chat is one joined object (30fc7af + 64a1d81 styles):**
- The composer left the header: /chat stamps data-hchat="off" and gets the standard interior header (no sticky, no page-ground band, no z-index case).
- The ChatBar input docks into the phosphor panel as its top edge: one night-material object, no seam, panel border + radius wrap both.
- Pinned input: position sticky top 0 within the panel; while stuck it keeps the panel ground within the panel's side borders and gains a bottom hairline (scroll-state driven).
- Panel min-height: calc(100dvh - 120px) (the 120px covers header chrome + the breathing gap; the rendered bottom gap is the veto knob). Long threads grow the panel and the page scrolls; no internal scroll region.
- Keybar: [help] removed (typed help still works), [clear] right-aligned, the only chip.
- Clear: no "# Cleared" note; storage wiped; pristine first-visit state returns (intro lines visible); input refocused (Brian rider); reload stays pristine.

**4C, the machine feels alive (64a1d81):**
- Uniform thinking: PULSE_MS = 450 before deterministic in-place responses; LLM sends keep the real indicator; navigation commands and clicked links stay instant.
- Send motion: echo lifts from the input into the new top turn, reply settles beneath, transform + opacity on the house grammar, reduced-motion collapses it.
- Contact emulation: the contact nav item lands on /chat and types "How do I contact Brian?" at TYPE_MS = 35 per character, auto-submits, pulses, renders the deterministic contact answer; in place when already on /chat; instant under reduced motion.

## Veto knobs for Brian

1. Mobile wordmark floor 24px, reduction starting at 400px.
2. The 42px spacing pair (his own 1.5x order, listed for completeness).
3. Panel bottom gap (the 120px calc constant).
4. PULSE_MS 450 and TYPE_MS 35.
5. [clear] placement (right-aligned in the keybar row inside the panel).
6. Baseline alignment of nav links against the large name (any optical correction is in .idrow's home rule).

## Validation

- Lead structural checks on the merged dist: data-hchat off on /chat, slab-chat panel present, [help] gone / [clear] present, no .masthead on /, header h1 wmrow, flowchat present, emulation string in the bundle, zero "# Cleared" strings, build green, zero dashes added by the branch.
- Fresh Sonnet browser round on the merged dist (13 checks: identity, mobile reduction, spacing, joined object, pinned input, panel height, keybar, clear + refocus, pulse, send motion, contact emulation, regressions, console/CLS): results recorded in STATUS and the comms log at merge time.
- Human close-out class (#124): real phone keyboard with the pinned input, reduced-motion glance, the typing emulation feel at real speed.
