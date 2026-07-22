// LOCAL command (npm run share-cards): render the 1200x630 glyph share cards
// for every PUBLISHED no-video article, plus the manifest the build gate reads.
//
// This is the ONLY step that needs a browser. It is never run on the Cloudflare
// Pages build machine (which has no Playwright); the build chain only VERIFIES
// freshness via tools/build/check-share-cards.mjs (pure node). Run this locally
// whenever an article title or the scene glyph sources change, commit the
// regenerated PNGs + manifest, and the gate passes.
//
// What a card is: dark night ground (#0e1512), a snapshot of the live scene
// canvas cropped to the article's mark (so the card's glyph is literally what
// the page renders, in the theme's color), the article title in Circular, and
// "brohde.com" in the mono stack. The composition is deliberately simple and
// readable so the card design can be iterated.

const http = require("node:http");
const path = require("node:path");
const {
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  createReadStream,
} = require("node:fs");
const { createHash } = require("node:crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const distDir = path.join(repoRoot, "dist");
const articlesDir = path.join(repoRoot, "src", "content", "articles");
const shareDir = path.join(repoRoot, "public", "share");

// Keep this list AND its order identical to tools/build/check-share-cards.mjs:
// the manifest hash only matches when both hash the same files in the same
// order. These three files define what a mark looks like.
const GLYPH_FILES = [
  path.join(repoRoot, "src", "scripts", "scene", "sources.ts"),
  path.join(repoRoot, "src", "scripts", "scene", "marks.generated.ts"),
  path.join(repoRoot, "src", "scripts", "scene", "palettes.ts"),
];

function glyphHash() {
  const h = createHash("sha256");
  for (const f of GLYPH_FILES) h.update(readFileSync(f, "utf8"));
  return h.digest("hex");
}

// Same minimal frontmatter read the check script uses.
function scanArticle(slug) {
  const md = readFileSync(path.join(articlesDir, slug, "index.md"), "utf8");
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const field = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    if (!m) return undefined;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    return v;
  };
  const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");
  return {
    slug,
    title: field("title"),
    theme: field("theme") ?? "default",
    draft: field("draft") === "true",
    hasVideo: /<video[^>]*\bsrc="/.test(body),
  };
}

// Playwright is a LOCAL-only tool, not a repo dependency (keeping it out of
// package.json avoids the install-pollution risk). Prefer a normal install;
// fall back to the session scratchpad where it already lives; else explain.
function loadPlaywright() {
  const candidates = [
    "playwright",
    process.env.PLAYWRIGHT_PATH,
    "/private/tmp/claude-501/-Users-brian-Projects-brohde-com/b0d7127a-bf9f-48db-88bb-219cd5c884fd/scratchpad/node_modules/playwright",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try the next candidate */
    }
  }
  console.error(
    "share-cards: Playwright not found. Install it locally:\n" +
      "  npm i -D playwright && npx playwright install chromium\n" +
      "  (or set PLAYWRIGHT_PATH to an existing playwright install)\n" +
      "  This is a LOCAL command; the build machine never runs it."
  );
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const direct = path.join(distDir, p);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const asDir = path.join(distDir, p, "index.html"); // /slug -> /slug/index.html
  if (existsSync(asDir)) return asDir;
  const asHtml = direct + ".html";
  if (existsSync(asHtml)) return asHtml;
  return null;
}

function serveDist() {
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url);
    if (!file) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

