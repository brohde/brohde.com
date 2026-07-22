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
import {
  prefersReducedMotion,
  autoGrow,
  typeInto,
} from "./terminal/typing";
import {
  byId,
  currentScreen,
  chatlog,
  sink,
  beginTurn,
  removeGreeting,
  scrollToNewest,
  setActiveTurn,
  setReplaying,
} from "./terminal/dom";
import {
  announce,
  hint,
  roveEls,
  isRove,
  setRoveStop,
  moveRove,
  moveRoveEnd,
  getRoveHinted,
  setRoveHinted,
} from "./terminal/a11y";

/* Copy case (#76): human-language strings use sentence case; lowercase is
   reserved for literal terminal tokens (typed commands, file-ish names like
   build.log, URLs and emails). */
/* the /chat hint once a conversation is underway (Brian): the pristine
   panel keeps the component's original invitation; this softer one takes
   over from the first visitor line and [clear] restores the original */
const ONGOING_PH = "Write a message...";

/* static console strings (innerHTML sinks below take only these) */
const HELP_HTML =
  "Commands\n" +
  "  hello     A quick tour\n" +
  "  work      Browse the log\n" +
  "  about     Who I am\n" +
  "  contact   Send Brian a message\n" +
  "  chat      Ask me anything\n" +
  "  home      Back to the log\n" +
  "  clear     Wipe this chat\n" +
  "  help      This list";

/* hello: a short natural-language tour of the core pages (Brian's ask,
   2026-07-15; capitalized page-name links per #76). Links are underlined,
   keyboard reachable, and join the roving cursor order like any other chat
   output. */
const HELLO_HTML =
  "Hello! Here’s what’s on the site:\n" +
  '<a href="/">Work</a>: the log, case studies of what I ship\n' +
  '<a href="/about">About</a>: who I am in four paragraphs\n' +
  '<a href="/chat">Chat</a>: ask me anything\n' +
  '<button type="button" class="cmdlink" data-cmd="contact">Contact</button>: send Brian a message right here';

/* The email card RETIRED (#183): brian@brohde.com comes off every visitor
   surface with Phase B, and contact is the in-chat flow now. Every path that
   used to print the address (the contact command, the contact nav item, the
   model's [contact] link, an open_page:contact) opens the conversational
   flow instead (see the contact flow section below). */

/* shown only when the chat backend is unreachable at the network level
   (server-sent errors render their own body verbatim). The email is gone with
   #183; the honest fallback is to try again. */
const OFFLINE_HTML =
  "The chat is offline right now.\n" +
  '<span class="c"># Please try again in a moment.</span>';

/* ---------------------------------------------------------------- state ---- */

let pendingAfter: (() => void) | null = null;
let pendingFocus: string | null = null;
/* Phase 4C: pendingAfter can carry a scripted CONTACT EMULATION (type the
   question, then run the deterministic contact turn) rather than a plain
   send; the flag lets initPage tell them apart. */
let pendingEmulate = false;

/* #150 Phase 3 matrix choreography. Set at astro:before-swap when the crossing
   is choreographed (the destination scene theme differs from the current one,
   so navTravel + the nav surge already fired during the swap and <html> carries
   data-vt-matrix); the page-load handler then only syncs state (no second
   surge) and clears the flag. Same-theme crossings never set it and keep the
   fast concurrent fade. Recomputed on every before-swap, never mid-transition. */
let navChoreographed = false;

/* Contact flow state (Phase B item 1). When non-null the flow owns every TYPED
   send: the submit handler routes to contactSend instead of the command router,
   so the visitor's words are the message / name / email / confirm answer, not a
   chat question. null = normal chat. This is deliberately module-only state
   (not persisted): a /chat refresh restores the transcript but disarms the
   flow, a known Phase B limitation flagged in the handoff. `awaiting` names
   what the next send answers; "blob" is the first free-form message where the
   /api/contact LLM extraction runs. */
type Awaiting = "blob" | "message" | "name" | "email" | "confirm" | "sending";
interface ContactState {
  name: string | null;
  email: string | null;
  message: string | null;
  awaiting: Awaiting;
}
let contact: ContactState | null = null;

/* the /chat composer's input id (docked in the panel, Phase 4B): pendingFocus
   targets it after a navigation lands on /chat, and it is the redirect
   countdown's focus fallback. The header input (#in-site) is the composer
   only on interior pages now (a jump-to-chat affordance), never targeted
   here. */
const CHAT_INPUT = "in-chat";

/* Phase 4C motion timings (Brian veto knobs). */
const PULSE_MS = 450; // brief thinking pulse before a deterministic response
const CONTACT_PULSE_MS = 180; // the contact flow's own quicker pulse (asks,
// greeting, edit re-asks, confirm nudge): the flow is a form, not a chat, so
// the beat between turns is snappier than the 450ms general chat pulse.
const CONTACT_Q = "How do I contact Brian?"; // the emulated contact question

/* Typing humanization + TYPE_BASE/TYPE_SETTLE_MS, prefersReducedMotion, and the
   composer auto-grow -> ./terminal/typing (Stage 1 extraction). */

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

