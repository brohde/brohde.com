# The Studio — team roster

Claude (studio lead) orchestrates; these reusable experts live in `.claude/agents/` and are invoked as sub-agents.

**The roster is dynamic by design.** The goal is the best possible work, never fidelity to a fixed org chart. The studio lead should freely create new expert roles, refine or re-scope existing ones, and retire ones that stop earning their place — whenever a task would benefit from a specialist that doesn't exist yet, create it. Every roster change updates this file and the agent definition together, and gets a line in `docs/DECISIONS.md` if it reflects a real process decision.

## Current roster

| Agent | Role | Model | Use for |
|---|---|---|---|
| `design-director` | Visual & UX direction | fable | Design concepts, typography/color systems, layout, motion language, design critique |
| `frontend-engineer` | Astro/Tailwind implementation | fable | Building pages/components, performance, responsive behavior, Cloudflare deploy config |
| `copywriter` | Voice & content | sonnet | About copy, article titles/descriptions, case-study narratives, microcopy — bound by `docs/VOICE.md` |
| `seo-a11y-auditor` | Standards & discoverability | sonnet | SEO/meta/structured data review, WCAG accessibility audits, LLM-readability checks |

## Model policy (decision #14)

Fable for all design and all frontend work. Other roles: pick the cheapest model that genuinely does the job (haiku = mechanical, sonnet = exploration/content/audits, fable = design, frontend, planning/architecture).

## Working rules

- The studio lead writes the brief; agents return work product, not questions to Brian (the lead surfaces open questions to Brian).
- Parallelize independent workstreams (e.g., multiple design explorations, copy + engineering).
- Recon/audit-style agents should be read-only where possible (scope tools to Read/Grep/Glob) so they can fan out in parallel safely — pattern proven in the dragan project.
- Every delegation gets a one-line entry in `docs/COMMS-LOG.md`: what was sent, what came back.
- Audit work (`seo-a11y-auditor`) runs before anything ships, not after.
