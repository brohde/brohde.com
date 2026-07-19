/**
 * Terminal controller for brohde.com.
 *
 * One bundled module drives every interactive terminal behavior:
 *   - deterministic command router (work/about/contact/help/home/clear
 *     + /slash aliases + free-form -> live chat), ported from build-log-v3.html
 *   - the roving page cursor (#63)
 *   - the redirect countdown for model-chosen navigation (#143), the /chat
 *     conversation persistence via sessionStorage (#144), and the header
 *     chat-input dedup on pages that carry their own input (#145)
 *   - Phase 4: the docked /chat composer's pinned-stuck detection (4B), the
 *     uniform thinking pulse before deterministic responses + the send motion
 *     for new turns (4C), and contact as a typed LLM moment (4C)
 *
 * Command autocomplete (#48) and prompt history recall (#44) RETIRED with
 * the homepage slab (#160): they were gated to the slab's .prompt input,
 * which no longer exists anywhere. Every remaining input is the one .hchat
 * material (the header row + the homepage flow bar), which submits through
 * the delegated form handler. Revival path if wanted: chat-top-spec.md
 * Phase B (parity on the .hchat inputs); the machinery is in git history.
 *
 * Page transitions (#150, "the tide carries you"): this module does NOT drive
 * them. The one persistent scene ([transition:persist]) keeps drifting through
 * every navigation, the reading column cross-fade + lift lives entirely in
 * CSS (the main view-transition group in global.css), and identity travel
 * rides the scene bridge below (syncSceneState). The old opaque 140ms wipe
 * cover is retired; nothing may cover the scene during a navigation.
 *
 * View-Transitions safety (E5): all listeners are delegated on `document` and
 * attached exactly once; nothing is bound to a specific node at module scope.
 * Per-page setup runs from `astro:page-load`, which fires on the initial load
 * and after every client-side navigation. Programmatic navigation uses the VT
 * `navigate()` so the terminal keeps its instant, no-flash feel.
 *
 * Accessibility (#28): the prompt is an ARIA combobox; suggestions are a
 * listbox with aria-activedescendant; focus is never trapped; arrow keys act
 * only while a prompt input is focused, so page scrolling is never hijacked.
 */
import { navigate } from "astro:transitions/client";

/* Copy case (#76): human-language strings use sentence case; lowercase is
   reserved for literal terminal tokens (typed commands, file-ish names like
   build.log, URLs and emails). */
/* static console strings (innerHTML sinks below take only these) */
const HELP_HTML =
  "Commands\n" +
  "  hello     A quick tour\n" +
  "  work      Browse the log\n" +
  "  about     Who I am\n" +
  "  contact   Email + LinkedIn\n" +
  "  chat      Ask me anything\n" +
  "  home      Back to the log\n" +
  "  clear     Wipe this chat\n" +
  "  help      This list\n" +
  '<span class="c"># Anything else goes to the chat</span>';

/* hello: a short natural-language tour of the core pages (Brian's ask,
   2026-07-15; capitalized page-name links per #76). Links are underlined,
   keyboard reachable, and join the roving cursor order like any other chat
   output. */
const HELLO_HTML =
  "Hello! Here's what's on the site:\n" +
  '<a href="/">Work</a>: the log, case studies of what I ship\n' +
  '<a href="/about">About</a>: who I am in four paragraphs\n' +
  '<a href="/chat">Chat</a>: ask me anything\n' +
  '<a href="mailto:brian@brohde.com">Contact</a>: start a conversation';

const CONTACT_HTML =
  'Email     <a href="mailto:brian@brohde.com">brian@brohde.com</a>\n' +
  'LinkedIn  <a href="https://www.linkedin.com/in/brian-rohde-4ba3558/" target="_blank" rel="noopener">/in/brian-rohde-4ba3558</a>\n' +
  'X         <a href="https://x.com/brianxbuilds" target="_blank" rel="noopener">@brianxbuilds</a>';

/* shown only when the chat backend is unreachable at the network level
   (server-sent errors render their own body verbatim) */
const OFFLINE_HTML =
  "The chat is offline right now.\n" +
  '<span class="c"># Email <a href="mailto:brian@brohde.com">brian@brohde.com</a> and ask him directly.</span>';

/* ---------------------------------------------------------------- state ---- */

let pendingAfter: (() => void) | null = null;
let pendingFocus: string | null = null;
/* Phase 4C: pendingAfter can carry a scripted CONTACT EMULATION (type the
   question, then run the deterministic contact turn) rather than a plain
   send; the flag lets initPage tell them apart. */
let pendingEmulate = false;

/* the /chat composer's input id (docked in the panel, Phase 4B): pendingFocus
   targets it after a navigation lands on /chat, and it is the redirect
   countdown's focus fallback. The header input (#in-site) is the composer
   only on interior pages now (a jump-to-chat affordance), never targeted
   here. */
const CHAT_INPUT = "in-chat";

/* Phase 4C motion timings (Brian veto knobs). */
const PULSE_MS = 450; // brief thinking pulse before a deterministic response
const TYPE_MS = 35; // per-character speed of the contact typing emulation
const CONTACT_Q = "How do I contact Brian?"; // the emulated contact question

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* -------------------------------------------------- redirect countdown ---- */
/* #143: when the model answers a QUESTION by choosing an open_page
   navigation, we do not redirect instantly. The reply flow announces it in
   the house voice ("Let me take you to the about page.") with a REAL inline
   link, then a cancellable countdown. Cancel three ways: Escape, the visible
   stay control, or simply starting to type the next message. Explicit
   "open X"-style asks and in-place slugs skip the countdown (redirectDest /
   isExplicitNav). */
const REDIRECT_SECONDS = 5; // Generous enough that a keyboard or switch user
// can reach a cancel path before it fires. The three cancel mechanisms also
// satisfy WCAG 2.2.1 by letting the visitor turn the limit off entirely.
// Brian can shorten this in one place.
let redirect: {
  timer: number;
  tail: HTMLElement; // the countdown + stay control, removed on cancel
  input: HTMLTextAreaElement | null; // where focus returns after a click-cancel
} | null = null;

/* --------------------------------------------- conversation persistence --- */
/* #144: the /chat thread survives same-tab navigation, Back, and a full
   refresh. The display transcript AND the model-facing history serialize to
   sessionStorage: per-tab, cleared on tab close, and NOT localStorage, so a
   genuinely fresh tab always starts pristine. `transcript` is authoritative
   within a live tab (module state outlives client-side navigations);
   sessionStorage is the backup that survives a full reload. */
