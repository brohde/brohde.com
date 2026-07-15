/**
 * Terminal controller for brohde.com.
 *
 * One bundled module drives every interactive terminal behavior:
 *   - deterministic command router (work/about/resume/contact/help/home/clear
 *     + /slash aliases + free-form -> chat stub), ported from build-log-v3.html
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

const COMMANDS: Cmd[] = [
  { name: "work", desc: "browse the log" },
  { name: "about", desc: "who I am" },
  { name: "resume", desc: "resume.pdf" },
  { name: "contact", desc: "email + linkedin" },
  { name: "chat", desc: "ask me anything" },
  { name: "hello", desc: "a quick tour" },
  { name: "help", desc: "list commands" },
  { name: "home", desc: "back to the log" },
  { name: "clear", desc: "wipe this chat" },
];
/* static console strings (innerHTML sinks below take only these) */
const HELP_HTML =
  "commands\n" +
  "  hello     a quick tour\n" +
  "  work      browse the log\n" +
  "  about     who I am\n" +
  "  resume    resume.pdf\n" +
  "  contact   email + linkedin\n" +
  "  chat      ask me anything\n" +
  "  home      back to the log\n" +
  "  clear     wipe this chat\n" +
  "  help      this list\n" +
  '<span class="c"># anything else goes to chat</span>';

/* hello: a short natural-language tour of the core pages (Brian's ask,
   2026-07-15). Links are underlined, keyboard reachable, and join the roving
   cursor order like any other chat output. */
const HELLO_HTML =
  "hello! here's what's on the site:\n" +
  '<a href="/">work</a>: the build log, case studies of what I ship\n' +
  '<a href="/about">about</a>: who I am in four paragraphs\n' +
  '<a href="/resume.pdf">resume</a>: the PDF\n' +
  '<a href="/chat">chat</a>: ask me anything\n' +
  '<a href="mailto:brian@brohde.com">contact</a>: start a conversation';

const CONTACT_HTML =
  'email     <a href="mailto:brian@brohde.com">brian@brohde.com</a>\n' +
  'linkedin  <a href="https://www.linkedin.com/in/brian-rohde-4ba3558/" target="_blank" rel="noopener">/in/brian-rohde-4ba3558</a>\n' +
  'x         <a href="https://x.com/brianxbuilds" target="_blank" rel="noopener">@brianxbuilds</a>';

const RESUME_HTML =
  'resume    <a href="/resume.pdf">resume.pdf</a>\n' +
  '<span class="c"># opens the PDF in a new tab on the live site</span>';

const STUB_HTML =
  "the live model is coming soon.\n" +
  '<span class="c"># chat will run on claude haiku when the site ships. for now, type help, or email brian@brohde.com.</span>';

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

/* ---------------------------------------------- route transitions (#64) --- */
/* Every internal navigation shares one transition, both directions: the
 * ~140ms terminal wipe from build-log-v3.html. A ground-colored cover with a
 * resting block caret drops before the old page changes, the swap happens
 * underneath (the underlying view transition is set to animation:none in
 * global.css), and the cover lifts ~50ms after the new page has rendered, so
 * the destination is always visually complete when it appears.
 *
 * Structured as named kinds so the next phase (option C: the slab
 * expand/collapse morph into chat) can slot in as another kind here instead
 * of reworking this layer: resolveTransition() picks per navigation, each
 * kind covers/uncovers around the ClientRouter lifecycle. Under reduced
 * motion navigation is instant: no cover, no held loader.
 */
type TransitionKind = "wipe" | "instant";

const WIPE_HOLD_MS = 140; // cover time before the swap may land
const WIPE_LIFT_MS = 50; // settle time after the new page renders

let wipeEl: HTMLElement | null = null;
let wipeTimer = 0; // one handle for pending lift AND failsafe: a new drop cancels both

function resolveTransition(): TransitionKind {
  return RM() ? "instant" : "wipe";
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
  const next =
    i === -1 ? els[0] : els[(i + dir + els.length) % els.length];
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
  line("cmt", "# cleared");
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

function askStub(q: string) {
  echo(q);
  out(STUB_HTML);
}

function toChat(q: string, viaKb: boolean) {
  if (currentScreen() === "chat") {
    askStub(q);
  } else {
    pendingAfter = () => askStub(q);
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
    if (currentScreen() === "home") hint("# you are home");
    else navigate("/");
    return;
  }
  if (cmd === "about") {
    if (currentScreen() !== "about") navigate("/about");
    return;
  }
  if (cmd === "clear") {
    if (currentScreen() === "chat") clearChat();
    else hint("# nothing to clear here");
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

  // free-form question: the chat stub (live model deferred)
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
        hint("# arrows move the cursor · enter opens");
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

  // Route transitions (#64): drop the wipe as soon as an internal navigation
  // starts, and hold the router's loader so the cover stays down for at
  // least WIPE_HOLD_MS before the swap can land. Applies to every direction
  // (links, commands, Escape, back/forward all flow through the router).
  document.addEventListener("astro:before-preparation", (e) => {
    if (resolveTransition() !== "wipe") return;
    dropWipe();
    if (e instanceof TransitionBeforePreparationEvent) {
      const started = Date.now();
      const load = e.loader;
      e.loader = async () => {
        await load();
        const left = WIPE_HOLD_MS - (Date.now() - started);
        if (left > 0) await new Promise((r) => setTimeout(r, left));
      };
    }
  });

  // Lift the wipe only after the new page is rendered and initialized, so
  // the destination is visually complete the moment it appears.
  document.addEventListener("astro:page-load", liftWipe);

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
}

const w = window as unknown as { __terminalInit?: boolean };
if (!w.__terminalInit) {
  w.__terminalInit = true;
  setupOnce();
}

export {};
