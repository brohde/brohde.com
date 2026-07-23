# brohde.com

The personal portfolio and writing site for Brian Rohde, live at [brohde.com](https://brohde.com). It showcases client work and project deep dives for potential clients, alongside thought-leadership articles on AI-assisted workflows. The site also carries an in-page chat: an LLM assistant that answers questions about Brian and his work, and can hand off to a contact flow.

## Stack

- [Astro](https://astro.build) 7 + [Tailwind CSS](https://tailwindcss.com) 4, static output.
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com).
- The chat and contact endpoints are [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) that call the [Anthropic API](https://docs.anthropic.com) (Claude), fronted by a Cloudflare AI Gateway with a hard spend cap.

## How this repo is built: the studio process

This site is built by a [Claude Code](https://claude.com/claude-code) studio process, and that process is part of what the repo shows. Claude acts as studio lead and delegates to specialist sub-agents (design, engineering, copy, SEO and accessibility). Every decision, every conversation with Brian, and the running project status are checked in and public by design, so any reader can see how the site was actually made, not just the finished result.

**It started with one prompt.** [`PLAN.md`](PLAN.md) is Brian's kickoff prompt to Claude, preserved verbatim, typos included. It names the studio model, the reusable expert sub-agents, the decision log, the session-continuity rule, and the partnership posture ("don't be afraid to push back") that the rest of this repo operationalizes. Read it first and everything else here is legible as that one prompt, executed.

If you want to understand the working model before the code, read these:

- [`CLAUDE.md`](CLAUDE.md): the working agreement. The standing prompt the studio lead runs under every session.
- [`.claude/agents/`](.claude/agents/): the system prompts for the studio's experts (design director, frontend engineer, copywriter, SEO and accessibility auditor). These are the "reusable subagents" PLAN.md asked for.
- [`chat/system-prompt.md`](chat/system-prompt.md) and [`chat/facts.md`](chat/facts.md): the complete brain of the site's visitor-facing chat, prompt and knowledge both, public on purpose. What it deflects and how is part of the design.
- [`docs/VOICE.md`](docs/VOICE.md): the writing style guide every published word passes through; in practice, a standing prompt for the copywriter.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): every decision made, with date and rationale.
- [`docs/COMMS-LOG.md`](docs/COMMS-LOG.md): the running log of communications and delegated sub-agent work.
- [`docs/TEAM.md`](docs/TEAM.md): the studio roster of expert roles and the model policy.
- [`docs/GATE.md`](docs/GATE.md): the agreed definition of done for the current program.
- [`docs/ENGINEERING.md`](docs/ENGINEERING.md): the deep build reference (architecture, run and build and deploy, the interaction model as shipped). Read this if you are here for the code.

## Repo map

The meaningful directories. Full architecture lives in [`docs/ENGINEERING.md`](docs/ENGINEERING.md).

| Path | Purpose |
| --- | --- |
| `src/` | The Astro site: `pages/` (routes), `layouts/`, `components/`, `scripts/` (the client controller and the ambient canvas scene), `styles/`, `content/articles/` (one folder per article), `lib/` (site constants, article ordering, JSON-LD builders). |
| `chat/` | Source of truth for the chat model behavior: the system prompt, the facts pack, a local dev bridge, and the eval harness. The build bundles the prompt and facts into the chat Function. |
| `functions/api/` | Cloudflare Pages Functions, the only server surface: `chat.ts` (`POST /api/chat`), `contact.ts` (`POST /api/contact`), and `_shared.ts` (shared helpers; a leading underscore means not routed). |
| `tools/` | Build and asset tooling: `build/` (prompt codegen, vector-mark rasterizer, share-card freshness check), `share-cards/` (the local share-image generator), `og/` (the OG card renderer), `git-hooks/` (the gitleaks pre-commit hook). |
| `public/` | Static assets served as-is: `_headers` (CSP and security headers), `_redirects`, `robots.txt`, favicons, `media/` (case-study video), `og.png`. |
| `docs/` | The studio process and reference material: `STATUS.md`, `DECISIONS.md`, `COMMS-LOG.md`, `ENGINEERING.md`, `TEAM.md`, `VOICE.md`, plus `reference/`, `drafts/`, `design/`, and `archive/`. |
| `.claude/agents/` | Reusable sub-agent definitions for the studio experts. |

Top-level config: `astro.config.mjs`, `wrangler.toml` (Cloudflare Pages config-as-code), `package.json`, `PLAN.md` (the verbatim kickoff prompt, see above), and `CLAUDE.md`.

## About the article dates

Articles are pre-dated on purpose, and the dates are meaningful. A piece about past work carries the date that work shipped, not the date the article was written. Where a retrospective revisits an old project from today, it carries a dated postscript so the timeline stays honest. This is a deliberate editorial choice and it is disclosed here so no reader mistakes a historical date for a fresh one.

## Local development

```sh
npm install          # once
npm run dev          # astro dev at http://localhost:4321
npm run build        # codegen -> astro check -> astro build -> ./dist
npm run preview      # serve the built ./dist locally
npm run check        # astro check alone (typecheck + Astro diagnostics)
npm run format       # prettier --write .
```

The licensed LL Circular webfonts are not in the repo (see the `LICENSE` scope note): `public/fonts/` is gitignored and populated at build time by `tools/build/fetch-fonts.mjs` when `FONTS_BASE_URL` is set. Without it the build still succeeds and the site renders with the metric-tuned fallback face, zero layout shift. This degrade is deliberate: clone-and-build works for everyone without redistributing licensed font files.

`npm run build` runs a prompt codegen step first: `tools/build/build-chat-prompt.mjs` bundles `chat/system-prompt.md` and `chat/facts.md` into a generated TypeScript module the chat Function imports. That generated file is gitignored and rebuilt on every build, locally and on Cloudflare. Edit the prompt or facts in `chat/`, never the generated output.

### Running the chat locally

The site itself renders without any keys. To exercise the live chat in local dev, run the bridge in `chat/`, which talks to the real Anthropic API:

```sh
cd chat
npm install
npm start            # local Haiku bridge on http://localhost:8787 (loopback only)
```

The bridge reads its key from `chat/.env` as `ANTHROPIC_API_KEY=...`. That file is required only for the local chat bridge, holds a real key, and is never committed (it is gitignored). Deploys get their keys from the Cloudflare dashboard instead. See [`docs/ENGINEERING.md`](docs/ENGINEERING.md) section 9 for the full local-chat and Pages Functions parity story.

## Deploy

Cloudflare Pages. Build command `npm run build`, output directory `dist`. The two Pages Functions are compiled from `functions/` by Cloudflare. All secrets (the Anthropic key, the gateway token, the Resend key, the Turnstile secret) live in the Cloudflare dashboard, never in `wrangler.toml` or the repo. `docs/ENGINEERING.md` section 8 documents the full deploy posture.

## Secret hygiene

The repo carries no secret values, and a fresh-history cut is made before it goes public. To keep it that way, a `gitleaks` pre-commit hook is provided in `tools/git-hooks/`. It is not enabled automatically (this repo never touches your local git config on your behalf). Enable it for your clone with one command:

```sh
git config core.hooksPath tools/git-hooks
```

With the hook enabled, each commit runs `gitleaks protect --staged` against the staged diff and blocks the commit if it finds a secret. If `gitleaks` is not installed, the hook warns and lets the commit through rather than failing, so it never blocks a contributor who has not installed the scanner. The scan config, including allowlisted false-positive shapes, is in [`.gitleaks.toml`](.gitleaks.toml).

## License

Split posture, on purpose. The **source code** is licensed under the [MIT License](LICENSE): reuse it, learn from it, build on it. The **written content and media are not**: the articles (`src/content/articles/`), the studio process docs (`docs/`), and the images and video (`public/media/` and per-article assets) remain all rights reserved. The plain-language scope note at the bottom of the `LICENSE` file states the same boundary.
