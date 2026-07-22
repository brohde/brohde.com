/**
 * Procedural glyph-tide sources, ported VERBATIM from the frozen reference
 * spec (docs/design/lab/aurora-terminal.html, #106): 480x300 canvases, white
 * ground + black figure. Sampling inverts, so dark source areas become bright
 * glyphs on the night ground.
 *
 * These are the per-page marks (#111, identity plan in
 * docs/reference/editorial-review-r1.md section 2 as amended by Brian):
 * br = the site default (BR letterform), logo = Eight Angle, pose =
 * astavakrasana, f = Facebook Newsroom, robot = Android for Work (see the
 * license note at its drawer), atg = ATG, gccm = Gold Coast, twilio = the
 * Twilio mark. The 8 and the G letterform stay in the file unused (the 8 as
 * hero-variant material, the G superseded by the robot per the approved
 * plan). A production image asset swaps in through this same seam: any
 * drawer that fills the 480x300 frame (e.g. ctx.drawImage(asset, ...)) is a
 * valid source.
 *
 * The #104 lesson binds every drawer: dead margin in the frame presents the
 * mark small (the pose's 0.610 ink-to-frame ratio is the known-bad example,
 * f's 0.840 the good one), so marks trim toward the ink box with roughly an
 * 8% bottom safe area kept for the future hero band (#103 asset spec).
 *
 * VECTOR-DRIVEN MARKS (vector-marks handoff): the logo marks whose hand traces
 * drifted from the real thing (twilio, logo/Eight Angle, gccm, atg) are now
 * driven by their true vector sources. tools/build/build-marks.mjs rasterizes
 * src/assets/marks/*.svg into this 480x300 frame at the #104 ink ratio, bakes a
 * compact grayscale grid per mark into ./marks.generated.ts, and the runtime
 * drawer (paintGrid) scales that grid into the frame synchronously (no fetch,
 * no async, no flash) through the exact seam above. The hand-drawers below stay
 * as the per-mark fallback if a grid is ever missing, and letterform marks
 * (br, f) plus the drawn robot keep their hand-drawers on purpose.
 */

import { MARKS, GRID_W, GRID_H } from "./marks.generated";

export const SRC_W = 480;
export const SRC_H = 300;

export type SourceName =
  | "eight"
  | "logo"
  | "pose"
  | "f"
  | "g"
  | "br"
  | "robot"
  | "gccm"
  | "atg"
  | "twilio";

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function blank(sctx: CanvasRenderingContext2D) {
  sctx.fillStyle = "#FFFFFF";
  sctx.fillRect(0, 0, SRC_W, SRC_H);
  sctx.fillStyle = "#000000";
  sctx.strokeStyle = "#000000";
}

function capsule(
  sctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  wdt: number
) {
  sctx.lineWidth = wdt;
  sctx.lineCap = "round";
  sctx.beginPath();
  sctx.moveTo(x1, y1);
  sctx.lineTo(x2, y2);
  sctx.stroke();
}

function drawEight(sctx: CanvasRenderingContext2D) {
  blank(sctx);
  sctx.font = `900 300px ${MONO}`;
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.fillText("8", 240, 162);
}

/* FALLBACK for the eight angle logo mark (the live mark now drives it via
   src/assets/marks/logo.svg -> the generated grid; see the header note). This
   earlier hand trace from the live site header stays as the drop-in fallback if
   the grid is ever missing: the A, the small ring at its hip, the big O */
function drawLogo(sctx: CanvasRenderingContext2D) {
  blank(sctx);
  capsule(sctx, 168, 52, 88, 248, 38);
  capsule(sctx, 168, 52, 248, 248, 38);
  sctx.lineWidth = 24;
  sctx.beginPath();
  sctx.arc(234, 202, 33, 0, 6.2832);
  sctx.stroke();
  sctx.lineWidth = 30;
  sctx.beginPath();
  sctx.arc(360, 148, 62, 0, 6.2832);
  sctx.stroke();
}

