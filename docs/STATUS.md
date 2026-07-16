# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, evening). Brian may clear the session; this file + DECISIONS + COMMS-LOG are the complete handoff._

## Artifact inventory (published; update via Artifact tool `url` param from any session)

| Artifact                                                                                        | URL                                                                  | Source file (`docs/design/`)      |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| **Homepage structure lab** (treatments A/B/C + article variants; **C CHOSEN, #67**)             | https://claude.ai/code/artifact/70935e14-01f4-43ed-8223-06946903b26c | `lab/homepage-structure.html`     |
| **build.log v3 interactive prototype** (interaction reference: boot, commands, alternate screen) | https://claude.ai/code/artifact/7ca6a6c4-df52-477a-b6e6-051b8cd40855 | `lab/build-log-v3.html`           |
| **Aurora Terminal Lab** (demo 04 composed scene; hero geometry #97 in flight, republish after)   | https://claude.ai/code/artifact/9b0b7ddf-75b3-4e68-bd36-d6b76647bd71 | `lab/aurora-terminal.html`        |
| **Article visuals lab** (imagery system: screen/paper/lifted; AWAITING BRIAN + asset list)       | https://claude.ai/code/artifact/82405b82-a35d-4cb1-8cce-d5d0c67e32fd | `lab/article-visuals.html`        |
| **Chat eval review** (interactive grading; regen via `node poc/chat/make-review.mjs`)           | https://claude.ai/code/artifact/55298a58-d9e4-4952-afdf-951c78adcbd2 | `../../poc/chat/eval-review.html` |
| Animation Lab (6 ambient demos)                                                                 | https://claude.ai/code/artifact/6b30f13b-9b24-4825-a7b2-7744d0168e38 | `lab/animations.html`             |
| Parked directions (Quarterly/Blackletter/Exposed Grid, round-2 split)                           | https://claude.ai/code/artifact/95d8afd0-bf02-4478-8f54-b87ea803c4f3 | `lab/parked-directions.html`      |
| Round 2 (historical, all 4 directions)                                                          | https://claude.ai/code/artifact/c0782148-e1c2-4727-9743-f75fb94ab3ff | `lab/round-2.html`                |
| Round 1: 10 concepts (historical)                                                               | https://claude.ai/code/artifact/8634c805-be41-4357-b23b-02b22ec5d6e1 | `design-concepts.html`            |

All artifacts republish with favicon 🎨 except the eval review (🧪).

## Where we are

**DEV LINK LIVE: https://brohde-com.pages.dev** (Cloudflare Pages, auto-deploys on push to `main`; validated on the rendered surface). NOTE: the URL is public-but-unlisted; don't circulate until editorial sign-offs below clear. **Phase 1 Astro scaffold COMMITTED and live on localhost:4321.** Chat behavior **signed off 38/38 (#61)** at `poc/chat/`. Direction decided: **Option C "the phosphor slab" (#67)** — terminal as one always-night physical object holding everything interactive, editorial Circular page around it, **chat expands the slab** toward full window and collapses back home with an **elegant designed transition both ways (#69)**. Supporting behaviors: hello = natural-language page tour with underlined links, external ↗ arrows never underlined (#68).

- Site: Astro 5 + Tailwind v4 static at repo root; `npm run dev` (localhost:4321), `npm run build` = `astro check && astro build` → `dist/`. Full build reference: **`docs/ENGINEERING.md`** (merged f199195, verified against source).
- Content: 5 real case studies render on the site (validated on rendered HTML after the content-store staleness fix, see ENGINEERING.md §2); `brohde-com-build` stubbed `draft: true`; `twilio-hackpack-v4` is an `external:` entry.
- Chat POC: real Haiku 4.5 at localhost:8787 (`cd poc/chat && npm start`), dev CORS for the Astro site; key in gitignored `poc/chat/.env` (expires 2026-08-14). **Production port lives at `functions/api/chat.ts` (POST /api/chat, #81)** — live once Brian's ANTHROPIC_API_KEY Pages secret + a redeploy land; prompt/facts bundle regenerates from `poc/chat/*.md` on every build.

## Agent board (this session)

**THE C BUILD IS MERGED TO MAIN (6228713) AND DEPLOYED** — C1 slab+editorial home (26873bb), C2 morph + live chat bridge (1b6ff53, #85), C3 article pages (8206723, #86), C4 chrome unification + straight-100s audit pass (76ac001, #87). Brian approved on the rendered preview (#87). The deployed pages.dev chat UI now talks to the production /api/chat. The old C engineer is RETIRED per #95 (no more resuming it).

**MODEL POLICY (#96)**: Opus for all agents, lower only where the task genuinely doesn't need it. `frontend-engineer.md` was still `model: fable` and BOTH original engineers died mid-work on a Fable out-of-credits API error (they had been mis-reported to Brian as Opus; a subagent's model is fixed at spawn). Definition now `opus`; copywriter + seo-a11y-auditor stay sonnet by choice. **If an agent dies on credits, check the definition's model first.**

In flight (fresh Opus agents; lead merges worktrees on completion — the two engineers have explicit file fences, see below):
- **Engineer A (opus) — RESPAWNED onto the surviving worktree** `.claude/worktrees/change-orders` (branch `feat/review-change-orders`, base 02eeb57): Brian's chrome/copy change orders: unbrand build.log (#88), hint line + textfield + placeholder (#89), (contract) + header arrows + hover restyle (#90), Circular copyright footer (#91). OWNS `EditorialHeader.astro`, `index.astro`, `styleguide.astro`, `terminal.css`. Ports 4330-4339.
- **Engineer B (opus) — RESPAWNED onto the surviving worktree** `.claude/worktrees/theme-toggle` (branch `feat/theme-toggle`, base 02eeb57): theme toggle (#92). OWNS `global.css`, `ThemeToggle.astro`, `theme.ts`; BARRED from engineer A's four files. Ports 4340-4349.
- **Design director (opus) — hero geometry #97**: reworks demo 04's hero placement in `docs/design/lab/aurora-terminal.html` ONLY (top 30% band, body bleeds from ~20%, symbol centered/height-100%/width-auto, perf + contrast re-measure). No commits. Ports 4350-4359.
- ~~Design director (opus) — article visuals~~ **DONE, committed a03bae1, artifact published** (82405b82-a35d-4cb1-8cce-d5d0c67e32fd). Direction: **no third visual language** — every figure declares its material. Diagram = **screen** object (always-night phosphor mono, in-house inline SVG, theme-independent); screenshot/archival still = **paper** object on an editorial plate that follows the theme (bright captures reined in on night ground only, `brightness(.9)`); argument-carrying numbers = **lifted card** (the stat-band pattern). No device frames, hairlines not shadows, cards not charts. Per-article figure plan for all five pieces; both archival pieces LEAD with a house diagram so they survive a trademark no. Lead fixed 2 stale "build.log" labels in the mockup pre-publish (#88). **AWAITING BRIAN**: asset request list + 4 open questions (see below).
- ~~Doc agent (sonnet)~~ **DONE, reviewed + committed 297d94d**: `aurora-handoff.md` now trails the theme-press rework (f653063) and records Brian's approval of its four taste flags (#94). Lead verified the load-bearing claims against `aurora-terminal.html` source (all 16 PEAKS hexes = the file's RGB triplets, PLACE_DEFAULT sky 26, THEME_SOURCE map, 0.12/0.28 caps, 0.66/0.74 sky glass pour, stage-scoped inks `#a2b8ab`/`#7c440c`, themed grounds); zero dashes (#18). The four OLDER demo-04 flags (landscape sources small in gutter, newsroom-blue chat, android rose variant, phone fallback cap ~0.2) survive as "still open (variants, not blockers)" — Brian's "I'm good with this!" answered the THEME flags, not these.

**Brian review surfaces**: localhost:4326 = scratchpad preview of the C4 tip with WORKING chat (POC CORS patched, ebe7365; POC on :8787); https://brohde-com.pages.dev = the same code with the real production chat.

**Next major build queued: #59/#74 aurora + image/glyph tide site integration — one scene, three placements, per-page theme identities.** Sequenced AFTER engineer B's theme toggle merges (the toggle defines how the theme override resolves; the aurora scenes ride that system) and article visuals direction lands (imagery must coexist with the live scene). Seams already in place: articles ship the static tide facade reserving layout (#70-safe), aurora lab approved (#94), handoff doc updating. Dispatch as a fresh phased build (Phase 1, 2, 3…) per #56/#95.

Done this stretch:
- **Production chat build (opus) — DONE, merged 4825d0c** per #73/#81: `functions/api/chat.ts` (POC port, parity proven via eval-http: 35/38 = the POC's identical 35/38, all stale labels), build-time prompt codegen from `poc/chat/*.md`, `wrangler.toml` (nodejs_compat), Turnstile graceful-skip, per-IP rate limiting. **KV `CHAT_RL` created + bound (ef0fbe1, #83).** GO-LIVE: waiting only on Brian's `ANTHROPIC_API_KEY` Pages secret + one redeploy after it (any push redeploys). TURNSTILE_SECRET must stay unset until the client sends tokens. Until the key exists, `/api/chat` returns the friendly 503; the deployed site's chat UI still uses the stub, so nothing user-visible breaks. #49 audit still gates public launch.
- **Aurora theme changes (fable design-director) — DONE, committed f653063, artifact republished (same URL, label theme-owns-the-scene)**: theme travels the source + recolors ground/glass on the 2.6s clock; full sky ghosts through lighter glass (capped 0.28); worst contrast 4.7:1 AA+; perf 0.77ms/tick vs 4ms budget. 4 taste flags await Brian (COMMS batch 51); `aurora-handoff.md` update deferred until his review.
- Sentence-case sweep (copywriter) — merged earlier; ENGINEERING.md reconciliation + styleguide .lbl wrap — merged earlier.

**Standing rule #82: the Fable lead NEVER drives Chrome — browser automation always via a Sonnet/Opus subagent.**

1. **Interaction cluster — DONE, merged 343663d, pushed (deploying to pages.dev)**: cursor #63 (tradeoffs logged #75), boot entry-only + no-blank-first-frame #64/#62, 140ms wipe (named transition kinds, slab morph #69 slots in later), hover unification, hello tour #68, dev chat bridge #54 (live replies on localhost:4321 against the POC; stub elsewhere). Follow-ups: styleguide `.cbtn` specimens need the `.lbl` wrap; ENGINEERING.md §3 reconciliation (agent dispatched).
2. **Perf (opus) — DONE, merged bab2a76**: inline critical CSS + cache headers + binding facade contract (#70); Lighthouse mobile Perf 100/TBT 0/CLS 0, validated on built dist. Its HIGH finding (boot = ~1.3s blank screen; prompt is `.bseq`-hidden so hello types invisibly) routed to the interaction agent as part of its #64 boot work.
3. **Docs (sonnet) — DONE, merged f199195**: `docs/ENGINEERING.md` + README. Flags 4 decision-vs-code gaps inline (all in the interaction agent's scope) → needs a **reconciliation pass after the interaction merge** (resume the same agent or quick lead edit).
4. **Demo 04 refinements — DONE, committed 8971c33, aurora artifact republished**: contain-fit, phone background fallback (whisper cap), per-page brand palettes (eight angle teal + logo source, newsroom Facebook blue, android Google quartet). Contrast all AA+ (worst 4.6:1), perf well inside budget. Taste flags await Brian in COMMS batch: gutter presents landscape sources small; chat stays golden hour under every theme; android drops the rose blob; phone fallback near-invisible on light ground by design.
5. **Cloudflare Pages setup — DONE**: https://brohde-com.pages.dev live, auto-deploys on push to `main`. Follow-ups: custom domain (needs registrar answer), PostHog env var later, 2 cosmetic `z` deprecation hints in content.config.ts.

## Next actions

1. **Chat go-live**: Brian sets `ANTHROPIC_API_KEY` (Pages → Settings → Variables and secrets, Secret, Production+Preview) → next push/redeploy activates it → validate `/api/chat` on brohde-com.pages.dev via curl (subagent for any browser check, #82). Turnstile + AI Gateway wiring later; #49 audit before chat is surfaced publicly.
2. **Option C phases**: C2 reviewed + accepted (#85); review C3 (article pages) when the agent reports, then C4; merge at the end, validate rendered (browser checks via subagent, #82), update ENGINEERING.md for the C architecture.
3. Brian reviews the aurora artifact's 4 new taste flags (COMMS batch 51) → then lead updates `aurora-handoff.md` to trail the file.
4. Then **#59/#74 aurora + tide site integration** (per-page themes as full-scene identities) after C lands.

## v2 / backlog (parked, Brian-approved ideas)

- **Contact form inside the chat** (Brian: "that would be pretty cool"): chat collects name/email/message conversationally, submits via the production Worker
- Ephemeral visitor-to-visitor chat (#32, parked)
- Presence planes with your-plane marker + steering (#43), post-v1
- Real brand marks in the glyph tide pending trademark-use check (#45/#59 note)

## Open questions for Brian

**ASSET REQUEST LIST (article visuals, 2026-07-15)** — only Brian can supply these; the in-house diagrams are unblocked and cost nothing but SVG:
1. **Eight Angle audit gallery screenshot** (the MediaPipe accept/reject browser gate). Proof of tooling discipline; nothing else shows it. _Priority 1._
2. **Eight Angle live app: pose overlay + 3D skeleton**, mid-practice, pose locked with the confidence chip. The "it actually works" shot. _Priority 1._
3. **Eight Angle Picture-in-Picture in action** (YouTube full-screen + tracking tile). Carries the marquee feature and the hardest-bug story. _Priority 1, optional but high value._
4. **Gold Coast: the original ChatGPT comps** (any 1-2 of the eight PNGs). The live "after" is already in the repo; without the comps the two-up thesis opener is impossible. _Priority 2._
5. **ATG "before"**: a WordPress-era screenshot or Wayback still ("after" already in repo). _Priority 3._
6. **Decision, not a file: provenance/trademark comfort** on showing Facebook- and Google-branded Wayback captures (`newsroom-still-*.jpg`, `afw-still-*.jpg` already on hand). Documenting your own work is defensible editorial use, but #45/#59 flagged trademark caution. If no, house diagrams carry both pieces.

**Article visuals open questions (studio recommendations in brackets):**
- Do in-body diagrams re-theme with the live tide (#59/#74)? [studio: **no** — content figures hold canonical mint, only the ambient band takes the per-page palette; themed color belongs to atmosphere, a client reading a diagram should get fixed legibility. If Brian wants themed figures, mint-on-#0b110e needs a per-palette contrast re-audit]
- Night-ground dimming strength: shipped `brightness(.9)`, deliberately subtle so it never reads as broken/greyed-out; can go `.85` if bright shots still glare.
- Eight Angle unconfirmed numbers are now MORE load-bearing: fig.3 repeats 71.2/97.4/89.6/93.4 and the honest headstand -12.2%. Confirm before the figures ship (already flagged #86).

- **Brian's C-lab questions**: ~~lowercase vs sentence case~~ ANSWERED: sentence case (#76, sweep in flight); still open: always-dark slab on light ground OK?; does "build.log" stay the archive's public name?
- Title line: Brian weighing "from training the model to shipping the app" clause + "AI Engineer" in metadata only (batch 46); copywriter exploration offered, not yet ordered
- ~~LL Circular web license~~ CONFIRMED (#78): C build ships Circular self-hosted on editorial surfaces
- Where is brohde.com registered? (Not on his Cloudflare account; needed for the domain cutover. Pages ships on a pages.dev URL meanwhile)
- Editorial before public deploy: pre-date tension (retrospective passages inside pre-dated articles; studio recommends a dated postscript block convention); Eight Angle unconfirmed numbers (pricing, 47-class vs 49-pose, decoy examples); ATG client sign-off + "Workers vs Pages" naming + SiteGround figure; Gold Coast pending Dragan's consent
- Resume command behavior (print link vs open PDF in new tab — code currently opens same tab, output text claims new tab)
- Boot: fake caret during the auto-type? (input deliberately unfocused, so none shows today)
- Raster OG image before launch (SVG placeholder today); PostHog key as a Pages env var
- Earlier open items: writing samples for VOICE, Substack canonical, travel placement, resume format
