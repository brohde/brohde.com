# brohde.com

Personal portfolio + writing site for Brian Rohde. Showcases client work and project deep dives to potential clients, plus thought-leadership articles on AI-assisted workflows.

## Stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- Hosted on Cloudflare (Pages)
- Private GitHub repo (for now)

## Repo map

| Path | Purpose |
|---|---|
| `PLAN.md` | Original project brief from Brian |
| `CLAUDE.md` | Working agreement for Claude sessions — read first |
| `docs/STATUS.md` | **Current state + next steps** — the session-resume anchor |
| `docs/DECISIONS.md` | Every decision made, with rationale |
| `docs/COMMS-LOG.md` | Running log of Brian ↔ Claude communications and delegated sub-agent work |
| `docs/TEAM.md` | The studio roster — expert roles and when to use each |
| `.claude/agents/` | Reusable sub-agent definitions for the studio experts |

Site source will live in the standard Astro layout (`src/`, `public/`) once the design concept is chosen.

## Working model

This project is run like a design studio: Claude acts as studio lead/CEO, delegating to specialist sub-agents (design, engineering, copy, SEO/a11y) and logging all decisions and delegations so any session can resume from `docs/STATUS.md` at any point.
