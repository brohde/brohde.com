/**
 * Terminal controller for brohde.com.
 *
 * One bundled module drives every interactive terminal behavior:
 *   - deterministic command router (work/about/resume/contact/help/home/clear
 *     + /slash aliases + free-form -> live chat), ported from build-log-v3.html
 *   - command autocomplete at the prompt (#48)
 *   - shell-style prompt history (#44)
 *   - the roving page cursor (#63)
 *   - the redirect countdown for model-chosen navigation (#143), the /chat
 *     conversation persistence via sessionStorage (#144), and the header
 *     chat-input dedup on pages that carry their own input (#145)
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

interface Cmd {
  name: string;
  desc: string;
}

/* Copy case (#76): human-language strings use sentence case; lowercase is
   reserved for literal terminal tokens (typed commands, file-ish names like
   resume.pdf, URLs and emails). */
const COMMANDS: Cmd[] = [
  { name: "work", desc: "Browse the log" },
  { name: "about", desc: "Who I am" },
  { name: "resume", desc: "resume.pdf" },
  { name: "contact", desc: "Email + LinkedIn" },
  { name: "chat", desc: "Ask me anything" },
  { name: "hello", desc: "A quick tour" },
  { name: "help", desc: "List commands" },
  { name: "home", desc: "Back to the log" },
  { name: "clear", desc: "Wipe this chat" },
];
/* static console strings (innerHTML sinks below take only these) */
const HELP_HTML =
  "Commands\n" +
  "  hello     A quick tour\n" +
  "  work      Browse the log\n" +
  "  about     Who I am\n" +
  "  resume    resume.pdf\n" +
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
  '<a href="/resume.pdf">Resume</a>: the PDF\n' +
  '<a href="/chat">Chat</a>: ask me anything\n' +
  '<a href="mailto:brian@brohde.com">Contact</a>: start a conversation';

const CONTACT_HTML =
  'Email     <a href="mailto:brian@brohde.com">brian@brohde.com</a>\n' +
  'LinkedIn  <a href="https://www.linkedin.com/in/brian-rohde-4ba3558/" target="_blank" rel="noopener">/in/brian-rohde-4ba3558</a>\n' +
  'X         <a href="https://x.com/brianxbuilds" target="_blank" rel="noopener">@brianxbuilds</a>';

const RESUME_HTML =
  'Resume    <a href="/resume.pdf">resume.pdf</a>\n' +
  '<span class="c"># Opens the PDF</span>';

/* shown only when the chat backend is unreachable at the network level
   (server-sent errors render their own body verbatim) */
const OFFLINE_HTML =
  "The chat is offline right now.\n" +
  '<span class="c"># Email <a href="mailto:brian@brohde.com">brian@brohde.com</a> and ask him directly.</span>';

/* ---------------------------------------------------------------- state ---- */

const history: string[] = []; // typed commands, this session
let histIndex = 0;
let pendingAfter: (() => void) | null = null;
let pendingFocus: string | null = null;

const ac = { open: false, items: [] as Cmd[], sel: -1, promptId: "" };

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
  input: HTMLInputElement | null; // where focus returns after a click-cancel
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

function currentScreen(): string {
  return (
    document.querySelector("[data-screen]")?.getAttribute("data-screen") ?? ""
  );
}

/* Header chat-input dedup (#145): the header's chat row is hidden on the two
   pages that carry their own input (the homepage slab and the /chat composer)
   and shown on every other page. SiteHeader server-renders the correct state
   per page (data-hchat), and we re-stamp it during the swap so a header that
   is ever persisted across navigations can never carry a stale state. Stamped
   before paint (astro:after-swap) so the row's presence never shifts layout
   after the page is visible: zero CLS. The identity row is untouched. */
