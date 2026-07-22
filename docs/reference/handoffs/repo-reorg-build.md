# Handoff: repository reorganization build (#213)

_Agent: Opus engineer, isolated worktree `agent-aadacaf19e88c8916` (branch
`worktree-agent-aadacaf19e88c8916`, base `c806f1f`). Date: 2026-07-21._

Executed the approved repo reorg (#213) per `docs/reference/repo-reorg-proposal.md`,
with the directed carve-outs: the R1 sensitivity prune (step 8) is skipped
entirely (human-gated, Brian reviews the prune list separately), open-question
steps took the proposal's conservative default plus a flag, and the promoted
directory name was DECIDED as top-level `chat/`. Four commits, each build-green.

## Scope: what shipped, by commit

| Commit | Step | What |
| --- | --- | --- |
| `dadbc7e` | 1 | `docs/README.md` index + `docs/reference/handoffs/README.md` + `HANDOFF-TEMPLATE.md`. New files only, no content rewrites. |
| `2ac0676` | 2 | `poc/chat/` promoted to top-level `chat/` (the load-bearing seam). |
| `4d21279` | 3 | `scripts/build-chat-prompt.mjs` folded into `tools/build/`; `scripts/` removed. |
| `ad740e3` | 4 | Root hygiene: deleted dead `public/og-default.svg`; archived root `assets/` to `docs/archive/source-assets/`. |

## Files

**Step 1 (docs stubs):** `docs/README.md` (task-keyed reading order + directory
map), `docs/reference/handoffs/README.md` (what a handoff is / when to write
one), `docs/reference/handoffs/HANDOFF-TEMPLATE.md` (the shape). No existing doc
content rewritten.

**Step 2 (chat promotion):** `git mv poc/chat chat` as a FLAT move (all 13
tracked files land at `chat/` root). Updated the build seam
`scripts/build-chat-prompt.mjs` (path `poc/chat` to `chat`, var `pocDir` to
`chatDir`, banner + comments). Updated `.gitignore` (line 26 comment, line 30
`chat/eval-http-transcript.md`), `.prettierignore` (`poc/` to `chat/`),
`functions/api/chat.ts` comments, `src/scripts/terminal.ts` comment, `README.md`
repo-map rows. Rewrote `chat/README.md` to describe the directory as production
infrastructure, including a "formerly `poc/chat/`" note. Updated the dev-facing
`poc/chat` strings inside `chat/server.mjs` (comment + key-missing message) and
`chat/index.html` (file-protocol error).

**Step 3 (tooling):** `git mv scripts/build-chat-prompt.mjs
tools/build/build-chat-prompt.mjs`. Fixed `repoRoot` to two levels up (the script
is now one directory deeper). Updated the emitted banner, `package.json` build
line, `.gitignore` comment, `functions/api/chat.ts` comment, `chat/README.md`,
and `README.md` (added a `tools/og/` row too, which the map was missing). Removed
the emptied `scripts/` directory.

**Step 4 (root hygiene):** `git rm public/og-default.svg` + removed its stale
`/og-default.svg` rule from `public/_headers` + refreshed the `README.md`
`public/` row to current reality (it also listed a nonexistent `resume.pdf` and
`favicon.svg`). `git mv assets docs/archive/source-assets` (all 36 files intact),
added `docs/archive/source-assets/README.md` explaining the archive and flagging
the licensed fonts and duplicates. Updated the one provenance comment in
`src/scripts/scene/sources.ts` to the new archive path. Dropped the now-stale
`assets/` line from `.prettierignore` (its target moved under `docs/`, already
ignored).

## Verification

- **`npm run build` green after every step** (12 pages, 0 `astro check` errors).
  Final clean build (dist removed first) green.
- **Prompt bundle byte-identical (the critical seam).** Captured the pre-move
  `functions/api/_chat-prompt.generated.ts` as a baseline. After step 2 and again
  after step 3, the regenerated bundle's payload (the `export const SYSTEM` line,
  banner comments stripped) is byte-identical: same SHA-1 `422ea680...`, same 9819
  bytes, same 9652-char SYSTEM string. The only full-file diff is the banner's
  source-path comment, which was intentionally updated to name the new location.
- **`chat/.env` stays ignored (no live key can be staged).** `git check-ignore -v
  chat/.env` matches `.gitignore:18` (the bare `.env` rule, which is
  directory-agnostic), exactly as it matched `poc/chat/.env`. `git status
  --ignored` shows no `.env` staged or tracked. See the merge note below for why
  the physical `.env` needs one manual move on `main`.
- **Harness relative reads resolve at `chat/`.** `node chat/server.mjs` reads
  `system-prompt.md` + `facts.md` cleanly (no ENOENT) and reaches the key check
  with the updated message; the `@anthropic-ai/sdk` import resolves from root
  `node_modules`.
- **`repoRoot` fix proven** by running the relocated `node
  tools/build/build-chat-prompt.mjs` directly: byte-identical payload.
- **`poc/` classification:** zero live code or build config still references
  `poc/`. The only remaining hits are the two intentional "formerly `poc/chat/`"
  provenance notes (README, chat/README) and dated docs records (see flags).
