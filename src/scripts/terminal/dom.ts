/**
 * Chat-log DOM core for the terminal controller (Stage 1 extraction). The
 * primitives every render path goes through: element lookup, the current
 * screen, the chat log node, the newest-turn scroll, and the turn sink. It also
 * owns the two pieces of turn state (the active turn node and the replay flag),
 * exposed through accessors rather than exported `let` bindings so no other
 * module can silently fork them. Self-contained: it imports nothing from the
 * rest of the controller, and the feature layers that stay in terminal.ts
 * import from here. Behavior is byte-identical to the pre-split module.
 */

export const byId = (id: string) => document.getElementById(id);

/* The page's OWN section (.screen) is the source of truth for the current
   screen and its scene identity. The global header ALSO carries data-screen
   since Phase 4 (it drives the large home wordmark + the /chat state) and it
   renders BEFORE the section in BaseLayout, so a bare "[data-screen]" query
   returns the persisted HEADER, whose value is "page" for every interior page
   and which carries no data-scene-theme. Targeting .screen reads the real page
   (the fix for the scene identity-travel bug: the theme stamp is read off this
   fresh section by the #150 bridge below, never off the header). */
export function currentScreen(): string {
  return document.querySelector(".screen")?.getAttribute("data-screen") ?? "";
}

export function chatlog(): HTMLElement | null {
  return byId("chatlog");
}

/* Newest-at-top transcript (#153, chat-top-spec Q1). The composer is the
   strip docked sticky at the top of the /chat panel, so each user turn PREPENDS a
   .turn block to the log: DOM order equals visual order equals newest first
   (never column-reverse, which would split the two and invert within-turn
   order). Within a turn the flow stays natural: echoed question, thinking,
   reply, redirect line. The server-rendered intro .cmt lines sink to the
   bottom as the oldest content. beginTurn runs once per user turn (askLive,
   toConsole's run closure); every line builder appends through sink(), so
   output lands in the active turn, or falls back to the log for a stale turn
   left detached by a navigation. */
let activeTurn: HTMLElement | null = null;
/* Phase 4C send motion: live turns get the .turn-in entrance (echo lift +
   reply settle in CSS); turns rebuilt from the stored transcript render
   settled. rehydrateChat sets this around its replay. */
let replaying = false;

/* turn state accessors: the two mutable bindings above are read and written
   from several call sites (beginTurn/sink here, plus clearChat, dropThread,
   and rehydrateChat in terminal.ts), so they are exposed as functions rather
   than exported `let` to keep a single source of truth across the split. */
export function setActiveTurn(t: HTMLElement | null): void {
  activeTurn = t;
}
export function setReplaying(v: boolean): void {
  replaying = v;
}

export function beginTurn(): HTMLElement | null {
  const log = chatlog();
  if (!log) return null;
  removeGreeting(); // the first real turn replaces the pristine greeting
  const t = document.createElement("div");
  t.className = replaying ? "turn" : "turn turn-in";
  log.prepend(t);
  activeTurn = t;
  return t;
}

export function sink(): HTMLElement | null {
  if (activeTurn?.isConnected) return activeTurn;
  return chatlog();
}

/* Remove the pristine greeting node from the log. A log-core operation (it
   only touches the log DOM); showGreeting, which builds the greeting text,
   stays with the greeting empty-state section in terminal.ts. */
export function removeGreeting() {
  chatlog()?.querySelector(".greeting")?.remove();
}

/* The composer sits at the top, the newest turn directly beneath it: after a
   send the only scroll that can be needed is back UP to the newest turn, and
   it is instant (no smooth behavior), so it is reduced-motion-safe by
   construction. */
export function scrollToNewest() {
  if (currentScreen() !== "chat") return;
  // Caret-at-top fix: only pull the page to the very top when the composer has
  // actually scrolled ABOVE the viewport (its sticky rest is now inset by
  // --chat-pin-gap, so a rect.top below 0 means the composer, and the newest
  // turn directly beneath it, are out of view up top). When the composer is
  // already onscreen (its common state, natural or stuck at the gap) a new turn
  // blooms right under it, so no scroll is needed: the caret keeps its resting
  // gap below the panel border instead of jamming against the top. CLS 0: this
  // only ever scrolls, it never changes layout.
  const composer = document.querySelector<HTMLElement>(
    ".slab-chat > .chatcomposer"
  );
  if (composer && composer.getBoundingClientRect().top < 0) {
    window.scrollTo({ top: 0 });
  }
}
