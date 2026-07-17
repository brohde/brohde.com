/**
 * The aurora + glyph tide scene (#106): production port of demo 04 from the
 * FROZEN reference spec, docs/design/lab/aurora-terminal.html. One scene,
 * parameterized placements (#59/#114); the homepage's "ambient" placement is
 * the first consumer.
 *
 * FACADE CONTRACT (#70, binding): this module costs zero bytes on the
 * pre-paint path. Scene.astro server-renders the static facade (gradient sky
 * + pour) and reserves the layer; terminal.ts lazy-imports this module from
 * its idle hook (requestIdleCallback, setTimeout fallback). Init here builds
 * the live layers (tide canvas + drifting sky slots) inside the reserved
 * container and crossfades them in. The container is position:fixed and
 * aria-hidden: it cannot shift layout (CLS 0 by construction) and never
 * enters the accessibility tree.
 *
 * PLACEMENT PARAMETER (#114/#120): a placement owns three things.
 *   1. Geometry: CSS on .scene[data-scene-placement] shapes the container
 *      (ambient: fixed, inset 0; the drifting tide spans the FULL viewport,
 *      the content column included, per #120). The engine is
 *      geometry-agnostic; it fits whatever box the canvas gets. A future
 *      hero placement is a top band (30svh, #97/#103 tokens) expressed the
 *      same way.
 *   2. The mark region: where the per-page mark contain-fits inside the
 *      field. Ambient desktop: centered (both axes) in the right gutter,
 *      and since the whole layer is viewport-fixed, the mark does not
 *      scroll (#114). The gutter is MEASURED from the real content column
 *      (#120: the layout centers the column, so its edge is layout data,
 *      never a hardcoded right-edge offset): every resize, orientation
 *      change, and DPR change re-measures the column rect, re-positions the
 *      mark, and re-stamps --scene-edge so the pour tracks the same edge.
 *      When the measured gutter is too narrow to hold a mark, the placement
 *      falls back to background mode: mark centered in the full field.
 *   3. Strength: the tide intensity plus the lab's caps. Ambient background
 *      mode holds the lab's whisper cap (0.12).
 *
 * THEME (#92/#111): the ground (night/lite) follows the site resolution:
 * html[data-theme] override wins, system preference otherwise; watched live
 * via MutationObserver + matchMedia, so it survives astro:after-swap
 * re-stamps. The page THEME identity (sky palette + tide peak + mark,
 * data-scene-theme) is per-page and parameterized; the homepage is
 * "default" (the BR letterform, #111). setTheme() ports the lab's two-slot
 * sky crossfade + peak lerp + mark travel; themed sky palettes land in
 * scene.css when
 * the first themed page ships (B3), keeping unused bytes off the critical
 * CSS until then. Page GROUND identities (#74) are :root token work owned
 * by B3, not this module.
 *
 * PERF (#70/#105): 9fps tide (110ms tick), rAF-gated; pauses when hidden,
 * offscreen, or under reduced motion (which renders a settled still
 * instead). dpr capped at 2. NEW vs the lab (flagged in the B1 report): the
 * cell grid is capped at CELL_CAP cells; full-viewport fields on large
 * monitors scale the cell up so the worst tick stays inside the lab's 4ms
 * budget. On localhost the handle is exposed as window.__scene so audits
 * can read live tick stats from the built output.
 */
/* ?raw on purpose: a plain `import "./live.css"` gets hoisted into every
   page's inlined critical CSS by Astro's code-split-CSS handling, putting
   live-layer bytes back on the pre-paint path (#70). As a string it rides
   this lazy chunk and adopts at init (see ensureLiveStyles). */
import liveCss from "./live.css?raw";
import {
  DRAW,
  SOURCES,
  SRC_W,
  SRC_H,
  isSourceName,
  type SourceName,
} from "./sources";

type GroundKey = "night" | "lite";
type SceneState = "home" | "chat";
type ThemeName =
  | "default"
  | "eight"
  | "news"
  | "android"
  | "atg"
  | "goldcoast"
  | "twilio";
type PlacementName = "ambient";

/* ------------------------------------------------------------- constants -- */

const CW = 15; // lab cell grid, css px
const CH = 18;
const FONT_PX = 12;
const CELL_CAP = 6000; // see PERF note above; measured on dist, see B1 report
const RAMP = [" ", ".", "·", ":", "~", "+", "x", "8", "#"];
const TICK_MS = 110; // 9fps, the lab cadence
const CLOCK_MS = 2600; // the one scene clock: state tint, theme travel, sky
const OUT_MS = 1400; // mark travel envelope (out, hold, in)
const HOLD_MS = 900;
const IN_MS = 1400;

