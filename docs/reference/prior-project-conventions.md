# Conventions mined from prior projects (anthony-thomas-galante, dragan)

Research brief from 2026-07-15 session (researcher agent reviewed both repos read-only). Both are Astro + Tailwind v4 + Keystatic client sites. This file preserves what's worth copying into brohde.com; adoption status tracked here.

## Documentation / workflow practices

| # | Practice | Source | Status |
|---|---|---|---|
| D1 | Decision log, newest entries appended, date + rationale | both repos | ✅ already adopted (`docs/DECISIONS.md`) |
| D2 | Explicit subagent model policy in team docs | atg CLAUDE.md | ✅ adopted (`docs/TEAM.md`, decision #14) |
| D3 | Read-only recon agents (tools scoped to Read/Grep/Glob) fanned out in parallel | dragan `.claude/agents/page-design-recon.md` | ✅ adopted as a working rule in TEAM.md |
| D4 | Living design-system doc (`STYLEGUIDE.md`) + `/styleguide` specimen page (noindex) + hard rule: token change updates code + specimen + doc in the same change | dragan | 🔜 adopt in Phase 3 (design system build-out) |
| D5 | "Design revisits = 3 genuinely different variations as an artifact, Brian picks" as standing practice | atg CLAUDE.md | ✅ adopted (in the same spirit as the current 10-concept round) |
| D6 | Voice/style guide for consistent tone | atg `docs/writing-style.md` | ✅ adopted (`docs/VOICE.md`) |
| D7 | Validation sweep before shipping: every route 200s, renders non-empty, images resolve, zero console errors, internal links work | atg plans overview | 🔜 adopt as pre-launch + pre-article-publish gate |
| D8 | `.prettierrc` with prettier-plugin-astro + prettier-plugin-tailwindcss | atg | 🔜 adopt at Astro scaffold |
| D9 | `.vscode/extensions.json` recommending Astro extension | atg | 🔜 adopt at scaffold |

## Astro / engineering practices

| # | Practice | Source | Status |
|---|---|---|---|
| E1 | Content collections: Zod + glob loader, one schema per shape, commented rationale | both | 🔜 scaffold |
| E2 | Centralized SEO component (title/desc/canonical/OG/Twitter + JSON-LD, per-page override → global default). Port dragan's `SEO.astro`; use Person/Article/ProfilePage types | dragan | 🔜 scaffold — highest-leverage port |
| E3 | `@astrojs/sitemap` filtered to exclude internal routes (e.g. /styleguide) | both | 🔜 scaffold |
| E4 | `prefetch: { prefetchAll: true }` in astro.config | atg | 🔜 scaffold |
| E5 | View Transitions (`<ClientRouter />`) + VT-safety rule: event delegation on document/window or re-init on `astro:page-load`; never bind nodes at module scope. Write into CLAUDE.md BEFORE first interactive component | both | 🔜 scaffold (motion is a design pillar here) |
| E6 | Font discipline: self-host (@fontsource / Astro Fonts API), preload only above-fold weights, do NOT force `-webkit-font-smoothing`/`optimizeLegibility` on body (weight-flip bug both projects hit) | atg | 🔜 scaffold |
| E7 | PostHog wiring: single init component, `defaults` date config, global click-delegation for conversions, do NOT manually fire `$pageview` under View Transitions (double-counts; verified in prod on dragan) | dragan `src/components/posthog.astro` | 🔜 scaffold — hand to frontend-engineer as starting point |
| E8 | Tailwind v4 via `@tailwindcss/vite` (not deprecated `@astrojs/tailwind`) | both | 🔜 scaffold |
| E9 | Design tokens single-sourced in `global.css` (`@theme`), one typography utility per text role, no scattered font/size strings | dragan | 🔜 Phase 3 |
| E10 | Security headers via Cloudflare `_headers` (port dragan's netlify.toml set: CSP, HSTS, X-Frame-Options, Permissions-Policy, immutable cache on hashed assets); single strict CSP since no admin route | dragan | 🔜 scaffold |
| E11 | `tsconfig` extends `astro/tsconfigs/strict` + path alias | both | 🔜 scaffold |
| E12 | `build` script chains `astro check && astro build` | dragan | 🔜 scaffold |
| E13 | OG-image generation script (sharp, 1200×630) | dragan `scripts/generate-og-image.mjs` | 💡 consider: per-article OG images generated at build |

## Explicitly NOT copying (and why)

- **Keystatic CMS + its adapter/KV/React baggage** — Brian authors content directly; pure static output, no adapter needed.
- **Astro pinned to v5** (dragan) — only because of Keystatic; brohde uses current Astro.
- **Netlify Forms wiring** — Netlify-specific; if a contact form is wanted, use Pages Functions + Turnstile.
- **Migration tooling/docs, PII gitignore gates** — greenfield site, N/A.
- **SESSION_LOG.txt Stop hook** (atg) — personal tutorial artifact, not requested here.
- **dragan's settings.local.json permission graveyard** — generate our own allowlist from real usage (`/fewer-permission-prompts`) instead.
- **Full researched hosting-limits audit doc** — overkill for a self-authored blog; one paragraph on Pages free tier suffices.