/* eight-angle pose (astavakrasana) as a bold silhouette: head right, torso
   leaning over two straight arms, legs extended left and crossed */
function drawPose(sctx: CanvasRenderingContext2D) {
  blank(sctx);
  capsule(sctx, 205, 168, 62, 200, 34);
  capsule(sctx, 202, 182, 70, 232, 30);
  capsule(sctx, 292, 138, 198, 168, 58);
  capsule(sctx, 226, 152, 218, 254, 21);
  capsule(sctx, 266, 146, 272, 254, 21);
  sctx.beginPath();
  sctx.arc(318, 112, 31, 0, 6.2832);
  sctx.fill();
  capsule(sctx, 150, 262, 360, 262, 6);
}

/* letterform stand-ins for the per-page brand sources. stroke over fill
   beefs the letter into a mass the coarse cell grid can hold onto */
function drawLetter(sctx: CanvasRenderingContext2D, ch: string, px: number) {
  blank(sctx);
  sctx.lineWidth = 26;
  sctx.lineJoin = "round";
  sctx.font = `900 ${px}px ${MONO}`;
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.strokeText(ch, 240, 162);
  sctx.fillText(ch, 240, 162);
}

/* the house letterform treatment at word scale: same stroke-over-fill mass
   as drawLetter, but on the alphabetic baseline so the ink box lands
   deterministically against the frame (baseY places the deepest ink at the
   8% bottom safe line; wide-short words center instead) */
function drawWord(
  sctx: CanvasRenderingContext2D,
  word: string,
  px: number,
  baseY: number,
  stroke: number
) {
  blank(sctx);
  sctx.lineWidth = stroke;
  sctx.lineJoin = "round";
  sctx.font = `900 ${px}px ${MONO}`;
  sctx.textAlign = "center";
  sctx.textBaseline = "alphabetic";
  sctx.strokeText(word, 240, baseY);
  sctx.fillText(word, 240, baseY);
}

function roundedRect(
  sctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wd: number,
  ht: number,
  r: number
) {
  sctx.beginPath();
  sctx.moveTo(x + r, y);
  sctx.arcTo(x + wd, y, x + wd, y + ht, r);
  sctx.arcTo(x + wd, y + ht, x, y + ht, r);
  sctx.arcTo(x, y + ht, x, y, r);
  sctx.arcTo(x, y, x + wd, y, r);
  sctx.closePath();
  sctx.fill();
}

/* the Android robot for the android theme (identity plan, Brian's call):
   dome head with two antennae and dot eyes, body, arms, legs.
   LICENSE: the Android robot is reproduced or modified from work created
   and shared by Google and used according to terms described in the
   Creative Commons 3.0 Attribution License (per Google's brand guidelines,
   https://developer.android.com/distribute/marketing-tools/brand-guidelines).
   A USER-VISIBLE attribution line on the site is still required; placement
   is a pending copy decision (likely the article footer). */
function drawRobot(sctx: CanvasRenderingContext2D) {
  blank(sctx);
  capsule(sctx, 168, 12, 196, 44, 14); // antennae
  capsule(sctx, 312, 12, 284, 44, 14);
  sctx.beginPath(); // dome head
  sctx.arc(240, 134, 112, Math.PI, 0);
  sctx.closePath();
  sctx.fill();
  sctx.fillStyle = "#FFFFFF"; // dot eyes, punched out of the dome
  sctx.beginPath();
  sctx.arc(196, 84, 13, 0, 6.2832);
  sctx.fill();
  sctx.beginPath();
  sctx.arc(284, 84, 13, 0, 6.2832);
  sctx.fill();
  sctx.fillStyle = "#000000";
  roundedRect(sctx, 126, 144, 228, 90, 14); // body
  capsule(sctx, 88, 169, 88, 211, 54); // arms
  capsule(sctx, 392, 169, 392, 211, 54);
  capsule(sctx, 196, 232, 196, 253, 46); // legs
  capsule(sctx, 284, 232, 284, 253, 46);
}