/* byId, currentScreen, chatlog, sink, beginTurn, removeGreeting, and
   scrollToNewest -> ./terminal/dom (Stage 1 extraction, the chat-log core).
   autoGrow -> ./terminal/typing. Both are imported at the top of this file. */

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
  // /contact carries its own docked composer (like /chat and the homepage), so
  // the header's jump-to-chat input row hides there too, else two composers
  // stack. It stays a normal interior header otherwise (data-screen "page").
  const ownsInput = onHome || onChat || p === "/contact";
  header.dataset.hchat = ownsInput ? "off" : "on";
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

/* announce/hint (the polite live region + transient hint line) -> ./terminal/a11y
   (Stage 1 extraction); the a11y module owns the announcer, and the render
   paths here import announce back. */

/* ------------------------------------------ route transitions (#150) ------ */
/* Nothing to do in script. The tide carries you: the persistent scene is
 * never covered, the reading column cross-fade + lift is the CSS-driven
 * main view-transition group (global.css), and the identity travel is the
 * scene bridge at the bottom of this file. The old wipe cover (#64) and its
 * loader hold are retired; navigations resolve as fast as the router can
 * swap. Reduced motion collapses the column move to an instant swap through
 * the explicit view-transition override in global.css. */

/* The roving page cursor (#63): ROVE_SELECTOR, roveEls, isRove, setRoveStop,
   moveRove, moveRoveEnd, and the once-per-load rove hint flag -> ./terminal/a11y
   (Stage 1 extraction). The keydown/focusin glue below imports them. */

/* ------------------------------------------------------------ chat output -- */

/* chatlog, the turn state (active turn + replay flag) with its accessors,
   beginTurn, sink, and scrollToNewest -> ./terminal/dom (Stage 1 extraction,
   the chat-log core). The line builders below still render through sink(). */

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
  softenPlaceholder();
}

/* Brian: once the thread holds visitor text the hint softens to the
   conversational "Write a message..."; the ORIGINAL invitation belongs to
   the pristine panel only (fresh arrival, or restored by [clear] below).
   Called from echo() so a session restore softens it too, and from
   armContact() because the contact flow's ephemeral turns never pass
   through echo() (Brian, 2026-07-21: an armed flow is an underway thread). */
function softenPlaceholder() {
  const f = byId("in-chat") as HTMLTextAreaElement | null;
  if (f && f.placeholder !== ONGOING_PH) {
    f.dataset.ph ??= f.placeholder;
    f.placeholder = ONGOING_PH;
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
  // Brian's rider (supersedes the #177 pristine restore): clear EMPTIES the
  // panel, with NO "# Cleared" note and NO greeting; the time-of-day greeting
  // belongs to fresh arrivals only. Every user turn begins with beginTurn, so
  // the only direct log children are the .turn blocks; removing them (and a
  // standing greeting, if the visitor cleared before typing) leaves it bare.
  for (const t of log.querySelectorAll(":scope > .turn")) t.remove();
  removeGreeting();
  setActiveTurn(null);
  contact = null; // clear also exits an in-progress contact flow
  llmHistory.length = 0; // clear wipes the model's context too
  purgeChat(); // #144: and the persisted session, so a cleared chat stays cleared
  // the bare panel is an initial state again: the original invitation returns
  const f = byId("in-chat") as HTMLTextAreaElement | null;
  if (f?.dataset.ph) f.placeholder = f.dataset.ph;
  scrollToNewest(); // bring the bare panel back to the top
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
/* The time-of-day salutation, shared by the pristine /chat greeting and the
   contact flow's opening line (#182), so the word always matches. morning
   5:00-11:59, afternoon 12:00-16:59, evening 17:00-4:59. */
function timeGreeting(): string {
  const h = new Date().getHours();
  return h >= 5 && h < 12
    ? "Good morning!"
    : h >= 12 && h < 17
      ? "Good afternoon!"
      : "Good evening!";
}

function greetingText(): string {
  return `${timeGreeting()} I’m Brian’s AI. Ask me anything about his work and I’ll do my best to answer.`;
}

function showGreeting() {
  const log = chatlog();
  if (!log || log.querySelector(".greeting")) return; // idempotent
  const d = document.createElement("div");
  d.className = "reply greeting"; // styled like an assistant reply
  d.textContent = greetingText();
  log.appendChild(d);
}

/* removeGreeting (drop the pristine greeting node) -> ./terminal/dom, beside
   the log core beginTurn calls it from; showGreeting stays here (it builds the
   greeting text). */

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
  setActiveTurn(null);
  contact = null; // leaving /chat also cancels an in-progress contact flow
}

/* Coerce a stored history into exactly what the hardened server accepts
   (validateHistory, audit H2/M2 on main): {role: user|assistant, content:
   non-empty string <= 2000 chars}, strictly alternating roles. Anything that
   would trip the server's 400 is dropped here, so a rehydrated history can
   never be rejected on the next send. */
function coerceHistory(raw: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  // named `hist` (not `out`) so it never reads as the module `out()` sink below
  const hist: { role: "user" | "assistant"; content: string }[] = [];
  let prev: string | null = null;
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const role = (e as { role?: unknown }).role;
    const raw2 = (e as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof raw2 !== "string" || raw2.length === 0) continue;
    if (role === prev) continue; // server requires strict alternation
    const content = raw2.length > 2000 ? raw2.slice(0, 2000) : raw2;
    hist.push({ role, content });
    prev = role;
  }
  return hist;
}