function syncHeaderChat() {
  const header = document.querySelector<HTMLElement>(".shead");
  if (!header) return;
  const p = location.pathname.replace(/\/+$/, "") || "/";
  const ownsInput = p === "/" || p === "/chat";
  header.dataset.hchat = ownsInput ? "off" : "on";
  // The header is a persisted node (#150: it holds still through every
  // navigation so the caret never stops), so per-page server-rendered
  // differences must be re-stamped here, under the swap, before paint. The
  // wordmark row is the homepage's h1 and a p everywhere else; the persisted
  // node carries the OLD page's tag, so rebuild the row's tag to match the
  // arriving page. Visual output is identical (.wmrow styles the tag away),
  // so this costs nothing on screen; it keeps the heading semantics honest.
  const row = header.querySelector<HTMLElement>(".wmrow");
  const wantTag = p === "/" ? "H1" : "P";
  if (row && row.tagName !== wantTag) {
    const next = document.createElement(wantTag);
    next.className = row.className;
    while (row.firstChild) next.appendChild(row.firstChild);
    row.replaceWith(next);
  }
}

function visibleInput(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(".prompt input");
}

function promptIdOf(input: HTMLInputElement): string {
  return input.closest<HTMLElement>("[data-prompt]")?.dataset.prompt ?? "";
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

function setCaretEnd(input: HTMLInputElement) {
  const n = input.value.length;
  try {
    input.setSelectionRange(n, n);
  } catch {
    /* some input types disallow selection; ignore */
  }
}

/* ------------------------------------------------------------ chat output -- */

function chatlog(): HTMLElement | null {
  return byId("chatlog");
}

function scrollChatBottom() {
  if (currentScreen() === "chat") {
    window.scrollTo(0, document.documentElement.scrollHeight);
  }
}

/* The `replay` flag (#144) means "this line is being rebuilt from the stored
   transcript on a /chat rehydrate": build the DOM, but do not re-record it,
   do not re-announce it, and do not scroll per line (rehydrate scrolls once
   at the end). Live calls omit it and therefore record + announce as before. */
function line(cls: string, text?: string, replay = false) {
  const log = chatlog();
  if (!log) return;
  const d = document.createElement("div");
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  log.appendChild(d);
  if (!replay) {
    record({ t: "cmt", c: cls, s: text ?? "" });
    scrollChatBottom();
  }
}

function echo(t: string, replay = false) {
  const log = chatlog();
  if (!log) return;
  const d = document.createElement("div");
  d.className = "uline";
  const p = document.createElement("span");
  p.className = "p";
  p.setAttribute("aria-hidden", "true");
  p.textContent = "$ ";
  d.appendChild(p);
  d.appendChild(document.createTextNode(t));
  log.appendChild(d);
  if (!replay) {
    record({ t: "echo", s: t });
    scrollChatBottom();
  }
}

function out(html: string, slot?: HTMLElement | null, replay = false) {
  const log = chatlog();
  if (!log) return;
  // given a slot (the in-flight thinking line, #116), reuse its position so
  // the output lands where the visitor is already looking
  const d = slot?.isConnected ? slot : document.createElement("div");
  d.className = "out";
  d.innerHTML = html; // static strings only, never user input
  if (!d.parentElement) log.appendChild(d);
  if (!replay) {
    record({ t: "out", s: html });
    announce(d.textContent ?? "");
    scrollChatBottom();
  }
}

function clearChat() {
  const log = chatlog();
  if (!log) return;
  log.innerHTML = "";
  llmHistory.length = 0; // clear wipes the model's context too
  purgeChat(); // #144: and the persisted session, so a cleared chat stays cleared
  line("cmt", "# Cleared", true); // shown, deliberately not stored
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
const OUT_ALLOW = new Set([
  HELP_HTML,
  HELLO_HTML,
  CONTACT_HTML,
  RESUME_HTML,
  OFFLINE_HTML,
]);
const REDIRECT_HREFS = new Set(["/about", "/log/eight-angle-ml", "/#log"]);

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
  for (const e of transcript) renderEntry(e);
  scrollChatBottom();
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
    echo(cmd);
    out(html);
  };
  if (currentScreen() === "chat") {
    run();
  } else {
    pendingAfter = run;
    if (viaKb) pendingFocus = "in-chat";
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

/* #54 slug allowlist -> real routes. eight-angle maps to its /log/ route;
   work is the homepage log; contact and resume have no pages of their own,
   so they run their deterministic commands instead (see below). */
const SLUG_HREF: Record<string, string> = {
  about: "/about",
  work: "/#log",
  "eight-angle": "/log/eight-angle-ml",
  resume: "/resume.pdf",
};

const MD_LINK =
  /\[([^\]\n]{1,80})\]\(\/(about|work|eight-angle|contact|resume)\)/g;

/** Model prose -> DOM. Text nodes only, plus allowlisted links; never HTML.
    Given a slot (the in-flight thinking line, #116), the reply fills that
    same element in place: content swaps, the box never moves. */
function renderReply(text: string, slot?: HTMLElement | null, replay = false) {
  const log = chatlog();
  if (!log) return;
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
    } else {
      const a = document.createElement("a");
      a.href = SLUG_HREF[slug];
      a.textContent = label;
      d.appendChild(a);
    }
    last = m.index + m[0].length;
  }
  d.appendChild(document.createTextNode(text.slice(last)));
  if (!d.parentElement) log.appendChild(d);
  if (!replay) {
    record({ t: "reply", s: text });
    announce(text);
    scrollChatBottom();
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
  const log = chatlog();
  if (!log) return null;
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
  log.appendChild(d);
  announce("Thinking…");
  scrollChatBottom();
  return d;
}

