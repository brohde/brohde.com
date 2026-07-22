# Handoff: Phase B docs hygiene + restructure (track 2)

_Opus docs engineer, 2026-07-21. Publish-readiness Phase B. Fence: `docs/**` except `ENGINEERING.md`, `reference/scene.md`, `GATE.md` (a parallel agent owns the first two; GATE is process-live) plus root `README.md`. `CLAUDE.md` untouched (Brian-gated). House rules held: zero em dashes in anything written here, typographic apostrophes, no co-author trailer, history preserved (only location/banners/numbering changed on dated entries)._

## Per-item summary

**D2 (STATUS accuracy)** `docs/STATUS.md` "Where we are" line: "Astro 5" corrected to "Astro 7" (package pins `astro ^7.0.9`); the build command corrected to the real `node tools/build/build-chat-prompt.mjs && astro check && astro build`; the ENGINEERING.md advertisement changed from "verified against source" to "rewrite in progress, Phase B" (per the parallel rewrite). The other "verified against source" mention lives inside the historical docs-auditor board entry, which moved to the archive as-is (it is that agent's finding, correctly preserved as history).

**D3 (README build + repo map)** `README.md` local-dev `npm run build` comment now shows the exact package.json script (codegen prebuild included). Repo map updated for today's reorg: the `functions/api/chat.ts` row became a `functions/api/` row covering `chat.ts` + `contact.ts` + `_shared.ts`; a new `docs/archive/` row was added (status-history + source-assets); the `docs/reference/` row now notes `handoffs/`. `chat/` and `tools/build/` were already present and accurate.

**D4 (VOICE wordmark casing)** `docs/VOICE.md` sentence-case list no longer includes "the wordmark". Added an explicit line: the wordmark is a deliberate lowercase exception (decision #115), "brian rohde", always lowercase. Resolves the contradiction with #115.

**D5 (CONTENT duplicate row)** `docs/CONTENT.md` the off-topic Hawaii travel piece was a second row numbered 9; renumbered to 11 (the work table ends at 10, so 11 continues cleanly and no longer collides).

**D6 (COMMS-LOG chronology)** `docs/COMMS-LOG.md` the "Claude (chat feasibility, per Brian's ask)" entry was sitting after batch 137 (2026-07-19) at the file's tail. Moved verbatim (content untouched) into the 2026-07-15 section, immediately before the "Brian (direction pick)" entry whose #23 "greenlights the feasibility brief's architecture" depends on the brief already existing. Now a single occurrence, in date order.

**D7 (prior-project-conventions banner)** `docs/reference/prior-project-conventions.md` gained a top blockquote: statuses are historical (pre-scaffold), the "scaffold / adopt" markers are day-one intent captured before the scaffold + `/styleguide` shipped, live truth is the codebase.

**D10 (single-source model policy)** `docs/TEAM.md` "Model policy" section rewritten to the canonical current policy: decision #130 (supersedes #14/#46/#50/#96/#117) plus the persistent-memory refinements: subagents Opus-or-lower by default with degrade-per-spawn, Fable a frontend-only ceiling for substantial builds, browser validation always on Sonnet/Opus (#82), Opus context wrap ~450K (cap 500K) / others ~150-180K (#123), fan-out to fresh agents each writing a handoff (#127), model fixed at spawn. The section now declares itself the single source of truth and tells other docs to reference it.

  _Drifted copies swept / accounted for (each listed):_
  - `docs/TEAM.md` prose (was citing the superseded #50 split) - **rewritten** (the canonical home).
  - `docs/STATUS.md` #130 block (old line 42) and #96 block (old line 116) - these are inside dated agent-board / session-note entries and **moved verbatim to `docs/archive/status-history.md`** under D11; history, not rewritten.
  - `docs/reference/prior-project-conventions.md` row D2 ("subagent model policy in team docs ... #14") - left as-is; the D7 historical banner now frames the whole table as a pre-scaffold snapshot, so the stale decision number reads correctly as day-one intent.
  - Out of this track's fence (flagged, not touched): `.claude/agents/*` frontmatter (the debt-backlog's "single-source to agent frontmatter" target), `CLAUDE.md` (Brian-gated), and the user memory file. No other living restatement exists inside `docs/**`.

**D11 (STATUS slim + archive)** Created `docs/archive/status-history.md` and moved four clearly-historical sections into it verbatim, with a provenance banner: "Agent board (this session)" (the C build), "READ THIS FIRST (2026-07-17...)", "Agent board (2026-07-16)", and "Previous session notes (2026-07-15...)". `docs/STATUS.md` dropped from 195 to 89 lines and now reads: the lead's live resume-point header paragraphs (verbatim, untouched), artifact inventory, Where we are (with the D2 fixes), Next actions, v2 / backlog, Open questions for Brian. This was a move, not a rewrite; the D2 line edits are the only content changes to kept text.

**D13 (aurora-handoff banner)** `docs/design/lab/aurora-handoff.md` gained a top blockquote: lab origin, frozen reference (#106), superseded by the production scene module (`src/scripts/scene/*`, `Scene.astro`, `scene.css`), do not build against the lab's structure, read `docs/reference/scene.md` for scene work.

## Verification performed

- Every moved STATUS fact is greppable in `docs/archive/status-history.md` and absent from `docs/STATUS.md` (spot-checked distinctive strings: "THE C BUILD IS MERGED", "Boot-kill + inline-icons engineer", "occluded live body text", the 2026-07-15 header, "Demo 04 (aurora + image tide").
- README `npm run build` comment matches `package.json` `scripts.build` exactly.
- COMMS-LOG feasibility entry: exactly one occurrence, now in the 2026-07-15 section before the direction pick.
- Zero em/en dashes in any text this track authored (one slipped into a TEAM heading and was fixed; all remaining dash hits in touched files are pre-existing content this track did not write).
- Cold-reader pass of the slimmed STATUS: header to where-we-are to next-actions to backlog to open-questions flows without the historical boards in the way.

## Observations passed up (not in this track's remit)

- **`poc/` to `chat/` rename drift**: `poc/chat/*` paths still appear in kept STATUS text ("Where we are" chat-POC lines) and the artifact-inventory rows (`node poc/chat/make-review.mjs`, `../../poc/chat/eval-review.html`), though the directory is now `chat/`. Left untouched (out of the D-item list, and the in-flight repo-reorg proposal agent owns the poc question). Worth a sweep once the reorg lands.
- **STATUS "Next actions" is stale relative to the live header** (it lists the #149-#157 wave as "IN FLIGHT" though the header shows it shipped). Preserved verbatim per the move-not-rewrite rule; the live resume-point header at the top carries current truth. A future STATUS pass could prune it, but that is a rewrite, not this hygiene move.
- **D8/D9/D12** (scene doc, docs index / CLAUDE.md reading path, handoffs README+template) were not in this track's item list. D8 is the parallel agent's `reference/scene.md`; D9 touches Brian-gated CLAUDE.md; D12's `handoffs/README.md` + `HANDOFF-TEMPLATE.md` already exist in the tree.