/* Known-good `out` bodies and redirect destinations: on replay we only trust
   values we ourselves ever produce. A tampered store falls back to inert text
   (out) or a plain label (redirect), never innerHTML or a live href. */
const OUT_ALLOW = new Set([HELP_HTML, HELLO_HTML, OFFLINE_HTML]);
const REDIRECT_HREFS = new Set(["/about", "/#log", "/eight-angle-ml"]);

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
  setActiveTurn(null);
  setReplaying(true); // rebuilt turns render settled (no send-motion entrance)
  for (const e of transcript) {
    if (e.t === "echo") beginTurn();
    renderEntry(e);
  }
  setReplaying(false);
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
 * POC server instead (chat/, http://localhost:8787), which speaks the
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

/* The contact endpoint is ALWAYS same-origin (Phase B): only `wrangler pages
   dev` serves /api/contact locally, and the POC bridge on 8787 does not speak
   it. On `astro dev` the route is simply absent, so a request 404s and the flow
   degrades to its deterministic asks plus a friendly "delivery unavailable"
   line, which is exactly the no-key graceful path. In production it is the
   Pages Function functions/api/contact.ts. */
const CONTACT_URL = "/api/contact";

/** rolling model conversation (distinct from the prompt's command history) */
const llmHistory: { role: "user" | "assistant"; content: string }[] = [];

/* #54 slug allowlist -> real routes. work is the homepage log; contact has no
   page of its own, so it runs its deterministic command instead (see below).
   resume is gone site-wide (#177 item 6) and out of the model prompt, but stays
   matched by MD_LINK as a backstop; eight-angle is matched but unpublished
   (item 11). Matched slugs with no route here degrade to a plain-text mention
   (renderReply) instead of a link that would 404. */
const SLUG_HREF: Record<string, string> = {
  about: "/about",
  work: "/#log",
  // the article page exists again (#188 image-first stub), so the model's
  // eight-angle slug is a real destination, not a no-op
  "eight-angle": "/eight-angle-ml",
};

const MD_LINK =
  /\[([^\]\n]{1,80})\]\(\/(about|work|eight-angle|contact|resume)\)/g;

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
  else if (slug === "contact") {
    // contact has no page (#183): the model choosing open_page:contact opens
    // the in-chat contact flow in place (greeting + arm + cancel chip), inside
    // the turn its reply already occupies. No new echo (the model's turn was
    // the ask).
    speakGreetingAndArm(null);
  } else if (slug in SLUG_HREF) navigate(SLUG_HREF[slug]);
  // any unknown slug is a no-op: no route, no 404. The prose the model
  // already rendered carries the mention.
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
  if (slug === "work" && screen !== "home")
    return { href: "/#log", name: "the work log" };
  // the Eight Angle article page exists again (#188 image-first stub), so the
  // slug earns the same guarded countdown as any other navigation away.
  if (slug === "eight-angle" && location.pathname !== "/eight-angle-ml")
    return { href: "/eight-angle-ml", name: "the Eight Angle article" };
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
  // fallback is the docked /chat composer (#in-chat, Phase 4B)
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
      // 429 rate limit (friendly body), 502/503 offline text (no email since
      // #183, just a try-again). renderReply builds text nodes only, so the
      // body is inert.
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
function pulseThen(
  render: (slot: HTMLElement | null) => void,
  ms: number = PULSE_MS
) {
  if (prefersReducedMotion()) {
    render(null);
    return;
  }
  const wait = thinking();
  window.setTimeout(() => render(wait), ms);
}

/* --------------------------------------- contact flow (Phase B item 1) ----- */
/* Clicking the contact nav item (or an inline [contact] link, or typing the
   contact command, or the model choosing open_page:contact) opens a
   conversational contact flow instead of printing an email address (#183). A
   time-of-day greeting invites the visitor to write their message with their
   name and email; a deterministic state machine collects message, then name,
   then email (Brian's order), assisted by a small LLM extraction in /api/contact
   that pulls all three out of one blob when they are given at once; an explicit
   confirm turn ALWAYS precedes delivery. The flow's turns are EPHEMERAL: none of
   them are written to the persisted transcript, so a /chat refresh (which
   restores recorded chat) leaves no half-finished flow behind, and leaving /chat
   drops it (dropThread). */

/* sessionStorage may be blocked (private mode); the typing emulation skips its
   theater then, like reduced motion, and renders the turn instantly. */
function storageBlocked(): boolean {
  try {
    sessionStorage.getItem(STORE_KEY);
    return false;
  } catch {
    return true;
  }
}

/* humanDelay + typeInto (the humanized keystroke emulation) -> ./terminal/typing
   (Stage 1 extraction); playContactEmulation below imports typeInto. */

/* The flow's opening line (Brian's copy, #182): the time-of-day word matches
   the pristine /chat greeting. */
