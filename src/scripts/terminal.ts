/**
 * Terminal controller for brohde.com.
 *
 * One bundled module drives every interactive terminal behavior:
 *   - deterministic command router (work/about/resume/contact/help/home/clear
 *     + /slash aliases + free-form -> live chat), ported from build-log-v3.html
 *   - command autocomplete at the prompt (#48)
 *   - shell-style prompt history (#44)
 *   - the boot sequence (#36; #64: site entry only, never on internal navs)
 *   - the roving page cursor (#63) and the terminal wipe transition (#64)
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
import {
  navigate,
  TransitionBeforePreparationEvent,
} from "astro:transitions/client";

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
let bootCancel: (() => void) | null = null;

/* --------------------------------------------------------------- helpers --- */

const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const byId = (id: string) => document.getElementById(id);

function currentScreen(): string {
  return (
    document.querySelector("[data-screen]")?.getAttribute("data-screen") ?? ""
  );
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

/* ---------------------------------------- route transitions (#64, #69) ---- */
/* Named transition kinds, resolved per navigation:
 *
 * "wipe" (#64), the default for internal navigations: a ground-colored cover
 * with a resting block caret drops before the old page changes, the swap
 * happens underneath (the underlying view transition is animation:none in
 * global.css), and the cover lifts ~50ms after the new page has rendered, so
 * the destination is always visually complete when it appears.
 *
 * "morph" (#69), home <-> chat only: the slab expands toward full window on
 * chat engagement and collapses back home, both directions elegant, never a
 * hard cut. Mechanism: the slab carries a persistent view-transition-name
 * (.vtslab, on the home slab and the chat screen); this layer stamps
 * html[data-vt="morph"], which global.css uses to re-time the UA's group
 * interpolation and cross-fade the editorial root around it. The wipe's
 * opaque cover MUST NOT drop for this kind: it would hide the morph. The
 * attribute is re-stamped after the swap (Astro replaces root attributes)
 * so it is present when the transition's animations are set up, and cleared
 * once the morph has finished.
 *
 * "instant" under reduced motion: no cover, no held loader, no morph (the
 * data-vt attribute is never stamped, so every VT animation stays none).
 */
type TransitionKind = "wipe" | "instant" | "morph";

const WIPE_HOLD_MS = 140; // cover time before the swap may land
const WIPE_LIFT_MS = 50; // settle time after the new page renders
const MORPH_MS = 360; // keep in sync with the [data-vt="morph"] CSS timings

let wipeEl: HTMLElement | null = null;
let wipeTimer = 0; // one handle for pending lift AND failsafe: a new drop cancels both
let navKind: TransitionKind = "instant"; // kind of the navigation in flight
let vtTimer = 0; // pending data-vt cleanup; a new navigation cancels it

/** the home <-> chat pair morphs; everything else wipes (instant under RM) */
function resolveTransition(from?: URL, to?: URL): TransitionKind {
  if (RM()) return "instant";
  if (from && to) {
    const a = from.pathname;
    const b = to.pathname;
    if ((a === "/" && b === "/chat") || (a === "/chat" && b === "/")) {
      return "morph";
    }
  }
  return "wipe";
}

function stampMorph(on: boolean) {
  const root = document.documentElement;
  if (on) root.setAttribute("data-vt", "morph");
  else root.removeAttribute("data-vt");
}

function wipe(): HTMLElement {
  if (!wipeEl) {
    wipeEl = document.createElement("div");
    wipeEl.id = "wipe";
    wipeEl.hidden = true;
    wipeEl.setAttribute("aria-hidden", "true");
    wipeEl.appendChild(document.createElement("span"));
    // Attached to <html>, not <body>: the router swaps the body wholesale,
    // and the cover must survive the swap to bridge old and new page.
    document.documentElement.appendChild(wipeEl);
  }
  return wipeEl;
}

function dropWipe() {
  const w = wipe();
  w.hidden = false;
  clearTimeout(wipeTimer);
  // never leave the page covered if a navigation dies midway
  wipeTimer = window.setTimeout(() => {
    w.hidden = true;
  }, 4000);
}

function liftWipe() {
  if (!wipeEl || wipeEl.hidden) return;
  clearTimeout(wipeTimer);
  // plain timeout, deliberately no rAF: rAF never fires in a hidden or
  // throttled tab and would leave the cover stuck over the page
  wipeTimer = window.setTimeout(() => {
    if (wipeEl) wipeEl.hidden = true;
  }, WIPE_LIFT_MS);
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

function line(cls: string, text?: string) {
  const log = chatlog();
  if (!log) return;
  const d = document.createElement("div");
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  log.appendChild(d);
  scrollChatBottom();
}

function echo(t: string) {
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
  scrollChatBottom();
}

function out(html: string) {
  const log = chatlog();
  if (!log) return;
  const d = document.createElement("div");
  d.className = "out";
  d.innerHTML = html; // static strings only, never user input
  log.appendChild(d);
  announce(d.textContent ?? "");
  scrollChatBottom();
}

function clearChat() {
  const log = chatlog();
  if (!log) return;
  log.innerHTML = "";
  llmHistory.length = 0; // clear wipes the model's context too
  line("cmt", "# Cleared");
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

/** Model prose -> DOM. Text nodes only, plus allowlisted links; never HTML. */
function renderReply(text: string) {
  const log = chatlog();
  if (!log) return;
  const d = document.createElement("div");
  d.className = "reply";
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
  log.appendChild(d);
  announce(text);
  scrollChatBottom();
}

function openSlug(slug: string) {
  if (slug === "work") goHomeThen(scrollToLog);
  else if (slug === "contact") out(CONTACT_HTML);
  else if (slug === "resume") out(RESUME_HTML);
  else if (slug in SLUG_HREF) navigate(SLUG_HREF[slug]);
}

async function askLive(q: string) {
  echo(q);
  const log = chatlog();
  const wait = document.createElement("div");
  wait.className = "cmt";
  wait.textContent = "…";
  log?.appendChild(wait);
  scrollChatBottom();
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
    wait.remove();
    if (!res.ok || d.error) {
      // server-sent error bodies ({error}) render verbatim: 400 validation,
      // 429 rate limit (friendly body), 502/503 offline text with the email.
      // renderReply builds text nodes only, so the body is inert.
      renderReply(d.error || "Something went wrong. Try again in a moment.");
      return;
    }
    if (d.text) renderReply(d.text);
    llmHistory.push(
      { role: "user", content: q },
      { role: "assistant", content: d.text || `(opened ${d.open_page})` }
    );
    if (d.usage && IS_LOCAL) {
      // dev-only telemetry line; visitors never see cost figures
      line(
        "cmt",
        `# ${d.usage.input} in · ${d.usage.output} out · $${(d.cost ?? 0).toFixed(4)}`
      );
    }
    if (d.open_page) {
      line("cmt", `# Opening ${d.open_page}…`);
      const slug = d.open_page;
      window.setTimeout(() => openSlug(slug), 700);
    }
  } catch {
    wait.remove();
    out(OFFLINE_HTML);
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
    // open (expand into) the chat itself; never send "chat" as a question
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

  // free-form question: the live chat (expands the slab, #69)
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

/* ----------------------------------------------------------------- boot ---- */

function runBoot() {
  const root = document.documentElement;
  const els = Array.from(document.querySelectorAll<HTMLElement>(".bseq"));
  const input = byId("in-home") as HTMLInputElement | null;
  if (!input || !els.length) {
    root.classList.remove("boot");
    return;
  }

  const HELLO = "hello";
  const T_HOLD = 500;
  const T_CHAR = 85;
  const T_BEAT = 460;
  const T_STEP = 50;
  const tReveal = T_HOLD + (HELLO.length - 1) * T_CHAR + T_BEAT;
  const start = Date.now();
  let shown = 0;
  let cleared = false;
  let timer = 0;

  function end(clearInput: boolean) {
    if (!root.classList.contains("boot")) return;
    clearInterval(timer);
    root.classList.remove("boot");
    if (
      clearInput &&
      input &&
      HELLO.slice(0, input.value.length) === input.value
    ) {
      input.value = "";
    }
    document.removeEventListener("keydown", skip, true);
    document.removeEventListener("pointerdown", skip, true);
    input?.removeEventListener("input", keep);
    bootCancel = null;
  }
  function skip() {
    end(true);
  }
  function keep() {
    end(false);
  }

  bootCancel = () => end(false);

  document.addEventListener("keydown", skip, true);
  document.addEventListener("pointerdown", skip, true);
  input.addEventListener("input", keep);

  timer = window.setInterval(() => {
    const t = Date.now() - start;
    if (t < T_HOLD) return;
    if (t < tReveal) {
      const n = Math.min(HELLO.length, 1 + Math.floor((t - T_HOLD) / T_CHAR));
      if (input.value !== HELLO.slice(0, n)) input.value = HELLO.slice(0, n);
      return;
    }
    if (!cleared) {
      cleared = true;
      input.value = "";
    }
    const k = Math.min(els.length, 1 + Math.floor((t - tReveal) / T_STEP));
    while (shown < k) els[shown++].classList.add("bon");
    if (shown >= els.length) end(false);
  }, 24);
}

function cancelBoot() {
  if (bootCancel) bootCancel();
}

/* --------------------------------------------------- per-page init (VT) ---- */

function initPage() {
  cancelBoot();
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

  const root = document.documentElement;
  if (currentScreen() === "home" && root.classList.contains("boot") && !RM()) {
    runBoot();
  } else {
    root.classList.remove("boot");
  }

  // localhost only: the chat preview note reflects the live POC bridge
  if (IS_LOCAL && currentScreen() === "chat") {
    const note = byId("chat-note");
    if (note) note.textContent = "# Live model via the local POC";
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
  // while the cursor group or a prompt input owns focus; the roving tab stop
  // follows focus (clicks included) so Tab re-enters where the cursor left.
  document.addEventListener("focusin", (e) => {
    const t = e.target as HTMLElement;
    const live = !!t.matches?.(".prompt input") || isRove(t);
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
      if (ac.open) {
        e.preventDefault();
        closeAC();
        return;
      }
      // single-cursor model (#63): the first Escape parks the cursor back on
      // the wordmark (blur); from rest, Escape leaves non-home screens.
      if (t && (t.matches?.(".prompt input") || isRove(t))) {
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

  // Route transitions (#64, #69), resolved per navigation. Wipe: drop the
  // cover as soon as an internal navigation starts and hold the router's
  // loader so it stays down for at least WIPE_HOLD_MS before the swap can
  // land. Morph: NO cover (it would hide the slab morphing); stamp the
  // html[data-vt] hook the morph CSS keys on. Applies to every direction
  // (links, commands, Escape, back/forward all flow through the router).
  document.addEventListener("astro:before-preparation", (e) => {
    clearTimeout(vtTimer);
    const prep = e instanceof TransitionBeforePreparationEvent ? e : null;
    navKind = resolveTransition(prep?.from ?? undefined, prep?.to ?? undefined);
    stampMorph(navKind === "morph");
    if (navKind !== "wipe") return;
    dropWipe();
    if (prep) {
      const started = Date.now();
      const load = prep.loader;
      prep.loader = async () => {
        await load();
        const left = WIPE_HOLD_MS - (Date.now() - started);
        if (left > 0) await new Promise((r) => setTimeout(r, left));
      };
    }
  });

  // Astro's swap replaces the root element's attributes with the new page's,
  // which would drop data-vt before the transition's animations are set up
  // (that happens at ready-time, AFTER the swap). Re-stamp it here, then
  // clear once the morph has finished so a stale hook can never restyle a
  // later navigation.
  document.addEventListener("astro:after-swap", () => {
    if (navKind === "morph") stampMorph(true);
  });

  // Lift the wipe only after the new page is rendered and initialized, so
  // the destination is visually complete the moment it appears.
  document.addEventListener("astro:page-load", () => {
    liftWipe();
    if (navKind === "morph") {
      clearTimeout(vtTimer);
      vtTimer = window.setTimeout(() => stampMorph(false), MORPH_MS + 140);
    }
  });

  // Boot plays on SITE ENTRY ONLY (#64): the pre-paint gate in BaseLayout
  // sets html.boot on genuine full loads of the homepage, and Astro never
  // re-runs that unchanged inline script on client-side navigations. Here we
  // only ever CLEAR the class after a swap, so internal navigation back to
  // home renders instantly complete and the sequence never replays.
  document.addEventListener("astro:after-swap", () => {
    document.documentElement.classList.remove("boot");
  });

  // stop a running boot if we navigate away mid-sequence
  document.addEventListener("astro:before-swap", cancelBoot);

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
  const requestScene = () => {
    if (sceneRequested || !document.querySelector("[data-scene]")) return;
    sceneRequested = true;
    const idle: (cb: () => void) => void =
      "requestIdleCallback" in window
        ? (cb) => requestIdleCallback(cb, { timeout: 2500 })
        : (cb) => window.setTimeout(cb, 1500);
    idle(() => {
      void import("@/scripts/scene").then((m) => m.initScene());
    });
  };
  document.addEventListener("astro:page-load", requestScene);
}

const w = window as unknown as { __terminalInit?: boolean };
if (!w.__terminalInit) {
  w.__terminalInit = true;
  setupOnce();
}

export {};
