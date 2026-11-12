#!/usr/bin/env node
/**
 * Renders the production OG image (1200x630) to public/og.png.
 *
 * Reproducible and dependency-free: it embeds the site's own Circular woff2
 * subsets into tools/og/og.html as base64 data: URIs, then drives the system
 * Google Chrome over the DevTools Protocol (no npm install, no Puppeteer) to
 * screenshot the deterministic canvas render. Node 18+ (global fetch/WebSocket)
 * and Google Chrome are the only requirements.
 *
 * Regenerate:  node tools/og/render.mjs
 */
import { spawn } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");

const CHROME =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 4421;

const FONT_BOLD = resolve(REPO, "public/fonts/circular-bold.woff2");
const FONT_BOOK = resolve(REPO, "public/fonts/circular-book.woff2");
const TEMPLATE = resolve(__dirname, "og.html");
const OUT = resolve(REPO, "public/og.png");

// Temp artifacts (font-inlined HTML + Chrome profile) live outside the repo.
const TMP = resolve(tmpdir(), "brohde-og-render");
const TMP_HTML = resolve(TMP, "og.rendered.html");
const PROFILE = resolve(TMP, "chrome-profile");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dataUri = (p) =>
  "data:font/woff2;base64," + readFileSync(p).toString("base64");

function buildHtml() {
  mkdirSync(TMP, { recursive: true });
  const html = readFileSync(TEMPLATE, "utf8")
    .replace("__FONT_BOLD__", dataUri(FONT_BOLD))
    .replace("__FONT_BOOK__", dataUri(FONT_BOOK));
  writeFileSync(TMP_HTML, html);
}

async function pageSocket() {
  for (let i = 0; i < 150; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* Chrome not up yet */
    }
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
}

async function main() {
  buildHtml();
  if (existsSync(PROFILE)) rmSync(PROFILE, { recursive: true, force: true });

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    const wsUrl = await pageSocket();
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res, { once: true });
      ws.addEventListener("error", rej, { once: true });
    });
    const send = cdp(ws);

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1200,
      height: 630,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: `file://${TMP_HTML}` });

    // Wait for the canvas draw to finish (og.html sets data-ready), or surface
    // a font/render error instead of silently shipping a blank image.
    let ok = false;
    for (let i = 0; i < 200; i++) {
      const { result } = await send("Runtime.evaluate", {
        expression:
          "document.documentElement.dataset.ready==='1'?'ready':(document.documentElement.dataset.error||'')",
        returnByValue: true,
      });
      if (result.value === "ready") {
        ok = true;
        break;
      }
      if (result.value) throw new Error("render error: " + result.value);
      await sleep(50);
    }
    if (!ok) throw new Error("render timed out (data-ready never set)");

    const { data } = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
      captureBeyondViewport: true,
    });
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, Buffer.from(data, "base64"));
    ws.close();
    console.log("wrote", OUT);
  } finally {
    chrome.kill("SIGKILL");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