function openSlug(slug: string) {
  if (slug === "work") goHomeThen(scrollToLog);
  else if (slug === "contact") out(CONTACT_HTML);
  else if (slug === "resume") out(RESUME_HTML);
  else if (slug in SLUG_HREF) navigate(SLUG_HREF[slug]);
}

/* ------------------------------------------------- redirect countdown ----- */

/* Which open_page slugs are a genuine navigation to ANOTHER page (so a
   countdown makes sense), vs an in-place output (contact/resume) or a
   same-page scroll. Returns the real destination href + a plain-words name,
   or null to fall back to openSlug's instant behavior. */
function redirectDest(slug: string): { href: string; name: string } | null {
  const screen = currentScreen();
  if (slug === "about" && screen !== "about")
    return { href: "/about", name: "the about page" };
  if (slug === "eight-angle")
    return { href: "/log/eight-angle-ml", name: "the Eight Angle article" };
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
  const log = chatlog();
  if (!log) return null;
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
  if (!box.parentElement) log.appendChild(box);
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
  scrollChatBottom();
  if (!refs) {
    navigate(href);
    return;
  }
  // keep focus on whatever input the send came from (#143 req 2)
  const active = document.activeElement as HTMLElement | null;
  const input =
    active && active.matches?.(".prompt input, .hchat input")
      ? (active as HTMLInputElement)
      : (byId("in-chat") as HTMLInputElement | null);

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
        // an explicit "open X" ask, or an in-place slug (contact/resume/work
        // while home): go now, no countdown (#143 req 3)
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
    if (viaKb) pendingFocus = "in-chat";
    navigate("/chat");
  }
}

/* --------------------------------------------------------- command router -- */

function run(raw: string, viaKb: boolean) {
  const v = (raw || "").trim();
  if (!v) return;
  const low = v.toLowerCase();
  const cmd = low.startsWith("/") ? low.slice(1) : low;

  if (history[history.length - 1] !== v) history.push(v);
  histIndex = history.length;

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
    // open the chat page itself; never send "chat" as a question
    if (currentScreen() === "chat") {
      byId("in-chat")?.focus({ preventScroll: true });
    } else {
      if (viaKb) pendingFocus = "in-chat";
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
  if (cmd === "resume") {
    toConsole(v, RESUME_HTML, viaKb);
    return;
  }

  // free-form question: the live chat on /chat, or in place when already
  // there (#108)
  toChat(v, viaKb);
}

/* -------------------------------------------------------------- autocomplete */

function matchCommands(raw: string): Cmd[] {
  if (raw === "/") return COMMANDS.slice();
  if (raw === "") return [];
  const q = (raw.startsWith("/") ? raw.slice(1) : raw).toLowerCase();
  if (q === "") return [];
  const starts = COMMANDS.filter((c) => c.name.startsWith(q));
  if (starts.length) return starts;
  return COMMANDS.filter((c) => c.name.includes(q));
}

function acContainer(promptId: string) {
  return byId(`ac-${promptId}`);
}
function acList(promptId: string) {
  return byId(`ac-list-${promptId}`);
}

function closeAC() {
  const input = visibleInput();
  if (ac.promptId) {
    const c = acContainer(ac.promptId);
    const l = acList(ac.promptId);
    if (c) c.hidden = true;
    if (l) l.innerHTML = "";
  }
  if (input) {
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  ac.open = false;
  ac.items = [];
  ac.sel = -1;
}

function optionId(promptId: string, i: number) {
  return `ac-${promptId}-opt-${i}`;
}

function renderAC(input: HTMLInputElement, items: Cmd[]) {
  const promptId = promptIdOf(input);
  const container = acContainer(promptId);
  const list = acList(promptId);
  if (!container || !list) return;

  ac.open = true;
  ac.items = items;
  ac.sel = -1;
  ac.promptId = promptId;

  list.innerHTML = "";
  items.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = "ac-chip";
    li.setAttribute("role", "option");
    li.id = optionId(promptId, i);
    li.dataset.cmd = c.name;
    li.setAttribute("aria-selected", "false");
    const name = document.createElement("span");
    name.textContent = c.name;
    const desc = document.createElement("span");
    desc.className = "ac-desc";
    desc.textContent = c.desc;
    li.appendChild(name);
    li.appendChild(desc);
    list.appendChild(li);
  });

  container.hidden = false;
  input.setAttribute("aria-expanded", "true");
  input.removeAttribute("aria-activedescendant");
}

