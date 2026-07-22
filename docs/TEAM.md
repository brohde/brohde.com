# The Studio — team roster

Claude (studio lead) orchestrates; these reusable experts live in `.claude/agents/` and are invoked as sub-agents.

**The roster is dynamic by design.** The goal is the best possible work, never fidelity to a fixed org chart. The studio lead should freely create new expert roles, refine or re-scope existing ones, and retire ones that stop earning their place — whenever a task would benefit from a specialist that doesn't exist yet, create it. Every roster change updates this file and the agent definition together, and gets a line in `docs/DECISIONS.md` if it reflects a real process decision.

## Current roster

| Agent               | Role                          | Model  | Use for                                                                                              |
| ------------------- | ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `design-director`   | Visual & UX direction         | opus   | Design concepts, typography/color systems, layout, motion language, design critique                  |
| `frontend-engineer` | Astro/Tailwind implementation | fable  | Building pages/components, performance, responsive behavior, Cloudflare deploy config                |
| `copywriter`        | Voice & content               | sonnet | About copy, article titles/descriptions, case-study narratives, microcopy — bound by `docs/VOICE.md` |
| `seo-a11y-auditor`  | Standards & discoverability   | sonnet | SEO/meta/structured data review, WCAG accessibility audits, LLM-readability checks                   |

## Model policy (canonical: decision #130, supersedes #14/#46/#50/#96/#117)

**This section is the single source of truth for subagent model selection.** Other docs reference it rather than restating it; if the policy changes, it changes here (and a dated line lands in `docs/DECISIONS.md`). The per-agent `Model` column above is the default for each role; this policy governs when to depart from it.

Current policy (Brian, decision #130, plus the persistent-memory refinements):

- **All subagents default to Opus or lower** unless Brian specifies otherwise. Opus for substantive implementation and design/critique; Sonnet for content, audits, and routine work; Haiku for mechanical tasks. Always consider degrading a spawn to save credits.
- **Fable is a frontend-only ceiling for substantial builds**, with mandatory per-spawn degrade consideration: tweaks, minor updates, and rote chores never get Fable. Fable spawns only on a genuinely substantial frontend build (and are called out as such); when in doubt, start lower.
- **Browser validation always runs on a Sonnet or Opus subagent, never the Fable lead** (decision #82). The lead stays thin and delegates the substantive work.
- **Context budgets**: never feed one agent past its wrap. Opus agents wrap ~450K (hard cap 500K); other models wrap ~150K/180K (never past ~200K per #123). Fan follow-up work out to fresh, tightly-briefed agents rather than growing one long-running agent; each writes a handoff to `docs/reference/handoffs/` and is freed on completion (#127).

A running subagent's model is fixed at spawn: if an agent dies on credits, check the agent definition's `model` first (see `.claude/agents/`).

## Working rules

- The studio lead writes the brief; agents return work product, not questions to Brian (the lead surfaces open questions to Brian).
- Parallelize independent workstreams (e.g., multiple design explorations, copy + engineering).
- Recon/audit-style agents should be read-only where possible (scope tools to Read/Grep/Glob) so they can fan out in parallel safely — pattern proven in the dragan project.
- Every delegation gets a one-line entry in `docs/COMMS-LOG.md`: what was sent, what came back.
- Audit work (`seo-a11y-auditor`) runs before anything ships, not after.
- **Phased delivery (Brian, 2026-07-15)**: large work is briefed as numbered phases that land and get reviewed independently (agent review counts); never one monolithic build. Briefs state the phase boundaries up front.