/* the content column: measured live from the page (#120); the selector can
   be overridden per page via data-scene-content. CONTENT_W is only the
   no-column-found fallback, matching --scene-content-w in scene.css. */
const CONTENT_SEL = ".wrap";
const CONTENT_W = 760;
/* narrower than this and the gutter cannot hold a mark: background mode */
const MIN_GUTTER = 160;
const MARK_PAD = 20;

/* the three ink buckets: one calm text ramp shared by every theme, lerping
   home-to-chat on the sky's clock (lab values, verbatim) */
const INKS: Record<GroundKey, Record<SceneState, number[][]>> = {
  night: {
    home: [
      [143, 167, 154, 0.4],
      [214, 229, 220, 0.55],
      [214, 229, 220, 0.8],
    ],
    chat: [
      [167, 158, 143, 0.4],
      [229, 223, 211, 0.55],
      [233, 223, 205, 0.8],
    ],
  },
  lite: {
    home: [
      [63, 83, 72, 0.4],
      [20, 33, 26, 0.55],
      [20, 33, 26, 0.8],
    ],
    chat: [
      [90, 74, 55, 0.4],
      [48, 35, 22, 0.55],
      [48, 35, 22, 0.8],
    ],
  },
};

/* the peak bucket is the page theme's voice: [home, chat] per ground,
   matching the sky palettes (lab values verbatim for the original four;
   atg/goldcoast/twilio added per the #111 identity plan, contrast-checked
   against both grounds: worst combo 5.44:1, above the existing floor of
   4.84:1 = android lite/home). Chat peaks stay in the golden-hour amber
   family under every theme, the house rule the lab set. */
const PEAKS: Record<ThemeName, Record<GroundKey, number[][]>> = {
  default: {
    night: [
      [126, 231, 135],
      [245, 185, 104],
    ],
    lite: [
      [8, 97, 72],
      [138, 77, 15],
    ],
  },
  eight: {
    night: [
      [70, 200, 174],
      [239, 194, 114],
    ],
    lite: [
      [14, 114, 99],
      [138, 100, 40],
    ],
  },
  news: {
    night: [
      [122, 167, 255],
      [243, 199, 123],
    ],
    lite: [
      [29, 78, 216],
      [138, 90, 15],
    ],
  },
  android: {
    night: [
      [61, 220, 132],
      [252, 201, 52],
    ],
    lite: [
      [24, 128, 56],
      [154, 98, 7],
    ],
  },
  /* ATG's warm monochrome identity: bone on night, umber on light */
  atg: {
    night: [
      [224, 210, 189],
      [240, 196, 130],
    ],
    lite: [
      [97, 78, 55],
      [130, 82, 24],
    ],
  },
  /* Gold Coast gold, deepened on the light ground for contrast */
  goldcoast: {
    night: [
      [233, 186, 64],
      [248, 196, 92],
    ],
    lite: [
      [136, 92, 6],
      [140, 84, 14],
    ],
  },
  /* Twilio red: the brand red lifts slightly on night (the literal
     #F22F46 measures 4.64:1 there, under the 4.84 floor) and deepens on
     light. DORMANT: no page consumes this theme yet (the twilio piece is
     an external entry with no interior page). */
  twilio: {
    night: [
      [246, 78, 94],
      [244, 186, 105],
    ],
    lite: [
      [186, 18, 42],
      [136, 78, 18],
    ],
  },
};

/* each theme carries its page's mark: the tide draws what the page is
   (#74/#111). The site default is the BR letterform; the 8 and the G
   letterform stay drawable but unmapped (see sources.ts). Article pages
   declare their theme in frontmatter (content.config.ts) and stamp it on
   the [data-screen] section; the terminal.ts bridge travels the persisted
   scene there on navigation. twilio is wired to the Signal pong piece,
   which is draft: no public page consumes it until the draft flips. */
const THEME_SOURCE: Record<ThemeName, SourceName> = {
  default: "br",
  eight: "logo",
  news: "f",
  android: "robot",
  atg: "atg",
  goldcoast: "gccm",
  twilio: "twilio",
};

/** exported for the terminal.ts bridge: pages stamp data-scene-theme on
    their fresh [data-screen] section (the persisted scene node keeps the
    OLD page's dataset, so it can never be the source of truth) */
export function isThemeName(v: string | undefined): v is ThemeName {
  return !!v && v in PEAKS;
}

