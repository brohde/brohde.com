# Handoff: matrix identity sources + palettes (#111 identity plan, Brian-approved)

_Scope: the per-page mark sources, tide peak palettes, and the site-default swap from the Brian-approved matrix identity plan (docs/reference/editorial-review-r1.md section 2, as amended by Brian). Built on branch `worktree-agent-a7e5eff5cad9dc2d9`; merges AFTER the two other in-flight branches. Written per #127._

## What shipped

Files touched (nothing else):

- `src/scripts/scene/sources.ts`: five new drawers + a `drawWord` letterform helper + `roundedRect` helper; `SourceName` widened
- `src/scripts/scene/index.ts`: three new themes in `ThemeName` + `PEAKS`; `THEME_SOURCE` remapped (default and android changed, three added)
- `src/components/Scene.astro`: default `mark` prop `"eight"` to `"br"`; prop unions widened; identity comment updated
- `src/styles/scene.css`: comment-only update (themed skies stay deferred to B3, new themes included)

### Sources added (all 480x300, house drawer idioms)

| source | figure | ink_w | ink_h | bottom margin | notes |
|---|---|---|---|---|---|
| `br` | "BR" letterform, house stroke-over-fill | 0.842 | 0.890 | 8.0% | site default |
| `robot` | Android robot (dome, antennae, dot eyes, body, arms, legs) | 0.746 | 0.903 | 8.0% | see license note below |
| `gccm` | "GCCM" letterform, stroke 16 | 0.900 | 0.510 | 23.7% | wide-short, centered vertically (contain-fit centers it; the 8% rule targets full-height marks) |
| `atg` | "atg" letterform, stroke 22 | 0.885 | 0.793 | 10.7% | monogram variant chosen, see judgment calls |
| `twilio` | ring + four dots (two upper, two lower), MARK ONLY, no lettering | 0.563 | 0.900 | 8.0% | circle is aspect-bound; 0.56 width is its geometric ceiling |

