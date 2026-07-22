# Handoff: interior pages (B2 Phase 3 + B3)

_Branch `worktree-agent-a19cf90b3ed2a5b27`, based on main with both Phase 2 merges folded in (final base includes c8b6704 and the OG/hardening commits through b7711dc). Commits: ec25618 (Phase A, article template), 2c54257 (Phase B, core pages), 542d52f (Phase C, copy debts), 8232282 (perf staging fix). Not merged, not pushed; the lead merges. Written per #127._

## What this build is

The interior of the site joins the shell: every article page and /about (plus 404) now mounts the ONE persistent scene (#109: content left column, right gutter preserved) wearing a per-article identity (#111), articles open with the #97/#103 hero band presenting their mark large, article images sit on the article-visuals paper plates, and four copy debts are paid (styleguide titles, label concision, Android CC BY attribution, gold-coast Squarespace line).

## Wiring map (who wears what)

| Page | theme | sky | mark |
| --- | --- | --- | --- |
| / (home), /about, /404, /chat | `default` | default | BR letterform |
| /log/eight-angle-ml | `eight` | teal (lab) | Eight Angle logo |
| /log/facebook-newsroom | `news` | Facebook blue (lab) | f letterform |
| /log/google-android-for-work | `android` | Google quartet (lab) | Android robot |
| /log/atg-llm-migration | `atg` | DEFAULT (see flags) | atg letterform |
| /log/gold-coast | `goldcoast` | DEFAULT (see flags) | GCCM letterform |
| twilio-signal-pong (draft) | `twilio` | DEFAULT | Twilio mark |
| brohde-com-build (draft) | `default` | default | BR |

Mechanics: `theme` is a frontmatter enum (content.config.ts) with default `default`. The article template passes it to `<Scene theme={...} />` AND stamps `data-scene-theme` on the `[data-screen]` section. On a fresh load the mount reads the server-rendered scene dataset; on client-side navigations the persisted scene node keeps the OLD page's dataset, so the terminal.ts bridge (extended `syncSceneState`) reads the fresh section stamp and calls `setTheme()`, which travels sky + peak + mark together (snap under reduced motion). This is exactly the wiring the motion spec's items 4 and 5 prescribe, so Phase 3 transitions build directly on it.

## What shipped, by phase

### Phase A: article interior template (ec25618)

1. **Per-article scene identity.** Schema field + frontmatter on six articles + section stamp + bridge (above). `Scene.astro` bug fixed on the way: the `mark` prop defaulted to `"br"`, and a server-rendered `data-scene-mark="br"` outranks `THEME_SOURCE[theme]` in the mount, so every fresh themed load would have worn BR. The attribute now renders only on an explicit override; no page overrides today.
2. **Themed skies.** The three lab-designed palettes (eight/news/android) ship verbatim in TWO scopes: container-scoped var blocks in scene.css so the SERVER FACADE paints the page's own sky from the first frame (no default-violet flash on a fresh themed load), and slot-scoped `.skyslot[data-sky]` blocks in live.css so a crossfade keeps each sky's own palette mid-travel (the container attribute flips instantly; the outgoing slot must not). The default palette is pinned explicitly on default/atg/goldcoast/twilio slots for the same reason.
3. **Chat facade gap (Phase 2 fence item) fixed.** `.scene[data-scene-state="chat"] .scn-static` remaps the four home slots to the golden-hour set; a fresh /chat load paints golden hour immediately (validated: computed `--sc-h1` on `.scn-static` is amber at ~130ms).
4. **Hero band (#97/#103).** `TideBand.astro` became `HeroBand.astro`: 30% of the screen (`--screen: max(640px, 100svh)`, the #103 token), ground bleed mask from the 20% line (20/30 = 66.7% of the band, so no rectangle reads), body top at 27.5% via a negative bottom margin. The band follows the page ground; its ink pair is the article peak (hex table in the component, KEEP IN SYNC note against `PEAKS`). Live layer = a settled STILL of the article's mark contain-fit in the band (symbol centered, max height, never cropped), painted by `paintHeroStill`/`initHeroBand` in the scene chunk: one paint at idle, repaints only on resize/ground flip, ZERO tick cost. Facade = the old server glyph field, now peak-tinted, crossfading to the still.
5. **Figure plates (article-visuals material rules).** Markdown authors write `<figure>` + image + `<figcaption>`; the `<p>` Astro wraps the image in becomes the editorial plate (`--well` mount, hairline, 12px radius; image hairline + 7px radius), the caption sits outside on the page ground in dim editorial 13.5px. Night ground reins bright captures in (`brightness(.9) contrast(.96) saturate(.97)`), light leaves them untouched. `<figure class="portrait">` narrows to 300px for phone captures. Both live newsroom figures render on plates now.
6. **Android CC BY 3.0 attribution** (required, #135 follow-up): rendered by the TEMPLATE when `theme === "android"` (`.attrib`, mono 11.5px dim, after the footer chips), so it can never detach from the identity it credits.

### Phase B: core pages (2c54257)

/about and /404 mount `<Scene />` on the default BR identity; both inherit the full-width left-anchored shell automatically (`body:has(.scene)`, #125/#126). /chat untouched (Phase 2 owns it; my only interaction is the facade fix above). Styleguide deliberately stays scene-less: a centered dev surface.

### Phase C: copy debts (542d52f)

- Styleguide ledger specimen carries the two real current titles (Eight Angle on-device classifier; Twilio Hackpack v4 with the #141 domain unit).
- Label concision, no meaning changes: the styleguide comment line tightened; "global header (B2 Phase 1)" drops the stale phase tag; /about drops a repeated "Facebook" ("Newsroom, its first WordPress site").
- gold-coast body gains the grounded line: "The site he wanted to replace was running on Squarespace." (second sentence of "The designs"; owner-stated fact per #134). **For Brian's read.**

### Perf fix (8232282)

Rendered Lighthouse caught the unstaged hero bind fusing module eval + scene mount + the band paint into one ~400ms mobile task (article Perf 96, TBT 220ms). Now staged with the mount's rAF/timeout race. Re-validated: article and home both Perf 100 / TBT 0 / CLS 0 on the built dist, long-task audit empty.

## Judgment calls a reviewer should know

1. **Hero band + gutter mark coexist, band at column width.** The lab's demo 04 auditioned placements one at a time ("hero band wins for article pages"), but #109 later made the gutter the scene's home on EVERY page, and the work order asked for both. Resolution: the band is the article's masthead moment inside the content column (where the old tideband sat), the gutter is the persistent identity; both wear the same mark + peak, so they read as one identity, and the full-width band can never collide with the viewport-fixed gutter mark. A full-width band was rejected on that collision.
2. **The hero still is static.** No second tide engine, no animation: #139 gates all new motion, and a second rAF loop would eat into the 4ms budget for a decorative moment. The motion pass owns whether the band ever learns to move.
3. **The band follows the ground, not always-night.** Per the lab, the hero tide dissolves INTO the page ground (that is the whole point of the bleed); it is atmosphere, not a content figure, so the "diagram = always-night screen" material rule does not apply to it.
4. **Night rein-in applies to ALL article images** on the night ground (no per-image `bright` flag exists in plain markdown). Dim captures get marginally dimmer; the lab's own night-dimming note says the filter is deliberately subtle.
5. **Diagram + lifted-card figure idioms not speculatively ported.** The screen-object (`pre`) and stat-band (`.astats`) materials already exist; the lab's flow/node diagram CSS lands with the first real in-house diagram rather than as dead bytes in critical CSS.
6. **404 got the scene** (the matrix wiring list has 404 riding default); it cost one line.
7. **Critical CSS grew ~90 gzip-friendly lines** (themed facade vars + state remap). Measured consequence: none (Perf 100 / FCP unchanged class). The alternative (lazy-only themed skies) would re-open the default-sky-flash gap for themed pages.

## Validation record

All browser work via Sonnet subagents (#82), on the BUILT dist at localhost:4410 (still serving for review).

- `npm run build` green throughout (astro check + build; the pre-existing content.config.ts `z` deprecation hints only; 10 pages).
- **PASS (measured):** theme wiring exact on all five article pages (scene + section stamps); hero band height exactly 0.30 x max(640, svh) everywhere; band goes `.live` with canvas at opacity 1; marks recognizable in screenshots (8, f, robot unambiguous; atg/GCCM letterforms legible-as-marks at the validator's small window, same physics the matrix handoff flagged); bottom dissolve confirmed (no rectangle edge); date overlaps the band bottom as specced; `--scene-edge` = `.wrap` right edge exact on every page; sky vars byte-exact per theme (Google quartet verbatim; atg/goldcoast byte-identical to default by design); facade first paint themed at ~130ms on newsroom and golden-hour on /chat (no default flash); client-side nav keeps the SAME scene node and flips theme default->atg->default (tagged-node proof); figure plates verified in both grounds incl. filter on/off; attribution present on android only; Squarespace line in place; /about + /404 scene mounts; CLS 0 over 6s on newsroom; zero console errors everywhere; no horizontal overflow at 500px with whisper background fallback; theme toggle flips ground/band ink/sky/filter.
- **Lighthouse mobile on dist:** / = 100 / TBT 0 / CLS 0; /log/facebook-newsroom/ = 100 / TBT 0 / CLS 0 (after 8232282; before it: 96 / 220ms, root-caused and fixed).
- **Environment-blocked, closed by argument + one human check** (same artifact class as #124 / matrix): (a) desktop-width visuals: the automation window was floored at 500x479, so the gutter mark per article, the /about left-anchor comparison, and the 2.6s crossfade travel were verified by attribute/palette measurement, not by eye at 1440px. One human pass over localhost:4410 closes it. (b) `window.__scene.stats()` could not tick (tabs OS-occluded, rAF dead); by construction this build adds NOTHING to the tick path (the hero still is a one-time paint outside the runner), so B1's measured budget stands; focus a tab ~30s and expect max < 4ms. (c) reduced-motion emulation is not exposed to the tool; by construction the still paints normally and its transitions are none'd.

## Open items / flags for Brian

1. **Squarespace line** (gold-coast, "The designs"): owner-stated per #134, one sentence, please read.
2. **atg / goldcoast / twilio have no designed sky palettes** (the lab predates them): they ride the default sky; peak + mark carry the identity. If Brian wants fully themed skies for these three, that is a design-director round (palette + contrast audit), not an engineering gap.
3. **Gold Coast consent** is still open per STATUS while the piece and now its identity are live; unchanged by this build, but the identity makes the page more branded, so worth resolving.
4. **Per-page GROUND identities (#74)** deliberately not done: changing grounds per page invalidates the measured pour floors (4.81:1 worst) and needs its own contrast audit.
5. **Motion-spec items deliberately not built** (gated on Brian, #139/#112): wipe retirement, `<main>` view-transition, header `transition:persist`, micro-interactions, any hero band motion.
6. **Human desktop pass** over localhost:4410 (or the deployed preview after merge): the five article pages at full width, one home->article->home navigation to watch the travel, and the `stats()` check above.
7. **twilio-signal-pong** carries `theme: twilio` in frontmatter; the identity goes live the moment the draft flips (no extra wiring needed). Same for brohde-com-build on default.
8. The hero band's ink table in HeroBand.astro duplicates PEAKS home values as hex (SSR cannot import the scene module because it touches window at eval). KEEP IN SYNC comment is in both places; a palette change must touch both.