function contactGreeting(): string {
  return `${timeGreeting()} You can contact Brian right here. Simply write your message, and include your name and email address.`;
}

/* -------- ephemeral turn builders (never recorded, so they never rehydrate) - */

function contactEcho(text: string) {
  const host = sink();
  if (!host) return;
  const d = document.createElement("div");
  d.className = "uline";
  d.textContent = text; // pre-wrap in CSS keeps a multi-line message readable
  host.appendChild(d);
  scrollToNewest();
}

/* An assistant line in the flow: announces (a11y) but is never recorded. `warn`
   tints it with the --warn attention token (the invalid-email notice). Reuses
   the thinking slot when given, so the pulse swaps to the line in place. */
function contactLine(
  text: string,
  slot: HTMLElement | null,
  warn = false
): HTMLElement | null {
  const host = sink();
  if (!host) return null;
  const d = slot?.isConnected ? slot : document.createElement("div");
  d.className = warn ? "reply contact-warn" : "reply";
  d.replaceChildren(document.createTextNode(text));
  if (!d.parentElement) host.appendChild(d);
  announce(text);
  scrollToNewest();
  return d;
}

/* -------- entry -------- */

function armContact() {
  contact = { name: null, email: null, message: null, awaiting: "blob" };
  softenPlaceholder();
}

/* Speak the greeting into `slot`, arm the flow, and append the [cancel] chip so
   abandoning is discoverable from the very first line (item 1a). Shared by every
   entry: the scripted echo entry, the model's open_page:contact, and the
   /contact route entry. */
function speakGreetingAndArm(slot: HTMLElement | null) {
  const el = contactLine(contactGreeting(), slot);
  el?.appendChild(contactCancelChip());
  armContact();
  // The greeting asks for the visitor's message, so the cursor is theirs:
  // focus lands in the composer the moment the flow arms (Brian, batch:
  // after the response to the auto-typed question, focus the input). The
  // page-swap entry paths reset focus to body during the navigation, so
  // the earlier focus() calls upstream cannot be relied on alone.
  byId(CHAT_INPUT)?.focus({ preventScroll: true });
}

/* On /chat: open a turn that echoes `echoText`, pulses, then speaks the greeting
   and arms the flow. */
function scriptedContactEntry(echoText: string) {
  beginTurn();
  contactEcho(echoText);
  pulseThen((slot) => speakGreetingAndArm(slot), CONTACT_PULSE_MS);
}

/* The /contact route entry (item 5): NO fake user echo (nobody typed anything),
   just a pulse then the greeting turn as the newest line, with the flow armed.
   Runs from initPage on /contact whether the panel is pristine or a thread was
   rehydrated below (the visitor came to contact, so the greeting is newest). */
function routeContactEntry() {
  if (contact) return; // already armed (defensive against a double page-load)
  beginTurn();
  pulseThen((slot) => speakGreetingAndArm(slot), CONTACT_PULSE_MS);
}

/* The contact nav item / inline [contact] link: land on /chat and TYPE the
   question (the emulation), then enter the flow. On /chat it plays in place.
   Reduced motion or blocked storage skips the typing. Focus ends in the
   composer. */
function playContactEmulation() {
  const input = byId(CHAT_INPUT) as HTMLTextAreaElement | null;
  const finish = () => {
    if (input) {
      input.value = "";
      autoGrow(input);
    }
    scriptedContactEntry(CONTACT_Q);
    input?.focus({ preventScroll: true });
  };
  if (!input || prefersReducedMotion() || storageBlocked()) {
    finish();
    return;
  }
  input.focus({ preventScroll: true });
  typeInto(input, CONTACT_Q, finish);
}

function contactMoment() {
  if (currentScreen() === "chat") {
    playContactEmulation();
  } else {
    // ride the pendingAfter mechanism with the emulation flag so initPage
    // focuses the composer before it types (#153 carry)
    pendingAfter = () => playContactEmulation();
    pendingEmulate = true;
    navigate("/chat");
  }
}

/* Typed "contact" and open_page:contact enter the flow directly, echoing the
   visitor's own word (no keystroke emulation). */
function enterContactTyped() {
  if (currentScreen() === "chat") {
    scriptedContactEntry("contact");
  } else {
    pendingAfter = () => scriptedContactEntry("contact");
    pendingEmulate = true;
    navigate("/chat");
  }
}

/* -------- collection state machine -------- */

const EMAIL_FIND = /[^\s@]+@[^\s@]+\.[^\s@]+/;
function firstEmail(text: string): string | null {
  const m = text.match(EMAIL_FIND);
  return m ? m[0].replace(/[.,;:>)\]]+$/, "") : null;
}
function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
function cleanName(text: string): string {
  let s = (text.split("\n")[0] ?? "").trim();
  s = s.replace(/^(my name is|i am|i'm|im|it is|it's|this is|name:?)\s+/i, "").trim();
  s = s.replace(/[.,;:!]+$/, "").trim();
  return (s || text.trim()).slice(0, 100);
}

interface Extracted {
  name: string | null;
  email: string | null;
  message: string | null;
}

