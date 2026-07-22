/**
 * Scene palette data (#106 extraction): the pure colour tables the tide engine
 * reads, lifted out of scene/index.ts so the engine file is about the engine.
 * No DOM, no timers, no behavior: ink ramps, per-theme peaks, and the mark each
 * theme carries, plus the ground/state/theme type vocabulary. The lab values
 * are verbatim (docs/design/lab/aurora-terminal.html, #106); nothing here is a
 * new literal. mount() in index.ts imports these; isThemeName is re-exported
 * from index.ts for the terminal.ts scene bridge.
 */
import { type SourceName } from "./sources";

export type GroundKey = "night" | "lite";
export type SceneState = "home" | "chat";
export type ThemeName =
  | "default"
  | "eight"
  | "news"
  | "android"
  | "atg"
  | "goldcoast"
  | "twilio";

/* the three ink buckets: one calm text ramp shared by every theme, lerping
   home-to-chat on the sky's clock (lab values, verbatim) */
export const INKS: Record<GroundKey, Record<SceneState, number[][]>> = {
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
export const PEAKS: Record<ThemeName, Record<GroundKey, number[][]>> = {
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
export const THEME_SOURCE: Record<ThemeName, SourceName> = {
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
