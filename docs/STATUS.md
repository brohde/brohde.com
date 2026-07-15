# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, late). Brian may clear the session; this file + DECISIONS + COMMS-LOG are the complete handoff._

## Artifact inventory (published; update via Artifact tool `url` param from any session)

| Artifact | URL | Source file (`docs/design/`) |
|---|---|---|
| **build.log v3 interactive prototype** (CURRENT review surface) | https://claude.ai/code/artifact/7ca6a6c4-df52-477a-b6e6-051b8cd40855 | `lab/build-log-v3.html` |
| **Aurora Terminal Lab** (dusk/golden two-state, glyph-from-image, presence planes) | https://claude.ai/code/artifact/9b0b7ddf-75b3-4e68-bd36-d6b76647bd71 | `lab/aurora-terminal.html` |
| Animation Lab (6 ambient demos) | https://claude.ai/code/artifact/6b30f13b-9b24-4825-a7b2-7744d0168e38 | `lab/animations.html` |
| Parked directions (Quarterly/Blackletter/Exposed Grid, round-2 split) | https://claude.ai/code/artifact/95d8afd0-bf02-4478-8f54-b87ea803c4f3 | `lab/parked-directions.html` |
| Round 2 (historical, all 4 directions) | https://claude.ai/code/artifact/c0782148-e1c2-4727-9743-f75fb94ab3ff | `lab/round-2.html` |
| Round 1: 10 concepts (historical) | https://claude.ai/code/artifact/8634c805-be41-4357-b23b-02b22ec5d6e1 | `design-concepts.html` |

## ⚠️ In-flight background agents (die if session clears; contingency inline)

1. **Newsroom history research** → should update `docs/drafts/facebook-newsroom.md` with: predecessor site before the 2014 build, decommission window (site lifespan), archive-verified localized-language list. If the draft lacks those: re-run research via Wayback in-browser (web.archive.org is blocked for WebFetch; use claude-in-chrome; CDX for URL discovery).
2. **Boot sequence for build.log v3** (decision #36) → should modify `docs/design/lab/build-log-v3.html` in place: first load starts blank with just the chatbox, "hello" auto-types, then the homepage reveals as the terminal's answer (once per session, any input skips, reduced-motion disabled, content stays in DOM for SEO, deep links skip it). If the file lacks it in a new session: re-brief a design-director with this paragraph. After it lands, republish the artifact from the same file path (URL in table above).

## Where we are

**Phase: 0.5 — build.log is THE direction (decision #22). Chat greenlit as a real LLM (#23). Content production started (#29).**

### Delivered
- Artifacts: 10 Concepts (round 1) · Animation Lab · Design Round 2 · **build.log v3 interactive prototype** (3 header treatments, alternate-screen nav, command layer, mobile-verified)
- `docs/reference/chat-feasibility.md` (costs/options/presence research) + `docs/reference/llm-terminal-plan.md` (**the build plan**: clicks-are-commands, deterministic layer, Haiku tool-use router page-vs-prose, Brian-owned deny-list incl. no age/YOE leakage, validation gates V1-V5, abuse controls, keyboard a11y, phases P1-P4)
- LL Circular staged (`assets/fonts/circular/`, web license needed; note: Circular was for the parked Blackletter direction)

### Content drafts: ALL 5 DELIVERED to `docs/drafts/` (awaiting Brian's review)
- `eight-angle-ml.md` (~1,570w; flags a hidden-pose-class facts discrepancy vs training config)
- `atg-llm-migration.md` (~885w; **flags: repo evidence says ~11-hour build, not "under 4 hours"; DNS cutover was pending**)
- `gold-coast.md` (~1,040w; needs Dragan's consent)
- `facebook-newsroom.md` (545w) + `google-android-for-work.md` (495w) — archive.org-sourced
- Each draft ends with image candidates + open questions for Brian

### Chat POC: BUILT at `poc/chat/` (decision #34)
Real Haiku 4.5 (confirmed, #30) via official SDK; facts pack (`facts.md`, age-safe per #31); deny-list + injection-resistant system prompt; open_page vs prose tool router; per-reply cost readout; 26-question eval harness → `transcript.md` with pass/fail rows (gates V2-V3). Run: `cd poc/chat && npm i && ANTHROPIC_API_KEY=... npm start`

### Still in flight (background)
- `docs/design/lab/aurora-terminal.html` — aurora-on-white two-state lab + glyph-from-image + presence planes
- Newsroom follow-up research: predecessor site, decommission date/lifespan, archive-verified language list (updates the draft when done)

### Standing rules (recent additions)
- Full keyboard accessibility for the terminal (#28) · no dashes anywhere (#18) · no aggregate years-of-experience/age phrasing in any copy or LLM output (#27/#29) · FB/Google = agency work via Beyond (#21)

## Next actions
1. Collect the 5 workstreams: review drafts against VOICE, publish aurora lab artifact, bring open questions to Brian
2. Brian: header treatment pick (1/2/3 in v3 prototype) · aurora state-color reaction · draft reviews · answers to open questions below
3. Then: converge build.log v3 + aurora direction into v4; start Phase 1 scaffold (Astro + Cloudflare + PostHog per prior-project conventions)

## Open questions for Brian
- Clarify the "don't actively reveal my name" constraint (we read it as the age/YOE class of redaction; confirm exactly what's off-limits)
- X handle · header treatment pick · resume command behavior (print link vs open PDF)
- Ephemeral visitor chat parked for v1, OK?
- Supply images (folder path) for the glyph-tide-from-images pipeline whenever ready
- LL Circular web license purchase (only matters if any Circular use survives into build.log)
- Earlier open items: writing samples for VOICE, Substack canonical, travel placement, pre-dates, resume format
