# Technical Debt Backlog - publish-readiness audit (2026-07-21)

Read-only sweep of `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/reference/*` (docs-audit-r1, seo-a11y-r2, chat-security-audit, all 20 handoffs), targeted `docs/COMMS-LOG.md` greps, and the codebase (`src/`, `functions/`, `poc/`, config). Every item re-verified against current code/docs before listing; verified-fixed items are in the CLOSED section so they are not mistaken for open work. `.claude/worktrees/` is gitignored, so worktree contents are not a public-repo content risk (local disk noise only).

IDs are for reference. Size = rough effort (S = under 30min, M = a focused session, L = multi-session).

## Docs-accuracy

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| D1 | `ENGINEERING.md` sections 1 and 5 materially stale: still lists deleted `TerminalHeader`/`Topbar`, calls `/chat` a "static stub," asserts `functions/`, `wrangler.toml`, and the Pages project "do not exist yet" (all live since `2a979c7`). Verified still stale (lines 13-15, 31, 35, 152). The flagship build reference, and it ships public. | docs-audit-r1 finding 1; b2-phase2 loose end 6 | M | OPEN |
| D2 | `STATUS.md` line 26 says "Astro 5" (package pins `^7.0.9`) and still advertises ENGINEERING.md as "verified against source." | docs-audit-r1 findings 9, 1 | S | OPEN |
| D3 | `README.md` line 16 build command drops the `build-chat-prompt.mjs` prebuild (`astro check && astro build` only); README line 43 documents the prebuild, so the file self-contradicts. | docs-audit-r1 finding 8 | S | OPEN |
| D4 | `VOICE.md` line 43 lists "the wordmark" as sentence-case copy, contradicting #115 (lowercase "brian rohde"). | docs-audit-r1 finding 7 | S | OPEN |
| D5 | `CONTENT.md` has two rows numbered 9 (lines 17, 24). | docs-audit-r1 finding 11 | S | OPEN |
| D6 | `COMMS-LOG.md` final entry is out of chronological order (a day-one chat-feasibility summary after batch 66). | docs-audit-r1 finding 11 | S | OPEN |
| D7 | `prior-project-conventions.md` statuses uniformly "scaffold/adopt" though the scaffold + `/styleguide` shipped long ago; needs a "statuses historical" banner. | docs-audit-r1 finding 10 | S | OPEN |
| D8 | No production scene engineering doc. The live scene module (`src/scripts/scene/*`, `Scene.astro`, `scene.css`) has no prose spec; a scene-bug cold start must reverse-engineer it against a frozen design lab. | docs-audit-r1 finding 2 | M | OPEN |
| D9 | No top-level docs index; CLAUDE.md's reading path omits VOICE/ENGINEERING/TEAM/CONTENT. | docs-audit-r1 finding 4 | S/M | OPEN |
| D10 | Model policy duplicated across 6+ surfaces and drifting: `TEAM.md` prose (lines 16-18) still cites the superseded #50 split; current is #130. Single-source to agent frontmatter. | docs-audit-r1 finding 5 | M | OPEN |
| D11 | `STATUS.md` overloaded (~190 lines: two overlapping agent boards, a 40-line self-labeled "superseded" block, direction recap duplicating #106-#112). Slim + archive history. | docs-audit-r1 finding 6 | M | OPEN |
| D12 | `docs/reference/handoffs/` has no README or HANDOFF-TEMPLATE; the #127 convention has no shape to follow (dir exists, discoverability half unfixed; convention absent from CLAUDE.md/README/agent defs). | docs-audit-r1 finding 3 | S | OPEN (partial) |
| D13 | `aurora-handoff.md` needs a "lab origin / superseded by production module" banner so agents do not build against the frozen lab structure. | docs-audit-r1 finding 2 | S | OPEN |

## Content

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| C1 | Unconfirmed numbers still live in published articles: eight-angle (71.2% / 97.4% / -12.2%), gold-coast (435 comments / 8 pages), atg (98-of-320 / 247.7 to 26.0MB / $20/mo SiteGround). Verified present in `src/content/`. Credibility risk on a public portfolio. | editorial-apply flag #2; DECISIONS #86; STATUS | M | OPEN |
| C2 | ATG client consent open: `atg-llm-migration` is `draft:false` and names the client, old host, and $20 cost. | editorial-apply flag #3; interior-pages flag | S (legal) | OPEN |
| C3 | Gold Coast client consent open: title is client-neutral but body line 15 names "Gold Coast Capital Management". | editorial-apply flag #3; interior-pages flag 3 | S (legal) | OPEN |
| C4 | ATG body opens "one morning... about five hours" while the title leads with "4 hours"; copy-echo reconciliation Brian deferred. | feedback-batch-2026-07-19 item 10; DECISIONS #180 | S | OPEN |
| C5 | Cross-piece closer differentiation deferred: Facebook and Android articles land the same "build inside the platform" moral. | editorial-apply "Deferred / not applied" | M | OPEN |
| C6 | Twilio Signal-pong draft (`draft:true`) awaiting Brian; 6 open questions unanswered; no public route. | STATUS; twilio-signal-pong-draft handoff | S/M | OPEN |
| C7 | `brohde-com-build` article stubbed `draft:true`; the site's own build story is unwritten (relevant precisely because the repo/process is going public). | STATUS | M | OPEN |
| C8 | Pre-date convention only partially applied: dated-postscript convention landed on facebook-newsroom + google-android-for-work only. | DECISIONS #132; STATUS v2 backlog | S/M | OPEN |

## Security

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| S1 | Git-history secret-scan verification before the repo flips public. Keys believed never committed; a `git log -S "sk-ant"` scan surfaced only doc references (no key). Formal verification is an explicit prune-pass gate. | chat-security L4; DECISIONS #193; STATUS v2 | S | OPEN |
| S2 | H3 Turnstile: launched rate-limit-only. Server ready, client sends no token; conscious posture backstopped by the hard spend cap. | chat-security H3; chat-hardening residual 3 | M | OPEN (accepted) |
| S3 | M1 KV rate limiter cross-PoP race remains; bounded by the AI Gateway hard cap; upgrade path is a Durable Object / Rate-Limiting binding if abuse appears. | chat-security M1; chat-hardening residual 1 | M | OPEN (residual) |
| S4 | L1 deny-list self-disclosure: the model sometimes names its "policy" / "facts pack" when declining. Prompt tweak + eval row never applied. | chat-security L1; chat-hardening residual 4 | S | OPEN |
| S5 | Revoke the POC key (L4). `poc/chat/.env` (gitignored) holds a real key expiring 2026-08-14; revoke after eval sign-off. | chat-security L4; chat-hardening residual 5 | S | OPEN |
| S6 | Gateway spend-trip has no Cloudflare notification; a cap trip silently degrades chat to the offline message; intended close is PostHog chat-error alerting once the analytics key lands (see R4). | STATUS agent board (#159 close-out) | S | OPEN |

## Code-quality

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| Q1 | `content.config.ts` Zod deprecation warnings (`z.coerce.date()` / `z.string().url()`), 2 cosmetic warnings at build. | STATUS lines 134-135 | S | OPEN |
| Q2 | `terminal.ts` stale-era comments; deferred during #196 because the file was mid-build; now actionable. | DECISIONS #196 | S | OPEN |
| Q3 | `system-prompt.md:42` "the site has a terminal aesthetic": internal vocabulary flagged for a follow-up sweep; becomes public knowledge with the repo. | editorial-apply "Deferred" | S | OPEN |
| Q4 | `BaseLayout.astro` has 5 em dashes in comment blocks; the #18 dash ban covers comments; owed as a separate sweep. | STATUS "Known debt, not fixed on purpose" | S | OPEN |
| Q5 | Styleguide composer specimens cannot key `:root[data-theme]` tokens on forced-ground panels, so they follow the live toggle instead of the panel; per-panel re-key is backlog. | DECISIONS #196 | S | OPEN |
| Q6 | Frozen prompt may still rarely emit a `/resume` markdown link that now renders as raw text; a future contract change should drop `resume` from the model's allowlist. | feedback-batch flag; DECISIONS #180 | S | OPEN |
| Q7 | Chat eval is 36/38; the 2 remaining fails are stale #81 labels, not real regressions; eval-fixture relabel owed. | STATUS (#198) | S | OPEN |

## SEO / a11y

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| A1 | No `srcset`/responsive images on the two article images. | seo-a11y-r2 backlog; STATUS line 67 | S | OPEN |
| A2 | No `BreadcrumbList` JSON-LD. | seo-a11y-r2 backlog | S | OPEN |
| A3 | robots.txt / noindex redundancy cleanup. | seo-a11y-r2 backlog | S | OPEN |
| A4 | Placeholder 0.4-opacity text is deliberate sub-AA (~2.15:1 night / ~1.93:1 light) per Brian's explicit order; documented, semantics carried elsewhere. A public a11y auditor will flag it. Note, not necessarily a fix. | DECISIONS #196/#184 | - | OPEN (accepted) |

## Performance

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| P1 | Chat prompt caching no-ops: the ~2000-token tools+system prefix sits just under Haiku 4.5's 2048-token minimum cacheable prefix, so `cache_control` silently no-ops (~$0.002/reply extra). Accepted; revisit if the facts pack grows. | DECISIONS #84 | S | OPEN (accepted) |

## Repo-hygiene

| ID | Item | Source | Size | Status |
|----|------|--------|------|--------|
| R1 | Repo-publish sensitivity prune (the gating project): personal email, DNS/registrar/account specifics, and budget notes live in `COMMS-LOG.md` / `MEMORY.md`; `Brian-Rohde-Resume-2026.pdf` sits in `docs/reference/`. Prune-not-exclude pass reviewed by Brian before the flip. | DECISIONS #193; STATUS v2 backlog | M | OPEN |
| R2 | 12 stale worktrees under `.claude/worktrees/` (gitignored; local disk only), including one UNMERGED branch `worktree-agent-a5d6ffeb17f51ebf4` holding an Eight Angle expansion that never landed; keep-or-kill owed; bulk removal was permission-blocked. | STATUS header | S | OPEN |
| R3 | `public/og-default.svg` is vestigial (replaced by `og.png`), harmless but removable. | STATUS agent board (og-image) | S | OPEN |
| R4 | PostHog wired but keyless: `PUBLIC_POSTHOG_KEY` unset, nothing logged today; blocks S6 error-alerting and the analytics phase question. | DECISIONS #11; STATUS | S | OPEN |

## Feature backlog (Brian-approved ideas, parked; not debt, listed for completeness)

Homepage cycling starter questions; chat answers technical questions about itself + offers the source link once public; matrix marks as ASCII art; ephemeral visitor-to-visitor chat (#32); presence planes (#43); the awards/gallery submission + relaunch of the STOPPED award-readiness audit (#172); real brand marks in the glyph tide pending trademark check (#45/#59, settled for Twilio by owner, open for future marks).

## Verified CLOSED (appeared in docs as flags, confirmed fixed in current code; do NOT re-list as open)

- Android CC BY 3.0 user-visible attribution (#135 "owed later"): rendered template-side, verified android-only in dist.
- Styleguide hardcoded old article titles: now shows the current eight-angle title.
- `facts.md` fabrications (Spanish/Portuguese, "Django at Twilio", "additional WordPress sites", phantom `/work` section): removed at #132; grep clean.
- `scene.css` /chat cold-sky facade gap (b2-phase2 loose end 1): closed by interior-pages themed skies.
- Header `transition:persist` (b2-phase1/phase2 loose end): landed in Phase 3.
- Homepage boot LCP ship-gate blocker: boot killed, mobile Perf 87 to 100.
- `brohde-com-build` "terminal" description house-rule violation: fixed #132.
- SVG-only OG image (no social card): real `og.png` wired.
- Chat security H1/H2/M2/L2/L3/L5: hardening merged; AI Gateway + $5 hard cap live (#159).
- `/log/*` to bare-slug migration + 301s: shipped #180.
- README component/repo map: current (only the build-command line, D3, is stale).

## Summary - counts per category (open items only)

| Category | Count |
|----------|-------|
| Docs-accuracy | 13 |
| Content | 8 |
| Security | 6 |
| Code-quality | 7 |
| SEO / a11y | 4 |
| Repo-hygiene | 4 |
| Performance | 1 |
| Total open | 43 |

Sizing skews small: ~33 S, ~8 M, 0 L (the two heaviest, D1 and R1, are M but consequential). Three items are explicitly accepted trade-offs, not fixes (S2, A4, P1).

## Top 10 by impact for a public-repo reader

1. D1: `ENGINEERING.md` is materially false in its two largest sections. The repo is being published specifically to showcase the process; the flagship build doc describing a site that no longer exists is the most damaging thing a technical reader will hit.
2. R1: the sensitivity prune (personal email, DNS/account specifics, budget notes, resume PDF, git-history key verification). The gate on going public, and the one item with real personal-exposure downside.
3. C1: unconfirmed numbers in live articles. Precise metrics the portfolio cannot stand behind are a credibility liability.
4. C2 + C3: ATG and Gold Coast client consent on live articles naming clients, domains, hosts, and costs.
5. D2 + D11: `STATUS.md` overload + "Astro 5" + the false "verified against source" claim.
6. S4 + S2 + S3: chat security residuals (L1 self-disclosure, H3 no bot check, M1 KV race). The security audit ships public; readers will read it, so open findings should be closed or clearly annotated as accepted.
7. D8 + D9: no scene doc, no docs index / broken CLAUDE.md reading path. The AI-studio workflow is the story being sold.
8. D10: model-policy drift (TEAM.md prose citing a superseded decision).
9. Q3 + Q4 + Q2: code-quality sweeps now unblocked ("terminal aesthetic" internal vocab, BaseLayout comment dashes, stale terminal.ts comments).
10. The quick-win doc cluster (D3/D4/D5/D6/D7 + Q1): individually trivial, collectively the "does this team sweat the details" signal.

Notable: no `TODO`/`FIXME`/`HACK` markers exist anywhere in `src/` or `functions/`; the debt is tracked in docs, not scattered in code, which is a point in the repo's favor.