Ratios measured on the rendered harness (exact esbuild transpile of `sources.ts`, ink bbox / frame). Calibration on the same harness: `f` = 0.863 tall axis (vs 0.840 quoted in #104, same ballpark, methodology comparable); the known-bad `pose` = 0.613 tall axis, matching #104's 0.610. All five new marks clear the #104 lesson.

Kept but unmapped: the `eight` (8) drawer (hero-variant material) and the `g` (G) drawer (superseded by the robot per the approved plan).

### Palettes added (`PEAKS` in index.ts)

Existing structure holds: `INKS` (the calm text ramp) is shared across every theme by design; the per-theme voice is the `PEAKS` entry. The "new ink palettes" of the work order are therefore PEAKS entries, keeping the existing palette structure. Chat peaks stay in the golden-hour amber family under every theme (house rule from the lab).

| theme | night home | night chat | lite home | lite chat | worst contrast |
|---|---|---|---|---|---|
| `atg` | 224,210,189 (bone) | 240,196,130 | 97,78,55 (umber) | 130,82,24 | 6.39:1 |
| `goldcoast` | 233,186,64 (gold) | 248,196,92 | 136,92,6 | 140,84,14 | 5.66:1 |
| `twilio` | 246,78,94 (lifted red) | 244,186,105 | 186,18,42 | 136,78,18 | 5.44:1 |

Contrast measured against both grounds (#0e1512 night, #fbfbf8 light), WCAG method. Existing floor for reference: android lite/home = 4.84:1; all new combos sit above it. The literal Twilio red #F22F46 measures 4.64:1 on night, under the floor, hence the slight night lift; the lite value deepens the brand red for the light ground.

### THEME_SOURCE map (after)

`default: br` (was eight), `eight: logo`, `news: f`, `android: robot` (was g), `atg: atg`, `goldcoast: gccm`, `twilio: twilio`.

## Android attribution FOLLOW-UP (required before launch)

The Android robot is licensed by Google under CC BY 3.0 (Google brand guidelines allow use and modification with attribution). The source-code citation sits at the `drawRobot` drawer. **A USER-VISIBLE attribution line is still required somewhere on the site**; placement is a copy decision not taken here (likely the google-android-for-work article footer). Owner: lead/copywriter. Do not launch the android identity publicly without it.

## Twilio: dormant + mark-only

- No page consumes the twilio theme today: the twilio piece is an `external:` entry with no interior page. The source + palette land dormant for future use.
- Per Brian's mid-build clarification: the drawer is the MARK ONLY (red ring, four dots inside, two upper two lower), no wordmark, no text lockup anywhere in it. Compliant as built; verified on the rendered harness and at gutter scale (bitmap occupancy map: ring + four separated clusters, zero lettering).
- Dots run r23 vs the proportional ~r26 on purpose: at the tide's coarse cell grid the proportional dots merged into two blobs (caught on rendered validation); the extra gap keeps four distinct dots.
- Trademark note for the record: the editorial report's own guideline was "never pair a client's exact logo geometry with its exact brand color"; Brian explicitly ordered the Twilio logo geometry + Twilio red, and his modifications override the report. The #45/#59 decorative-marks flag remains the lead's item.

## What B3 must wire (not done here, per the fences)

1. Per-article theme wiring: article pages currently render the `TideBand` facade, not the scene. B3 passes `theme` (and optionally `mark`) into `Scene.astro` per page: eight-angle-ml = `eight`, facebook-newsroom = `news`, google-android-for-work = `android`, atg-llm-migration = `atg`, gold-coast = `goldcoast`. Homepage/about/404/brohde-com-build ride `default` (BR).
2. Themed SKY css: `.skyslot[data-sky]` palette blocks (lab reference) for ALL non-default themes, the new three included; deliberately not added here.
3. Per-page GROUND identities (#74): `:root` token work, B3.
4. Gold Coast consent gate: the gold-coast piece is unpublished pending Dragan; the identity ships with the piece, not before.
5. The user-visible Android attribution line (above).

## Judgment calls a reviewer should know

- **atg variant**: chose the `"atg"` monogram over the single `"a"` (the report offered both). The lone lowercase a maxes out near 0.58 frame width; the monogram presents at 0.885 and carries more identity. This is the "presents best at gutter scale" call the brief asked for.
- **drawWord** places letterforms on the alphabetic baseline (not `middle` like the single-letter `drawLetter`) so the ink box lands deterministically against the 8% bottom safe line.
- **roundedRect** builds the robot body from `arcTo` rather than `ctx.roundRect` to stay inside the arc/line idioms the file already uses (no newer-API dependency inside the render path).
- **gccm stroke 16 / atg stroke 22** vs the house 26: at their smaller font sizes the full 26 clogs counters; strokes scaled to hold roughly the same relative weight as `f`.
- **INKS untouched**: see palettes section; per-theme INKS would have changed the structure the work order said to follow.

## Verification record

- `npm run build` green (astro check + build, 10 pages; the `z` deprecation warnings in content.config.ts are the pre-existing cosmetic hints STATUS tracks).
- All browser checks via Sonnet subagents (#82), built dist served on port 4390, harness on 4391:
  - Harness: all 10 sources drawn + measured; 5 new marks read correctly (BR, robot, GCCM, atg, ring+4 dots), no frame-edge clipping.
  - Homepage: server DOM carries `data-scene-mark="br"`; the tide forms a large BR centered in the right gutter; mark viewport-fixed (does not scroll).
  - #120 tracking: `--scene-edge` matches the measured `.wrap` right edge at 1440px (0.03px delta) and 1720px (0.005px delta); narrow width drops to whisper background mode (verified at 600px).
  - Theme flip (light/dark): ground + tide inks flip, no console errors.
  - All six themes rendered at gutter scale via `window.__scene.setTheme(...)`: figures recognizable, all six accent colors sampled from the canvas match spec exactly (peak RGBs read back verbatim).
  - /chat: loads clean, no scene, no console errors; golden-hour state machinery untouched by this diff.
- **Perf: environment-blocked, closed by argument + one human check.** The automation tabs were OS-occluded all three runs (visibilityState "hidden", rAF dead, confirmed by control tests), so `stats()` could not tick; same artifact class as #124's visibility non-pass. By construction this diff cannot move tick cost: the tick loop is untouched, `PEAKS`/`THEME_SOURCE` are same-shape lookups, and drawers execute only inside `sample()` (once per mark change, where `getImageData` dominates identically for every source). Human closure: focus a localhost:4390 tab for ~30s, run `window.__scene.stats()`, expect max under 4ms as B1 measured.

## Loose ends / flags

- **GCCM legibility at gutter scale**: four letter-blocks are countable but not crisply readable as G-C-C-M at a 1440px gutter (validator's honest read). This is the physics of 4 characters across a 480-wide frame sampled at 15x18px cells; a 2x2 stacked composition was evaluated and does NOT help (the landscape frame height-binds it to the same per-letter size). Reads better on wider gutters. Design/Brian may want a look; the identity also carries through the gold accent.
- **atg** letterforms are plausible-but-soft at gutter scale for the same reason; clear at harness scale.
- The perf human check above.
- Validation screenshots live in the browser tool session, not on disk (automation environment could not write files); the measured numbers in this doc are the durable record.
