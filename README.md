# brohde.com

Personal portfolio + writing site for Brian Rohde. Showcases client work and project deep dives to potential clients, plus thought-leadership articles on AI-assisted workflows.

## Stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- Hosted on Cloudflare (Pages)
- Private GitHub repo (for now)

## Local development

```
npm install       # once
npm run dev       # dev server at http://localhost:4321
npm run build     # astro check && astro build -> ./dist (static, for Cloudflare Pages)
npm run preview   # serve the production build locally
npm run format    # prettier (astro + tailwind plugins)
```

Deploy target: Cloudflare Pages. Build command `npm run build`, output directory `dist`.

## Repo map

| Path                           | Purpose                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `astro.config.mjs`             | Astro config: static output, sitemap (excludes /chat, /styleguide), prefetch, Tailwind v4 vite plugin            |
| `src/content.config.ts`        | Content collections: `articles` schema (title, description, date, draft, external)                               |
| `src/content/articles/`        | One folder per article (`<slug>/index.md`)                                                                       |
| `src/pages/`                   | Routes: `/` (terminal home), `/about`, `/chat` (stub), `/styleguide`, `/log/[...slug]`, `/404`, `/rss.xml`       |
| `src/layouts/BaseLayout.astro` | HTML shell: head, SEO, theme-color, ClientRouter, boot gate, analytics, terminal mount                           |
| `src/components/`              | `SEO`, `Analytics` (PostHog), `TerminalHeader`, `Prompt` (+ autocomplete), `CommandMenu`, `ArticleLog`, `Topbar` |
| `src/scripts/terminal.ts`      | Command router, autocomplete (#48), prompt history (#44), boot sequence (#36/#41)                                |
| `src/styles/global.css`        | Tailwind import, design tokens (both grounds, #40), base + View-Transition rules                                 |
| `src/styles/terminal.css`      | Terminal UI component classes (ported from the prototypes)                                                       |
| `src/lib/site.ts`              | Site constants: metadata, social links, company links, log helpers                                               |
| `public/`                      | `_headers` (CSP + security), `robots.txt`, `favicon.svg`, `og-default.svg`, `resume.pdf`                         |
| `PLAN.md`                      | Original project brief from Brian                                                                                |
| `CLAUDE.md`                    | Working agreement for Claude sessions — read first                                                               |
| `docs/STATUS.md`               | **Current state + next steps** — the session-resume anchor                                                       |
| `docs/DECISIONS.md`            | Every decision made, with rationale                                                                              |
| `docs/COMMS-LOG.md`            | Running log of Brian ↔ Claude communications and delegated sub-agent work                                        |
| `docs/TEAM.md`                 | The studio roster (dynamic) — expert roles and model policy                                                      |
| `docs/CONTENT.md`              | Article backlog and content pipeline                                                                             |
| `docs/VOICE.md`                | Brian's writing style guide — binding for all published copy                                                     |
| `docs/design/`                 | Design deliverables + the approved prototypes (`lab/build-log-v3.html`, `lab/aurora-terminal.html`)              |
| `docs/reference/`              | Source material: resume PDF, prior-project conventions brief                                                     |
| `poc/chat/`                    | Chat POC (real Haiku, validated separately); not wired into the site yet                                         |
| `.claude/agents/`              | Reusable sub-agent definitions for the studio experts                                                            |

## Working model

This project is run like a design studio: Claude acts as studio lead/CEO, delegating to specialist sub-agents (design, engineering, copy, SEO/a11y) and logging all decisions and delegations so any session can resume from `docs/STATUS.md` at any point.
