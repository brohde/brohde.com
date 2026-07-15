/**
 * Terminal controller for brohde.com.
 *
 * One bundled module drives every interactive terminal behavior:
 *   - deterministic command router (work/about/resume/contact/help/home/clear
 *     + /slash aliases + free-form -> chat stub), ported from build-log-v3.html
 *   - command autocomplete at the prompt (#48)
 *   - shell-style prompt history (#44)
 *   - the boot sequence (#36, #41)
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

const COMMANDS: Cmd[] = [
  { name: "work", desc: "browse the log" },
  { name: "about", desc: "who I am" },
  { name: "resume", desc: "resume.pdf" },
  { name: "contact", desc: "email + linkedin" },
  { name: "chat", desc: "ask about my work" },
  { name: "help", desc: "list commands" },
  { name: "home", desc: "back to the log" },
  { name: "clear", desc: "wipe this chat" },
];
const CMD_NAMES = new Set(COMMANDS.map((c) => c.name));

/* static console strings (innerHTML sinks below take only these) */
const HELP_HTML =
  "commands\n" +
  "  work      browse the log\n" +
  "  about     who I am\n" +
  "  resume    resume.pdf\n" +
  "  contact   email + linkedin\n" +
  "  chat      ask about my work\n" +
  "  home      back to the log\n" +
  "  clear     wipe this chat\n" +
  "  help      this list\n" +
  '<span class="c"># anything else goes to chat</span>';

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
    if (clearInput && input && HELLO.slice(0, input.value.length) === input.value) {
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

  const after = pendingAfter;
  pendingAfter = null;
  const focusId = pendingFocus;
  pendingFocus = null;

  const root = document.documentElement;
  if (
    currentScreen() === "home" &&
    root.classList.contains("boot") &&
    !RM()
  ) {
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
  // form submit: run whatever is typed
  document.addEventListener("submit", (e) => {
    const form = (e.target as HTMLElement).closest?.("form[data-screen-form]");
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector<HTMLInputElement>("input");
    if (!input) return;
    run(input.value, true);
    input.value = "";
    closeAC();
  });

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
    if (e.key === "Escape") {
      if (ac.open) {
        e.preventDefault();
        closeAC();
        return;
      }
      if (currentScreen() !== "home") {
        e.preventDefault();
        navigate("/");
      }
      return;
    }

    const t = e.target as HTMLElement;
    if (!t.matches?.(".prompt input")) return;
    const input = t as HTMLInputElement;

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
      if (e.key === "Enter" && ac.sel >= 0) {
        e.preventDefault();
        run(ac.items[ac.sel].name, true);
        input.value = "";
        closeAC();
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

  // Set the boot class before paint on client-side navigations, so the home
  // screen never flashes its full content before the reveal. (The initial
  // hard load is handled by the pre-paint gate in BaseLayout.)
  document.addEventListener("astro:after-swap", () => {
    const root = document.documentElement;
    if (location.pathname === "/" && !RM()) root.classList.add("boot");
    else root.classList.remove("boot");
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
