# STATUS — session resume point

_Last updated: 2026-07-15 (session 1, late). Phase 0 deliverable shipped._

## Where we are

**Phase: 0 — Discovery & design concepts. The 10-concept artifact is delivered; waiting on Brian's pick.**

- ✅ Repo scaffolded, private GitHub (`github.com/brohde/brohde.com`), studio docs + 4 dynamic agents
- ✅ Research: old brohde.com case studies (Facebook Newsroom, Google Android for Work via Beyond), goldcoastcapm profile, eightangle.com profile, resume 2026 (`docs/reference/`)
- ✅ **10 design concepts delivered as artifact** "brohde.com — 10 Design Concepts" (file: `docs/design/design-concepts.html`, published from this repo). Studio recommendation: develop **10 Detection**, runner-up **02 Index**, possible blend (Index skeleton + Detection grammar on work articles). 5 concepts are explicitly technical per Brian's requirement.
- ✅ Prior-project conventions mined from atg + dragan → `docs/reference/prior-project-conventions.md` (adoption tracked there; Keystatic explicitly skipped)
- ✅ `docs/VOICE.md` v1 (binding style guide; never en dashes). `docs/CONTENT.md` backlog (9 ideas)
- ✅ Process: PostHog analytics (#11), Fable for design+frontend (#14), dynamic roster (#15), no Claude commit attribution (#13, settings enforced)

## Next actions (in order)

1. **Brian picks/blends a concept** from the artifact → log decision, then design-director develops it into a full system (article page, about, tokens, motion spec)
2. Phase 1 foundation: Astro scaffold per `docs/reference/prior-project-conventions.md` (Tailwind v4 vite plugin, SEO component port, content collections, `_headers`, prettier, `astro check` build chain), Cloudflare Pages deploy, PostHog project + wiring
3. Content: Brian to send more writing samples → VOICE.md v2; then first articles per CONTENT.md

## Open questions for Brian

- **Concept pick** (the blocking one)
- Em dashes: banned like en dashes, or allowed sparingly? (VOICE.md assumes avoid-by-default)
- More writing samples for VOICE.md (he offered)
- Substack vs. site as canonical home; travel-content placement; article pre-dates; resume public format; Twitter link in/out
