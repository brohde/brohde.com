# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, late). Brian may clear the session; this file + DECISIONS + COMMS-LOG are the complete handoff._

## Artifact inventory (published; update via Artifact tool `url` param from any session)

| Artifact                                                                                        | URL                                                                  | Source file (`docs/design/`)      |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| **build.log v3 interactive prototype** (CURRENT review surface)                                 | https://claude.ai/code/artifact/7ca6a6c4-df52-477a-b6e6-051b8cd40855 | `lab/build-log-v3.html`           |
| **Aurora Terminal Lab** (dusk/golden two-state, glyph-from-image, presence planes)              | https://claude.ai/code/artifact/9b0b7ddf-75b3-4e68-bd36-d6b76647bd71 | `lab/aurora-terminal.html`        |
| **Chat eval review** (interactive pass/fail grading; regen via `node poc/chat/make-review.mjs`) | https://claude.ai/code/artifact/55298a58-d9e4-4952-afdf-951c78adcbd2 | `../../poc/chat/eval-review.html` |
| Animation Lab (6 ambient demos)                                                                 | https://claude.ai/code/artifact/6b30f13b-9b24-4825-a7b2-7744d0168e38 | `lab/animations.html`             |
| Parked directions (Quarterly/Blackletter/Exposed Grid, round-2 split)                           | https://claude.ai/code/artifact/95d8afd0-bf02-4478-8f54-b87ea803c4f3 | `lab/parked-directions.html`      |
| Round 2 (historical, all 4 directions)                                                          | https://claude.ai/code/artifact/c0782148-e1c2-4727-9743-f75fb94ab3ff | `lab/round-2.html`                |
| Round 1: 10 concepts (historical)                                                               | https://claude.ai/code/artifact/8634c805-be41-4357-b23b-02b22ec5d6e1 | `design-concepts.html`            |

## ⚠️ In-flight background agents

