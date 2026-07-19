# Handoff: composer redesign Phase A (#181/#182/#185)

_Written by the LEAD from the diff: the second Phase A Opus engineer was killed at ~280K tokens (over cap, caught by Brian's question and the lead's transcript usage probe) after finishing implementation and the build, before the browser round and this handoff. Work sits uncommitted; a fresh Sonnet validator runs the browser round; the lead commits after it passes._

## What landed (8 files, ~451 insertions)

1. ChatBar.astro: the input is a recessed field well (well ground, hairline border, 10px radius, accent on focus-within) and a TEXTAREA resting at one line, growing to a 160px cap (about 6 lines) then scrolling; field-sizing: content where supported, scrollHeight fallback in terminal.ts. Circular Book 16px face. "$" sigil gone. Per-instance placeholder prop: header + homepage "Ask Brian's AI anything", /chat default "Ask a question, or type help". [send] is a filled accent button, no brackets (btn-send).
2. terminal.ts: Enter sends via requestSubmit (IME-safe, Shift+Enter = newline), autoGrow fallback wired to input/submit/emulation paths, echo drops the "$ " prefix and preserves newlines (uline pre-wrap), greeting says "Brian's AI", HTMLInputElement annotations widened.
3. terminal.css: .hchat well material; .hchat:not(.chatcomposer) pins the always-night token set for header + homepage; the /chat composer inherits panel tokens. btn-send with per-scope glow (--send-glow). [clear] moved to a panel FOOTER (bottom, right aligned, hairline top) as a quiet dim-to-accent control, fill-on-hover removed for it; .slab-chat is a flex column so the footer seats at the bottom edge. DAYLIGHT PANEL: light theme flips the /chat panel to warm paper (#fbfaf6 ground, light palette ink, no scanlines, golden-hour wash + warm shadow), triple-keyed (media + both data-theme overrides) so the toggle wins both directions; article pre excerpts stay night. Conversation set in Circular (question Medium bright, reply Book on the rail); code inside replies stays mono.
4. chat.astro: keybar moved below the transcript as the footer. index.astro: homepage placeholder. global.css: --warn attention token both palettes (night #e0a94b, light #b3791f) + utility mapping, for Phase B's invalid-email state. styleguide.astro: specimens updated (well + textarea + btn-send + warn swatch).

## Verified

- Lead static checks on a fresh build: build green, per-surface placeholders in dist, "Brian's AI" in the bundle, no "$" sigil, textareas present, warn token in the styleguide, zero dashes in the diff.
- Browser round: delegated to a fresh Sonnet validator (report follows in COMMS/DECISIONS).

## Flags

- maxlength stays 240 on the textarea; Phase B must raise it for contact messages (its own endpoint cap too).
- The daylight panel media-query branch is dormant belt-and-braces (data-theme is always stamped since item 8 of #177); kept for robustness.
- Phase B seams ready: --warn token, textarea, per-instance placeholders, [clear] footer.