type Entry =
  | { t: "echo"; s: string }
  | { t: "reply"; s: string }
  | { t: "out"; s: string }
  | { t: "cmt"; c: string; s: string }
  | { t: "redirect"; href: string; name: string };
const transcript: Entry[] = [];
const STORE_KEY = "brohde.chat.v1";
const MAX_ENTRIES = 60; // display lines kept (~30 exchanges)
const MAX_LLM = 12; // model-history entries stored; the send slices to 8, so a
// rehydrated history is never larger than a live session would already send.

/* --------------------------------------------------------------- helpers --- */

const byId = (id: string) => document.getElementById(id);

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
function autoGrow(el: HTMLTextAreaElement) {
  if (FIELD_SIZING) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, GROW_CAP) + "px";
}

/* The page's OWN section (.screen) is the source of truth for the current
   screen and its scene identity. The global header ALSO carries data-screen
   since Phase 4 (it drives the large home wordmark + the /chat state) and it
   renders BEFORE the section in BaseLayout, so a bare "[data-screen]" query
   returns the persisted HEADER, whose value is "page" for every interior page
   and which carries no data-scene-theme. Targeting .screen reads the real page
   (the fix for the scene identity-travel bug: the theme stamp is read off this
   fresh section by the #150 bridge below, never off the header). */
function currentScreen(): string {
  return document.querySelector(".screen")?.getAttribute("data-screen") ?? "";
}

/* Header per-page state on the persisted node (#145/#150, amended by Phase 4).
   The header hides its chat input row on the pages that carry their own chat
   input: the homepage (flow chat bar) and /chat (Phase 4B: the composer is
   docked into the panel, so the header row is dropped there too). Interior
   pages keep the header input as a jump-to-chat affordance. data-screen drives
   the homepage's large wordmark identity (Phase 4A) and nothing sticky on
   /chat anymore (Phase 4B: /chat is the standard interior header). SiteHeader
   server-renders the correct state per page; we re-stamp it during the swap
   because the header is a persisted node that would otherwise carry a stale
   state. Stamped before paint (astro:after-swap) so nothing shifts layout
   after the page is visible: zero CLS. */
function syncHeaderChat() {
  const header = document.querySelector<HTMLElement>(".shead");
  if (!header) return;
  const p = location.pathname.replace(/\/+$/, "") || "/";
  const onHome = p === "/";
  const onChat = p === "/chat";
  header.dataset.hchat = onHome || onChat ? "off" : "on";
  header.dataset.screen = onChat ? "chat" : onHome ? "home" : "page";
  // Phase 4A: the wordmark is the homepage's h1 and a <p> everywhere else.
  // The header is a persisted node, so the server tag can be a page behind
  // after a client-side navigation; correct it here, before paint (zero CLS:
  // h1 and p share identical .wmrow styling). Move the <a class="wm"> intact
  // into the new wrapper so the caret element itself is never rebuilt.
  const row = header.querySelector<HTMLElement>(".wmrow");
  const wantTag = onHome ? "H1" : "P";
  if (row && row.tagName !== wantTag) {
    const el = document.createElement(wantTag.toLowerCase());
    el.className = row.className;
    while (row.firstChild) el.appendChild(row.firstChild);
    row.replaceWith(el);
  }
  // The /chat composer (#in-chat) carries aria-controls="chatlog" straight
  // from chat.astro (both server-rendered on the same page), so nothing is
  // wired here; the header input (#in-site) is no longer the /chat composer.
}

let announcer: HTMLElement | null = null;
function announce(msg: string) {
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.className = "sr";
    announcer.setAttribute("aria-live", "polite");
    document.body.appendChild(announcer);
  }
  announcer.textContent = msg;
}