1. **frontend-engineer (opus): PHASE 1 SCAFFOLD** — Astro + Tailwind v4 static site at repo root per `docs/reference/prior-project-conventions.md`: both themes (#40) from the two labs, homepage port with boot sequence, article collection seeded from the 5 drafts, deterministic commands + autocomplete (#48) + prompt history (#44), chat screen stubbed (no LLM wiring until Brian marks `poc/chat/transcript.md`). Agent does NOT commit; studio lead reviews the tree, runs `npx astro check && npm run build`, then commits. If missing in a new session: re-brief per COMMS batch 14 entry + decisions #36-49.

Aurora light-theme rework LANDED and republished (2026-07-15); its open questions are below.

## Where we are

**Phase: 0.5 — build.log is THE direction (decision #22). Chat greenlit as a real LLM (#23). Content production started (#29).**

### Delivered

- Artifacts: 10 Concepts (round 1) · Animation Lab · Design Round 2 · **build.log v3 interactive prototype** (boot sequence per #36, header 1 phosphor wordmark default per #38, company links per #39, alternate-screen nav, command layer, mobile/keyboard-verified) · **Aurora Terminal Lab** (dark build.log ground, cold/gold two-state sky, glyph tide with mint peaks, presence planes; light ground kept behind a comparison toggle)
- `docs/reference/chat-feasibility.md` (costs/options/presence research) + `docs/reference/llm-terminal-plan.md` (**the build plan**: clicks-are-commands, deterministic layer, Haiku tool-use router page-vs-prose, Brian-owned deny-list incl. no age/YOE leakage, validation gates V1-V5, abuse controls, keyboard a11y, phases P1-P4)
- LL Circular staged (`assets/fonts/circular/`, web license needed; note: Circular was for the parked Blackletter direction)

### Content drafts: ALL 5 DELIVERED to `docs/drafts/` (awaiting Brian's review)

- `eight-angle-ml.md` (~1,570w; flags a hidden-pose-class facts discrepancy vs training config)
- `atg-llm-migration.md` (~885w; **flags: repo evidence says ~11-hour build, not "under 4 hours"; DNS cutover was pending**)
- `gold-coast.md` (~1,040w; needs Dragan's consent)
- `facebook-newsroom.md` (640w, incl. researched predecessor/5-year-lifespan/verified 7+1 languages) + `google-android-for-work.md` (495w) — archive.org-sourced
- Each draft ends with image candidates + open questions for Brian

### Chat POC: BUILT at `poc/chat/` (decision #34) — SETUP DONE, WAITING ON BRIAN'S KEY

Real Haiku 4.5 (confirmed, #30) via official SDK; facts pack (`facts.md`, age-safe per #31); deny-list + injection-resistant system prompt; open_page vs prose tool router; per-reply cost readout; 26-question eval harness (`npm run eval` → `transcript.md` pass/fail rows, gates V2-V3).
**Current state (2026-07-15 late):** deps installed; API key "brohde-chat-poc" CREATED (30-day expiry, 2026-08-14) and stored in gitignored `poc/chat/.env`; server verified running at http://localhost:8787 (key authenticates). **BLOCKED on Console credit balance ($0.00)**: Brian must add funds at platform.claude.com/settings/billing, then chat replies work immediately, no restart needed. To (re)start the server in any session: `cd poc/chat && npm start` (background), verify `curl -s localhost:8787`. Then Brian validates per the README + `npm run eval` (gates V2/V3).

### Still in flight (background)

See the ⚠️ in-flight agents section at the top: aurora dark-ground rework, Android for Work lifespan research (re-run), boot sequence + header links for v3. Newsroom follow-up research is DONE and folded into the draft.

### Standing rules (recent additions)

- Full keyboard accessibility for the terminal (#28) · no dashes anywhere (#18) · no aggregate years-of-experience/age phrasing in any copy or LLM output (#27/#29) · FB/Google = agency work via Beyond (#21)

## Next actions (Phase 1 greenlit territory; Brian's 2026-07-15 review: "I LOVE where this is going")

0. **Phase 1 official build: Brian asked if we're ready → YES, nothing blocks the scaffold.** Studio recommendation pending his confirm: amend #14 to a model split — Opus for scaffold/plumbing (Astro config, collections, SEO/PostHog ports per prior-project-conventions), Fable stays on design-system components, terminal interactions, and all aesthetic/motion work
1. ~~Eval sign-off~~ DONE 2026-07-15: **gates V2/V3 PASSED** (24/26 pass; 2 facts gaps filled per Brian's notes: DePaul, favorite frameworks, post-Newsroom Facebook repeat work; verdicts archived at `poc/chat/verdicts-2026-07-15.md`). Chat formally validated; production wiring (Worker + AI Gateway + Turnstile) unblocked once the scaffold lands
   1b. Launch gates: pre-launch SECURITY AUDIT (#49: Turnstile, per-IP rate limits, AI Gateway spend cap verified live, headers/CSP, key handling) + existing seo-a11y audit
2. Brian: pick a glyph-tide placement from the presented ideas; answer AfW 2015-vs-2016; draft reviews
3. Studio: Phase 1 Astro scaffold (Astro + Tailwind v4 + Cloudflare Pages + PostHog per `docs/reference/prior-project-conventions.md`), build.log design system as components with light+dark themes (#40), boot sequence + header ported from the prototype
4. QUEUED PHASE (gated on Brian's Phase 1 review, #59): aurora + image tide integration per demo 04 verdict, with per-page color themes and matrix-style per-character animation
5. Then: chat production Worker (AI Gateway, Turnstile, rate limits); presence (planes + your-plane marker) after v1

### Recent additions (2026-07-15 late)

- Legacy brohde.com assets recovered: screenshots staged at `assets/images/legacy-site/` (see its README), demo videos located (newsroom.mp4, afw.mp4, nownow.mp4, platform-surfaces.mp4 in the legacy repo), Circular web formats at `assets/fonts/circular/web/`, full old-site copy in the legacy SQL dump
- v3 prototype updated + republished: "$ hello" header line, boot on every visit (#41, #42)

## v2 / backlog (parked, Brian-approved ideas)
- **Contact form inside the chat** (Brian, 2026-07-15: "that would be pretty cool"): the chat collects name/email/message conversationally and submits via the production Worker; pairs naturally with the deterministic layer
- Ephemeral visitor-to-visitor chat (#32, parked)
- Presence planes with your-plane marker + steering (#43), post-v1
- Real brand marks in the glyph tide pending trademark-use check (#45/#59 note)

## Open questions for Brian

- Where is brohde.com registered? (Not on his Cloudflare account; needed for the eventual domain cutover. Pages setup proceeds on a pages.dev URL once the scaffold is committed: Claude drives the dashboard, Brian clicks the GitHub authorize step)
- Glyph tide placement in build.log: ideas presented (article heroes + right gutter recommended; full background at whisper strength; boot-moment assembly; chat-only). Awaiting his pick, then lab-build the top contenders
- Presence planes: "your plane" marker agreed (#43); steering mechanism to design (opt-in fly command recommended over raw arrow-key hijack, a11y #28)
- Aurora details (tweak later per Brian): night glow strength, amber chat tag vs all-mint, drop the light-ground toggle now that light mode is real (#40)
- Resume command behavior (print link vs open PDF)
- ATG draft: timing being recomputed from Claude Code session logs (Brian: ~4h total incl. LLM waiting; publish hands-on time minus LLM waiting; later touch-ups counted separately; forensics agent in flight). THEN a copywriter revision restructures around Brian's three pillars: the migration, UI refresh preserving the same look and feel, FREE hosting + FREE CMS (verify $0 claims against the repo). Queued behind the forensics agent, same file
- Boot: fake caret during the auto-type? (input deliberately unfocused, so none shows today)
- Supply images (folder path) for the glyph-tide-from-images pipeline whenever ready
- LL Circular web license: LIVE AGAIN (Brian wants Circular on designed surfaces, batch 32); confirm/purchase with Lineto before production ships it
- Earlier open items: writing samples for VOICE, Substack canonical, travel placement, pre-dates, resume format
