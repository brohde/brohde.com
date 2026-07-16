/**
 * Procedural glyph-tide sources, ported VERBATIM from the frozen reference
 * spec (docs/design/lab/aurora-terminal.html, #106): 480x300 canvases, white
 * ground + black figure. Sampling inverts, so dark source areas become bright
 * glyphs on the night ground.
 *
 * These are the per-page marks (#111): the 8 is the default/homepage
 * identity, logo = Eight Angle, pose = astavakrasana, f/G = letterform
 * stand-ins for the Facebook Newsroom and Android for Work pages (real brand
 * marks stay pending the #45/#59 trademark check). A production image asset
 * swaps in through this same seam: any drawer that fills the 480x300 frame
 * (e.g. ctx.drawImage(asset, ...)) is a valid source.
 */

export const SRC_W = 480;
export const SRC_H = 300;

export type SourceName = "eight" | "logo" | "pose" | "f" | "g";

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

/* the eight angle logo mark, traced bold and simplified from the live site
   header (reference: assets/images/case-studies/eight-angle/
   hero-live-2026-07.png): the A, the small ring at its hip, the big O */
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

export const DRAW: Record<
  SourceName,
  (sctx: CanvasRenderingContext2D) => void
> = {
  eight: drawEight,
  logo: drawLogo,
  pose: drawPose,
  f: (sctx) => drawLetter(sctx, "f", 320),
  g: (sctx) => drawLetter(sctx, "G", 280),
};

export const SOURCES = Object.keys(DRAW) as SourceName[];

export function isSourceName(v: string | undefined): v is SourceName {
  return !!v && v in DRAW;
}