let hintTimer = 0;
function hint(msg: string) {
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

/* ------------------------------------------ route transitions (#150) ------ */
/* Nothing to do in script. The tide carries you: the persistent scene is
 * never covered, the reading column cross-fade + lift is the CSS-driven
 * main view-transition group (global.css), and the identity travel is the
 * scene bridge at the bottom of this file. The old wipe cover (#64) and its
 * loader hold are retired; navigations resolve as fast as the router can
 * swap. Reduced motion collapses the column move to an instant swap through
 * the explicit view-transition override in global.css. */

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

function roveEls(): HTMLElement[] {
  const screen = document.querySelector("[data-screen]");
  if (!screen) return [];
  return Array.from(screen.querySelectorAll<HTMLElement>(ROVE_SELECTOR));
}

function isRove(el: HTMLElement | null): el is HTMLElement {
  return (
    !!el && !!el.matches?.(ROVE_SELECTOR) && !!el.closest?.("[data-screen]")
  );
}

/** roving tabindex: exactly one element in the group is the tab stop */
function setRoveStop(target: HTMLElement, els?: HTMLElement[]) {
  for (const el of els ?? roveEls()) {
    el.tabIndex = el === target ? 0 : -1;
  }
}

function moveRove(from: HTMLElement, dir: 1 | -1) {
  const els = roveEls();
  if (!els.length) return;
  const i = els.indexOf(from);
  const next = i === -1 ? els[0] : els[(i + dir + els.length) % els.length];
  setRoveStop(next, els);
  next.focus();
}

function moveRoveEnd(last: boolean) {
  const els = roveEls();
  if (!els.length) return;
  const next = els[last ? els.length - 1 : 0];
  setRoveStop(next, els);
  next.focus();
}

/* ------------------------------------------------------------ chat output -- */

function chatlog(): HTMLElement | null {
  return byId("chatlog");
}

/* Newest-at-top transcript (#153, chat-top-spec Q1). The composer is the
   sticky header input at the top of /chat, so each user turn PREPENDS a
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

function beginTurn(): HTMLElement | null {
  const log = chatlog();
  if (!log) return null;
  removeGreeting(); // the first real turn replaces the pristine greeting
  const t = document.createElement("div");
  t.className = replaying ? "turn" : "turn turn-in";
  log.prepend(t);
  activeTurn = t;
  return t;
}

function sink(): HTMLElement | null {
  if (activeTurn?.isConnected) return activeTurn;
  return chatlog();
}

/* The composer sits at the top, the newest turn directly beneath it: after a
   send the only scroll that can be needed is back UP to the newest turn, and
   it is instant (no smooth behavior), so it is reduced-motion-safe by
   construction. */
function scrollToNewest() {
  if (currentScreen() === "chat") {
    window.scrollTo({ top: 0 });
  }
}

/* The `replay` flag (#144) means "this line is being rebuilt from the stored
   transcript on a /chat rehydrate": build the DOM, but do not re-record it,
   do not re-announce it, and do not scroll per line (rehydrate scrolls once
   at the end). Live calls omit it and therefore record + announce as before. */
function line(cls: string, text?: string, replay = false) {
  const host = sink();
  if (!host) return;
  const d = document.createElement("div");
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  host.appendChild(d);
  if (!replay) {
    record({ t: "cmt", c: cls, s: text ?? "" });
    scrollToNewest();
  }
}

function echo(t: string, replay = false) {
  const host = sink();
  if (!host) return;
  const d = document.createElement("div");
  d.className = "uline";
  // Composer phase A: the "$" sigil is dropped from the echoed question too
  // (item 1/4). The line is the visitor's own words in the editorial voice
  // (Circular Medium), not a machine prompt. textContent preserves the newlines
  // a multi-line send carries; .uline renders them (white-space: pre-wrap).
  d.textContent = t;
  host.appendChild(d);
  if (!replay) {
    record({ t: "echo", s: t });
    scrollToNewest();
  }
}

function out(html: string, slot?: HTMLElement | null, replay = false) {
  const host = sink();
  if (!host) return;
  // given a slot (the in-flight thinking line, #116), reuse its position so
  // the output lands where the visitor is already looking
  const d = slot?.isConnected ? slot : document.createElement("div");
  d.className = "out";
  d.innerHTML = html; // static strings only, never user input
  if (!d.parentElement) host.appendChild(d);
  if (!replay) {
    record({ t: "out", s: html });
    announce(d.textContent ?? "");
    scrollToNewest();
  }
}

function clearChat() {
  const log = chatlog();
  if (!log) return;
  // Phase 4B: clear returns the panel to its PRISTINE first-visit state, with
  // NO "# Cleared" note. Drop every conversation turn, then bring back the
  // greeting empty state, so a cleared /chat looks exactly like arriving
  // fresh. Every user turn begins with beginTurn, so the only direct log
  // children are the .turn blocks (the "#" intro lines retired); removing the
  // turns leaves the panel empty for the greeting.
  for (const t of log.querySelectorAll(":scope > .turn")) t.remove();
  activeTurn = null;
  llmHistory.length = 0; // clear wipes the model's context too
  purgeChat(); // #144: and the persisted session, so a cleared chat stays cleared
  showGreeting(); // the panel is pristine again: re-show the time-of-day greeting
  scrollToNewest(); // bring the pristine panel back to the top
  byId("in-chat")?.focus({ preventScroll: true }); // Brian's rider: refocus the input
}

/* ------------------------------------------------ greeting empty state ---- */
/* The "#" intro lines retired: when /chat is pristine (no thread, and NOT
   arriving with a pending question from the homepage flow bar) a static
   assistant-styled greeting stands in, chosen by LOCAL time of day, no API
   call. initPage injects it only AFTER rehydrate has confirmed an empty
   transcript, so it can never flash before a restored or pending thread
   renders; beginTurn drops it on the first real turn, and clear brings it
   back when the panel returns to pristine. */
function greetingText(): string {
  const h = new Date().getHours();
  // morning 5:00-11:59, afternoon 12:00-16:59, evening 17:00-4:59
  const part =
    h >= 5 && h < 12
      ? "Good morning!"
      : h >= 12 && h < 17
        ? "Good afternoon!"
        : "Good evening!";
  return `${part} I'm Brian's AI. Ask me anything about his work and I'll do my best to answer.`;
}

function showGreeting() {
  const log = chatlog();
  if (!log || log.querySelector(".greeting")) return; // idempotent
  const d = document.createElement("div");
  d.className = "reply greeting"; // styled like an assistant reply
  d.textContent = greetingText();
  log.appendChild(d);
}

function removeGreeting() {
  chatlog()?.querySelector(".greeting")?.remove();
}

/* -------------------------------------------- persistence + rehydrate ----- */
/* #144. Save on every recorded line; rehydrate the /chat page from module
   memory first (a live tab) or sessionStorage (a cold load / refresh). */

function saveChat() {
  try {
    if (transcript.length > MAX_ENTRIES) {
      transcript.splice(0, transcript.length - MAX_ENTRIES);
    }
    const l = llmHistory.slice(-MAX_LLM);
    sessionStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, t: transcript, l }));
  } catch {
    /* private mode / quota: persistence is a nicety, never a hard dependency */
  }
}

function record(e: Entry) {
  transcript.push(e);
  saveChat();
}

function purgeChat() {
  transcript.length = 0;
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
}

/* The /chat thread does NOT survive leaving the page (supersedes #144's
   cross-navigation persistence): navigating AWAY from /chat drops the whole
   thread (module transcript + model history + the persisted session), so
   every fresh arrival at /chat is pristine and shows the greeting. The
   homepage flow-bar handoff is untouched: that carry rides pendingAfter (a
   module closure), not the transcript. While the visitor stays on /chat the
   thread persists in module memory as before. */
function dropThread() {
  purgeChat();
  llmHistory.length = 0;
  activeTurn = null;
}

/* Coerce a stored history into exactly what the hardened server accepts
   (validateHistory, audit H2/M2 on main): {role: user|assistant, content:
   non-empty string <= 2000 chars}, strictly alternating roles. Anything that
   would trip the server's 400 is dropped here, so a rehydrated history can
   never be rejected on the next send. */
function coerceHistory(raw: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { role: "user" | "assistant"; content: string }[] = [];
  let prev: string | null = null;
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const role = (e as { role?: unknown }).role;
    const raw2 = (e as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof raw2 !== "string" || raw2.length === 0) continue;
    if (role === prev) continue; // server requires strict alternation
    const content = raw2.length > 2000 ? raw2.slice(0, 2000) : raw2;
    out.push({ role, content });
    prev = role;
  }
  return out;
}

/* Known-good `out` bodies and redirect destinations: on replay we only trust
   values we ourselves ever produce. A tampered store falls back to inert text
   (out) or a plain label (redirect), never innerHTML or a live href. */
const OUT_ALLOW = new Set([HELP_HTML, HELLO_HTML, CONTACT_HTML, OFFLINE_HTML]);
const REDIRECT_HREFS = new Set(["/about", "/#log"]);

