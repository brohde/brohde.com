/**
 * Typing + motion helpers for the terminal controller (Stage 1 extraction, the
 * self-contained leaf). Reduced-motion detection, the composer's auto-grow
 * fallback, and the humanized keystroke emulation (Phase B item 4). Zero shared
 * state and zero imports from the rest of the controller, so this is the
 * cleanest module boundary in the file. Every timing literal is carried
 * verbatim from terminal.ts: nothing here changed but its location.
 */

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Composer multi-line auto-grow (composer phase A item 2). The one .hchat
   control is a TEXTAREA now: it rests at one line and grows with content to a
   ~6-line cap, then scrolls internally. CSS `field-sizing: content` drives the
   growth where supported; this scrollHeight fallback covers the rest (reset to
   auto, then grow to the content height, capped at the CSS max-height). The
   growth is a synchronous reflow, never an animation, so reduced motion needs
   no special case. */
const FIELD_SIZING =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("field-sizing", "content");
const GROW_CAP = 160; // matches .hchat textarea max-height
export function autoGrow(el: HTMLTextAreaElement) {
  if (FIELD_SIZING) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, GROW_CAP) + "px";
}

/* Typing humanization (Phase B item 4). The emulation jitters each keystroke,
   pauses longer after spaces and punctuation, and occasionally hesitates, so it
   reads like a person typing rather than a metronome. The base was lowered again
   (20 to 14) with the contact-flow speed pass so the entry emulation lands
   faster while keeping the human cadence. `prev` is the character just typed. */
const TYPE_BASE = 14; // humanized per-character base (jittered + bonused below)
const TYPE_SETTLE_MS = 120; // beat after the last keystroke before the emulated
// send fires (shortened with the contact-flow speed pass so it resolves faster)

/* Typing humanization (item 4). Each keystroke gets its own jittered delay, a
   longer pause after a space (a word boundary), a longer one still after
   punctuation, and an occasional micro-hesitation. Centered a hair below the old
   flat 35ms so those bonuses keep the total within about 20% of the flat
   duration. `prev` is the character just typed (the pause happens after it). */
function humanDelay(prev: string | undefined): number {
  let d = TYPE_BASE * (0.7 + Math.random() * 0.6); // jitter 0.7x..1.3x
  if (prev === " ") d += 45 + Math.random() * 40; // longer after a word
  else if (prev && /[.,!?;:]/.test(prev)) d += 70 + Math.random() * 60; // after punctuation
  if (Math.random() < 0.05) d += 90 + Math.random() * 110; // occasional hesitation
  return d;
}

/* Type `text` into the composer character by character on the humanized clock,
   then run `done` after a short beat. Applies to all emulated typing. */
export function typeInto(
  input: HTMLTextAreaElement,
  text: string,
  done: () => void
) {
  let i = 0;
  const step = () => {
    i += 1;
    input.value = text.slice(0, i);
    autoGrow(input); // keep the fallback height in step with the typed value
    if (i < text.length) window.setTimeout(step, humanDelay(text[i - 1]));
    else window.setTimeout(done, TYPE_SETTLE_MS); // a beat, then submit
  };
  window.setTimeout(step, humanDelay(undefined));
}
