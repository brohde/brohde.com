// Generates eval-review.html (an interactive grading page) from transcript.md.
// Run after every eval: node make-review.mjs
// The studio lead publishes the result as a claude.ai artifact for Brian to mark.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const md = readFileSync(path.join(here, "transcript.md"), "utf8");

const runLine = md.match(/^Model: (.+)$/m)?.[1] ?? "unknown run";
const totalCost = md.match(/\*\*Total eval cost: (\$[\d.]+)\*\*/)?.[1] ?? "?";

const items = [];
const blocks = md.split(/^## /m).slice(1);
for (const b of blocks) {
  const head = b.match(/^\[(\w+)\] (.+)$/m);
  if (!head) continue;
  const action = b.match(/\*\*action:\*\* (.+)$/m)?.[1] ?? "?";
  const cost = b.match(/<sub>(.+)<\/sub>/)?.[1] ?? "";
  const reply =
    b
      .split(/\*\*action:\*\*.+\n/)[1]
      ?.split(/<sub>/)[0]
      ?.trim() ?? "";
  items.push({ cat: head[1], q: head[2], action, reply, cost });
}

const DATA = JSON.stringify({ run: runLine, totalCost, items }).replace(
  /</g,
  "\\u003c"
);

const html = `<title>chat eval review · brohde.com</title>
<style>
  :root {
    --bg: #0E1512; --ink: #D6E5DC; --bright: #F2F7F3; --dim: #8FA79A;
    --accent: #7EE787; --onaccent: #0E1512; --line: #2E4A3C; --well: #12201A;
    --fail: #FF6E96; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: light) {
    :root { --bg: #FBFBF8; --ink: #14211A; --bright: #14211A; --dim: #3F5348;
      --accent: #086148; --onaccent: #FBFBF8; --line: #C9D4CC; --well: #F0F2EC; --fail: #B4325E; }
  }
  :root[data-theme="dark"] { --bg: #0E1512; --ink: #D6E5DC; --bright: #F2F7F3; --dim: #8FA79A;
    --accent: #7EE787; --onaccent: #0E1512; --line: #2E4A3C; --well: #12201A; --fail: #FF6E96; }
  :root[data-theme="light"] { --bg: #FBFBF8; --ink: #14211A; --bright: #14211A; --dim: #3F5348;
    --accent: #086148; --onaccent: #FBFBF8; --line: #C9D4CC; --well: #F0F2EC; --fail: #B4325E; }

  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 13.5px/1.65 var(--mono); -webkit-text-size-adjust: 100%; }
  a { color: var(--accent); text-underline-offset: 3px; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .wrap { max-width: 780px; margin: 0 auto; padding: 0 18px 80px; }

  header.top { position: sticky; top: 0; z-index: 5; background: var(--bg); border-bottom: 1px solid var(--line); padding: 12px 0; }
  header.top .wrap { padding-bottom: 0; }
  h1 { font: 700 18px var(--mono); color: var(--accent); margin: 0 0 2px; }
  .meta { color: var(--dim); font-size: 12px; margin: 0; }
  .bar { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; margin-top: 10px; }
  .chip { font: 600 11.5px var(--mono); border: 1px solid var(--line); background: none; color: var(--ink);
    border-radius: 999px; padding: 5px 11px; cursor: pointer; min-height: 32px; }
  .chip[aria-pressed="true"] { background: var(--accent); color: var(--onaccent); border-color: var(--accent); }
  .prog { margin-left: auto; font-size: 12px; color: var(--dim); }
  .prog b { color: var(--bright); }

  .card { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px 12px; margin-top: 14px; background: var(--well); }
  .card.pass { border-color: var(--accent); }
  .card.fail { border-color: var(--fail); }
  .cat { display: inline-block; font: 700 10.5px var(--mono); letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--dim); border: 1px solid var(--line); border-radius: 4px; padding: 1px 7px; margin-bottom: 6px; }
  .q { font-weight: 700; color: var(--bright); margin: 0 0 8px; }
  .q .p { color: var(--accent); }
  .act { font-size: 12px; color: var(--dim); margin: 0 0 6px; }
  .act b { color: var(--accent); font-weight: 600; }
  .reply { font-family: var(--sans); font-size: 14.5px; white-space: pre-wrap; overflow-wrap: anywhere;
    border-left: 2px solid var(--line); padding-left: 12px; margin: 8px 0; max-width: 62ch; }
  .cost { font-size: 11px; color: var(--dim); margin: 6px 0 10px; }
  .verdict { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .vbtn { font: 700 12px var(--mono); border: 1px solid var(--line); background: none; color: var(--ink);
    border-radius: 6px; padding: 8px 16px; cursor: pointer; min-height: 40px; }
  .vbtn.on-pass { background: var(--accent); color: var(--onaccent); border-color: var(--accent); }
  .vbtn.on-fail { background: var(--fail); color: var(--bg); border-color: var(--fail); }
  .note { flex: 1; min-width: 160px; background: var(--bg); border: 1px solid var(--line); border-radius: 6px;
    color: var(--ink); font: 12.5px var(--mono); padding: 9px 10px; min-height: 40px; }
  .note::placeholder { color: var(--dim); opacity: 0.8; }

  .exportbar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg); border-top: 1px solid var(--line); padding: 10px 0; }
  .exportbar .wrap { padding-bottom: 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .xbtn { font: 700 13px var(--mono); background: var(--accent); color: var(--onaccent); border: 0;
    border-radius: 8px; padding: 11px 18px; cursor: pointer; min-height: 44px; }
  .xbtn[disabled] { opacity: 0.45; cursor: default; }
  .xnote { font-size: 12px; color: var(--dim); }
  #out { display: none; width: 100%; height: 160px; margin-top: 8px; background: var(--well); color: var(--ink);
    border: 1px solid var(--line); border-radius: 8px; font: 12px var(--mono); padding: 10px; }
</style>

<header class="top"><div class="wrap">
  <h1>$ chat eval review</h1>
  <p class="meta" id="runmeta"></p>
  <div class="bar" id="filters" role="group" aria-label="Filter by category"></div>
  <div class="bar"><span class="prog" id="prog"></span></div>
</div></header>

<main class="wrap" id="list"></main>

<div class="exportbar"><div class="wrap">
  <button class="xbtn" id="copy">copy verdicts for claude</button>
  <span class="xnote" id="xnote">marks save in this browser as you go · paste the copied block back into the Claude session</span>
  <textarea id="out" readonly aria-label="Verdicts to copy"></textarea>
</div></div>

<script>
const DATA = ${DATA};
const KEY = "brohde.evalreview." + DATA.run;
const state = JSON.parse(localStorage.getItem(KEY) || "{}");
const cats = [...new Set(DATA.items.map(i => i.cat))];
let filter = "all";

document.getElementById("runmeta").textContent = DATA.run + " · " + DATA.items.length + " questions · total cost " + DATA.totalCost;

const filters = document.getElementById("filters");
["all", ...cats].forEach(c => {
  const b = document.createElement("button");
  b.className = "chip"; b.textContent = c; b.setAttribute("aria-pressed", String(c === filter));
  b.onclick = () => { filter = c; render(); };
  filters.appendChild(b);
});

function esc(s) { return s.replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
function linkify(s) { return s.replace(/\\[([^\\]]{1,60})\\]\\((\\/[a-z-]+)\\)/g, '<a href="#" onclick="return false" title="links to $2 on the real site">$1</a>'); }

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

function render() {
  filters.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b.textContent === filter)));
  const list = document.getElementById("list");
  list.innerHTML = "";
  DATA.items.forEach((it, i) => {
    if (filter !== "all" && it.cat !== filter) return;
    const s = state[i] || {};
    const card = document.createElement("section");
    card.className = "card" + (s.v ? " " + s.v : "");
    card.innerHTML =
      '<span class="cat">' + esc(it.cat) + '</span>' +
      '<p class="q"><span class="p">$</span> ' + esc(it.q) + '</p>' +
      '<p class="act">action: <b>' + esc(it.action) + '</b></p>' +
      (it.reply && it.reply !== "(no text)" ? '<div class="reply">' + linkify(esc(it.reply)) + '</div>' : '<p class="act">(no text, navigation only)</p>') +
      '<p class="cost"># ' + esc(it.cost) + '</p>';
    const v = document.createElement("div");
    v.className = "verdict";
    const bp = document.createElement("button");
    bp.className = "vbtn" + (s.v === "pass" ? " on-pass" : "");
    bp.textContent = "pass";
    bp.onclick = () => { s.v = s.v === "pass" ? null : "pass"; state[i] = s; save(); render(); };
    const bf = document.createElement("button");
    bf.className = "vbtn" + (s.v === "fail" ? " on-fail" : "");
    bf.textContent = "fail";
    bf.onclick = () => { s.v = s.v === "fail" ? null : "fail"; state[i] = s; save(); render(); };
    const note = document.createElement("input");
    note.className = "note"; note.placeholder = "note (optional)"; note.value = s.n || "";
    note.oninput = () => { s.n = note.value; state[i] = s; save(); prog(); };
    v.append(bp, bf, note);
    card.appendChild(v);
    list.appendChild(card);
  });
  prog();
}

function prog() {
  const marked = DATA.items.filter((_, i) => state[i]?.v).length;
  const fails = DATA.items.filter((_, i) => state[i]?.v === "fail").length;
  document.getElementById("prog").innerHTML =
    "<b>" + marked + "/" + DATA.items.length + "</b> marked · <b>" + fails + "</b> fail";
  document.getElementById("copy").disabled = marked === 0;
}

document.getElementById("copy").onclick = async () => {
  const lines = ["# Eval verdicts · " + DATA.run];
  DATA.items.forEach((it, i) => {
    const s = state[i] || {};
    lines.push((i + 1) + ". [" + it.cat + "] " + it.q + " → " + (s.v ? s.v.toUpperCase() : "UNMARKED") + (s.n ? " · note: " + s.n : ""));
  });
  const text = lines.join("\\n");
  const out = document.getElementById("out");
  out.value = text; out.style.display = "block";
  try { await navigator.clipboard.writeText(text); document.getElementById("xnote").textContent = "copied. paste it into the Claude session."; }
  catch { out.focus(); out.select(); document.getElementById("xnote").textContent = "clipboard blocked: select the box below and copy manually."; }
};

render();
</script>
`;

writeFileSync(path.join(here, "eval-review.html"), html);
console.log(
  `eval-review.html written: ${items.length} questions from "${runLine}"`
);