function renderEntry(e: Entry) {
  if (e.t === "echo") echo(e.s, true);
  else if (e.t === "reply") renderReply(e.s, null, true);
  else if (e.t === "out")
    OUT_ALLOW.has(e.s) ? out(e.s, null, true) : line("out", e.s, true);
  else if (e.t === "cmt") line(e.c, e.s, true);
  else if (e.t === "redirect")
    renderRedirect(e.href, e.name, null, false); // settled: link only, no ticker
}

function rehydrateChat() {
  if (currentScreen() !== "chat") return;
  const log = chatlog();
  if (!log) return;
  // module memory wins within a tab (survives client-side navigations); fall
  // back to sessionStorage on a cold load / refresh.
  if (transcript.length === 0) {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(STORE_KEY);
    } catch {
      /* storage blocked: nothing to restore */
    }
    if (raw) {
      try {
        const p = JSON.parse(raw) as { v?: number; t?: unknown; l?: unknown };
        if (p && p.v === 1 && Array.isArray(p.t)) {
          transcript.push(...(p.t as Entry[]));
          llmHistory.length = 0;
          llmHistory.push(...coerceHistory(p.l));
        }
      } catch {
        /* corrupt blob: start pristine */
      }
    }
  }
  if (!transcript.length) return;
  // The "#" intro lines retired: nothing sits below the log to hide before a
  // restore, so the replay builds the thread with nothing moving (CLS 0). The
  // greeting is only ever injected when the transcript is empty, so a restore
  // never has a greeting to shift either.
  // Replay regroups by echo boundaries: a new turn begins at each user
  // message, and beginTurn prepends, so replaying oldest to newest lands the
  // newest turn on top with natural order kept within each turn. Entries
  // before the first echo (rare) fall through sink() to the log itself.
  activeTurn = null;
  replaying = true; // rebuilt turns render settled (no send-motion entrance)
  for (const e of transcript) {
    if (e.t === "echo") beginTurn();
    renderEntry(e);
  }
  replaying = false;
  scrollToNewest();
}

/* ------------------------------------------------------------ navigation -- */

function goHomeThen(after: () => void) {
  if (currentScreen() === "home") {
    after();
  } else {
    pendingAfter = after;
    navigate("/");
  }
}

function scrollToLog() {
  byId("log")?.scrollIntoView({ behavior: "auto", block: "start" });
}

function toConsole(cmd: string, html: string, viaKb: boolean) {
  const run = () => {
    beginTurn(); // one user turn: the echoed command + its output (#153)
    echo(cmd);
    // Phase 4C uniform thinking: a deterministic in-place response shows a
    // brief pulse before it renders (LLM sends keep the real indicator).
    pulseThen((slot) => out(html, slot));
  };
  if (currentScreen() === "chat") {
    run();
  } else {
    pendingAfter = run;
    if (viaKb) pendingFocus = CHAT_INPUT;
    navigate("/chat");
  }
}

/* -------------------------------------------------------- chat bridge ---- */
/* Free-form questions go to the live model. In production/preview that is
 * the Pages Function: POST /api/chat {message (1-500), history (last 8)} ->
 * {text, open_page, usage, cost}; errors are {error} bodies rendered
 * verbatim (400 validation, 429 rate limit, 502/503 upstream, all
 * sentence-cased server-side). On localhost the request goes to the local
 * POC server instead (poc/chat, http://localhost:8787), which speaks the
 * same shape; `wrangler pages dev dist` (port 8788) exercises the real
 * Function locally when parity matters.
 *
 * Markdown links restricted to the five allowlisted slugs render as real
 * internal links (#54); everything else stays plain text. open_page triggers
 * real navigation through the deterministic layer. The usage/cost comment
 * line is a dev nicety: localhost only, never shown to visitors. Network-
 * level failure (backend unreachable) falls back to OFFLINE_HTML.
 * Lazy by contract (#70): nothing here runs, connects, or loads before the
 * visitor actually asks something.
 */
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const CHAT_URL = IS_LOCAL ? "http://localhost:8787/chat" : "/api/chat";

/** rolling model conversation (distinct from the prompt's command history) */
const llmHistory: { role: "user" | "assistant"; content: string }[] = [];

/* #54 slug allowlist -> real routes. work is the homepage log; contact has no
   page of its own, so it runs its deterministic command instead (see below).
   resume is gone site-wide (item 6). eight-angle is still matched by MD_LINK
   but no longer resolves to a route: the article is unpublished (item 11), so
   a chat mention degrades to a plain-text mention (renderReply) instead of a
   link that would 404. */
const SLUG_HREF: Record<string, string> = {
  about: "/about",
  work: "/#log",
};

const MD_LINK =
  /\[([^\]\n]{1,80})\]\(\/(about|work|eight-angle|contact)\)/g;

/** Model prose -> DOM. Text nodes only, plus allowlisted links; never HTML.
    Given a slot (the in-flight thinking line, #116), the reply fills that
    same element in place: content swaps, the box never moves. */
function renderReply(text: string, slot?: HTMLElement | null, replay = false) {
  const host = sink();
  if (!host) return;
  const d = slot?.isConnected ? slot : document.createElement("div");
  d.className = "reply";
  d.replaceChildren();
  let last = 0;
  for (const m of text.matchAll(MD_LINK)) {
    d.appendChild(document.createTextNode(text.slice(last, m.index)));
    const [, label, slug] = m;
    if (slug === "contact") {
      // no contact page: a link-styled button runs the command in place
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cmdlink";
      b.dataset.cmd = "contact";
      b.textContent = label;
      d.appendChild(b);
    } else if (slug in SLUG_HREF) {
      const a = document.createElement("a");
      a.href = SLUG_HREF[slug];
      a.textContent = label;
      d.appendChild(a);
    } else {
      // matched the pattern but has no live route (eight-angle: unpublished,
      // item 11). Degrade to a plain-text mention so the chat never emits a
      // link that 404s.
      d.appendChild(document.createTextNode(label));
    }
    last = m.index + m[0].length;
  }
  d.appendChild(document.createTextNode(text.slice(last)));
  if (!d.parentElement) host.appendChild(d);
  if (!replay) {
    record({ t: "reply", s: text });
    announce(text);
    scrollToNewest();
  }
}

/* The waiting state (#116): an assistant-style thinking line, shown for model
   round trips only; deterministic commands render synchronously and never
   pass through here. It is built inside the same .reply box the answer will
   fill, so arrival is a content swap, never a box swap: zero layout shift.
   The pulsing dots are aria-hidden decoration animated purely in CSS, so the
   live region never sees animation frames; the waiting state announces
   exactly once through the polite announcer. Under reduced motion the dots
   give way to the static label (rules in terminal.css). */
