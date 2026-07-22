/**
 * Scene placement data (#106 extraction): the parameterized placement spec
 * (#59/#114) and the content-column geometry it measures against, lifted out of
 * scene/index.ts. A placement owns the tide strength and where the per-page
 * mark contain-fits; the engine in index.ts is geometry-agnostic and fits
 * whatever box the placement hands it. Pure data + one geometry function, no
 * DOM and no state; the values are the lab's, verbatim (#106). "ambient" is the
 * only placement today (fixed full-viewport layer, mark centered in the
 * measured right gutter); a future hero band is another entry here.
 */

/* the content column: measured live from the page (#120); the selector can
   be overridden per page via data-scene-content. CONTENT_W is only the
   no-column-found fallback, matching --scene-content-w in scene.css. */
export const CONTENT_SEL = ".wrap";
export const CONTENT_W = 760;
/* narrower than this and the gutter cannot hold a mark: background mode */
export const MIN_GUTTER = 160;
const MARK_PAD = 20;

export type PlacementName = "ambient";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacementSpec {
  /** tide strength, the lab's slider as a 0..1 value */
  intensity: number;
  /** where the mark contain-fits, in canvas css px; edge = the MEASURED
      right edge of the content column (#120). null = the full field
      (background mode: whisper cap, the lab's phone fallback treatment,
      #109/#114 mobile) */
  markRect(w: number, h: number, edge: number): Rect | null;
}

export const PLACEMENTS: Record<PlacementName, PlacementSpec> = {
  /* #114/#120: full-width fixed layer, tide drifting across the whole
     viewport; the mark centers (both axes) in the measured right gutter
     and, being viewport-anchored, never scrolls. The lab's gutter voice. */
  ambient: {
    intensity: 0.7,
    markRect(w, h, edge) {
      const x = edge + MARK_PAD;
      const wd = w - x - MARK_PAD;
      if (wd < MIN_GUTTER - 2 * MARK_PAD) return null;
      const iy = h * 0.08;
      return { x, y: iy, w: wd, h: h - iy * 2 };
    },
  },
};
