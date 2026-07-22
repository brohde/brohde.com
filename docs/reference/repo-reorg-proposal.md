# Repository reorganization proposal (pre-public)

_Read-only architecture pass, 2026-07-21. Author: Opus architect, cold start. Scope: the whole tracked tree, ahead of taking the repo public as a showcase of the AI-studio process. This file is the only change; nothing else moves. Every claim below was verified against the actual files (build script paths, `package.json`, `.gitignore`, `.prettierignore`, `git ls-files`), not from memory. Grounds decision #158's earmark and the debt backlog (R1, R3, D8-D13) into one target layout plus an ordered, build-green migration sequence._

Trigger: Brian, "I still see the poc directory." The `poc/` name is the visible symptom; the real work is promoting a load-bearing subsystem out of a name that says "throwaway," pruning two staging piles, and shaping `docs/` for a stranger who reads the repo as the product.

## 0. What is in the tree today (verified inventory)

| Top-level | Tracked contents | Role | Verdict |
|-----------|------------------|------|---------|
| `src/` | Astro site: `pages/`, `components/`, `layouts/`, `lib/`, `content/articles/*` (8 articles, 6 with co-located figures), `scripts/` (`terminal.ts`, `theme.ts`, `scene/*`), `styles/`, `assets/fonts/circular-{book,medium,bold}.woff2` | The live site. Load-bearing. | Keep as-is |
| `functions/` | `api/chat.ts`, `api/contact.ts`, `api/_chat-prompt.generated.ts` (gitignored, built), `tsconfig.json` | Cloudflare Pages Functions (production backend). Load-bearing. | Keep as-is |
| `public/` | `_headers`, `_redirects`, favicons, `apple-touch-icon.png`, `media/`, `og.png`, `og-default.svg`, `robots.txt` | Static passthrough. Load-bearing except `og-default.svg`. | Keep; drop one dead file (R3) |
| `poc/` | `poc/chat/*` only (13 tracked files + gitignored `.env`, `node_modules/`, `eval-http-transcript.md`, `.DS_Store`) | **Load-bearing.** The build regenerates the production prompt from here on every build. Also holds the eval harness and the retired-in-plan dev bridge. | **Promote out of `poc/`** |
| `assets/` | `fonts/circular/` (10 `.ttf` + `web/` `.woff`/`.ttf`), `images/case-studies/`, `images/glyph-source/`, `images/legacy-site/` | Staging holding pen. **Not referenced by `src/` at all** (Astro cannot serve from a root `assets/`); the live figures were copied into `src/content/`. | Prune + rename to an obvious archive |
| `tools/` | `og/render.mjs`, `og/og.html`, `og/README.md` | The OG-card renderer (Chrome-over-CDP, byte-stable). Utility, run on demand. | Keep; consolidate story with `scripts/` |
| `scripts/` | `build-chat-prompt.mjs` | The build-time prompt codegen (the load-bearing seam). | Keep; consolidate story with `tools/` |
| `docs/` | STATUS, DECISIONS, COMMS-LOG, CONTENT, TEAM, VOICE, ENGINEERING, `drafts/`, `design/`, `reference/` (incl. `handoffs/` x28, `Brian-Rohde-Resume-2026.pdf`) | The AI-studio narrative. Ships public by Brian's call (#154). | Restructure for a public reader |
| `.claude/` | `agents/*.md` (4), `settings.json` | Studio agent roster. Ships public (#154). | Keep; note settings review |
| Root files | `astro.config.mjs`, `wrangler.toml`, `package.json`, `tsconfig.json`, `.gitignore`, `.prettierignore`, `.prettierrc.mjs`, `CLAUDE.md`, `PLAN.md`, `README.md`, `.vscode/` | Config + entry docs. | Keep; light hygiene |

Gitignored local-only (never a public content risk, noted not moved): `node_modules/`, `dist/`, `.astro/`, `.wrangler/`, `.claude/worktrees/`, `poc/chat/.env`, `poc/chat/node_modules/`, `functions/api/_chat-prompt.generated.ts`.

The load-bearing seam, verified: `scripts/build-chat-prompt.mjs` line 23 sets `pocDir = path.join(repoRoot, "poc", "chat")`, reads `system-prompt.md` + `facts.md` from it (lines 27-31), concatenates `SYSTEM = systemPrompt + "\n\n# FACTS PACK\n\n" + facts`, and writes `functions/api/_chat-prompt.generated.ts`. It runs first in `package.json`'s `build`: `node scripts/build-chat-prompt.mjs && astro check && astro build`. Both locally and on the Cloudflare Pages build. If this path breaks, the production chat prompt silently regenerates stale or the build fails. This is the single reference that must never break during the move.

---

## 1. `poc/chat` disposition (the headline)

**Recommendation: promote to a top-level `chat/` directory.** It is production infrastructure wearing a throwaway name; #158 already records Brian's "chat is no longer a poc." A root `chat/` (not `src/prompt/`, not `tools/chat/`) is right because the directory is not Astro-built source (it has its own `package.json` + `node_modules` and runs under plain Node), and because for a public reader a top-level `chat/` that holds the prompt, the facts pack, and the eval harness tells the AI-studio story at a glance. `src/` would drag it into the Astro build graph; `tools/` undersells it as a utility.

**Target layout:**

```
chat/
  README.md                 # rewritten: "the production chat, its prompt, and how it was evaluated"
  system-prompt.md          # FROZEN source of truth (#61); build reads here
  facts.md                  # FROZEN source of truth (#61); build reads here
  eval/
    eval.mjs                # keyed eval harness (26+ questions)
    eval-http.mjs           # HTTP parity harness vs the live Function
    make-review.mjs         # regenerates the review artifact
    eval-review.html        # interactive grading surface
    transcript.md           # preserved eval run
    verdicts-2026-07-15.md  # signed-off verdicts
    package.json            # @anthropic-ai/sdk etc. for the harness
    package-lock.json
```

**Disposition of the dev bridge (`server.mjs`, `index.html`, `.env`):** decision #158 already calls to retire the localhost POC server "in favor of `wrangler pages dev` + root `.dev.vars`, `poc/chat/.env` dies with it." I agree and recommend executing that, but as a **separate, later step** so the relocation itself ships build-green first (the bridge retirement is a `src/scripts/terminal.ts` code change, not a file move). Two viable end states:

- **A (recommended, matches #158):** delete `server.mjs` + `index.html`, retire `poc/chat/.env`, and repoint `terminal.ts`'s localhost bridge (`CHAT_URL = IS_LOCAL ? "http://localhost:8787/chat" : "/api/chat"`, line 699) at `wrangler pages dev` on the same `/api/chat` path, so localhost dev exercises the real Function with the key in a gitignored root `.dev.vars`. This removes a second key file (S5), a second CORS surface (chat-security L4), and a second prompt-concatenation copy (`server.mjs` mirrors the build script's concatenation by hand). One dev entry point instead of two.
- **B (minimal):** keep `server.mjs` + `index.html`, just relocate them under `chat/dev-server/`. Lower effort, but leaves the #158 debt open and keeps `poc/chat/.env` alive (S5 stays open), and keeps a hand-maintained prompt concatenation that can drift from the build script.

I recommend A, sequenced after the pure move. Do not delete `server.mjs` until `terminal.ts` no longer needs an 8787 listener.

**Every reference that must update (verified):**

| Reference | File:line | Change |
|-----------|-----------|--------|
| Prompt source path (LOAD-BEARING) | `scripts/build-chat-prompt.mjs:23` | `path.join(repoRoot, "poc", "chat")` -> `path.join(repoRoot, "chat")` |
| Ephemeral eval output ignore | `.gitignore:30` | `poc/chat/eval-http-transcript.md` -> `chat/eval/eval-http-transcript.md` |
| Codegen comment | `.gitignore:26` | update the `poc/chat/` mention |
| Prettier exclude | `.prettierignore:9` | `poc/` -> `chat/` (keep the harness/prompt out of the formatter) |
| POC key ignore | `.gitignore` | `poc/chat/.env` is covered by the global `.env` rule already; if bridge A retires it, no new rule needed; if bridge B keeps it, add `chat/dev-server/.env` explicitly |
| Header comments | `functions/api/chat.ts:5,8,9` | cosmetic; update `poc/chat/` mentions to `chat/` |
| Dev bridge comments | `src/scripts/terminal.ts:686,702` | cosmetic; update `poc/chat` mentions; under bridge A also change `CHAT_URL`/`IS_LOCAL` (line 698-699) |
| Repo map | `README.md:42,43,57` | rewrite the three `poc/chat/` rows to `chat/` |
| Build reference | `docs/ENGINEERING.md:87,115,152` | update `poc/`/`poc/chat` mentions (also owed a staleness rewrite, D1) |
| Resume point | `docs/STATUS.md:18,32` | `node poc/chat/make-review.mjs` -> `chat/eval/make-review.mjs`; `poc/chat/*.md` -> `chat/*.md` (STATUS is being rewritten anyway, D11) |
| Historical handoffs (x~12) + DECISIONS rows | `docs/reference/handoffs/*.md`, `docs/DECISIONS.md`, `docs/reference/chat-security-audit.md`, `editorial-review-r1.md`, `llm-terminal-plan.md` | **Do NOT rewrite.** These are dated historical records; rewriting them falsifies history. Add one line to the new `chat/README.md`: "formerly `poc/chat/`; older docs reference the old path." |

Internal relative reads inside the harness (`eval.mjs`/`server.mjs` reading `./system-prompt.md`) move intact because the files move together; verify with a keyed eval run after the move (sequence step 2).

**Risk:** Medium. The build seam is the hazard: a wrong path in `build-chat-prompt.mjs` fails the build (loud, good) or, if it fell back silently, would ship a stale prompt (it does not fall back; `readFileSync` throws). Mitigation: change the path and run `npm run build` in the same commit; grep for any surviving `poc/chat` in build-critical files before committing.
**Effort:** Move + build-critical refs = **S**. Bridge A retirement (terminal.ts repoint + `.dev.vars` + delete server) = **M**. Historical-doc note = **S**.

---

## 2. `assets/` disposition

**Finding:** root `assets/` is a **pure staging holding pen with zero live references.** `git grep "assets/"` over `src/`, `functions/`, and `astro.config.mjs` returns nothing; every hit is in `docs/`. Astro cannot serve a root `assets/` (only `public/` passes through and `src/assets/` is import-bundled), so nothing here reaches a visitor. The live figures were copied into `src/content/articles/*/` and the live fonts are the three subset `.woff2` files in `src/assets/fonts/`. Confirmed duplicates now living in both places:

- `assets/images/case-studies/{atg,eight-angle,gold-coast}/hero-live-2026-07.png` == the co-located `src/content/articles/*/hero-live-2026-07.png` (the rendered figures).
- `assets/images/case-studies/google-android-for-work/afw-still-15.jpg` == `src/content/articles/google-android-for-work/afw-still-15.jpg`.
- The Facebook figures used on the site (`Homepage-Localized.png`, `Timeline-Mobile.png`) came from `assets/images/legacy-site/`, not from `assets/images/case-studies/facebook-newsroom/` (those `newsroom-still-*.jpg` are unused alternates).

Unused staging never wired into anything: `newsroom-still-45/75.jpg`, `afw-still-45/75.jpg`, all of `images/glyph-source/` (4 jpgs, they were tracing sources for the ASCII tide), the extra `legacy-site` screenshots, and the entire `fonts/circular/` tree (10 raw `.ttf` + a `web/` mirror; the site ships the three subset `.woff2` under `src/assets/fonts/`).

**Recommendation:** this is a private working archive, not a public asset. Options, in order of preference:

- **Prune-and-rename (recommended):** delete the confirmed duplicates and unused alternates, then rename what remains (raw source captures worth keeping as provenance) to `docs/archive/source-assets/` so its archival status is legible to a public reader. A visitor should not find a top-level `assets/` that looks live but is dead. Note the licensed Circular font: the raw `.ttf` originals are a licensed typeface; keep them out of the public flip regardless (see open question), which is its own reason not to leave them at top level.
- **Prune-only:** delete duplicates + unused, keep a slimmed `assets/` where it is. Lower effort, but leaves a confusing top-level name.
- **Keep as-is:** rejected. It reads as clutter and ships a licensed font's raw originals publicly.

**References that must update:** none in code (nothing imports from `assets/`). Docs mention it (COMMS-LOG, DECISIONS #158, ENGINEERING, design-lab notes) as history; leave those. If renamed to `docs/archive/source-assets/`, no build touches it.
**Risk:** Low (nothing depends on it). The only care is not deleting a source capture that has no copy anywhere; verify each deletion has a live counterpart or is a genuine unused alternate before removing.
**Effort:** **S**.

---

## 3. `tools/` + `scripts/` consolidation

**Finding:** two homes for build-adjacent tooling, one file each. `scripts/build-chat-prompt.mjs` is a **build-pipeline** step (runs inside `npm run build`, non-optional). `tools/og/*` is an **on-demand generator** (run by hand: `node tools/og/render.mjs`; reads `src/assets/fonts/circular-{bold,book}.woff2` and the `src/scripts/scene/` ramp; drives Chrome; writes `public/og.png`). They are genuinely different kinds of thing, which is the honest argument for two directories. But for a public reader, two singleton top-level tooling dirs read as indecision.

**Recommendation (mild):** consolidate under one `tools/` with the build/on-demand distinction expressed by subfolders, not by two top-level names:

```
tools/
  build/
    build-chat-prompt.mjs
  og/
    render.mjs
    og.html
    README.md
```

Keep `scripts/` as an alias only if the `package.json` churn is unwelcome; otherwise fold it in. This is the lowest-value item in the reorg; if Brian prefers the build-vs-utility split, leaving them as-is is defensible. Do not overthink it.

**References that must update:**

| Reference | File:line | Change |
|-----------|-----------|--------|
| Build invocation (LOAD-BEARING) | `package.json:9` | `node scripts/build-chat-prompt.mjs` -> `node tools/build/build-chat-prompt.mjs` |
| Codegen self-reference in banner | `tools/build/build-chat-prompt.mjs:34-37` | the emitted banner names `scripts/build-chat-prompt.mjs`; update the string |
| `.gitignore:26` comment | `.gitignore` | names `scripts/build-chat-prompt.mjs` |
| Repo map | `README.md:43` | `scripts/build-chat-prompt.mjs` row |
| OG regen line | `tools/og/README.md`, `docs/reference/handoffs/og-image.md` | already `tools/og/render.mjs`; unchanged if `og/` stays put |
| `astro check` scope note | `docs/ENGINEERING.md` build section | if it names `scripts/` |

The additional working directory `src/scripts/` (in the env) is unrelated to root `scripts/`; it is Astro client code and does not move.
**Risk:** Low, but `package.json:9` is build-critical: get it in the same commit and run `npm run build`.
**Effort:** **S**. (Or zero if Brian keeps the split.)

---

## 4. `docs/` shape for a public reader

The AI-studio process is the thing being sold (#154), so `docs/` is a first-class deliverable, not backmatter. It currently has no index, an overloaded STATUS, no scene doc, model policy copied across six surfaces, a handoffs directory with no template, and a resume PDF plus personal specifics that the sensitivity prune (R1) removes. This folds the docs-audit-r1 structural picks and the debt backlog into one target.

**Target layout:**

```
docs/
  README.md                    # NEW (D9): the index + task-keyed reading order.
                               #   "any session: STATUS then DECISIONS; writing: VOICE+CONTENT;
                               #    engineering: ENGINEERING + the scene doc"
  STATUS.md                    # SLIMMED (D11): current state, in-flight, next, open questions only
  DECISIONS.md                 # unchanged mechanics; optional "current pointers" header
  COMMS-LOG.md                 # SENSITIVITY-PRUNED (R1): private email, DNS/registrar/account
                               #   specifics, budget notes removed before the flip
  TEAM.md                      # model policy -> one current line + pointer to agent frontmatter (D10)
  VOICE.md                     # visitor-copy checklist; line 43 wordmark fix (D4)
  ENGINEERING.md               # sections 1 + 5 rewritten from the tree (D1); build cmd fixed (D3)
  CONTENT.md                   # renumber the duplicate row 9 (D5)
  engineering/
    scene.md                   # NEW (D8): the production scene module spec (file map, facade
                               #   wiring, fixed-mark math, perf budget)
  drafts/                      # unpublished article drafts (kept; provenance for the process story)
  design/                      # design-concepts.html + lab/ prototypes (kept as dated artifacts)
  reference/                   # research + audits (below)
  archive/                     # NEW: rolled-off history, history-preserving via git mv
    STATUS-history.md          # the ~40-line self-labeled "superseded" block out of STATUS (D11)
    source-assets/             # the pruned root assets/ (from section 2), if kept
  reference/
    handoffs/
      README.md                # NEW (D12): what a handoff is, when to write one
      HANDOFF-TEMPLATE.md      # NEW (D12): scope / files / judgment calls / loose ends / verify
      *.md                     # the 28 existing handoffs (kept; they ARE the process artifact)
    ...audits + specs (docs-audit-r1, debt-backlog, chat-security-audit, seo-a11y-r2,
       editorial-review-r1, motion-spec-*, llm-terminal-plan, prior-project-conventions,
       chat-*, article-chrome-proposal, eight-angle-facts, this file)
```

**Ships public vs removed by the sensitivity prune (R1, the gate):**

| Item | Disposition | Source |
|------|-------------|--------|
| STATUS / DECISIONS / COMMS-LOG / TEAM / VOICE / ENGINEERING / CONTENT | Ship (the studio story is the point) | #154 |
| `.claude/agents/*` + `CLAUDE.md` + `PLAN.md` | Ship | #154 |
| `docs/reference/handoffs/*` | Ship (concrete evidence of the phased workflow) | #154, D12 |
| Audits (docs-audit, debt-backlog, chat-security, seo-a11y, editorial) | Ship, but close or annotate open security findings first (S2/S3/S4) so a reader does not see live holes | debt top-10 item 6 |
| `docs/reference/Brian-Rohde-Resume-2026.pdf` | **Remove** (personal document, not repo content) | R1 |
| Private email, DNS/registrar/account specifics, budget notes in COMMS-LOG | **Prune in place** (prune-not-exclude) | R1, #193 |
| `poc/chat` (now `chat/`) prompt + facts + eval fixtures | Ship, but this becomes public knowledge; confirm nothing in `facts.md` is private | #154, R1 |
| `MEMORY.md` (user auto-memory, budget notes) | Not in the repo tree; noted so it is not accidentally added | R1 |

**Handoffs (D12):** the directory exists with 28 handoffs but no `README.md` and no `HANDOFF-TEMPLATE.md` (verified: `ls | grep -i readme` is empty). Add both; reference the convention in `CLAUDE.md`'s process rules and each agent definition so #127 has a shape to follow. The handoffs stay: for a public reader they are the strongest single piece of evidence that the phase-per-agent workflow is real.

**References that must update:** `CLAUDE.md` "Read these first" list gains the index pointer and VOICE/ENGINEERING/TEAM/CONTENT (D9). Cross-doc links that point at moved files (e.g. anything linking `docs/reference/handoffs/` or a future `scene.md`). The STATUS -> archive move uses `git mv` to preserve blame.
**Risk:** Low mechanically; the real risk is the R1 prune being incomplete (a missed personal detail ships publicly and is hard to recall). Mitigation: R1 is a Brian-reviewed pass, and it is the last step before the flip, not folded into the structural move.
**Effort:** Structural moves + index + handoffs template + scene doc = **M**. The R1 prune is its own **M** and gates the flip. The quick-win doc fixes (D2-D7) are **S** each and can ride any of these commits.

---

## 5. Root hygiene

What a public reader trips over at the top level, and what to do:

- **`poc/`** — the headline; section 1 removes the name entirely.
- **`public/og-default.svg`** — vestigial (R3): replaced by `og.png`, which is what the social meta points at. Social platforms do not render SVG OG cards, so this file produces nothing. Delete it. Verify `git grep "og-default"` is clean in `src/` first (it should be; `SITE.ogImage` points at `/og.png`).
- **`assets/`** — section 2 (rename to `docs/archive/source-assets/` or prune).
- **Two singleton tooling dirs (`tools/`, `scripts/`)** — section 3.
- **`.claude/settings.json`** — ships public by #154; give it a read before the flip to confirm no local paths or tokens leak (it is committed config, but worth a glance in the R1 pass). `.claude/settings.local.json` is correctly untracked.
- **Stale worktrees under `.claude/worktrees/` (R2)** — **gitignored, local-disk only, NOT a public-repo content risk. Note only.** 12 stale worktrees including one unmerged branch (`worktree-agent-a5d6ffeb17f51ebf4`, an Eight Angle expansion that never landed). Keep-or-kill is a local-hygiene chore for Brian, not part of the public flip. Do not block the reorg on it.
- **`PLAN.md` at root** — fine to keep (original brief, part of the story); optionally move under `docs/` for a cleaner root, but it is referenced by CLAUDE.md as `PLAN.md`, so leaving it avoids churn.
- Root config (`astro.config.mjs`, `wrangler.toml`, `tsconfig.json`, `package.json`, prettier + git ignore files) — all expected at root; no change.

**Risk:** Low. **Effort:** **S** (the only real action is deleting `og-default.svg`; the rest is the section 2/3 work).

---

## 6. Migration sequence (ordered, each step independently shippable and build-green)

Each step is a commit (or small set) on `main` that leaves `npm run build` green. Run `npm run build` at the end of every code-touching step before committing. Steps are ordered so the load-bearing seam moves early and under test, and the irreversible-ish prune is last.

1. **Docs quick wins + index + handoffs template (no code).** Land the D2-D7 quick fixes, add `docs/README.md` index (D9), add `handoffs/README.md` + `HANDOFF-TEMPLATE.md` (D12). Pure docs; build cannot break. Ships value immediately and de-risks by warming up the doc structure first. **S.**

2. **Promote `poc/chat` -> `chat/` (the seam).** `git mv poc/chat chat` (and reshape into `chat/` + `chat/eval/` per section 1). Update the build-critical references in the SAME commit: `build-chat-prompt.mjs:23`, `package.json` build if `scripts/` also moves (do that separately, step 3), `.gitignore:30`, `.prettierignore:9`. Update `README.md`, `functions/api/chat.ts` comments. Add the "formerly poc/chat" note to `chat/README.md`. **Verify: `npm run build` green, `functions/api/_chat-prompt.generated.ts` regenerates identically (diff the SYSTEM string length in the build log), and a keyed `node chat/eval/eval.mjs` run holds the current 36/38.** Do NOT rewrite historical handoffs/DECISIONS. **M.**

3. **Tooling consolidation (optional).** Fold `scripts/build-chat-prompt.mjs` into `tools/build/`, update `package.json:9` + the emitted banner + `README.md` + `.gitignore:26`. `npm run build` green. Skip this step entirely if Brian prefers the split. **S.**

4. **Root hygiene.** Delete `public/og-default.svg` (after `git grep` clean). Prune + relocate `assets/` to `docs/archive/source-assets/` (or prune-only), removing the verified duplicates and unused alternates; keep the licensed raw fonts out of the public set (see open question). No build impact (nothing imports `assets/`). **S.**

5. **ENGINEERING + scene doc (the flagship rewrite).** Rewrite ENGINEERING sections 1 and 5 against the current tree (D1), add `docs/engineering/scene.md` (D8), stamp "current as of `<commit>`," add the update-in-same-change rule. This is the highest-value doc for a technical reader and should be current before the flip. **M.**

6. **STATUS slim + archive.** `git mv` the superseded block to `docs/archive/STATUS-history.md`; scope STATUS to current/in-flight/next/open (D11). Single-source the model policy to agent frontmatter with TEAM/STATUS as pointers (D10). **M.**

7. **Dev-bridge retirement (#158, if taking option A).** Repoint `terminal.ts` localhost bridge at `wrangler pages dev` on `/api/chat`, add a gitignored root `.dev.vars`, delete `chat/server.mjs` + `chat/index.html`, retire the old `.env` (closes S5). Verify localhost chat still answers via `wrangler pages dev dist`. This is deferred to here so nothing earlier depends on the 8787 listener. **M.**

8. **Sensitivity prune (R1) + security-finding annotation, Brian-reviewed.** The gate. Prune personal email / DNS / account / budget specifics from COMMS-LOG, remove the resume PDF, confirm `facts.md` carries nothing private, glance `.claude/settings.json`, and close or clearly annotate the open chat-security findings (S2/S3/S4) so a public reader does not see live holes. Then the git-history secret scan (S1). **Brian reviews the prune list before anything flips.** Last, because it is the most sensitive and should sit on top of a settled tree. **M.**

Steps 1-6 are safe to run in any order after 1, but this order front-loads the seam (2) and the flagship doc (5) and ends on the human-gated prune (8). Steps 3 and 7 are optional/deferrable. The repo is build-green and publishable after step 6; steps 7-8 are the polish and the gate.

---

## Open questions for Brian

1. **`chat/` vs `tools/chat/` vs `src/prompt/` for the promoted directory.** I recommend a top-level `chat/` (it is its own Node project and the clearest public signal). Confirm, or say if you would rather bury it under `tools/`.
2. **Dev bridge: retire it now (#158 option A) or just relocate it (option B)?** A closes the second key file (S5) and a hand-maintained prompt copy but is a `terminal.ts` change; B is a pure move. #158 says retire; confirming it is still the call.
3. **The licensed Circular font.** The raw `.ttf` originals under `assets/fonts/circular/` are a licensed typeface. The site ships only three subset `.woff2` (`src/assets/fonts/`). Do the raw originals get pruned entirely before public (recommended), and are the shipped `.woff2` subsets cleared for public redistribution under your license?
4. **`assets/` -> `docs/archive/source-assets/` (recommended) or a hard prune to nothing?** Some are irreplaceable source captures (glyph-tracing sources, legacy-site screenshots); some are dead duplicates. Keep the survivors as archived provenance, or drop them?
5. **Tooling: consolidate `scripts/` into `tools/` (step 3), or keep the build-vs-utility split?** Lowest-stakes item; your call on churn vs tidiness.
6. **`PLAN.md`: keep at root or move under `docs/`?** Keeping it avoids a CLAUDE.md reference edit; moving it tidies the root.
7. **Scope of the R1 prune (step 8).** Confirm the removal list: resume PDF out, personal email + DNS/registrar/account specifics + budget notes pruned from COMMS-LOG. Anything you want kept that I would otherwise cut, or cut that I would keep?
8. **Do the open chat-security findings (S2 Turnstile-off, S3 KV race, S4 self-disclosure) get closed before the flip, or annotated as accepted?** They ship public in `chat-security-audit.md`; a reader will read them.
