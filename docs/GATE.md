# GATE — the agreed completion state

_The definition of done for the current program. Any session or loop measures against this list and stops when it is green or when every open item is blocked on Brian. Agreed with Brian 2026-07-21; edit only with his word. Reconciled 2026-07-22 at his ask (the final pre-publish sweep); checkmarks reflect shipped reality, open items are the true remainder._

## Program: publish-readiness (the repo goes public)

### A. Code quality (COMPLETE)

- [x] All five audit tracks merged (scripts 4f50b2b, server 342d29d, css 4ad51d0, astro c10ec29, reorg proposal 7b4dfea), build green, astro check 0/0/0; debt Q1/Q2/Q4/A1/A2 closed; security hardening re-verified
- [x] Structural proposals DECIDED (#213) and BUILT: scripts extraction 7cd7698, surfaces 7723677 (Screen wrapper skipped with cause), _shared.ts 5ef9c03 (45/45 byte-identical matrix), repo reorg 61093fb (poc -> chat/, tools/build, assets archived, key file verified ignored; deep terminal split skipped per pick)
- [x] Human smoke test: superseded by Brian's own daily driving of the live site through the 2026-07-22 iteration wave (chat, contact, videos, transitions all exercised and bug-reported in real time)
- [x] npm audit clean (astro XSS + fast-uri advisories patched 2d41b96, 0 vulnerabilities)

### B. Docs accuracy (COMPLETE except D9)

- [x] ENGINEERING.md rewritten against current source (debt D1, merged 222cd9d)
- [x] Docs quick-win cluster closed (D2-D7, D12, D13; merged 898b5a2)
- [x] Scene doc (D8, docs/reference/scene.md), docs index (reorg), model policy single-sourced (D10), STATUS slimmed + archived (D11)
- [x] The CLAUDE.md reading-path line (D9): APPROVED by Brian 2026-07-22 ("D9 - add it"); the public-by-construction rule is in CLAUDE.md

### C. Content

- [x] Publish state SETTLED by #219: articles ship as image-first stubs with captions carrying the story (Brian's standing "We only want the images and minimal text"; full texts return only on his re-order). The gate's original per-article publish flips are superseded.
- [x] The #206 taste flags: overtaken by Brian's own retitle wave (ATG "in 4 hours" title, google "Website" casing, twilio titles all dictated by him 2026-07-22)
- [x] Eight Angle mark rebuilt from his live logomark (vector marks merge 8a297f7; a dedicated master SVG from Brian remains a nice-to-have, not a gate)
- [x] nownow.mp4 + platform-surfaces.mp4: ARCHIVED per Brian 2026-07-22; they stay in the legacy WordPress backup only, no article placement

### D. Chat hygiene

- [x] Eval fixtures relabeled (Q7, rode #198); chat facts/prompt current per the 2026-07-22 audit (#228: all case-study slugs, ATG + SIGNAL facts)
- [ ] chat/ apostrophe + vocabulary sweep (Q3) WITH the keyed eval re-run: one command, spends API credit; note the account holds $18.02 with auto-reload off, so Brian tops up first or accepts the spend

### E. Sensitivity prune + publish mechanics

- [x] Prune list compiled, RULED BY BRIAN (#218 overrides), EXECUTED and merged, verification greps zero-hit; prune-list.md is the audit record; resume PDF deleted outright (2026-07-22)
- [x] Git-history secret scan verified formally (S1 PASS: no secret values ever committed; chat/.env never in history; re-verified ignored + untracked at the final sweep)
- [x] Fresh-history cut PREPARED (exact commands staged in go-public-checklist.md section B); execution is one order away
- [x] Public README (with the pre-dating disclosure, the prompt-artifact reading list, PLAN.md framed as the verbatim kickoff prompt)
- [x] Final repo sweep run (2026-07-22): tracked tree clean of pruned patterns, secret grep clean, deps 0 vulnerabilities, 26 stale worktrees removed, live smoke green (301, og:video, glyph cards, chat navigating new slugs)
- [ ] **THE FLIP**: Brian says the word -> lead runs the fresh-history cut (destructive to remote history) -> Brian flips visibility + GitHub settings (secret scanning, push protection, branch protection AFTER the push) -> lead verifies Pages redeploy + live site -> license DONE (MIT code / all-rights content + media, Brian's "add it" on the recommended split)

## Standing quality bars (every merge, not steps)

Build green; zero em dashes in visible copy and comments; typographic apostrophes in visible copy; no "terminal" in copy; #61 chat contract frozen; commits authored by Brian only; docs (STATUS/DECISIONS/COMMS) current at each milestone.

## Out of scope for this gate (parked, do not pull in)

Awards submission, presence features, cycling starter questions, analytics phase. NOTE: the docs' own em-dash usage (COMMS-LOG, older reference docs) predates the docs becoming public copy; whether the VOICE em-dash ban extends to studio docs is Brian's editorial call, not a gate item.
