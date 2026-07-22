/**
 * Accessibility layer for the terminal controller (Stage 1 extraction): the
 * polite live-region announcer + transient hint line, and the roving page
 * cursor (#63). Its only state (the announcer node, the hint timer, the
 * once-per-load rove hint flag) is self-contained and exposed through
 * accessors where terminal.ts still needs it. announce() moves here because
 * this module owns the announcer, and the render paths that stay in terminal.ts
 * import it back. Only dependency: byId, from ./dom. Behavior byte-identical.
 */
import { byId } from "./dom";

let announcer: HTMLElement | null = null;
export function announce(msg: string) {
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.className = "sr";
    announcer.setAttribute("aria-live", "polite");
    document.body.appendChild(announcer);
  }
  announcer.textContent = msg;
}

let hintTimer = 0;
export function hint(msg: string) {
  announce(msg);
  const el = byId("hint-top");
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => {
    el.style.opacity = "0";
    hintTimer = window.setTimeout(() => {
      el.textContent = "";
      el.style.opacity = "1";
    }, 350);
  }, 2600);
}

/* ------------------------------------------------- roving cursor (#63) ---- */
/* One page cursor: the block caret rests on the wordmark; Tab reaches the
 * cursor group (a single tab stop) and the prompt; arrow keys walk every
 * interactive element (links, commands, log entries) terminal-style. The
 * highlight is the element's :focus-visible treatment, so it is always
 * visible and screen-reader semantics stay native (roles untouched;
 * tabindex=-1 keeps elements in the accessibility tree). Arrows are handled
 * only while focus is already ON a cursor element, so page scrolling is
 * never hijacked while the cursor is inactive or focus sits in an input.
 */
const ROVE_SELECTOR = "a[href], button[data-cmd]";
let roveHinted = false;

/* the once-per-load "arrows move the cursor" hint fires from the focusin
   handler in terminal.ts, so the flag is read and set through accessors
   rather than an exported `let`. */
export function getRoveHinted(): boolean {
  return roveHinted;
}
export function setRoveHinted(v: boolean): void {
  roveHinted = v;
}

export function roveEls(): HTMLElement[] {
  const screen = document.querySelector("[data-screen]");
  if (!screen) return [];
  return Array.from(screen.querySelectorAll<HTMLElement>(ROVE_SELECTOR));
}

export function isRove(el: HTMLElement | null): el is HTMLElement {
  return (
    !!el && !!el.matches?.(ROVE_SELECTOR) && !!el.closest?.("[data-screen]")
  );
}

/** roving tabindex: exactly one element in the group is the tab stop */
export function setRoveStop(target: HTMLElement, els?: HTMLElement[]) {
  for (const el of els ?? roveEls()) {
    el.tabIndex = el === target ? 0 : -1;
  }
}

export function moveRove(from: HTMLElement, dir: 1 | -1) {
  const els = roveEls();
  if (!els.length) return;
  const i = els.indexOf(from);
  const next = i === -1 ? els[0] : els[(i + dir + els.length) % els.length];
  setRoveStop(next, els);
  next.focus();
}

export function moveRoveEnd(last: boolean) {
  const els = roveEls();
  if (!els.length) return;
  const next = els[last ? els.length - 1 : 0];
  setRoveStop(next, els);
  next.focus();
}
