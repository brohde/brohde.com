# The Studio — team roster

Claude (studio lead) orchestrates; these reusable experts live in `.claude/agents/` and are invoked as sub-agents. Roles get refined as the project evolves — update this file and the agent definition together.

| Agent | Role | Model | Use for |
|---|---|---|---|
| `design-director` | Visual & UX direction | opus | Design concepts, typography/color systems, layout, motion language, design critique |
| `frontend-engineer` | Astro/Tailwind implementation | sonnet | Building pages/components, performance, responsive behavior, Cloudflare deploy config |
| `copywriter` | Voice & content | sonnet | About copy, article titles/descriptions, project case-study narratives, microcopy |
| `seo-a11y-auditor` | Standards & discoverability | sonnet | SEO/meta/structured data review, WCAG accessibility audits, LLM-readability checks |

## Working rules

- The studio lead writes the brief; agents return work product, not questions to Brian (the lead surfaces open questions to Brian).
- Parallelize independent workstreams (e.g., multiple design explorations, copy + engineering).
- Every delegation gets a one-line entry in `docs/COMMS-LOG.md`: what was sent, what came back.
- Audit work (`seo-a11y-auditor`) runs before anything ships, not after.
