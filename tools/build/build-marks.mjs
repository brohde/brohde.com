// Codegen: rasterize the vector scene marks (src/assets/marks/*.svg) into the
// scene's 480x300 source frame and emit a compact grayscale grid module that
// sources.ts paints synchronously.
//
// WHY a build step. The tide engine (src/scripts/scene/index.ts) samples a
// 480x300 white-ground / black-figure frame per mark, drawn by a "drawer" in
// sources.ts. Hand-traced canvas drawers drift from the real logos (Brian: the
// Twilio circles and the Eight Angle mark were wrong). This step reads the true
// vector sources once, contain-fits each into the frame at the #104 ink ratio
// (~0.84 tall, ~8% bottom safe area), downsamples to a small grayscale grid,
// and bakes the grids into a generated TS module. The runtime drawer just
// scales the grid up into the frame: no network, no async, no flash. It mirrors
// the chat-prompt codegen seam, with one deliberate difference noted below.
//
// COMMITTED, not gitignored (unlike _chat-prompt.generated.ts). That module is
// server-only (a Pages Function reads it); this one is imported by CLIENT code
// (sources.ts -> the scene, which runs in the browser during `astro dev`), so a
// fresh clone running `npm run dev` without a full build would fail on a
// missing import. Committing the deterministic grids keeps dev and CI
// dependency-free; @resvg/resvg-js is then a pure local-regeneration tool. This
// script still runs in `npm run build` so the grids stay fresh, and it NEVER
// fails the build: if the rasterizer is unavailable it logs and leaves the
// committed module in place (the hand-drawers in sources.ts are the last
// fallback per mark).
//
// Rasterizer: @resvg/resvg-js (devDependency), a well-known napi wrapper around
// the resvg renderer with prebuilt binaries and no system deps. Justified in
// docs/reference/handoffs/vector-marks.md.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const srcDir = path.join(repoRoot, "src", "assets", "marks");
const outFile = path.join(
  repoRoot,
  "src",
  "scripts",
  "scene",
  "marks.generated.ts"
);

// The scene source frame (must match SRC_W / SRC_H in sources.ts).
const SRC_W = 480;
const SRC_H = 300;
// Emitted grid: 8:5 like the frame, 6px cells. ~2x the finest real sampling
// (index.ts samples the mark region at roughly 31x16 cells on a large monitor),
// so box-averaged downsampling reads clean while the module stays small.
const GRID_W = 80;
const GRID_H = 50;
const CELL_PX_W = SRC_W / GRID_W; // 6
const CELL_PX_H = SRC_H / GRID_H; // 6
// Supersample the SVG well above frame scale so the frame map only downsamples.
const RASTER_W = 1000;
// #104 targets: seat tall marks so ink is ~84% of frame height with an 8%
// bottom safe area; cap width so wide marks do not touch the frame edge.
const TARGET_H_RATIO = 0.84;
const MAX_W_RATIO = 0.92;
const BOTTOM_SAFE = 0.08;
const INK_ALPHA = 8 / 255; // coverage below this is treated as bare ground

async function loadResvg() {
  try {
    const m = await import("@resvg/resvg-js");
    return m.Resvg;
  } catch (err) {
    console.warn(
      "build-marks: @resvg/resvg-js unavailable, keeping committed grids.\n  " +
        (err && err.message ? err.message : String(err))
    );
    return null;
  }
}

/** RGBA buffer -> Float coverage (alpha channel, 0..1). */
function coverageFromPixels(pixels, w, h) {
  const cov = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) cov[i] = pixels[i * 4 + 3] / 255;
  return cov;
}

/** tight ink bounding box (coverage above the ground threshold). */
function inkBox(cov, w, h) {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (cov[y * w + x] > INK_ALPHA) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function bilinear(cov, w, h, sx, sy) {
  if (sx < 0 || sy < 0 || sx > w - 1 || sy > h - 1) return 0;
  const x0 = Math.floor(sx),
    y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, w - 1),
    y1 = Math.min(y0 + 1, h - 1);
  const fx = sx - x0,
    fy = sy - y0;
  const a = cov[y0 * w + x0],
    b = cov[y0 * w + x1];
  const c = cov[y1 * w + x0],
    d = cov[y1 * w + x1];
  return (
    a * (1 - fx) * (1 - fy) +
    b * fx * (1 - fy) +
    c * (1 - fx) * fy +
    d * fx * fy
  );
}

/** contain-fit the ink box into the 480x300 frame per #104, return a Float
    coverage frame (0 = ground, 1 = full ink). */
