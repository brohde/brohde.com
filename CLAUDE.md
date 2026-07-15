# CLAUDE.md — working agreement for brohde.com

## What this project is

Portfolio + blog-style site for Brian Rohde (brohde.com). Audience: potential clients. Content: thought-leadership articles (AI workflows, tips) and project deep dives (goldcoastcapm.com, WordPress→Astro migration, older big-name client work). Original brief: `PLAN.md`.

## Read these first, every session

1. `docs/STATUS.md` — current state, in-flight work, next steps. **This is the resume point.** Keep it accurate; update it before ending any significant unit of work.
2. `docs/DECISIONS.md` — decisions already made. Do not re-litigate settled decisions; append new ones.
3. `docs/COMMS-LOG.md` — conversation history with Brian.

## Non-negotiable process rules (from Brian)

- **Log communications**: every substantive question Brian asks and every reply given goes in `docs/COMMS-LOG.md` (summaries, not transcripts). Sub-agent work is logged as: what was delegated + what came back.
- **Log decisions**: anything decided (by Brian or recommended-and-accepted) goes in `docs/DECISIONS.md` with date and rationale.
- **Session continuity**: Brian may clear/compact at any moment. `docs/STATUS.md` must always let a cold session pick up without Brian re-explaining.
- **Delegate + parallelize**: run work through the studio sub-agents (`.claude/agents/`, roster in `docs/TEAM.md`) concurrently where it genuinely helps. Pick model/effort appropriate to the task.
- **Phase large work**: break big builds/designs into systematic phases (Phase 1, 2, 3...) that land and get reviewed independently, instead of one huge chunk that consumes massive context. The review between phases can be an agent review, not necessarily Brian; the point is progressive, checkable delivery.
- **Be a partner**: challenge Brian's asks when there's a better path; surface unknown unknowns; recommend, don't just comply.

## Tech + platform decisions (settled)

- Astro + Tailwind CSS
- Hosting: Cloudflare (Pages)
- Repo: private on Brian's personal GitHub
- Must excel at: mobile accessibility, SEO, LLM-readability (structured data, semantic HTML, clean markdown content)
- No personal branding/logo, but a distinctive look via type, color, layout, motion
- Articles are pre-dated (site is new; posts about old projects get historical dates)
- Homepage lists article titles + publish dates; description optional in template

## Conventions

- Content collections for articles (Astro content layer), one folder per article if assets needed
- Conventional-ish commits; commit at meaningful checkpoints
- Commits are authored by Brian only — no Claude co-author trailer (enforced via `attribution` in settings; Brian's explicit preference)
- Keep README.md's repo map current as structure grows