function refreshAC(input: HTMLInputElement) {
  const items = matchCommands(input.value);
  if (!items.length) {
    closeAC();
    return;
  }
  renderAC(input, items);
}

function updateSel(next: number) {
  if (!ac.open || !ac.items.length) return;
  const count = ac.items.length;
  ac.sel = ((next % count) + count) % count;
  const input = visibleInput();
  const list = acList(ac.promptId);
  if (!list || !input) return;
  const options = list.querySelectorAll<HTMLElement>(".ac-chip");
  options.forEach((el, i) => {
    el.setAttribute("aria-selected", String(i === ac.sel));
  });
  const active = options[ac.sel];
  if (active) {
    input.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  }
}

function acceptTop() {
  if (!ac.open || !ac.items.length) return;
  const idx = ac.sel >= 0 ? ac.sel : 0;
  const input = visibleInput();
  if (!input) return;
  input.value = ac.items[idx].name;
  setCaretEnd(input);
  closeAC();
}

/* --------------------------------------------------------------- history --- */

function recall(dir: -1 | 1, input: HTMLInputElement) {
  if (!history.length) return;
  if (dir === -1) {
    if (histIndex > 0) histIndex--;
  } else {
    if (histIndex < history.length - 1) histIndex++;
    else {
      histIndex = history.length;
      input.value = "";
      setCaretEnd(input);
      return;
    }
  }
  input.value = history[histIndex] ?? "";
  setCaretEnd(input);
}

/* --------------------------------------------------- per-page init (VT) ---- */