function thinking(): HTMLElement | null {
  const host = sink();
  if (!host) return null;
  const d = document.createElement("div");
  d.className = "reply thinking";
  const dots = document.createElement("span");
  dots.className = "tdots";
  dots.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) {
    dots.appendChild(document.createElement("span"));
  }
  const label = document.createElement("span");
  label.className = "tlabel";
  label.textContent = "Thinking…";
  d.append(dots, label);
  host.appendChild(d);
  announce("Thinking…");
  scrollToNewest();
  return d;
}

function openSlug(slug: string) {
  if (slug === "work") goHomeThen(scrollToLog);
  else if (slug === "contact") out(CONTACT_HTML);
  else if (slug in SLUG_HREF) navigate(SLUG_HREF[slug]);
  // any other slug (e.g. eight-angle, now unpublished) is a no-op: no route,
  // no 404. The prose the model already rendered carries the mention.
}

/* ------------------------------------------------- redirect countdown ----- */

/* Which open_page slugs are a genuine navigation to ANOTHER page (so a
   countdown makes sense), vs an in-place output (contact) or a same-page
   scroll. Returns the real destination href + a plain-words name, or null to
   fall back to openSlug's instant behavior. */
function redirectDest(slug: string): { href: string; name: string } | null {
  const screen = currentScreen();
  if (slug === "about" && screen !== "about")
    return { href: "/about", name: "the about page" };
  // eight-angle is intentionally absent: the article is unpublished (item 11),
  // so a redirect there would 404. It falls through to openSlug's no-op.
  if (slug === "work" && screen !== "home")
    return { href: "/#log", name: "the work log" };
  return null;
}

/* An input the visitor phrased as an explicit navigation ("open the eight
   angle article", "take me to about") is honored instantly, no countdown
   (#143 req 3): the countdown only guards a QUESTION the model chose to
   answer by navigating away. */
const EXPLICIT_NAV =
  /^\s*(open|go to|goto|take me to|bring me to|navigate to|jump to|show me|visit)\b/i;
function isExplicitNav(q: string): boolean {
  return EXPLICIT_NAV.test(q);
}

/* Build the announcement line in the reply flow. Always: "Let me take you to
   <link>." with the destination a REAL inline anchor (kept on cancel, so the
   visitor can still click through). When `live`, append the ticking countdown
   + the stay control and return their nodes; on replay (settled history)
   render the link only. */
function renderRedirect(
  href: string,
  name: string,
  slot: HTMLElement | null,
  live: boolean
): { count: HTMLElement; tail: HTMLElement } | null {
  const host = sink();
  if (!host) return null;
  const box = slot?.isConnected ? slot : document.createElement("div");
  box.className = "reply redirect";
  box.replaceChildren();
  box.appendChild(document.createTextNode("Let me take you to "));
  if (REDIRECT_HREFS.has(href)) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = name;
    box.appendChild(a);
  } else {
    box.appendChild(document.createTextNode(name)); // untrusted stored href
  }
  box.appendChild(document.createTextNode("."));

  let refs: { count: HTMLElement; tail: HTMLElement } | null = null;
  if (live) {
    const tail = document.createElement("span");
    tail.className = "rdx-tail";
    // the ticking clock is decorative: screen readers hear the one announce
    // in startRedirect, never per tick (#143 req 4)
    const clock = document.createElement("span");
    clock.className = "rdx-clock";
    clock.setAttribute("aria-hidden", "true");
    clock.appendChild(document.createTextNode(" Heading there in "));
    const count = document.createElement("span");
    count.className = "rdx-count";
    count.textContent = String(REDIRECT_SECONDS);
    clock.appendChild(count);
    clock.appendChild(document.createTextNode("s. "));
    tail.appendChild(clock);
    const stay = document.createElement("button");
    stay.type = "button";
    stay.className = "rdx-stay";
    stay.textContent = "Stay here";
    stay.addEventListener("click", () => cancelRedirect("stay"));
    tail.appendChild(stay);
    box.appendChild(tail);
    refs = { count, tail };
  }
  if (!box.parentElement) host.appendChild(box);
  return refs;
}

/* Start the cancellable countdown toward `href`. Reuses the thinking slot
   when it is free (no prose already fills it) so the #118 same-slot swap
   survives; records the announcement so it persists (settled) across Back and
   refresh (#144). */
function startRedirect(href: string, name: string, slot: HTMLElement | null) {
  cancelRedirect("nav"); // clear any prior countdown silently
  const refs = renderRedirect(href, name, slot, true);
  record({ t: "redirect", href, name });
  scrollToNewest();
  if (!refs) {
    navigate(href);
    return;
  }
  // keep focus on whatever input the send came from (#143 req 2); the
  // fallback is the header composer, /chat's input since #153
  const active = document.activeElement as HTMLElement | null;
  const input =
    active && active.matches?.(".hchat textarea")
      ? (active as HTMLTextAreaElement)
      : (byId(CHAT_INPUT) as HTMLTextAreaElement | null);

  announce(
    `Taking you to ${name} in a few seconds. Press escape, or select stay here, to stay.`
  );

  let remaining = REDIRECT_SECONDS;
  const timer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      commitRedirect(href);
      return;
    }
    refs.count.textContent = String(remaining);
  }, 1000);
  redirect = { timer, tail: refs.tail, input };
}

function commitRedirect(href: string) {
  if (redirect) {
    clearInterval(redirect.timer);
    redirect = null;
  }
  navigate(href); // the house transition (#150; instant under reduced motion)
}

/* All cancel paths (#143 req 2) route here: Escape, the stay control, and
   start-typing. The announcement line and its inline link REMAIN (only the
   ticker + stay control are removed) so the visitor can still click through.
   Focus returns to the input it came from; it never leaves. A "nav" cancel
   (leaving the page) just stops the timer. */
function cancelRedirect(reason: "escape" | "stay" | "type" | "nav") {
  const r = redirect;
  if (!r) return;
  redirect = null;
  clearInterval(r.timer);
  if (reason === "nav") return; // the page is leaving; nothing to preserve
  r.tail.remove();
  announce("Staying here.");
  if (r.input && document.activeElement !== r.input) {
    r.input.focus({ preventScroll: true });
  }
}