/* ------------------------------------------------------------ placements -- */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PlacementSpec {
  /** tide strength, the lab's slider as a 0..1 value */
  intensity: number;
  /** where the mark contain-fits, in canvas css px; edge = the MEASURED
      right edge of the content column (#120). null = the full field
      (background mode: whisper cap, the lab's phone fallback treatment,
      #109/#114 mobile) */
  markRect(w: number, h: number, edge: number): Rect | null;
}

const PLACEMENTS: Record<PlacementName, PlacementSpec> = {
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

/* --------------------------------------------------------------- helpers -- */

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp3 = (a: number[], b: number[], x: number) => [
  a[0] + (b[0] - a[0]) * x,
  a[1] + (b[1] - a[1]) * x,
  a[2] + (b[2] - a[2]) * x,
];

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** the #92 resolution: explicit override wins, system otherwise */
function isLite(): boolean {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light") return true;
  if (t === "dark") return false;
  return matchMedia("(prefers-color-scheme: light)").matches;
}

function div(className: string): HTMLDivElement {
  const d = document.createElement("div");
  d.className = className;
  return d;
}

function buildSkySlot(sky: string, on: boolean): HTMLDivElement {
  const slot = div("skyslot" + (on ? " on" : ""));
  slot.dataset.sky = sky;
  for (const kind of ["aur aur-home", "aur aur-chat"]) {
    const aur = div(kind);
    for (let i = 1; i <= 4; i++) aur.appendChild(div("blob pos" + i));
    slot.appendChild(aur);
  }
  return slot;
}

/* ------------------------------------------------------------ the handle -- */

export interface SceneStats {
  ticks: number;
  avg: number;
  p95: number;
  max: number;
}

export interface SceneHandle {
  el: HTMLElement;
  setTheme(name: ThemeName): void;
  setMark(name: SourceName): void;
  setState(state: SceneState): void;
  /** live tick durations (ms) from the last ~240 ticks, for perf audits */
  stats(): SceneStats;
  destroy(): void;
}

/* ------------------------------------------------------------- the mount -- */

function mount(container: HTMLElement): SceneHandle {
  const placementAttr = container.dataset.scenePlacement;
  const placement: PlacementSpec =
    PLACEMENTS[(placementAttr as PlacementName) ?? "ambient"] ??
    PLACEMENTS.ambient;

  let theme: ThemeName = isThemeName(container.dataset.sceneTheme)
    ? container.dataset.sceneTheme
    : "default";
  let state: SceneState =
    container.dataset.sceneState === "chat" ? "chat" : "home";
  const markAttr = container.dataset.sceneMark;
  const initialMark: SourceName = isSourceName(markAttr)
    ? markAttr
    : THEME_SOURCE[theme];

  /* live layers under the server-rendered facade children */
  const canvas = document.createElement("canvas");
  canvas.style.opacity = "0"; // fades in after the first painted frame
  const slotA = buildSkySlot(theme, true);
  let slotB: HTMLDivElement | null = null; // built on first theme travel
  container.prepend(canvas, slotA);

  const contentSel = container.dataset.sceneContent || CONTENT_SEL;

  /* ------------------------------ tide engine (lab glyph4, ported) ------- */

  const ctx2d = canvas.getContext("2d");
  let w = 0,
    h = 0,
    cols = 0,
    rows = 0,
    cw = CW,
    ch = CH,
    fontPx = FONT_PX;

  const srcHi = document.createElement("canvas");
  srcHi.width = SRC_W;
  srcHi.height = SRC_H;
  const sctx = srcHi.getContext("2d");

  let lite = isLite();
  const LUM: Partial<Record<SourceName, Float32Array>> = {};
  let cur: SourceName = initialMark;
  let pending: SourceName | null = null;
  let phase: "idle" | "out" | "hold" | "in" = "idle";
  let m = 1; // mark envelope: 1 fully formed, 0 pure tide
  let holdT = 0;
  let mix = 0; // state tint: 0 home, 1 chat
  let target = state === "chat" ? 1 : 0;
  mix = target;
  let themeFrom = PEAKS[theme];
  let themeTo = PEAKS[theme];
  let tmix = 1; // theme peak travel: 1 arrived
  let bgMode = false; // background fallback: whisper cap, full-field mark
  let edgePx = 0; // measured right edge of the content column (#120)
  let ready = false; // staged boot: nothing paints before stage 3
  let lastT = 52000;
  /* production delta (perf, identical math): the lab computed three sins
     per cell per tick; the terms are separable by column, row and diagonal,
     so they precompute into these per-tick (sized per resize). Tick
     distributions measured on the built dist live in the B1 report. */
  let sinCol = new Float32Array(0);
  let sinRow = new Float32Array(0);
  let sinDiag = new Float32Array(0);

  function eff(): number {
    return bgMode ? Math.min(placement.intensity, 0.12) : placement.intensity;
  }

  /* whisper dims the whole field so it can sit behind a page (lab curve).
     Hidden documents never tick CSS transitions (the 400ms fade would stall
     at 0 until first visibility, verified on rendered validation), so when
     hidden the value lands instantly and the fade is restored for future
     changes on the next rendered frame, which by definition is visible. */
  function applyAlpha() {
    if (document.hidden) {
      canvas.style.transition = "none";
      requestAnimationFrame(() => {
        canvas.style.transition = "";
      });
    }
    canvas.style.opacity = (0.12 + 0.88 * Math.min(eff() / 0.45, 1)).toFixed(2);
  }

  function markRect(): Rect {
    const r = bgMode ? null : placement.markRect(w, h, edgePx);
    return r ?? { x: 0, y: 0, w, h };
  }

  /** contain-fit one source into the mark region, mapped to the cell grid
      (lab sampleOne, parameterized by the placement's mark rect) */
  function sample(name: SourceName): Float32Array {
    const out = new Float32Array(cols * rows);
    if (!sctx) return out;
    DRAW[name](sctx);
    const rect = markRect();
    const sc = document.createElement("canvas");
    sc.width = cols;
    sc.height = rows;
    const scx = sc.getContext("2d", { willReadFrequently: true });
    if (!scx) return out;
    const scale = Math.min(rect.w / SRC_W, rect.h / SRC_H);
    const dw = SRC_W * scale;
    const dh = SRC_H * scale;
    const dx = rect.x + (rect.w - dw) / 2;
    const dy = rect.y + (rect.h - dh) / 2;
    scx.fillStyle = "#FFFFFF";
    scx.fillRect(0, 0, cols, rows);
    scx.drawImage(
      srcHi,
      0,
      0,
      SRC_W,
      SRC_H,
      dx / cw,
      dy / ch,
      dw / cw,
      dh / ch
    );
    const data = scx.getImageData(0, 0, cols, rows).data;
    for (let i = 0; i < cols * rows; i++) {
      const r = data[i * 4],
        g = data[i * 4 + 1],
        b = data[i * 4 + 2];
      out[i] = 1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }
    return out;
  }

  function lum(name: SourceName): Float32Array {
    return (LUM[name] ??= sample(name));
  }

  /** #120: the gutter's position is layout data. Measure the content
      column's real rect (centering is the layout's business, breakpoints
      included); no column on the page = assume a centered CONTENT_W wrap. */
  function measureEdge(width: number): number {
    const content = document.querySelector(contentSel);
    const rect = content?.getBoundingClientRect();
    if (rect && rect.width > 0) return rect.right;
    return width / 2 + CONTENT_W / 2;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    /* cell scale cap: keep the grid inside the tick budget on big monitors */
    const base = (r.width / CW) * (r.height / CH);
    const k = base > CELL_CAP ? Math.sqrt(base / CELL_CAP) : 1;
    cw = CW * k;
    ch = CH * k;
    fontPx = FONT_PX * k;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx2d?.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = r.width;
    h = r.height;
    cols = Math.ceil(w / cw);
    rows = Math.ceil(h / ch);
    sinCol = new Float32Array(cols);
    sinRow = new Float32Array(rows);
    sinDiag = new Float32Array(cols + rows);
    /* the measured gutter drives the mark, the pour edge and the mode */
    edgePx = measureEdge(w);
    container.style.setProperty("--scene-edge", `${edgePx.toFixed(1)}px`);
    const nextBg = w - edgePx < MIN_GUTTER;
    if (nextBg !== bgMode) {
      bgMode = nextBg;
      if (ready) applyAlpha(); // the whisper cap moves with the mode
    }
    for (const s of SOURCES) delete LUM[s]; // resampled lazily per source
  }

  function repaint() {
    resize();
    if (!ready) return;
    if (running) step(0, lastT);
    else staticFrame();
  }

  function advance(dt: number) {
    if (tmix < 1) tmix = Math.min(1, tmix + dt / CLOCK_MS);
    if (mix !== target) {
      const dc = dt / CLOCK_MS;
      mix =
        target > mix ? Math.min(target, mix + dc) : Math.max(target, mix - dc);
    }
    if (phase === "out") {
      m -= dt / OUT_MS;
      if (m <= 0) {
        m = 0;
        cur = pending ?? cur;
        pending = null;
        phase = "hold";
        holdT = 0;
      }
    } else if (phase === "hold") {
      holdT += dt;
      if (holdT >= HOLD_MS) phase = "in";
    } else if (phase === "in") {
      m += dt / IN_MS;
      if (m >= 1) {
        m = 1;
        phase = "idle";
      }
    }
  }

  function step(dt: number, t: number) {
    if (!ctx2d) return;
    lastT = t;
    advance(dt);
    const k = ease(mix);
    const gkey: GroundKey = lite ? "lite" : "night";
    const gp = INKS[gkey];
    const pal: string[] = [];
    for (let b = 0; b < 3; b++) {
      const c0 = gp.home[b],
        c1 = gp.chat[b];
      pal.push(
        "rgba(" +
          Math.round(c0[0] + (c1[0] - c0[0]) * k) +
          "," +
          Math.round(c0[1] + (c1[1] - c0[1]) * k) +
          "," +
          Math.round(c0[2] + (c1[2] - c0[2]) * k) +
          "," +
          (c0[3] + (c1[3] - c0[3]) * k).toFixed(2) +
          ")"
      );
    }
    /* the peak: theme travel first (tmix), then the state tint (k), both on
       the same clock as the sky */
    const tk = ease(tmix);
    const pk = lerp3(
      lerp3(themeFrom[gkey][0], themeTo[gkey][0], tk),
      lerp3(themeFrom[gkey][1], themeTo[gkey][1], tk),
      k
    );
    pal.push(
      "rgb(" +
        Math.round(pk[0]) +
        "," +
        Math.round(pk[1]) +
        "," +
        Math.round(pk[2]) +
        ")"
    );
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.font = `${fontPx.toFixed(1)}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx2d.textBaseline = "top";
    const em = ease(m);
    const imgW = (0.35 + 0.55 * eff()) * em;
    const tideW = 1.08 - imgW;
    const l = lum(cur);
    for (let cx = 0; cx < cols; cx++)
      sinCol[cx] = Math.sin(cx * 0.42 + t * 0.0004);
    for (let cy = 0; cy < rows; cy++)
      sinRow[cy] = Math.sin(cy * 0.71 - t * 0.00029);
    for (let d = 0; d < cols + rows; d++)
      sinDiag[d] = Math.sin(d * 0.27 + t * 0.00019);
    let lastBucket = -1;
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const tide = (sinCol[cx] + sinRow[cy] + sinDiag[cx + cy] + 3) / 6;
        const v = l[cy * cols + cx] * imgW + tide * tideW;
        const idx = Math.floor(clamp(v, 0, 0.999) * RAMP.length);
        if (idx < 1) continue;
        const bucket = idx < 3 ? 0 : idx < 5 ? 1 : idx < 7 ? 2 : 3;
        if (bucket !== lastBucket) {
          ctx2d.fillStyle = pal[bucket];
          lastBucket = bucket;
        }
        ctx2d.fillText(RAMP[idx], cx * cw + 2, cy * ch + 3);
      }
    }
  }

  /* jump every envelope to its destination: the reduced-motion still */
  function settle() {
    if (pending) {
      cur = pending;
      pending = null;
    }
    phase = "idle";
    m = 1;
    holdT = 0;
    mix = target;
    tmix = 1;
  }

  function staticFrame() {
    if (!ready) return; // staged boot: stage 3 paints the first frame
    settle();
    step(0, lastT);
  }

  /* a source never swaps, it travels: out to pure tide, hold, in.
     requests mid-flight reroute gracefully (lab request(), verbatim) */
  function request(next: SourceName, snap: boolean) {
    if (snap) {
      pending = next;
      settle();
      return;
    }
    if (phase === "idle" && next === cur) return;
    if (phase === "in" && next === cur && !pending) return;
    if (phase === "hold") {
      cur = next;
      pending = null;
      return;
    }
    if (phase === "out") {
      pending = next;
      return;
    }
    pending = next;
    phase = "out";
  }

  /* ------------------------------- runner (lab wire(), single scene) ----- */

  let visible = true;
  let running = false;
  let raf = 0;
  let last = 0;
  let t = 0;
  const durs: number[] = []; // tick durations, ring buffer for stats()
  let destroyed = false;

  function loop(now: number) {
    raf = 0;
    if (!running) return;
    if (now - last >= TICK_MS) {
      const dt = last === 0 ? TICK_MS : Math.min(now - last, 100);
      last = now;
      t += dt;
      const s0 = performance.now();
      step(dt, t);
      durs.push(performance.now() - s0);
      if (durs.length > 240) durs.shift();
    }
    raf = requestAnimationFrame(loop);
  }

  function update() {
    const run =
      ready && visible && !document.hidden && !reduced() && !destroyed;
    container.classList.toggle("paused", !run);
    if (run && !running) {
      running = true;
      last = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    } else if (!run && running) {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      staticFrame(); // never leave a half-travelled frame on screen
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.target === container) {
          visible = e.isIntersecting;
          update();
        }
      }
    },
    { threshold: 0 }
  );
  io.observe(container);

  function syncGround() {
    const nextLite = isLite();
    if (nextLite === lite) return;
    lite = nextLite;
    if (!running) staticFrame();
  }

  /* ------------------------------- observers ----------------------------- */

  const cleanups: (() => void)[] = [];
  function listen(mq: MediaQueryList, fn: (e?: MediaQueryListEvent) => void) {
    mq.addEventListener("change", fn);
    cleanups.push(() => mq.removeEventListener("change", fn));
  }

  listen(matchMedia("(prefers-color-scheme: light)"), syncGround);
  listen(matchMedia("(prefers-reduced-motion: reduce)"), () => {
    update();
    if (!running) staticFrame();
  });

  /* the theme override is a root attribute; it survives astro:after-swap
     because theme.ts re-stamps it, and this observer sees the re-stamp */
  const mo = new MutationObserver(syncGround);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  cleanups.push(() => mo.disconnect());

  const onVis = () => update();
  document.addEventListener("visibilitychange", onVis);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVis));

  /* #120: the mark tracks the measured gutter, so every resize (orientation
     changes fire resize too) re-measures and repaints, debounced */
  let rto = 0;
  const onResize = () => {
    clearTimeout(rto);
    rto = window.setTimeout(repaint, 180);
  };
  window.addEventListener("resize", onResize);
  cleanups.push(() => {
    clearTimeout(rto);
    window.removeEventListener("resize", onResize);
  });

  /* #120: DPR changes (window dragged between displays, zoom) re-rasterize
     the field; matchMedia is per-value, so the watcher re-arms itself */
  let unDpr: (() => void) | null = null;
  const watchDpr = () => {
    unDpr?.();
    const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => {
      watchDpr();
      repaint();
    };
    mq.addEventListener("change", onDpr);
    unDpr = () => mq.removeEventListener("change", onDpr);
  };
  watchDpr();
  cleanups.push(() => unDpr?.());

  /* --------------------------------- boot --------------------------------
     Staged so no single task can cross the long-task line on a throttled
     mobile trace (#70: TBT ~0 must hold even though init lands inside the
     Lighthouse window): sizing + sampling in one stage, the first paint +
     facade handoff in the next, the canvas fade-in target after its
     committed 0 so the 400ms transition actually runs (instant under
     reduced motion).

     Stage boundaries prefer a frame (rAF: work splits across paints on
     visible tabs and the fade reads properly) but MUST NOT depend on one:
     rendering opportunities are suppressed in backgrounded tabs and can be
     starved right after a client-side navigation (view-transition cover),
     which rendered validation caught twice (a remount stuck at opacity 0;
     a background tab that never booted at all). Each stage races rAF
     against a wall-clock timeout, first one wins; a hidden tab completes
     the boot on throttled timers with one cheap settled frame while the
     runner itself stays paused until visibility (update()). */
  function defer(fn: () => void, ms: number) {
    let done = false;
    const once = () => {
      if (done || destroyed) return;
      done = true;
      fn();
    };
    requestAnimationFrame(once);
    window.setTimeout(once, ms);
  }

  defer(() => {
    resize();
    lum(cur); // sample the mark off the paint path
    defer(() => {
      ready = true;
      staticFrame(); // the first painted frame (a settled still under RM)
      container.classList.add("live"); // fades the facade sky out
      update(); // starts the runner (visibility and reduced motion permitting)
      defer(applyAlpha, 600);
    }, 300);
  }, 300);

  /* ------------------------------ handle API ----------------------------- */

  return {
    el: container,

    /** one press changes the whole scene (lab setTheme4): the incoming sky
        slot crossfades on the scene clock, the peak lerps inside the tide,
        and the mark travels through the source envelope. Page GROUND
        identities (#74) ride :root tokens and belong to B3. */
    setTheme(name: ThemeName) {
      if (name === theme) return;
      theme = name;
      container.dataset.sceneTheme = name;
      slotB ??= buildSkySlot(name, false);
      if (!slotB.parentNode) slotA.after(slotB);
      const incoming = slotA.classList.contains("on") ? slotB : slotA;
      const outgoing = incoming === slotA ? slotB : slotA;
      incoming.dataset.sky = name;
      outgoing.classList.remove("on");
      incoming.classList.add("on");
      const tk = ease(tmix);
      themeFrom = {
        night: [
          lerp3(themeFrom.night[0], themeTo.night[0], tk),
          lerp3(themeFrom.night[1], themeTo.night[1], tk),
        ],
        lite: [
          lerp3(themeFrom.lite[0], themeTo.lite[0], tk),
          lerp3(themeFrom.lite[1], themeTo.lite[1], tk),
        ],
      };
      themeTo = PEAKS[name];
      tmix = 0;
      request(THEME_SOURCE[name], reduced() || !running);
      if (!running) staticFrame();
    },

    setMark(name: SourceName) {
      container.dataset.sceneMark = name;
      request(name, reduced() || !running);
      if (!running) staticFrame();
    },

    setState(next: SceneState) {
      if (next === state) return;
      state = next;
      container.dataset.sceneState = next;
      target = next === "chat" ? 1 : 0;
      if (!running) staticFrame();
    },

    stats(): SceneStats {
      const sorted = [...durs].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      return {
        ticks: sorted.length,
        avg: sorted.length ? sum / sorted.length : 0,
        p95: sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0,
        max: sorted.length ? sorted[sorted.length - 1] : 0,
      };
    },

    destroy() {
      destroyed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      for (const fn of cleanups) fn();
    },
  };
}

/* ------------------------------------------------------- hero band still --
   The article hero band (#97/#103): HeroBand.astro server-renders the band
   and its glyph facade; this paints the live layer, a SETTLED STILL of the
   page's mark contain-fit in the band (symbol centered, max height, never
   cropped). Deliberately not animated and not a second engine: one paint at
   idle, repaints only on resize/ground flips, zero tick cost, so the scene
   keeps the whole 4ms budget. The motion spec (#139) owns whether this
   still ever learns to move. The band is per-page DOM (no persist), so a
   navigation rebinds a fresh element; the observers below are module-level
   and wired once. */

const HERO_INTENSITY = 0.6; // the lab's hero default strength (PLACE_DEFAULT)

let heroEl: HTMLElement | null = null;
let heroCanvas: HTMLCanvasElement | null = null;
let heroWired = false;

function paintHeroStill(el: HTMLElement, canvas: HTMLCanvasElement): void {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return;
  const theme: ThemeName = isThemeName(el.dataset.heroTheme)
    ? el.dataset.heroTheme
    : "default";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = Math.ceil(r.width / CW);
  const rows = Math.ceil(r.height / CH);

  /* sample the mark: contain-fit into the band, mapped to the cell grid
     (the mount's sample(), inlined for the band's own geometry; a band is
     ~1.2k cells, far under CELL_CAP, so no cell scaling is needed) */
  const hi = document.createElement("canvas");
  hi.width = SRC_W;
  hi.height = SRC_H;
  const hictx = hi.getContext("2d");
  if (!hictx) return;
  DRAW[THEME_SOURCE[theme]](hictx);
  const grid = document.createElement("canvas");
  grid.width = cols;
  grid.height = rows;
  const gctx = grid.getContext("2d", { willReadFrequently: true });
  if (!gctx) return;
  const scale = Math.min(r.width / SRC_W, r.height / SRC_H);
  const dw = SRC_W * scale;
  const dh = SRC_H * scale;
  const dx = (r.width - dw) / 2;
  const dy = (r.height - dh) / 2;
  gctx.fillStyle = "#FFFFFF";
  gctx.fillRect(0, 0, cols, rows);
  gctx.drawImage(hi, 0, 0, SRC_W, SRC_H, dx / CW, dy / CH, dw / CW, dh / CH);
  const data = gctx.getImageData(0, 0, cols, rows).data;

  /* one settled frame of the tide formula (fixed clock, the same instant
     the scene's reduced-motion still uses), band strength from the lab */
  const gkey: GroundKey = isLite() ? "lite" : "night";
  const inks = INKS[gkey].home;
  const pal = inks.map(
    (c) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + c[3] + ")"
  );
  const pk = PEAKS[theme][gkey][0];
  pal.push("rgb(" + pk[0] + "," + pk[1] + "," + pk[2] + ")");
  const imgW = 0.35 + 0.55 * HERO_INTENSITY;
  const tideW = 1.08 - imgW;
  const t = 52000;
  ctx.clearRect(0, 0, r.width, r.height);
  ctx.font = `${FONT_PX}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  ctx.textBaseline = "top";
  let lastBucket = -1;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx;
      const l =
        1 -
        (0.2126 * data[i * 4] +
          0.7152 * data[i * 4 + 1] +
          0.0722 * data[i * 4 + 2]) /
          255;
      const tide =
        (Math.sin(cx * 0.42 + t * 0.0004) +
          Math.sin(cy * 0.71 - t * 0.00029) +
          Math.sin((cx + cy) * 0.27 + t * 0.00019) +
          3) /
        6;
      const v = l * imgW + tide * tideW;
      const idx = Math.floor(clamp(v, 0, 0.999) * RAMP.length);
      if (idx < 1) continue;
      const bucket = idx < 3 ? 0 : idx < 5 ? 1 : idx < 7 ? 2 : 3;
      if (bucket !== lastBucket) {
        ctx.fillStyle = pal[bucket];
        lastBucket = bucket;
      }
      ctx.fillText(RAMP[idx], cx * CW + 2, cy * CH + 3);
    }
  }
}