function initPage() {
  closeAC();
  histIndex = history.length;

  // roving cursor (#63): the group's tab stop starts at its first element;
  // focus resets to body on swaps, so the resting cursor returns to the
  // wordmark (cfocus off) until focus lands somewhere live again.
  document.documentElement.classList.remove("cfocus");
  const rove = roveEls();
  if (rove.length) setRoveStop(rove[0], rove);

  const after = pendingAfter;
  pendingAfter = null;
  const focusId = pendingFocus;
  pendingFocus = null;

  // localhost only: the chat preview note reflects the live POC bridge
  if (IS_LOCAL && currentScreen() === "chat") {
    const note = byId("chat-note");
    if (note) note.textContent = "# Live model via the local POC";
  }

  // #144: restore the /chat thread (module memory first, else sessionStorage)
  // BEFORE running any pending send, so a carried question lands beneath the
  // restored conversation. Recompute the roving tab stop now the log is built,
  // since rehydrated replies add their own inline links to the cursor order.
  if (currentScreen() === "chat") {
    rehydrateChat();
    const r = roveEls();
    if (r.length) setRoveStop(r[0], r);
  }

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

  // Form submit fallback (virtual keyboards / IME that submit without a
  // keydown Enter). Capture phase + preventDefault so it lands before Astro's
  // ClientRouter submit handler, which would otherwise hijack the GET form and
  // navigate to /?q=... Keyboard Enter is handled in keydown below, which
  // cancels the submit before it ever fires.
  document.addEventListener(
    "submit",
    (e) => {
      const form = (e.target as HTMLElement).closest?.(
        "form[data-screen-form]"
      );
      if (!form) return;
      e.preventDefault();
      const input = form.querySelector<HTMLInputElement>("input");
      if (!input) return;
      run(input.value, true);
      input.value = "";
      closeAC();
    },
    true
  );

  // clicks: autocomplete chips, menu/keybar buttons. Anchors (back link, log
  // entries) fall through to ClientRouter untouched.
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const chip = t.closest?.<HTMLElement>(".ac-chip");
    if (chip && chip.dataset.cmd) {
      run(chip.dataset.cmd, false);
      const input = visibleInput();
      if (input) input.value = "";
      return;
    }
    const btn = t.closest?.<HTMLElement>("button[data-cmd]");
    if (btn && btn.dataset.cmd) {
      run(btn.dataset.cmd, false);
    }
  });

  // single-cursor bookkeeping (#63): html.cfocus hides the wordmark caret
  // while the cursor group or a chat input owns focus; the roving tab stop
  // follows focus (clicks included) so Tab re-enters where the cursor left.
  // The global header's input (.hchat, B2 Phase 1) joins the same model so
  // typing there never shows two carets.
  document.addEventListener("focusin", (e) => {
    const t = e.target as HTMLElement;
    const live = !!t.matches?.(".prompt input, .hchat input") || isRove(t);
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

  // input: refresh autocomplete for the active prompt
  document.addEventListener("input", (e) => {
    const input = e.target as HTMLElement;
    // #143 req 2: a visitor typing their next message has chosen to stay.
    // Cancel the countdown but let the keystroke through (no preventDefault).
    if (redirect && input.matches?.(".prompt input, .hchat input")) {
      cancelRedirect("type");
    }
    if (input.matches?.(".prompt input")) {
      refreshAC(input as HTMLInputElement);
      histIndex = history.length;
    }
  });

  // keyboard: escape, autocomplete cycling/accept, and prompt history.
  // Arrow/Tab logic only runs while a prompt input is focused, so page
  // scrolling is never hijacked (#44).
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
      if (ac.open) {
        e.preventDefault();
        closeAC();
        return;
      }
      // single-cursor model (#63): the first Escape parks the cursor back on
      // the wordmark (blur); from rest, Escape leaves non-home screens. The
      // header input (.hchat) blurs first too, so Escape mid-question never
      // throws typed text away by navigating.
      if (t && (t.matches?.(".prompt input, .hchat input") || isRove(t))) {
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

    if (!t?.matches?.(".prompt input")) return;
    const input = t as HTMLInputElement;

    // Enter runs the highlighted suggestion, or the typed text. preventDefault
    // here cancels the native form submission, so ClientRouter never sees it.
    if (e.key === "Enter") {
      e.preventDefault();
      if (ac.open && ac.sel >= 0) run(ac.items[ac.sel].name, true);
      else run(input.value, true);
      input.value = "";
      closeAC();
      return;
    }

    if (ac.open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        updateSel(ac.sel + 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        updateSel(ac.sel <= 0 ? ac.items.length - 1 : ac.sel - 1);
        return;
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        acceptTop();
        return;
      }
      if (
        e.key === "ArrowRight" &&
        input.selectionStart === input.value.length &&
        input.selectionEnd === input.value.length
      ) {
        e.preventDefault();
        acceptTop();
        return;
      }
      return;
    }

    // autocomplete closed: arrows recall command history
    if (e.key === "ArrowUp") {
      e.preventDefault();
      recall(-1, input);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      recall(1, input);
    }
  });

  // #143: a navigation away during a countdown cancels it silently; the timer
  // must never fire after the visitor has already left /chat (also closes the
  // back-button loop: the destination push happened, nothing re-triggers).
  document.addEventListener("astro:before-swap", () => cancelRedirect("nav"));

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
    // the fresh [data-screen] section (article pages, from frontmatter);
    // no stamp = the site default. Read from that fresh element, never
    // from [data-scene]: the persisted scene node still carries the OLD
    // page's dataset. setTheme no-ops when equal and travels the sky,
    // peak, and mark together when it changes (snap under reduced motion).
    const stamp = document.querySelector<HTMLElement>("[data-screen]")?.dataset
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