async function askLive(q: string) {
  beginTurn(); // the newest turn opens at the top of the transcript (#153)
  echo(q);
  const wait = thinking();
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Turnstile seam (#49): when the widget activates, add its token here
      // as `turnstileToken` alongside message/history. Nothing else changes.
      body: JSON.stringify({ message: q, history: llmHistory.slice(-8) }),
      signal: AbortSignal.timeout(15_000),
    });
    const d = (await res.json()) as {
      text?: string;
      open_page?: string | null;
      usage?: { input: number; output: number };
      cost?: number;
      error?: string;
    };
    if (!res.ok || d.error) {
      // server-sent error bodies ({error}) render verbatim: 400 validation,
      // 429 rate limit (friendly body), 502/503 offline text with the email.
      // renderReply builds text nodes only, so the body is inert.
      renderReply(
        d.error || "Something went wrong. Try again in a moment.",
        wait
      );
      return;
    }
    const hasProse = !!d.text;
    if (d.text) renderReply(d.text, wait);
    llmHistory.push(
      { role: "user", content: q },
      { role: "assistant", content: d.text || `(opened ${d.open_page})` }
    );
    saveChat(); // #144: persist the updated model history alongside the transcript
    if (d.usage && IS_LOCAL) {
      // dev-only telemetry line; visitors never see cost figures
      line(
        "cmt",
        `# ${d.usage.input} in · ${d.usage.output} out · $${(d.cost ?? 0).toFixed(4)}`
      );
    }
    if (d.open_page) {
      const slug = d.open_page;
      const dest = redirectDest(slug);
      if (dest && !isExplicitNav(q)) {
        // the model answered a QUESTION by navigating away (#143): announce it
        // with a cancellable countdown instead of an instant redirect. Reuse
        // the thinking slot only when no prose already fills it, so the #118
        // same-slot swap survives.
        startRedirect(dest.href, dest.name, hasProse ? null : (wait ?? null));
      } else {
        // an explicit "open X" ask, or an in-place slug (contact/work while
        // home): go now, no countdown (#143 req 3)
        if (!hasProse) wait?.remove();
        openSlug(slug);
      }
    } else if (!hasProse) {
      wait?.remove(); // no prose and no navigation: drop the empty thinking slot
    }
  } catch {
    // network-level failure or the 15s timeout: the offline output takes the
    // thinking line's place
    out(OFFLINE_HTML, wait);
  }
}

function ask(q: string) {
  void askLive(q);
}

function toChat(q: string, viaKb: boolean) {
  if (currentScreen() === "chat") {
    ask(q);
  } else {
    pendingAfter = () => ask(q);
    if (viaKb) pendingFocus = CHAT_INPUT;
    navigate("/chat");
  }
}

/* ------------------------------------------ uniform thinking (Phase 4C) --- */
/* Deterministic in-place responses get a brief thinking pulse before they
   render, so every send (LLM or command) feels like the machine is thinking.
   The pulse reuses the #116 thinking box, so the response lands in the SAME
   node (zero shift). Reduced motion: no pulse, instant render. Commands that
   NAVIGATE (about, home, work) never reach here; clicked links stay instant. */
function pulseThen(render: (slot: HTMLElement | null) => void) {
  if (prefersReducedMotion()) {
    render(null);
    return;
  }
  const wait = thinking();
  window.setTimeout(() => render(wait), PULSE_MS);
}

/* ------------------------------------- contact as an LLM moment (Phase 4C) - */
/* sessionStorage may be blocked (private mode); the emulation skips its
   theater then, like reduced motion, and renders the turn instantly. */
function storageBlocked(): boolean {
  try {
    sessionStorage.getItem(STORE_KEY);
    return false;
  } catch {
    return true;
  }
}

/* A fully scripted turn: the echoed line, a brief pulse, then a deterministic
   response, recorded + announced like any turn. */
function scriptedTurn(q: string, html: string) {
  beginTurn();
  echo(q);
  pulseThen((slot) => out(html, slot));
}

/* Clicking the contact nav item (on any page) lands on /chat and types
   "How do I contact Brian?" into the composer character by character, then
   auto-submits it as a normal turn whose answer is the deterministic contact
   card. On /chat it plays in place. Reduced motion or blocked storage: skip
   the typing theater, render echo + response instantly. Focus ends in the
   composer. */
function playContactEmulation() {
  const input = byId(CHAT_INPUT) as HTMLTextAreaElement | null;
  const finish = () => {
    if (input) {
      input.value = "";
      autoGrow(input);
    }
    scriptedTurn(CONTACT_Q, CONTACT_HTML);
    input?.focus({ preventScroll: true });
  };
  if (!input || prefersReducedMotion() || storageBlocked()) {
    finish();
    return;
  }
  input.focus({ preventScroll: true });
  let i = 0;
  const step = () => {
    i += 1;
    input.value = CONTACT_Q.slice(0, i);
    autoGrow(input); // keep the fallback height in step with the typed value
    if (i < CONTACT_Q.length) window.setTimeout(step, TYPE_MS);
    else window.setTimeout(finish, 220); // a beat, then submit
  };
  window.setTimeout(step, TYPE_MS);
}

function contactMoment() {
  if (currentScreen() === "chat") {
    playContactEmulation();
  } else {
    // ride the pendingAfter mechanism with the emulation flag so initPage
    // focuses the composer before it types (#153 carry, Phase 4C)
    pendingAfter = () => playContactEmulation();
    pendingEmulate = true;
    navigate("/chat");
  }
}

/* --------------------------------------------------------- command router -- */

function run(raw: string, viaKb: boolean) {
  const v = (raw || "").trim();
  if (!v) return;
  const low = v.toLowerCase();
  const cmd = low.startsWith("/") ? low.slice(1) : low;

  if (cmd === "work") {
    goHomeThen(scrollToLog);
    return;
  }
  if (cmd === "home" || cmd === "exit") {
    if (currentScreen() === "home") hint("# You are home");
    else navigate("/");
    return;
  }
  if (cmd === "about") {
    if (currentScreen() !== "about") navigate("/about");
    return;
  }
  if (cmd === "clear") {
    if (currentScreen() === "chat") clearChat();
    else hint("# Nothing to clear here");
    return;
  }
  if (cmd === "chat") {
    // open the chat page itself; never send "chat" as a question. The
    // composer is the header input (#153), so that is where focus lands.
    if (currentScreen() === "chat") {
      byId(CHAT_INPUT)?.focus({ preventScroll: true });
    } else {
      if (viaKb) pendingFocus = CHAT_INPUT;
      navigate("/chat");
    }
    return;
  }
  if (cmd === "hello" || cmd === "hi" || cmd === "hey") {
    toConsole(v, HELLO_HTML, viaKb);
    return;
  }
  if (cmd === "help") {
    toConsole(v, HELP_HTML, viaKb);
    return;
  }
  if (cmd === "contact") {
    toConsole(v, CONTACT_HTML, viaKb);
    return;
  }
  // "resume" is no longer a command (item 6): it falls through to the chat as
  // free-form input, like any unknown word.

  // free-form question: the live chat on /chat, or in place when already
  // there (#108)
  toChat(v, viaKb);
}