- **House rules:** authored files are em-dash and en-dash clean; the four commits
  carry no co-author trailer and are Brian-authored.

## Judgment calls

- **Flat `chat/` move instead of the proposal's `chat/eval/` + `chat/dev-server/`
  subdir reshape.** The nested layout contradicts the proposal's own stated
  safety property ("relative reads move intact because the files move together"),
  which only holds for a flat move. The harness is tightly same-dir coupled:
  `server.mjs` reads `system-prompt.md`/`facts.md` from its own dir, `eval.mjs`
  imports `./server.mjs`, `make-review.mjs` reads `./transcript.md`. A flat move
  keeps every read intact with zero harness edits and zero build risk. Alternative
  not taken: the `eval/` reshape, which is available as a follow-up but needs
  relative-path edits in `server.mjs` and `eval.mjs` first.
- **Dev bridge kept and moved (option B), not retired (option A, #158).** Open
  question 2; conservative default applied per directive, and the directive listed
  "POC server" as `chat/` content. `chat/server.mjs` + `chat/index.html` stay.
  Option A (delete the server, repoint `terminal.ts`'s localhost bridge at
  `wrangler pages dev`, add a root `.dev.vars`) is a `terminal.ts` code change,
  deferred as its own human-gated step.
- **`assets/` moved intact, not pruned.** Open question 4; kept everything
  (recommended archive option, conservative). Duplicates, unused alternates, and
  the licensed raw Circular fonts are flagged in the archive README for the
  human-reviewed prune, not deleted.
- **Refreshed only the references my own moves made stale** (README repo-map rows,
  `sources.ts` provenance comment, `functions/api/chat.ts` + `terminal.ts`
  comments, `chat/*` dev strings). Did not touch historical DECISIONS / COMMS-LOG
  / handoffs, nor the STATUS/ENGINEERING prose bodies (Phase B owns those).

## Loose ends and flags

1. **MERGE STEP (manual, on `main`): move the real `.env`.** `git mv` moves only
   tracked files. The chat POC's live key lives in the gitignored, untracked
   `poc/chat/.env` on the main checkout (it does not exist in this worktree, so it
   was untouched here). After merging, on the main checkout run `mv poc/chat/.env
   chat/.env` then `rmdir poc/chat poc`. `chat/.env` is already covered by the
   `.gitignore:18` bare `.env` rule (verified), so it will NOT become tracked.
   Confirm with `git status --ignored` after the move. Do not `git add` it.
2. **Keyed eval not run in-sandbox** (no `ANTHROPIC_API_KEY` available). The
   byte-identical bundle proves the shipped prompt is unchanged, and the harness
   reads resolve. To confirm behavior parity if wanted: `cd chat &&
   ANTHROPIC_API_KEY=sk-ant-... npm run eval` (expects the current 36/38).
3. **Deferred to Phase B (content rewrites, out of "moves + index + stubs"
   scope):** proposal step 5 (ENGINEERING sections 1+5 rewrite + new
   `docs/engineering/scene.md`) and step 6 (STATUS slim + `docs/archive/
   STATUS-history.md` + single-sourcing the model policy). Not started.
4. **Stale `poc/` path references left inside doc BODIES for the Phase B doc
   rewrite:** `docs/STATUS.md` (the artifact-inventory `node poc/chat/
   make-review.mjs` command and the `poc/chat/*.md` mention) and `docs/
   ENGINEERING.md` build references. These are the proposal's D11/D1 items. They
   are stale but not load-bearing (no build or site path depends on them). All
   other doc `poc/` hits are dated historical records and are correctly left.
5. **`CLAUDE.md` reading-path update (D9) not done.** `docs/README.md` exists as
   the index, but wiring it into CLAUDE.md's "Read these first" list is a change
   to the working agreement, outside this build's scope and left for Brian.
6. **`chat/package.json` name is still `brohde-chat-poc`.** It is an npm package
   identity, not a path, so it was left to avoid a lockfile-name mismatch. Optional
   follow-up: rename to `brohde-chat` and regenerate the lockfile.
7. **Skipped entirely: step 8 (R1 sensitivity prune) and step 7 option A.** R1 is
   human-gated by directive. The chat-security findings closure (open question 8)
   rides R1 / Phase B, untouched.

## Open-question dispositions (proposal section "Open questions for Brian")

| # | Question | Disposition |
| --- | --- | --- |
| 1 | `chat/` vs `tools/chat/` vs `src/prompt/` | DECIDED: top-level `chat/` (per directive). |
| 2 | Dev bridge retire (A) vs relocate (B) | Conservative B applied: kept + moved. A flagged. |
| 3 | Licensed Circular raw fonts | Moved intact, flagged in archive README. Open for Brian. |
| 4 | `assets/` archive vs hard prune | Archived (recommended), nothing pruned. Flagged. |
| 5 | Consolidate `scripts/` into `tools/` vs split | Consolidated per the proposal's pick (directive). |
| 6 | `PLAN.md` keep at root vs move | Left at root (proposal's low-churn recommendation). |
| 7 | R1 prune scope | Skipped (human-gated). |
| 8 | Close vs annotate chat-security findings | Untouched (rides R1 / Phase B). |
