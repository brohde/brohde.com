# Documentation audit, round 1 (onboarding efficiency)

_Read-only audit, 2026-07-17. Auditor: fresh general-purpose agent (Opus), cold start. Scope: CLAUDE.md, README.md, PLAN.md, docs/ (STATUS, DECISIONS, COMMS-LOG, TEAM, ENGINEERING, CONTENT, VOICE, reference/*, design handoff notes), and .claude/agents/* cross-checked against TEAM.md. Worktrees and the in-flight editorial-review file were excluded per brief. Findings go to Brian before any fix lands; this audit changed nothing but this file._

## (a) Verdict

**Partially.** A cold agent can onboard well for CONTENT and DECISION work, and the decision-logging discipline is genuinely strong. It cannot onboard reliably for ENGINEERING work, which is the site's active workstream.

**Single biggest obstacle:** `docs/ENGINEERING.md`, the doc that README and ENGINEERING itself both name as the build reference, is materially stale in its two largest sections. It was last substantively edited at `459410f` (2026-07-15 16:40); 84 commits have landed since. It describes a pre-C-build, pre-scene, pre-production-chat site, and in section 5 it explicitly asserts that the production chat backend and the Cloudflare Pages project "do not exist yet" when both are live in production. An engineer who trusts it builds against a site that no longer exists. STATUS.md line 25 still advertises this file as "verified against source," which compounds the trap.

A second, structural obstacle sits underneath: the truth about several things (model policy, the component inventory, house style rules) is copied across many files instead of single-sourced, so it drifts on every change. This audit watched it happen live: between my first and second reads the repo moved from decision #117 to #130, flipping `design-director` fable to opus across DECISIONS.md, STATUS.md, and the agent file. The brief that dispatched me ("design-director/frontend-engineer are fable") was itself out of date by the time I finished.

## (b) Findings, ranked by onboarding impact

### 1. ENGINEERING.md architecture + deploy sections are materially stale (highest impact)

This is the designated build reference (README line 23; ENGINEERING section 7 step 4), so its errors propagate to every engineering cold start.

- **Section 1, Components (lines 27-36):** lists `TerminalHeader.astro` and `Topbar.astro`. Neither exists. `TerminalHeader` was renamed `EditorialHeader.astro` in the C1 build (`26873bb`, #67); `Topbar` was deleted in C4 (`76ac001`, #87, "Topbar deleted"). The section omits six components that do exist: `EditorialHeader`, `Scene`, `Slab`, `SiteFooter`, `ThemeToggle`, `TideBand`.
- **Section 1, Pages table (line 15):** calls `/chat` a "static stub." The deployed `/chat` UI runs against the production `/api/chat` (#85, #87).
- **Section 5, Deploy (lines 146, 152):** states "no Cloudflare Pages project exists yet against this repo, no `wrangler.toml`, no Pages Functions," and "None of that server-side infrastructure is wired into the production site yet ... verified: no `functions/` directory, no Turnstile reference, no rate-limit code." All false. `functions/api/chat.ts` and `wrangler.toml` were added at `2a979c7`, eighteen minutes after ENGINEERING's last edit; the site is live at brohde-com.pages.dev; the chat backend, Turnstile skip-path, and KV rate limiting all exist (#81, #83).
- **Section 5 also predates the scene entirely** and the production chat go-live sequence (#81).

**Fix:** rewrite section 1's component/page inventory from the current tree and section 5's deploy/chat state (Pages project live, `wrangler.toml` + `functions/` present, remaining gate is the #49 pre-public audit and the ANTHROPIC_API_KEY go-live step, not "build it from scratch"). Add a dated "current as of `<commit>`" stamp at the top. Add a one-line rule: any component add, rename, or delete updates section 1 in the same change. Drop STATUS line 25's "verified against source" claim until it is true again.

### 2. No production scene engineering doc (the "fix a scene bug" cold start fails)

The scene is live code: `src/scripts/scene/{index.ts,sources.ts,live.css}`, `src/components/Scene.astro`, `src/components/TideBand.astro`, `src/styles/scene.css`. No prose doc describes the shipped module. ENGINEERING.md never mentions it (predates B1). README line 36 gives one line. `docs/design/lab/aurora-handoff.md` documents the frozen design lab (`aurora-terminal.html`, the `glyph4` IIFE, `setTheme4`), which is a different structure from the ported module and is explicitly frozen (#106). The behavior spec is scattered across #106/#114/#120/#122/#124. A scene-bug agent must reverse-engineer the module from code while cross-referencing a design handoff for a superseded artifact.

**Fix:** add an ENGINEERING section "The scene module" (file map, facade wiring per #70, placement parameters, the measured-gutter fixed-mark math from #120, the perf budget) or a standalone `docs/reference/scene.md`. Add a banner to `aurora-handoff.md`: "lab origin; production module documented at `<link>`."

### 3. The handoffs convention (#127) has no directory, no template, no discoverability

Decision #127 (2026-07-17) makes it mandatory that every agent write a handoff to `docs/reference/handoffs/` on completion. That directory does not exist (`ls docs/reference/handoffs` fails). No template, no README, no example. It is referenced only in STATUS, DECISIONS, and COMMS-LOG; it is absent from CLAUDE.md, README, ENGINEERING, TEAM, and the four agent definitions. An agent told "write a handoff to `docs/reference/handoffs/`" has no shape to follow and a missing target. This matters immediately: the in-flight B2 Phase 1 handoff is the primary input for a future Phase 2 agent.

**Fix:** create `docs/reference/handoffs/` now, with a `README.md` and a `HANDOFF-TEMPLATE.md` (scope delivered, files touched, judgment calls, loose ends, verification steps, ports used). Reference it in CLAUDE.md's process rules and in each agent definition's "report back" line.

### 4. No top-level docs index or reading order; CLAUDE.md's path omits binding docs

CLAUDE.md "Read these first, every session" lists only STATUS, DECISIONS, COMMS-LOG (lines 9-11). It omits VOICE.md (binding for every word a visitor reads), ENGINEERING.md, TEAM.md, and CONTENT.md. A new writer who follows CLAUDE.md literally never opens VOICE.md. A better six-step order exists, but it is buried at ENGINEERING section 7, which you only reach if you already knew to open ENGINEERING. There is no `docs/README.md` index.

**Fix:** add a task-keyed reading map to CLAUDE.md (or a short `docs/README.md`): every doc, one line on what it is, and when to read it ("writing copy: VOICE + CONTENT; engineering: ENGINEERING + the scene doc; any session: STATUS then DECISIONS"). Promote ENGINEERING section 7's ordering up to that index.

### 5. Model policy is duplicated across six-plus surfaces and drifts on every change

The policy lives in CLAUDE.md, TEAM.md (table plus prose), a dozen DECISIONS rows (#14/#46/#50/#71/#72/#96/#117/#130), STATUS.md, and four agent frontmatters. Every change is an N-file edit, and they fall out of sync:

- TEAM.md prose (lines 16-18) still reads "Model policy (decision #14, amended by #46, re-amended by #50)" and describes the #50 split (Fable for core product engineering). The current policy is #130 (Opus or lower by default; Fable a frontend-only ceiling). The prose is roughly six amendments behind and describes a superseded split. Its table happens to be correct again post-#130 by coincidence, not by maintenance.
- Live proof of the fragility: during this audit the repo moved #117 to #130, editing DECISIONS.md, STATUS.md, and `design-director.md` in sequence. Between my reads they briefly disagreed (COMMS-LOG named #130 before DECISIONS and the agent file caught up).

**Fix:** make each agent's `.md` frontmatter the single source of truth for that agent's model. TEAM.md keeps the table (or drops it and points at the agent files) plus one current-policy line and a pointer to the latest decision number. Delete the stale prose. STATUS states "current model policy = #NNN," not a restatement. DECISIONS stays the append-only history.

### 6. STATUS.md carries too many jobs and too much superseded history

At 154 lines STATUS spans: an artifact inventory, two separate agent boards (line 29 "this session" and line 54 "2026-07-16") that overlap, a "READ THIS FIRST" block, a direction recap that restates decisions #106-#112, a workstreams plan, an explicitly labeled "Previous session notes ... historical, superseded" block (lines 68-106, about forty lines), a "done this stretch" log, next actions, a v2 backlog, and a long open-questions dump. A cold agent hunting the resume point must scroll past forty lines the file itself marks as superseded, and reconcile two agent boards.

**Fix:** scope STATUS to current state, in-flight, next actions, and open questions. Move rolled-off session notes to `docs/archive/STATUS-history.md` (git mv preserves history). Collapse the two agent boards into one. Replace the direction recap with a pointer to the DECISIONS rows rather than a second copy.

### 7. Visitor-copy house rules are scattered, and VOICE.md now contradicts #115

The binding rules a copywriter needs are spread across DECISIONS, STATUS, and ENGINEERING instead of collected in VOICE.md:

- The "not a terminal, say chat surface / slab / the chat / the prompt" rule (#116, #58) is not in VOICE.md at all; it lives only in DECISIONS, STATUS, and ENGINEERING section 3.
- VOICE.md line 43 lists "the wordmark" among copy that uses sentence case, but #115 made the wordmark lowercase "brian rohde," an explicit exception. A copywriter reading VOICE.md alone would capitalize it wrong.

**Fix:** add a single "visitor-copy checklist" to VOICE.md that absorbs the dash ban (#18, already present), the chat-surface naming rule (#116/#58), sentence case (#76, present), the wordmark exception (#115), and the lowercase-token class (present). Correct line 43 to carve out the wordmark.

### 8. Build command misstated in two docs (quick)

`package.json` build is `node scripts/build-chat-prompt.mjs && astro check && astro build`. README line 16 and ENGINEERING section 2 (lines 76, 83) both state `astro check && astro build`, dropping the codegen prebuild. README line 43 documents the codegen separately, so README even contradicts itself. **Fix:** correct both lines to include the prebuild step.

### 9. STATUS says "Astro 5," package.json says Astro 7 (quick)

STATUS line 25 reads "Astro 5 + Tailwind v4." `package.json` pins `"astro": "^7.0.9"`. **Fix:** update STATUS to Astro 7. (The gold-coast draft's "Astro 5" is about the client's site and is out of scope.)

### 10. prior-project-conventions.md status column is uniformly stale-optimistic (quick)

Rows E1-E12 are marked "scaffold" (pending) and D4 "adopt in Phase 3," though the scaffold shipped long ago and `/styleguide` exists. It is a historical brief, so impact is low, but a cold agent could read scaffolding as unfinished. **Fix:** flip shipped rows to done, or add a one-line header note: "scaffold complete; statuses below are the original research brief, kept for provenance."

### 11. COMMS-LOG ordering slip and CONTENT numbering bug (quick, minor)

- COMMS-LOG's final entry (a chat-feasibility summary describing chat as "exploration, awaiting Brian's greenlight," a day-one state) sits after batch 66 (2026-07-17), violating the file's "newest at the bottom" rule. Move it to its chronological place or date-stamp it as a backfill.
- CONTENT.md has two rows numbered 9 (the LLM-chat-interface article at line 17 and the Hawaii travel piece at line 24). Renumber.

## What is genuinely good (kept brief)

- **DECISIONS.md is the backbone and it works.** Numbered, dated, rationale per row, and supersession marked inline where it happens (#69 SUPERSEDED, #107's mobile clause, the #117 to #130 chain). A cold agent can trust it and grep it.
- **VOICE.md is tight and binding**, and the dash ban and age-math ban are stated with the precision they need.
- **ENGINEERING sections 2 and 4 are high value and accurate**: the content-layer staleness gotcha (rm -rf .astro) and the drafts-to-src content workflow are exactly the afternoon-savers onboarding docs should carry.
- **The article-writing cold start basically works** once the agent reaches VOICE + CONTENT; the only gap there is the reading-path omission in finding 4.
- **The localhost dev / POC-on-8787 bridge is adequately documented** (ENGINEERING sections 3 and 5, STATUS line 27), contrary to the brief's worry; it is split across two files but not missing.

## (c) Proposed target structure (history-preserving)

Nothing is deleted; stale prose is rewritten in place (git holds the old text), and historical material moves rather than vanishes.

- **CLAUDE.md**: gains the task-keyed docs index and reading order (finding 4). Process rules gain the handoffs convention (finding 3).
- **docs/STATUS.md**: slimmed to current state, in-flight, next, open questions (finding 6).
- **docs/archive/STATUS-history.md** (new): rolled-off session notes, append-only; `git mv` the historical block so blame survives.
- **docs/DECISIONS.md**: unchanged mechanics. Optional small win: a "current pointers" header (model policy = #130, house style = VOICE, deploy state = ENGINEERING section 5) so readers do not reconstruct supersession chains by hand.
- **docs/ENGINEERING.md**: sections 1 and 5 refreshed against the tree; new scene subsection; "current as of `<commit>`" stamp; the update-in-same-change rule (findings 1, 2).
- **docs/reference/handoffs/** (new): README + template; first real handoffs land here (finding 3).
- **docs/VOICE.md**: visitor-copy checklist absorbing the scattered rules; line 43 wordmark fix (finding 7).
- **docs/TEAM.md**: table plus one current-policy line plus a pointer; agent `.md` frontmatter is the model source of truth; stale prose removed (finding 5).
- **docs/reference/prior-project-conventions.md** and **aurora-handoff.md**: kept as dated historical briefs with a one-line "superseded by / statuses historical" banner rather than edited row by row.

Migration order: create handoffs/ and the docs index first (cheap, unblock the live workflow), refresh ENGINEERING second (highest value), then the STATUS split and archive, then the single-sourcing passes.

## (d) Quick wins vs structural changes

**Quick wins (localized edits, no reorg, safe to do now):**
- ENGINEERING section 1 component/page inventory and section 5 chat/deploy state (finding 1). Big doc, but the false claims are localized to two sections; this is the single highest-value quick win.
- Create `docs/reference/handoffs/` with README + template (finding 3).
- Fix the build command in README line 16 and ENGINEERING section 2 (finding 8).
- STATUS "Astro 5" to "Astro 7" (finding 9).
- Add #116/#58 naming and the #115 wordmark exception to VOICE.md; fix line 43 (finding 7).
- Renumber CONTENT item 9; move the misplaced COMMS-LOG entry (finding 11).
- Add a "statuses historical" banner to prior-project-conventions.md (finding 10).
- Fix TEAM.md's model-policy prose to point at #130 (finding 5, the prose half).

**Structural changes (need a deliberate pass and Brian's sign-off):**
- The docs index and reading order in CLAUDE.md (finding 4).
- STATUS split plus `docs/archive/` (finding 6).
- The production scene engineering doc (finding 2).
- Single-sourcing model policy to the agent files, with TEAM/STATUS as pointers (finding 5, the structural half).
- The "inventory and deploy state update in the same change" rule for ENGINEERING, so section 1 and section 5 cannot rot silently again.

_One meta-note for whoever acts on this: the repo is a live target. It changed under this audit (the #117 to #130 model flip). Prefer fixes that reduce the number of places a fact is written down over fixes that re-copy the current value into more places._