/* --------------------------------------------------- per-page init (VT) ---- */

/* Pinned-composer stuck detection (Phase 4B). The composer is
   position: sticky; top: 0 inside the panel; when it pins to the viewport
   top a bottom hairline appears so it never reads as a detached strip. There
   is no cross-browser CSS `:stuck`, so a zero-layout sentinel just above the
   composer's rest position is watched: once it scrolls above the viewport
   top, the composer is stuck. Rebuilt per /chat page-load (main is swapped,
   the nodes are fresh); disconnected when leaving /chat. */
let pinObserver: IntersectionObserver | null = null;
function setupPin() {
  pinObserver?.disconnect();
  pinObserver = null;
  if (currentScreen() !== "chat") return;
  const sentinel = document.querySelector(".pin-sentinel");
  const composer = document.querySelector<HTMLElement>(".chatcomposer");
  if (!sentinel || !composer) return;
  pinObserver = new IntersectionObserver(
    ([entry]) => {
      // stuck once the sentinel has scrolled ABOVE the viewport top
      const stuck = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      composer.classList.toggle("pinned", stuck);
    },
    { threshold: 0 }
  );
  pinObserver.observe(sentinel);
}

function initPage() {
  // roving cursor (#63): the group's tab stop starts at its first element;
  // focus resets to body on swaps, so the resting cursor returns to the
  // wordmark (cfocus off) until focus lands somewhere live again.
  document.documentElement.classList.remove("cfocus");
  const rove = roveEls();
  if (rove.length) setRoveStop(rove[0], rove);

  const after = pendingAfter;
  pendingAfter = null;
  const emulate = pendingEmulate; // Phase 4C: a scripted contact emulation
  pendingEmulate = false;
  const focusId = pendingFocus;
  pendingFocus = null;

  // #144: restore the /chat thread (module memory first, else sessionStorage)
  // BEFORE running any pending send, so a carried question opens the newest
  // turn above the restored conversation (#153). Recompute the roving tab
  // stop now the log is built, since rehydrated replies add their own inline
  // links to the cursor order.
  if (currentScreen() === "chat") {
    rehydrateChat();
    // Greeting empty state: only when the panel is pristine (nothing restored)
    // AND no pending send/command/emulation is about to render a turn. Run
    // AFTER rehydrate so it can never flash before a restored or pending
    // thread renders.
    if (!transcript.length && !after && !emulate) showGreeting();
    const r = roveEls();
    if (r.length) setRoveStop(r[0], r);
    setupPin(); // watch the docked composer for the stuck hairline
  } else {
    setupPin(); // disconnects the observer when leaving /chat
  }

  // Phase 4C: a contact emulation owns focus itself (it types into the
  // composer), so put focus there before it runs; a normal pending send
  // focuses its input below.
  if (emulate) byId(CHAT_INPUT)?.focus({ preventScroll: true });
  if (after) after();
  if (focusId) {
    const el = byId(focusId) as HTMLElement | null;
    el?.focus({ preventScroll: true });
  }
}

/* ------------------------------------------------------------- setup once -- */

