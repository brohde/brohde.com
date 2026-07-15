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

## In-flight background agents

None. All three from this session landed and both artifacts were republished at their existing URLs (2026-07-15): boot sequence + header 1 + company links in the v3 prototype, aurora dark-ground rework, Android for Work lifespan research (folded into the draft).

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

### Chat POC: BUILT at `poc/chat/` (decision #34)
Real Haiku 4.5 (confirmed, #30) via official SDK; facts pack (`facts.md`, age-safe per #31); deny-list + injection-resistant system prompt; open_page vs prose tool router; per-reply cost readout; 26-question eval harness → `transcript.md` with pass/fail rows (gates V2-V3). Run: `cd poc/chat && npm i && ANTHROPIC_API_KEY=... npm start`

### Still in flight (background)
See the ⚠️ in-flight agents section at the top: aurora dark-ground rework, Android for Work lifespan research (re-run), boot sequence + header links for v3. Newsroom follow-up research is DONE and folded into the draft.

### Standing rules (recent additions)
- Full keyboard accessibility for the terminal (#28) · no dashes anywhere (#18) · no aggregate years-of-experience/age phrasing in any copy or LLM output (#27/#29) · FB/Google = agency work via Beyond (#21)

## Next actions
1. Collect the 5 workstreams: review drafts against VOICE, publish aurora lab artifact, bring open questions to Brian
2. Brian: header treatment pick (1/2/3 in v3 prototype) · aurora state-color reaction · draft reviews · answers to open questions below
3. Then: converge build.log v3 + aurora direction into v4; start Phase 1 scaffold (Astro + Cloudflare + PostHog per prior-project conventions)

## Open questions for Brian
- Header company link targets: official sites picked (gong.io, twilio.com, bynd.com, eightangle.com); veto or retarget any to internal case-study pages?
- Boot sequence: greeting word ("hello" vs "whoami" vs "hi")? once per session (current) vs per visit vs once ever? fake caret during the auto-type?
- Aurora: night glow strength (.4 faint / .55 current / .65 theatrical)? amber chat tag vs all-mint? keep or drop the light-ground comparison toggle?
- Android for Work: Wayback shows the redesign live by Sept 2015, but the old case study says "Released 2016". Shipped mid 2015, or was your work a 2016 iteration? Draft holds "shipped in 2016" until answered.
- Resume command behavior (print link vs open PDF)
- ATG draft: repo evidence says ~11-hour build vs PLAN.md's "under 4 hours"; which framing?
- Supply images (folder path) for the glyph-tide-from-images pipeline whenever ready
- LL Circular web license purchase (only matters if any Circular use survives into build.log)
- Earlier open items: writing samples for VOICE, Substack canonical, travel placement, pre-dates, resume format