/* Best-effort extraction of {name, email, message} from one blob via
   /api/contact. Returns null when the endpoint is unavailable (404 on astro
   dev, 503 with no key, network error), so the caller falls back to the
   deterministic asks: the flow works with zero LLM, and the extraction only lets
   it skip asks it can already fill. */
async function extractContact(text: string): Promise<Extracted | null> {
  try {
    const res = await fetch(CONTACT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "extract", text: text.slice(0, 2000) }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as Partial<Extracted> & { error?: string };
    if (d.error) return null;
    return {
      name: typeof d.name === "string" && d.name.trim() ? d.name.trim() : null,
      email: isEmail(d.email) ? d.email.trim() : null,
      message:
        typeof d.message === "string" && d.message.trim() ? d.message.trim() : null,
    };
  } catch {
    return null;
  }
}

/* Fill only the gaps: deterministic email always wins, a follow-up answer fills
   the field it answered, and the first-blob extraction fills whatever it found.
   A blob whose extraction ran but returned no message is left message-null on
   purpose (the visitor gave only details), so we ask for it. */
function mergeContact(
  text: string,
  ex: Extracted,
  detEmail: string | null,
  extractionRan: boolean
) {
  if (!contact) return;
  const prev = contact.awaiting;
  const em = detEmail ?? (isEmail(ex.email) ? ex.email : null);
  if (!contact.email && em) contact.email = em;
  if (!contact.name) {
    if (prev === "name") contact.name = cleanName(text);
    else if (ex.name) contact.name = ex.name;
  }
  if (!contact.message) {
    if (prev === "message") contact.message = text.trim();
    else if (ex.message) contact.message = ex.message;
    else if (prev === "blob" && !extractionRan) contact.message = text.trim();
  }
}

function collectContact(text: string) {
  if (!contact) return;
  const prev = contact.awaiting;
  const first = prev === "blob";
  const detEmail = firstEmail(text);
  if (first) {
    // the first blob is the only turn that hits the network (the /api/contact
    // extraction): show the thinking spinner while that round trip runs.
    const wait = thinking();
    void (async () => {
      const ex = await extractContact(text);
      const exv: Extracted = ex ?? { name: null, email: null, message: null };
      if (!contact) return; // cancelled or navigated away mid-request
      mergeContact(text, exv, detEmail, ex !== null);
      advanceContact(wait, false);
    })();
    return;
  }
  // every follow-up answer (message / name / email, and the edit re-asks) is
  // local: no extraction, so NO spinner (item 3). Merge synchronously, then
  // advance through the short contact pulse so the beat still reads as the
  // machine thinking briefly.
  const exv: Extracted = { name: null, email: null, message: null };
  mergeContact(text, exv, detEmail, false);
  const emailInvalid = prev === "email" && !contact.email;
  pulseThen((slot) => advanceContact(slot, emailInvalid), CONTACT_PULSE_MS);
}

/* The ask copy, factored out so the edit re-asks (editContactField) reuse the
   EXACT same strings advanceContact speaks the first time. */
const ASK_MESSAGE = "What would you like to say to Brian?";
const ASK_NAME = "Got it. And what is your name?";
const ASK_EMAIL = "Thanks. And what email should Brian reply to?";
const ASK_EMAIL_INVALID =
  "That does not look like an email address. What is the best email for Brian to reply to?";

/* Speak an ask line and append the [cancel] chip, so abandoning stays
   discoverable on every ask (item 1a). */
function askLine(text: string, slot: HTMLElement | null, warn = false) {
  const el = contactLine(text, slot, warn);
  el?.appendChild(contactCancelChip());
}

function advanceContact(slot: HTMLElement | null, emailInvalid = false) {
  if (!contact) return;
  if (!contact.message) {
    contact.awaiting = "message";
    askLine(ASK_MESSAGE, slot);
  } else if (!contact.name) {
    contact.awaiting = "name";
    askLine(ASK_NAME, slot);
  } else if (!contact.email) {
    contact.awaiting = "email";
    askLine(emailInvalid ? ASK_EMAIL_INVALID : ASK_EMAIL, slot, emailInvalid);
  } else {
    contact.awaiting = "confirm";
    renderConfirm(slot);
  }
}

/* Edit before send (item 2): a [edit name|email|message] chip on the confirm
   nulls that one field and re-asks it with the same copy, then the existing
   merge/advance machinery walks straight back to the confirm (every other field
   is still filled). No typed "edit" grammar. */
function editContactField(field: string) {
  if (!contact || contact.awaiting === "sending") return;
  if (field !== "name" && field !== "email" && field !== "message") return;
  contact[field] = null;
  contact.awaiting = field;
  beginTurn();
  const ask =
    field === "message" ? ASK_MESSAGE : field === "name" ? ASK_NAME : ASK_EMAIL;
  pulseThen((slot) => askLine(ask, slot), CONTACT_PULSE_MS);
  byId(CHAT_INPUT)?.focus({ preventScroll: true });
}

/* -------- confirm + send -------- */

/* One button builder in the flow's control grammar (a real button, like the
   keybar clear); data-contact (+ optional data-field) routes it in the click
   handler. `action` also names the class so the CSS can dress each kind (the
   filled primary .contact-send vs the quiet secondary cancel/edit). The label
   is a plain .lbl span so the routing attributes and aria-label stay
   byte-identical to the old bracket chip. */