function setupOnce() {
  // Astro's ClientRouter calls document.startViewTransition() on navigation.
  // The View Transitions spec aborts with InvalidStateError when the document
  // is not visible (a navigation fired from a backgrounded tab, or mid
  // visibility change). The navigation still completes; only the animation is
  // skipped. Swallow just that one benign rejection so it never noises the
  // console; anything else propagates normally.
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { name?: string; message?: string } | undefined;
    if (
      r &&
      r.name === "InvalidStateError" &&
      String(r.message).includes("Transition was aborted")
    ) {
      e.preventDefault();
    }
  });

  // THE submit path for every composer (both ChatBar placements): the [send]
  // button is type=submit, Enter routes here via requestSubmit (keydown below,
  // since a textarea's native Enter is a newline), and virtual keyboards / IME
  // land here too. Capture phase + preventDefault so it runs before Astro's
  // ClientRouter submit handler, which would otherwise hijack the GET form and
  // navigate to /chat?q=...
  document.addEventListener(
    "submit",
    (e) => {
      const form = (e.target as HTMLElement).closest?.(
        "form[data-screen-form]"
      );
      if (!form) return;
      e.preventDefault();
      // the control is a TEXTAREA now (composer phase A item 2); keep the
      // input fallback so any legacy specimen still submits
      const input = form.querySelector<HTMLTextAreaElement | HTMLInputElement>(
        "textarea, input"
      );
      if (!input) return;
      run(input.value, true);
      input.value = "";
      if (input instanceof HTMLTextAreaElement) autoGrow(input);
    },
    true
  );

  // clicks: keybar + nav command buttons. Anchors (log entries, inline chat
  // links) fall through to ClientRouter untouched.
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest?.<HTMLElement>("button[data-cmd]");
    if (btn && btn.dataset.cmd) {
      // Phase 4C: clicking any contact affordance (the nav item, an inline
      // [contact] chip in a reply) is an LLM moment, not the bare command;
      // typed "contact" still runs the deterministic card directly.
      if (btn.dataset.cmd === "contact") contactMoment();
      else run(btn.dataset.cmd, false);
    }
  });

  // single-cursor bookkeeping (#63): html.cfocus hides the resting caret
  // (the header wordmark's, and the homepage masthead's, #160) while the
  // cursor group or a chat input owns focus; the roving tab stop follows
  // focus (clicks included) so Tab re-enters where the cursor left. Every
  // input is the one .hchat material, so one selector covers them all.
  document.addEventListener("focusin", (e) => {
    const t = e.target as HTMLElement;
    const live = !!t.matches?.(".hchat textarea") || isRove(t);
    document.documentElement.classList.toggle("cfocus", live);
    if (isRove(t)) {
      setRoveStop(t);
      if (!roveHinted && t.matches(":focus-visible")) {
        roveHinted = true;
        hint("# Arrows move the cursor · enter opens");
      }
    }
  });
  document.addEventListener("focusout", (e) => {
    if (!e.relatedTarget) {
      document.documentElement.classList.remove("cfocus");
    }
  });

  // input: keep the textarea sized to its content (composer phase A item 2,
  // fallback where field-sizing is unsupported), and treat typing during a
  // redirect countdown as a cancel signal.
  document.addEventListener("input", (e) => {
    const input = e.target as HTMLElement;
    if (!input.matches?.(".hchat textarea")) return;
    autoGrow(input as HTMLTextAreaElement);
    // #143 req 2: a visitor typing their next message has chosen to stay.
    // Cancel the countdown but let the keystroke through (no preventDefault).
    if (redirect) cancelRedirect("type");
  });

  // keyboard: escape + the roving cursor. Arrow logic only runs while a
  // cursor element already holds focus, so page scrolling is never hijacked.
  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;

    if (e.key === "Escape") {
      // #143 req 2: while a redirect countdown is running, Escape cancels it
      // and stays put. It takes priority over the blur/leave behavior below so
      // focus never leaves the input the visitor is in.
      if (redirect) {
        e.preventDefault();
        cancelRedirect("escape");
        return;
      }
      // single-cursor model (#63): the first Escape parks the cursor back on
      // the resting caret (blur); from rest, Escape leaves non-home screens.
      // An input blurs first too, so Escape mid-question never throws typed
      // text away by navigating.
      if (t && (t.matches?.(".hchat textarea") || isRove(t))) {
        e.preventDefault();
        t.blur();
        return;
      }
      if (currentScreen() !== "home") {
        e.preventDefault();
        navigate("/");
      }
      return;
    }

    // roving cursor (#63): arrows walk the page's interactive elements, but
    // only while one of them already holds focus; otherwise arrows scroll.
    if (isRove(t) && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        moveRove(t, 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        moveRove(t, -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        moveRoveEnd(false);
      } else if (e.key === "End") {
        e.preventDefault();
        moveRoveEnd(true);
      }
      return;
    }

    // Enter SENDS (composer phase A item 2). The one .hchat control is a
    // TEXTAREA now, whose native Enter inserts a newline, so Enter-to-send is
    // wired here: Enter with no Shift, and not mid-IME-composition, submits the
    // form through the one delegated submit handler above (requestSubmit fires a
    // cancelable submit event, so that handler still owns the send + reset).
    // Shift+Enter falls through to the native newline.
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing &&
      t.matches?.(".hchat textarea")
    ) {
      e.preventDefault();
      const form = t.closest<HTMLFormElement>("form[data-screen-form]");
      form?.requestSubmit();
    }
  });

  // #143: a navigation away during a countdown cancels it silently; the timer
  // must never fire after the visitor has already left /chat (also closes the
  // back-button loop: the destination push happened, nothing re-triggers).
  // Also: leaving /chat drops the thread (item, above), so the next arrival is
  // pristine. At astro:before-swap the OUTGOING page is still the live
  // document, so currentScreen reports the page being left.
  document.addEventListener("astro:before-swap", () => {
    cancelRedirect("nav");
    if (currentScreen() === "chat") dropThread();
  });

  // #145/#150: stamp the persisted header's per-page state during the swap
  // (astro:after-swap runs before the new frame paints, so the stamp can
  // never shift visible layout) and again on page-load as a safety net.
  document.addEventListener("astro:after-swap", syncHeaderChat);
  document.addEventListener("astro:page-load", syncHeaderChat);

  // per-page setup, on initial load and every VT navigation
  document.addEventListener("astro:page-load", initPage);

  // THE IDLE HOOK (#70 facade contract; first consumer: the aurora + tide
  // scene, #106/#114). Heavy atmosphere layers lazy-import from here, never
  // from a tag in BaseLayout: zero bytes on the pre-paint path. When a page
  // carries a reserved facade ([data-scene]), the scene module loads at idle
  // (requestIdleCallback, setTimeout fallback for Safari); after the first
  // import the module re-binds itself across client-side navigations, so
  // this fires the import exactly once per full page lifetime.
  let sceneRequested = false;
  let sceneMod: typeof import("@/scripts/scene") | null = null;
  // Scene state follows the page (#108): /chat is golden hour, everything
  // else is the home sky. The scene element carries transition:persist, so
  // on client-side navigations the OLD page's DOM (dataset included)
  // survives the swap; the consumer stamps the arriving page's state through
  // the handle API. initScene() is idempotent: it returns the live handle,
  // re-binds a fresh facade, or tears down when the page has none (in which
  // case there is nothing to stamp). No-op until the module has loaded; the
  // first mount reads its state from the server-rendered dataset.
  const syncSceneState = () => {
    if (!sceneMod) return;
    const handle = sceneMod.initScene();
    if (!handle) return;
    handle.setState(currentScreen() === "chat" ? "chat" : "home");
    // Per-page identity (#111, B3): the arriving page stamps its theme on
    // its fresh .screen section (article pages, from frontmatter); no stamp
    // = the site default. Read from that fresh section, never from the
    // persisted [data-scene] node (which carries the OLD page's dataset) and
    // never from the bare [data-screen] (the persisted global header matches
    // that first and carries no theme, which pinned the mark to BR on every
    // navigation, #150 bridge bug). setTheme no-ops when equal and travels
    // the sky, peak, and mark together when it changes (snap under reduced
    // motion).
    const stamp = document.querySelector<HTMLElement>(".screen")?.dataset
      .sceneTheme;
    handle.setTheme(sceneMod.isThemeName(stamp) ? stamp : "default");
  };
  const requestScene = () => {
    if (sceneRequested || !document.querySelector("[data-scene]")) return;
    sceneRequested = true;
    const idle: (cb: () => void) => void =
      "requestIdleCallback" in window
        ? (cb) => requestIdleCallback(cb, { timeout: 2500 })
        : (cb) => window.setTimeout(cb, 1500);
    idle(() => {
      void import("@/scripts/scene").then((m) => {
        sceneMod = m;
        // covers a navigation that landed between request and load: the
        // persisted facade's dataset may be a page behind by now
        syncSceneState();
      });
    });
  };
  document.addEventListener("astro:page-load", requestScene);
  document.addEventListener("astro:page-load", syncSceneState);
}

const w = window as unknown as { __terminalInit?: boolean };
if (!w.__terminalInit) {
  w.__terminalInit = true;
  setupOnce();
}

export {};