/* FALLBACK for the Twilio mark (the official mark now drives it via
   src/assets/marks/twilio.svg -> the generated grid, which fixes the dot
   placement Brian flagged: the real mark clusters the four dots near center,
   not out by the ring). This earlier hand trace stays as the drop-in fallback:
   the ring with four dots inside, two upper, two lower. MARK ONLY, never the
   wordmark or any text lockup. */
function drawTwilio(sctx: CanvasRenderingContext2D) {
  blank(sctx);
  sctx.lineWidth = 38;
  sctx.beginPath();
  sctx.arc(240, 141, 116, 0, 6.2832);
  sctx.stroke();
  /* dots run slightly small vs the real mark's proportions on purpose:
     at the tide's coarse cell grid, bigger dots merge into two blobs
     (caught on rendered validation); the extra gap keeps four distinct
     dots readable at gutter scale */
  for (const [dx, dy] of [
    [-47, -47],
    [47, -47],
    [-47, 47],
    [47, 47],
  ]) {
    sctx.beginPath();
    sctx.arc(240 + dx, 141 + dy, 23, 0, 6.2832);
    sctx.fill();
  }
}

/* paint a generated grayscale grid (base64, GRID_W x GRID_H, 255 = ground,
   0 = ink) into the 480x300 frame. The grid already bakes the #104 contain-fit
   and 8% bottom safe area at build time, so this just scales it up over the
   white ground with smoothing on: the output matches what a hand-drawer would
   fill, and sample() in index.ts contain-fits the frame into the mark region as
   usual. Synchronous, no async or network, so the tide never flashes. */
function paintGrid(sctx: CanvasRenderingContext2D, b64: string) {
  blank(sctx);
  const bin = atob(b64);
  const img = new ImageData(GRID_W, GRID_H);
  for (let i = 0; i < GRID_W * GRID_H; i++) {
    const gray = bin.charCodeAt(i);
    img.data[i * 4] = gray;
    img.data[i * 4 + 1] = gray;
    img.data[i * 4 + 2] = gray;
    img.data[i * 4 + 3] = 255;
  }
  const gc = document.createElement("canvas");
  gc.width = GRID_W;
  gc.height = GRID_H;
  const gctx = gc.getContext("2d");
  if (!gctx) return;
  gctx.putImageData(img, 0, 0);
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(gc, 0, 0, GRID_W, GRID_H, 0, 0, SRC_W, SRC_H);
}

/* a generated mark maps to a grid drawer; if its grid is missing (a partial or
   skipped codegen), the hand-drawer fallback below keeps the mark working. The
   loose index is deliberate so a dropped mark degrades at runtime instead of
   breaking the type union. */
const GEN = MARKS as Record<string, string | undefined>;
function gridOr(
  name: string,
  fallback: (sctx: CanvasRenderingContext2D) => void
): (sctx: CanvasRenderingContext2D) => void {
  const b64 = GEN[name];
  return b64 ? (sctx) => paintGrid(sctx, b64) : fallback;
}

export const DRAW: Record<
  SourceName,
  (sctx: CanvasRenderingContext2D) => void
> = {
  eight: drawEight,
  logo: gridOr("logo", drawLogo),
  pose: drawPose,
  f: (sctx) => drawLetter(sctx, "f", 320),
  g: (sctx) => drawLetter(sctx, "G", 280),
  br: (sctx) => drawWord(sctx, "BR", 330, 263, 26),
  robot: drawRobot,
  gccm: gridOr("gccm", (sctx) => drawWord(sctx, "GCCM", 180, 218, 16)),
  atg: gridOr("atg", (sctx) => drawWord(sctx, "atg", 238, 208, 22)),
  twilio: gridOr("twilio", drawTwilio),
};

export const SOURCES = Object.keys(DRAW) as SourceName[];

export function isSourceName(v: string | undefined): v is SourceName {
  return !!v && v in DRAW;
}