function mkContactBtn(
  action: "send" | "cancel" | "edit",
  label: string,
  aria: string,
  field?: string
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `cbtn contact-${action}`;
  b.dataset.contact = action;
  if (field) b.dataset.field = field;
  b.setAttribute("aria-label", aria);
  const t = document.createElement("span");
  t.className = "lbl";
  t.textContent = label;
  b.append(t);
  return b;
}

/* A lone [cancel] chip (item 1a), appended to every contact ask + the greeting
   turn so abandoning the flow is discoverable everywhere, not only at confirm.
   Same grammar and aria-label as the confirm's cancel. */
function contactCancelChip(): HTMLElement {
  const row = document.createElement("div");
  row.className = "contact-actions";
  row.appendChild(
    mkContactBtn("cancel", "cancel", "Cancel and return to chat")
  );
  return row;
}

/* The confirm's [edit name] [edit email] [edit message] chips (item 2): each
   re-asks its one field, then merge/advance returns to the confirm. */
function contactEditChips(): HTMLElement {
  const row = document.createElement("div");
  row.className = "contact-edits";
  row.append(
    mkContactBtn("edit", "edit name", "Edit the name", "name"),
    mkContactBtn("edit", "edit email", "Edit the email", "email"),
    mkContactBtn("edit", "edit message", "Edit the message", "message")
  );
  return row;
}

/* The action chips ([send] / [cancel]) shown at confirm and on a send retry. */
function contactChips(): HTMLElement {
  const row = document.createElement("div");
  row.className = "contact-actions";
  row.append(
    mkContactBtn("send", "send", "Send this message to Brian"),
    mkContactBtn("cancel", "cancel", "Cancel and return to chat")
  );
  return row;
}

/* The explicit confirmation turn, always shown before delivery. Every visitor
   value is inserted as a TEXT NODE, never HTML. */
function renderConfirm(slot: HTMLElement | null) {
  const host = sink();
  if (!host || !contact) return;
  const box = slot?.isConnected ? slot : document.createElement("div");
  box.className = "reply contact-confirm";
  box.replaceChildren();

  const intro = document.createElement("p");
  intro.className = "cc-intro";
  intro.textContent = "Here is what I will send to Brian. Look right?";
  box.appendChild(intro);

  const dl = document.createElement("dl");
  dl.className = "cc-fields";
  const rows: [string, string][] = [
    ["Name", contact.name ?? ""],
    ["Email", contact.email ?? ""],
    ["Message", contact.message ?? ""],
  ];
  for (const [label, value] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    dl.append(dt, dd);
  }
  box.appendChild(dl);
  // edit-before-send (item 2): change any one field, then it walks back here
  box.appendChild(contactEditChips());
  box.appendChild(contactChips());

  const hint = document.createElement("p");
  hint.className = "cc-hint";
  hint.textContent = 'Or type "yes" to send, or "cancel" to stop.';
  box.appendChild(hint);

  if (!box.parentElement) host.appendChild(box);
  announce("Please confirm the message to send to Brian.");
  scrollToNewest();
}

const YES_RE =
  /^(y|yes|yep|yeah|yup|sure|ok|okay|send|send it|confirm|looks good|go|do it)$/i;
function handleConfirm(text: string) {
  if (YES_RE.test(text)) {
    doContactSend();
    return;
  }
  // not a yes, and cancel was caught earlier: nudge and re-offer the chips
  pulseThen((slot) => {
    contactLine('Type "yes" to send, or "cancel" to stop.', slot);
    sink()?.appendChild(contactChips());
  }, CONTACT_PULSE_MS);
}

/* After a failed delivery, drop back to the confirm state and re-offer the
   [send] / [cancel] chips so the visitor can retry from the same details.
   Shared by both send-failure paths (server not-ok and network throw). */
function reofferContactSend() {
  if (!contact) return;
  contact.awaiting = "confirm";
  sink()?.appendChild(contactChips());
}

function doContactSend() {
  if (!contact || contact.awaiting === "sending") return;
  const { name, email, message } = contact;
  if (!name || !email || !message) return;
  contact.awaiting = "sending";
  beginTurn();
  const wait = thinking();
  void (async () => {
    try {
      const res = await fetch(CONTACT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "send", name, email, message }),
        signal: AbortSignal.timeout(15_000),
      });
      const d = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        offline?: boolean;
      };
      if (res.ok && d.ok) {
        contactLine(
          "Thanks, your message is on its way to Brian.",
          wait
        );
        endContact(true);
      } else {
        contactLine(
          d.offline
            ? "Message delivery is unavailable right now. Please try again in a little while."
            : "Something went wrong sending that. Please try again.",
          wait,
          true
        );
        reofferContactSend(); // let them retry from the same details
      }
    } catch {
      contactLine(
        "Message delivery is unavailable right now. Please try again in a little while.",
        wait,
        true
      );
      reofferContactSend();
    }
  })();
}

