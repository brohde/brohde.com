# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, evening). Brian may clear the session; this file + DECISIONS + COMMS-LOG are the complete handoff._

## Artifact inventory (published; update via Artifact tool `url` param from any session)

| Artifact                                                                                        | URL                                                                  | Source file (`docs/design/`)      |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| **Homepage structure lab** (treatments A/B/C + article variants; **C CHOSEN, #67**)             | https://claude.ai/code/artifact/70935e14-01f4-43ed-8223-06946903b26c | `lab/homepage-structure.html`     |
| **build.log v3 interactive prototype** (interaction reference: boot, commands, alternate screen) | https://claude.ai/code/artifact/7ca6a6c4-df52-477a-b6e6-051b8cd40855 | `lab/build-log-v3.html`           |
| **Aurora Terminal Lab** (demo 04 composed scene; refinement agent republishing)                 | https://claude.ai/code/artifact/9b0b7ddf-75b3-4e68-bd36-d6b76647bd71 | `lab/aurora-terminal.html`        |
| **Chat eval review** (interactive grading; regen via `node poc/chat/make-review.mjs`)           | https://claude.ai/code/artifact/55298a58-d9e4-4952-afdf-951c78adcbd2 | `../../poc/chat/eval-review.html` |
| Animation Lab (6 ambient demos)                                                                 | https://claude.ai/code/artifact/6b30f13b-9b24-4825-a7b2-7744d0168e38 | `lab/animations.html`             |
| Parked directions (Quarterly/Blackletter/Exposed Grid, round-2 split)                           | https://claude.ai/code/artifact/95d8afd0-bf02-4478-8f54-b87ea803c4f3 | `lab/parked-directions.html`      |
| Round 2 (historical, all 4 directions)                                                          | https://claude.ai/code/artifact/c0782148-e1c2-4727-9743-f75fb94ab3ff | `lab/round-2.html`                |
| Round 1: 10 concepts (historical)                                                               | https://claude.ai/code/artifact/8634c805-be41-4357-b23b-02b22ec5d6e1 | `design-concepts.html`            |

All artifacts republish with favicon 🎨 except the eval review (🧪).

## Where we are

**Phase 1 Astro scaffold COMMITTED and live on localhost:4321.** Chat behavior **signed off 38/38 (#61)** at `poc/chat/`. Direction decided: **Option C "the phosphor slab" (#67)** — terminal as one always-night physical object holding everything interactive, editorial Circular page around it, **chat expands the slab** toward full window and collapses back home with an **elegant designed transition both ways (#69)**. Supporting behaviors: hello = natural-language page tour with underlined links, external ↗ arrows never underlined (#68).

- Site: Astro 5 + Tailwind v4 static at repo root; `npm run dev` (localhost:4321), `npm run build` = `astro check && astro build` → `dist/`. Full build reference: **`docs/ENGINEERING.md`** (merged f199195, verified against source).
- Content: 5 real case studies render on the site (validated on rendered HTML after the content-store staleness fix, see ENGINEERING.md §2); `brohde-com-build` stubbed `draft: true`; `twilio-hackpack-v4` is an `external:` entry.
- Chat POC: real Haiku 4.5 at localhost:8787 (`cd poc/chat && npm start`), dev CORS for the Astro site; key in gitignored `poc/chat/.env` (expires 2026-08-14).

## ⚠️ In-flight background agents (5 spawned; 1 landed)

1. **Interaction cluster (fable, worktree `a7593d05a409df7a7`)**: single-cursor #63, boot entry-only #64, ~140ms wipe #64, hover unification, chat dev-bridge (terminal free-form → localhost:8787), hello tour + arrow underline #68, "ask me anything" on the chat screen #65. Sent mid-flight: docs-audit code pointers + **#69 requirement** (transition layer must treat the slab expand/collapse morph as a first-class transition type, e.g. persistent `view-transition-name` on the slab).
2. **Perf (opus) — DONE, merged bab2a76**: inline critical CSS + cache headers + binding facade contract (#70); Lighthouse mobile Perf 100/TBT 0/CLS 0, validated on built dist. Its HIGH finding (boot = ~1.3s blank screen; prompt is `.bseq`-hidden so hello types invisibly) routed to the interaction agent as part of its #64 boot work.
3. **Docs (sonnet) — DONE, merged f199195**: `docs/ENGINEERING.md` + README. Flags 4 decision-vs-code gaps inline (all in the interaction agent's scope) → needs a **reconciliation pass after the interaction merge** (resume the same agent or quick lead edit).
4. **Demo 04 refinements (fable, `a6e3a77096f9cda8d`)**: finishing all three refinements (contain-fit, background fallback, brand palettes incl. Eight Angle logo source) per #72's quality-first call, then republishes the aurora artifact + reports. Works in the MAIN tree on `docs/design/lab/aurora-terminal.html` (currently modified — do not commit or revert it under the agent).
5. **Cloudflare Pages setup (opus, browser, `addb206b9ab895145`)**: RESUMED after Brian granted the repo ("Just added brohde.com for Cloudflare!"). Completing the wizard (project `brohde-com`, branch `main`, Astro preset, `npm run build` → `dist`, no env vars) → pages.dev URL.

**Only the interaction worktree remains to merge.** Lead reviews commits, merges, validates on the RENDERED surface (standing rule: agent reports are claims, not evidence), then ENGINEERING.md reconciliation.

## Next actions

1. Cloudflare agent reports the pages.dev URL (in flight; repo grant done).
2. Merge the interaction worktree when it lands; validate rendered; republish artifacts at their existing URLs.
3. ENGINEERING.md reconciliation once interaction merges (its §3 gap flags become stale).
4. **Option C implementation phase (#67/#68/#69)** — the next numbered phase, planned per #56 (phased, agent-reviewable): slab architecture, Circular on designed surfaces (GATED on Lineto license), designed article pages, chat-expands-slab with the elegant both-way transition. **Model policy: #72** (Fable re-greenlit for the remaining window, quality first, per the #50 split: Fable core engineering + taste-critical design, Opus general, Sonnet content/audits; don't burn Fable on rote work).
5. Then **#59 aurora + tide integration** (per-page themes, matrix-style per-character animation) and **chat production wiring** (Worker + AI Gateway + Turnstile + per-IP rate limits) behind the #49 security-audit launch gate.

## v2 / backlog (parked, Brian-approved ideas)

- **Contact form inside the chat** (Brian: "that would be pretty cool"): chat collects name/email/message conversationally, submits via the production Worker
- Ephemeral visitor-to-visitor chat (#32, parked)
- Presence planes with your-plane marker + steering (#43), post-v1
- Real brand marks in the glyph tide pending trademark-use check (#45/#59 note)

## Open questions for Brian

- **Brian's C-lab questions (asked in the homepage-structure verdict)**: lowercase vs sentence case; always-dark slab on light ground OK?; does "build.log" stay the archive's public name?
- LL Circular web license: confirm/purchase with Lineto before production ships it (#20; gates Option C's editorial type)
- Where is brohde.com registered? (Not on his Cloudflare account; needed for the domain cutover. Pages ships on a pages.dev URL meanwhile)
- Editorial before public deploy: pre-date tension (retrospective passages inside pre-dated articles; studio recommends a dated postscript block convention); Eight Angle unconfirmed numbers (pricing, 47-class vs 49-pose, decoy examples); ATG client sign-off + "Workers vs Pages" naming + SiteGround figure; Gold Coast pending Dragan's consent
- Resume command behavior (print link vs open PDF in new tab — code currently opens same tab, output text claims new tab)
- Boot: fake caret during the auto-type? (input deliberately unfocused, so none shows today)
- Raster OG image before launch (SVG placeholder today); PostHog key as a Pages env var
- Earlier open items: writing samples for VOICE, Substack canonical, travel placement, resume format