// Runs IN the page: crop the live scene canvas to the article's mark and
// compose the 1200x630 card, returning a PNG data URL. The crop math mirrors
// the ambient placement (src/scripts/scene/placements.ts) and the mark
// contain-fit (sample() in src/scripts/scene/index.ts) so the cropped glyph is
// exactly the region the tide draws the mark into.
async function composeInPage(page, title) {
  return page.evaluate(async (title) => {
    await document.fonts.ready;
    try {
      await document.fonts.load('700 48px "Circular"');
    } catch {
      /* fallback face is fine */
    }

    const sceneEl = document.querySelector("[data-scene]");
    const src = sceneEl && sceneEl.querySelector("canvas");
    if (!src) return null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = src.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // measured content-column right edge (the scene stamps it as --scene-edge)
    let edge = parseFloat(
      getComputedStyle(sceneEl).getPropertyValue("--scene-edge")
    );
    if (!isFinite(edge)) {
      const wrap = document.querySelector(".wrap");
      edge = wrap ? wrap.getBoundingClientRect().right : w / 2 + 380;
    }

    // ambient markRect (placements.ts), with the background-mode fallback
    const MARK_PAD = 20;
    const MIN_GUTTER = 160;
    const x = edge + MARK_PAD;
    const wd = w - x - MARK_PAD;
    const mr =
      wd < MIN_GUTTER - 2 * MARK_PAD
        ? { x: 0, y: 0, w, h } // gutter too small: mark centered in the full field
        : { x, y: h * 0.08, w: wd, h: h - h * 0.08 * 2 };

    // contain-fit the 480x300 source frame into mr (sample() in index.ts)
    const SRC_W = 480;
    const SRC_H = 300;
    const scale = Math.min(mr.w / SRC_W, mr.h / SRC_H);
    const dw = SRC_W * scale;
    const dh = SRC_H * scale;
    const bx = mr.x + (mr.w - dw) / 2;
    const by = mr.y + (mr.h - dh) / 2;
    const cropX = Math.max(0, Math.round(bx * dpr));
    const cropY = Math.max(0, Math.round(by * dpr));
    const cropW = Math.round(dw * dpr);
    const cropH = Math.round(dh * dpr);

    // ---- compose the card ----
    const CARD_W = 1200;
    const CARD_H = 630;
    const card = document.createElement("canvas");
    card.width = CARD_W;
    card.height = CARD_H;
    const g = card.getContext("2d");

    g.fillStyle = "#0e1512"; // the night ground token (global.css :root)
    g.fillRect(0, 0, CARD_W, CARD_H);

    // glyph on the right, echoing the site's gutter-mark placement
    const glyphPad = 60;
    const glyphW = 452;
    const glyphH = glyphW * (cropH / cropW);
    const glyphX = CARD_W - glyphPad - glyphW;
    const glyphY = (CARD_H - glyphH) / 2;
    g.drawImage(src, cropX, cropY, cropW, cropH, glyphX, glyphY, glyphW, glyphH);

    // title on the left, Circular, auto-fit to <= 2 lines
    const titleX = 72;
    const titleMaxW = glyphX - titleX - 44;
    const faces = '"Circular","Circular Fallback",system-ui,sans-serif';
    const wrapLines = (size) => {
      g.font = `700 ${size}px ${faces}`;
      const words = title.split(/\s+/);
      const lines = [];
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (!cur || g.measureText(test).width <= titleMaxW) cur = test;
        else {
          lines.push(cur);
          cur = word;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    };
    let size = 72;
    let lines = wrapLines(size);
    for (; size >= 26; size -= 2) {
      lines = wrapLines(size);
      const fits =
        lines.length <= 2 &&
        lines.every((l) => g.measureText(l).width <= titleMaxW);
      if (fits) break;
    }

    g.font = `700 ${size}px ${faces}`;
    g.fillStyle = "#EAF2EC";
    g.textBaseline = "alphabetic";
    const lineH = size * 1.2;
    const blockH = lines.length * lineH;
    let ty = (CARD_H - blockH) / 2 + size * 0.82;
    for (const l of lines) {
      g.fillText(l, titleX, ty);
      ty += lineH;
    }

    // wordmark, mono, quiet
    g.font =
      '500 22px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    g.fillStyle = "rgba(234,242,236,0.5)";
    g.fillText("brohde.com", titleX, CARD_H - 52);

    return card.toDataURL("image/png");
  }, title);
}

async function main() {
  if (!existsSync(distDir) || !existsSync(path.join(distDir, "index.html"))) {
    console.error(
      "share-cards: dist/ not found. Build first:\n  npm run build"
    );
    process.exit(1);
  }

  const slugs = readdirSync(articlesDir).filter((s) =>
    existsSync(path.join(articlesDir, s, "index.md"))
  );
  const cards = slugs.map(scanArticle).filter((a) => !a.draft && !a.hasVideo);
  if (cards.length === 0) {
    console.error("share-cards: no published no-video articles to render.");
    process.exit(1);
  }

  mkdirSync(shareDir, { recursive: true });

  const { chromium } = loadPlaywright();
  const { server, port } = await serveDist();
  const base = `http://127.0.0.1:${port}`;
  const hash = glyphHash();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });

  const manifest = { generatedAt: new Date().toISOString(), cards: {} };

  for (const a of cards) {
    const page = await context.newPage();
    await page.goto(`${base}/${a.slug}`, { waitUntil: "load" });
    // wait for the live scene canvas to have faded in, then let the wake surge
    // settle and the tide reach a dense frame
    await page.waitForFunction(
      () => {
        const el = document.querySelector("[data-scene] canvas");
        return el && parseFloat(getComputedStyle(el).opacity) > 0.3;
      },
      { timeout: 15000 }
    );
    await page.waitForTimeout(3500);

    const dataUrl = await composeInPage(page, a.title);
    if (!dataUrl) {
      console.error(`share-cards: ${a.slug}: scene canvas not found`);
      await page.close();
      continue;
    }
    const png = Buffer.from(dataUrl.split(",")[1], "base64");
    writeFileSync(path.join(shareDir, `${a.slug}.png`), png);
    manifest.cards[a.slug] = {
      title: a.title,
      theme: a.theme,
      glyphHash: hash,
    };
    console.log(`share-cards: wrote public/share/${a.slug}.png`);
    await page.close();
  }

  writeFileSync(
    path.join(shareDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  console.log(
    `share-cards: wrote public/share/manifest.json (${Object.keys(manifest.cards).length} cards, glyph ${hash.slice(0, 12)})`
  );

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error("share-cards: failed.", err);
  process.exit(1);
});