function placeInFrame(cov, w, h, box) {
  const scaleH = (TARGET_H_RATIO * SRC_H) / box.h;
  const scaleWcap = (MAX_W_RATIO * SRC_W) / box.w;
  const heightLimited = scaleH <= scaleWcap;
  const scale = heightLimited ? scaleH : scaleWcap;
  const drawW = box.w * scale;
  const drawH = box.h * scale;
  const dx = (SRC_W - drawW) / 2;
  const dy = heightLimited
    ? SRC_H - BOTTOM_SAFE * SRC_H - drawH // seat bottom on the 8% safe line
    : (SRC_H - drawH) / 2; // wide-short marks center vertically
  const frame = new Float32Array(SRC_W * SRC_H);
  for (let fy = 0; fy < SRC_H; fy++) {
    for (let fx = 0; fx < SRC_W; fx++) {
      const sx = box.x0 + (fx + 0.5 - dx) / scale;
      const sy = box.y0 + (fy + 0.5 - dy) / scale;
      frame[fy * SRC_W + fx] = bilinear(cov, w, h, sx, sy);
    }
  }
  return { frame, heightLimited };
}

/** box-downsample the coverage frame to the grayscale grid (255 = ground). */
function toGrid(frame) {
  const gray = new Uint8Array(GRID_W * GRID_H);
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      let sum = 0;
      for (let py = 0; py < CELL_PX_H; py++) {
        const fy = Math.round(gy * CELL_PX_H + py);
        for (let px = 0; px < CELL_PX_W; px++) {
          const fx = Math.round(gx * CELL_PX_W + px);
          sum += frame[fy * SRC_W + fx];
        }
      }
      const c = sum / (CELL_PX_W * CELL_PX_H);
      gray[gy * GRID_W + gx] = Math.round(255 * (1 - c));
    }
  }
  return gray;
}

/** measured ink ratio on the emitted grid (coverage > 0.5), mirroring the
    #104 "ink bbox / frame" method so verdicts are comparable. */
function measure(gray) {
  let x0 = GRID_W,
    y0 = GRID_H,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (gray[y * GRID_W + x] < 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const wRatio = (x1 - x0 + 1) / GRID_W;
  const hRatio = (y1 - y0 + 1) / GRID_H;
  const bottomMargin = (GRID_H - 1 - y1) / GRID_H;
  return { wRatio, hRatio, bottomMargin };
}

async function main() {
  const Resvg = await loadResvg();
  if (!Resvg) return; // committed grids stay; build continues

  let files;
  try {
    files = readdirSync(srcDir).filter((f) => f.endsWith(".svg"));
  } catch {
    console.warn(`build-marks: no ${path.relative(repoRoot, srcDir)}, skipping`);
    return;
  }
  files.sort();

  const marks = {};
  const report = [];
  for (const file of files) {
    const name = path.basename(file, ".svg");
    try {
      const svg = readFileSync(path.join(srcDir, file), "utf8");
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: RASTER_W },
        background: "rgba(0,0,0,0)",
        shapeRendering: 2, // geometricPrecision
      });
      const img = resvg.render();
      const cov = coverageFromPixels(img.pixels, img.width, img.height);
      const box = inkBox(cov, img.width, img.height);
      if (box.w <= 0 || box.h <= 0) {
        console.warn(`build-marks: ${file} rendered empty, skipping`);
        continue;
      }
      const { frame } = placeInFrame(cov, img.width, img.height, box);
      const gray = toGrid(frame);
      marks[name] = Buffer.from(gray).toString("base64");
      const m = measure(gray);
      report.push(
        `  ${name.padEnd(8)} ink ${m.wRatio.toFixed(3)}w x ${m.hRatio.toFixed(
          3
        )}h  bottom ${(m.bottomMargin * 100).toFixed(1)}%`
      );
    } catch (err) {
      console.warn(
        `build-marks: ${file} failed, skipping. ${
          err && err.message ? err.message : String(err)
        }`
      );
    }
  }

  const names = Object.keys(marks).sort();
  if (names.length === 0) {
    console.warn("build-marks: no marks generated, keeping committed module");
    return;
  }

  const banner =
    "// AUTO-GENERATED by tools/build/build-marks.mjs. DO NOT EDIT.\n" +
    "// Sources of truth: src/assets/marks/*.svg (rasterized at build).\n" +
    "// Committed (not gitignored): sources.ts imports this in client code, so\n" +
    "// `astro dev` needs it present without a full build. Regenerated on every\n" +
    "// `npm run build`; see tools/build/build-marks.mjs for the full rationale.\n";

  const union = names.map((n) => JSON.stringify(n)).join(" | ");
  let body =
    `\nexport const GRID_W = ${GRID_W};\n` +
    `export const GRID_H = ${GRID_H};\n\n` +
    `export type GeneratedMarkName = ${union};\n\n` +
    `/** base64 grayscale grids (${GRID_W}x${GRID_H}, 255 = ground, 0 = ink). */\n` +
    `export const MARKS: Record<GeneratedMarkName, string> = {\n`;
  for (const n of names) body += `  ${JSON.stringify(n)}: ${JSON.stringify(marks[n])},\n`;
  body += "};\n";

  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, banner + body, "utf8");
  console.log(
    `build-marks: wrote ${path.relative(repoRoot, outFile)} (${names.length} marks, ${GRID_W}x${GRID_H})`
  );
  for (const line of report) console.log(line);
}

main().catch((err) => {
  // never fail the build over mark generation; the committed module stands.
  console.warn(
    "build-marks: unexpected error, keeping committed module.\n  " +
      (err && err.stack ? err.stack : String(err))
  );
});