function wireHero(): void {
  if (heroWired) return;
  heroWired = true;
  const repaint = () => {
    if (heroEl?.isConnected && heroCanvas) paintHeroStill(heroEl, heroCanvas);
  };
  let hto = 0;
  window.addEventListener("resize", () => {
    clearTimeout(hto);
    hto = window.setTimeout(repaint, 180);
  });
  matchMedia("(prefers-color-scheme: light)").addEventListener(
    "change",
    repaint
  );
  new MutationObserver(repaint).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

/* the mount's stage-race pattern (rAF preferred, wall clock guaranteed),
   module-level for the band: rendered Lighthouse caught the unstaged bind
   fusing module eval + scene mount + this paint into one ~400ms mobile
   task (TBT). Staged, the paint runs as its own short task and the .live
   fade gets a committed opacity 0 to transition from. */
function heroDefer(fn: () => void, ms: number): void {
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(once);
  window.setTimeout(once, ms);
}

/** bind (or re-bind) the page's hero band; idempotent per element, called
    at module init and on every client-side navigation. The work is staged
    OFF the caller's task (see heroDefer): a navigation mid-stage simply
    drops the stale element. */
export function initHeroBand(): void {
  const el = document.querySelector<HTMLElement>("[data-hero-band]");
  if (el === heroEl && el?.isConnected) return;
  heroEl = el;
  heroCanvas = null;
  if (!el) return;
  heroDefer(() => {
    if (heroEl !== el || !el.isConnected) return;
    const canvas = document.createElement("canvas");
    el.appendChild(canvas);
    heroCanvas = canvas;
    paintHeroStill(el, canvas);
    heroDefer(() => {
      if (heroEl === el && el.isConnected) el.classList.add("live");
    }, 300);
  }, 300);
  wireHero();
}

/* ----------------------------------------------------------- module init -- */

/** live-layer styles, adopted once on the persistent document (survives
    every ClientRouter swap); <style> fallback re-checked per init because
    router swaps replace <head> children */
let liveSheet: CSSStyleSheet | null = null;
function ensureLiveStyles() {
  try {
    if (!liveSheet) {
      liveSheet = new CSSStyleSheet();
      liveSheet.replaceSync(liveCss);
    }
    if (!document.adoptedStyleSheets.includes(liveSheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, liveSheet];
    }
  } catch {
    if (!document.getElementById("scene-live-style")) {
      const style = document.createElement("style");
      style.id = "scene-live-style";
      style.textContent = liveCss;
      document.head.appendChild(style);
    }
  }
}

let handle: SceneHandle | null = null;

/**
 * Bind (or re-bind) the scene to the page's reserved facade. Idempotent:
 * called after the idle-hook import and again on every client-side
 * navigation. The facade carries transition:persist, so when both pages
 * render it the same live DOM (canvas, sky) survives the swap and this is a
 * no-op; a page without the facade tears the scene down, and returning to
 * one mounts a fresh scene into the fresh server HTML.
 */
export function initScene(): SceneHandle | null {
  const el = document.querySelector<HTMLElement>("[data-scene]");
  if (handle && handle.el === el && el.isConnected) return handle;
  if (handle) {
    handle.destroy();
    handle = null;
  }
  if (!el) return null;
  ensureLiveStyles();
  handle = mount(el);
  if (["localhost", "127.0.0.1"].includes(location.hostname)) {
    (window as unknown as { __scene?: SceneHandle }).__scene = handle;
  }
  return handle;
}

const w = window as unknown as { __sceneInit?: boolean };
if (!w.__sceneInit) {
  w.__sceneInit = true;
  document.addEventListener("astro:page-load", () => {
    initScene();
    initHeroBand();
  });
  /* the module arrives at idle, after the importing page already loaded:
     bind that page's hero band now rather than waiting for the next nav */
  initHeroBand();
}
