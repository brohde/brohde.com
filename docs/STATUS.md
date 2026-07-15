# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, end of round-2 design iteration)_

## Where we are

**Phase: 0 — Design exploration, round 2 delivered. No direction locked yet (decision #19); iterating shortlisted directions independently. Palette work deferred until a direction wins.**

### Delivered artifacts (all published, sources in `docs/design/`)
1. **"brohde.com — 10 Design Concepts"** (`design-concepts.html`) — round 1, reviewed by Brian
2. **"brohde.com — Animation Lab"** (`lab/animations.html`) — 6 ambient background demos for the Eight Angle direction (constellation, aurora gradients, ink drift, isolines, detection sweep, glyph tide)
3. **"brohde.com — Design Round 2"** (`lab/round-2.html`) — build.log v2 (readable + mobile + chat mock + bio fix), Blackletter v2 (dash-free, Circular pending), Quarterly v2 (de-AI'd), Exposed Grid v2 (3 title-font options + mobile solved)

### Shortlist per Brian's round-1 review
build.log (loved; chat-interface idea attached) · Blackletter Modern (liked, gets LL Circular) · Quarterly (structure liked, was too "AI") · Eight Angle animations (loved, now its own lab) · Exposed Grid (grid+filters liked, font disliked)

### Chat/presence exploration (NOT yet greenlit)
`docs/reference/chat-feasibility.md` — ~$0.002/reply Haiku vs $0 Workers AI free tier, AI Gateway for comparing LLMs, hybrid static+terminal architecture for SEO, deterministic command layer for "perfect" answers + discoverable nav, 9 presence ideas (top: online counter, `who` command, visitors as constellation nodes/detections via Durable Objects)

### Assets & rules
- LL Circular Pro TTFs in `assets/fonts/circular/` (⚠️ need Lineto web license + woff2 before production)
- Dash ban total: no en or em dashes anywhere (VOICE.md v1.1, decision #18)
- Facebook/Google always framed as agency work via Beyond (#21)
- Comms log lives at `docs/COMMS-LOG.md` (Brian asked; it is maintained and current)

## Next actions

1. **Brian reviews Round 2 + Animation Lab artifacts**: pick winners per direction (esp. Exposed Grid title font A/B/C, favorite animations), react to Quarterly de-AI moves
2. **Brian decides on chat/presence scope** (v1 chat? which presence features?)
3. Then: begin converging directions toward one unified design; only then palette exploration
4. Phase 1 (Astro scaffold per `docs/reference/prior-project-conventions.md`, Cloudflare Pages, PostHog) can start in parallel once any direction is close

## Open questions for Brian

- Round-2 picks (fonts, animations, direction ranking)
- Chat + presence greenlight and scope
- More writing samples for VOICE.md (offered, not yet sent)
- Substack vs site canonical; travel-content placement; article pre-dates; resume public format; Twitter link
- OK to buy LL Circular web license when we build?
