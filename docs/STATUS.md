# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, build.log chosen; 5 parallel workstreams in flight)_

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