/* Cancel from the [cancel] chip (no echo turn yet). */
function cancelContact() {
  if (!contact) return;
  beginTurn();
  endContact(false);
}

function endContact(success: boolean) {
  contact = null;
  if (!success) {
    contactLine("Cancelled. Ask me anything else, or type help.", null);
  }
  byId(CHAT_INPUT)?.focus({ preventScroll: true });
}

/* Every TYPED send while the flow is armed routes here (the submit handler). */
function contactSend(rawText: string) {
  if (!contact) return;
  const text = rawText.trim();
  if (!text) return;
  if (contact.awaiting === "sending") return; // a delivery is in flight
  beginTurn();
  contactEcho(text);
  if (/^(cancel|stop|nevermind|never mind|quit)$/i.test(text)) {
    endContact(false);
    return;
  }
  if (contact.awaiting === "confirm") {
    handleConfirm(text);
    return;
  }
  collectContact(text);
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
    // composer is the docked panel input (#in-chat, Phase 4B), so that is
    // where focus lands.
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
    // the email card is gone (#183): typed contact opens the in-chat flow,
    // echoing the visitor's own word (no keystroke emulation)
    enterContactTyped();
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
    // /contact route entry (item 5): the section carries data-contact-arm, so
    // instead of the pristine greeting we arm the flow with the contact
    // greeting as the newest turn. This runs whether the panel is pristine or a
    // thread was rehydrated below (the visitor came to contact). A pending
    // send/command/emulation still wins (it owns the turn). Because initPage
    // fires on every astro:page-load, a refresh of /contact re-arms
    // deterministically. /chat has no marker, so it keeps the normal greeting.
    const armed = !!document.querySelector(".screen[data-contact-arm]");
    if (armed && !after && !emulate) {
      routeContactEntry();
    } else if (!transcript.length && !after && !emulate) {
      // Greeting empty state: only when the panel is pristine (nothing
      // restored) AND no pending send/command/emulation is about to render a
      // turn. Run AFTER rehydrate so it can never flash before a restored or
      // pending thread renders.
      showGreeting();
    }
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
      const value = input.value;
      input.value = "";
      if (input instanceof HTMLTextAreaElement) autoGrow(input);
      // Brian's rider: focus STAYS in the composer after every send (Enter or
      // [send]). A send that navigates away (the homepage flow bar) hands
      // focus to the /chat composer via pendingFocus; an in-place /chat send
      // keeps it here.
      input.focus({ preventScroll: true });
      // Phase B item 1: while the contact flow is armed (only ever on /chat) it
      // owns every typed send, since the value is a message / name / email /
      // confirm answer, not a command or a chat question. [clear] and the
      // confirm chips are click paths, so they bypass this.
      if (contact && currentScreen() === "chat") contactSend(value);
      else run(value, true);
    },
    true
  );

  // clicks: the contact confirm chips, then keybar + nav command buttons.
  // Anchors (log entries, inline chat links) fall through to ClientRouter.
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    // Phase B: the confirm turn's [send] / [cancel] chips drive the flow.
    const cc = t.closest?.<HTMLElement>("button[data-contact]");
    if (cc && cc.dataset.contact && contact) {
      if (cc.dataset.contact === "send") doContactSend();
      else if (cc.dataset.contact === "cancel") cancelContact();
      else if (cc.dataset.contact === "edit")
        editContactField(cc.dataset.field ?? "");
      return;
    }
    const btn = t.closest?.<HTMLElement>("button[data-cmd]");
    if (btn && btn.dataset.cmd) {
      // any contact affordance (the nav item, an inline [contact] link in a
      // reply, the hello tour's Contact) opens the in-chat flow with the typing
      // emulation; the typed "contact" command enters the flow directly (run).
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
      if (!getRoveHinted() && t.matches(":focus-visible")) {
        setRoveHinted(true);
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

    // Bare left/right arrows page a closed loop through the whole log with
    // the homepage as the cap on both ends (Brian, 2026-07-21): home -> newest
    // -> ... -> oldest -> home, right moving older-ward and left reversing it.
    // Never with modifiers (browser history), never from editable or
    // scrollable contexts, so typing and code-block scrolling keep the keys.
    if (
      (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
      !e.altKey &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !t?.closest?.("input, textarea, select, [contenteditable], pre, video, audio")
    ) {
      const screen = currentScreen();
      if (screen === "log") {
        const link = document.querySelector<HTMLAnchorElement>(
          e.key === "ArrowLeft" ? ".anavmore .navnewer" : ".anavmore .navolder"
        );
        e.preventDefault();
        // Past either end of the chain the homepage is the bookend, so arrow
        // paging always returns to the ledger before wrapping around.
        if (link) link.click();
        else navigate("/");
        return;
      }
      if (screen === "home") {
        // From the ledger, right enters the loop at the newest article and
        // left at the oldest. External entries carry target="_blank" and own
        // no page, so only internal rows are loop stops. Left/right paging
        // outranks the roving cursor here; up/down still move the cursor.
        const rows = document.querySelectorAll<HTMLAnchorElement>(
          ".clog a.lentry:not([target])"
        );
        if (rows.length) {
          e.preventDefault();
          (e.key === "ArrowRight" ? rows[0] : rows[rows.length - 1]).click();
          return;
        }
      }
    }

    if (e.key === "Escape") {
      // #143 req 2: while a redirect countdown is running, Escape cancels it
      // and stays put. It takes priority over the blur/leave behavior below so
      // focus never leaves the input the visitor is in.
      if (redirect) {
        e.preventDefault();
        cancelRedirect("escape");
        return;
      }
      // Contact flow abandon (item 1b): while the flow is armed on /chat, an
      // Escape with an EMPTY composer abandons the flow immediately (the spoken
      // "Cancelled" line flows through cancelContact's announcer); with typed
      // text present, Escape only blurs so the draft is never discarded (and
      // never navigates away mid-flow). No second-Escape confirm.
      if (contact && currentScreen() === "chat") {
        const ta = byId(CHAT_INPUT) as HTMLTextAreaElement | null;
        if (!ta || ta.value.trim() === "") {
          e.preventDefault();
          cancelContact();
          return;
        }
        e.preventDefault();
        ta.blur();
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
  document.addEventListener("astro:before-swap", (event) => {
    cancelRedirect("nav");
    if (currentScreen() === "chat") dropThread();

    // #150 Phase 3 matrix gate. The destination scene theme is read from the
    // INCOMING document's own .screen section (undefined -> the site default),
    // never from the persisted [data-scene] node, which still holds the OLD
    // page's theme. GOVERNING RULE (Brian): the choreographed sequence runs
    // ONLY when the destination theme differs from the current one; a same-mark
    // crossing (home <-> /about, both "default") keeps today's fast concurrent
    // fade with no stamp. The stamp is recomputed here on every swap and never
    // mutated mid-transition; documentElement persists across the swap, so it
    // survives the transition it governs.
    const root = document.documentElement;
    navChoreographed = false;
    if (sceneMod) {
      const raw = event.newDocument.querySelector<HTMLElement>(".screen")
        ?.dataset.sceneTheme;
      const destTheme = sceneMod.isThemeName(raw) ? raw : "default";
      const handle = sceneMod.initScene();
      if (handle && handle.getTheme() !== destTheme) {
        root.dataset.vtMatrix = ""; // opens the matrix CSS window for this swap
        handle.navTravel(destTheme); // compressed mark travel + one nav surge
        navChoreographed = true;
      }
    }
    // Same-theme, or the module has not loaded yet: ensure no stale stamp is
    // present so the default fast fade governs the column swap.
    if (!navChoreographed) delete root.dataset.vtMatrix;
  });

  // #145/#150: stamp the persisted header's per-page state during the swap
  // (astro:after-swap runs before the new frame paints, so the stamp can
  // never shift visible layout) and again on page-load as a safety net.
  document.addEventListener("astro:after-swap", syncHeaderChat);
  document.addEventListener("astro:page-load", syncHeaderChat);

  // Article videos arrive DEAD after a client-side navigation: ClientRouter
  // parses the next page with DOMParser, and a media element created in an
  // inactive document never runs resource selection, so it sits at
  // readyState 0 with working controls that do nothing (Brian: "I cannot
  // interact with any video!"). load() re-runs resource selection on the
  // adopted element. Hard loads never need this; after-swap only fires on
  // client-side navigations.
  document.addEventListener("astro:after-swap", () => {
    document.querySelectorAll("video").forEach((v) => v.load());
  });
  // Reduced motion also governs autoplaying b-roll (silent loops on
  // articles): strip the autoplay before it fires and leave the visitor
  // the normal controls. Runs on page-load so hard loads are covered too.
  document.addEventListener("astro:page-load", () => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll<HTMLVideoElement>("video[autoplay]").forEach((v) => {
      v.removeAttribute("autoplay");
      v.pause();
    });
  });

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
  const syncSceneState = (surge = false) => {
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
    // #186 part 1: the field swells on every client-side navigation, sharing
    // a start with the identity travel above (setTheme). surge() is a no-op
    // under reduced motion or while paused and writes no travel accumulator,
    // so the swell rides on top of the 2.6s travel without fighting it. Fired
    // only from the astro:page-load path (never the post-import catch-up
    // below), so the initial direct load gets the loud wake (part 2) rather
    // than a nav surge. The CSS column swap is untouched: the surge is a
    // scalar inside the tide's own rAF tick, sharing no variable with it.
    if (surge) handle.surge();
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
  document.addEventListener("astro:page-load", () => {
    // #150 Phase 3: when the before-swap gate ran navTravel (the destination
    // theme differed), the identity travel AND the nav surge already fired
    // during the swap. Page-load then only syncs the chat/home tint: setTheme
    // no-ops on the already-applied destination, and NO second surge fires.
    // Otherwise the normal fallback path travels + surges here (covers a
    // same-theme crossing, the module not being loaded yet, and hard loads).
    if (navChoreographed) {
      navChoreographed = false;
      syncSceneState(false);
    } else {
      syncSceneState(true);
    }
  });
}

const w = window as unknown as { __terminalInit?: boolean };
if (!w.__terminalInit) {
  w.__terminalInit = true;
  setupOnce();
}

export {};
