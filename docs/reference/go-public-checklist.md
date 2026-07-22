# Go-public checklist

The go/no-go for flipping brohde.com from a private repo to a single public repo. There is no private/public split: the working repo is the public repo. A fresh git history is cut before the flip, so the first public commit is a single curated snapshot of the current tree.

Brian flips the repo. Nothing here executes without his word at the moment of execution, and step B is destructive to remote history.

Work top to bottom. Each item is a gate, not a suggestion.

---

## A. Before the cut

- [ ] **Sensitivity prune merged.** The rulings on `docs/reference/prune-list.md` (6 must-remove, 12 judgment calls) are applied and merged to main. The prune agent owns that work; this checklist only depends on it being done.
- [ ] **Verification greps green.** After the prune, re-run the sweep patterns and confirm the must-remove items are gone from the tree:
  - `git grep -n '847-630-6829'` returns nothing (the real phone number in the resume PDF; the PDF is binary, so confirm the file was regenerated or dropped, not just grepped).
  - `git grep -nE '76\.21\.34\.198|208\.113\.245\.188|hosted-email-verify=zzw7fdhu'` returns nothing (the DNS runbook infra identifiers).
  - `git grep -ni 'Dragan|Filipovic'` and `git grep -n 'Anthony Thomas Galante'` return only what Brian chose to keep after the consent rulings.
  - `git grep -n '/Users/brian'` is reduced to whatever Brian accepted (the J7 local-path tidy-up).
- [ ] **No live key on disk gets force-added.** Confirm `git check-ignore chat/.env` still reports it ignored, and `git ls-files chat/.env` is empty. The real Anthropic key lives only there and must never enter the tree.
- [ ] **Chat keyed eval (optional).** If Brian supplies the Anthropic key, re-run the chat eval once (`chat/` harness) to confirm the frozen #61 behavior still passes after any prompt/facts apostrophe sweep. This is optional and does not block the flip on its own.
- [ ] **Phoneless resume swapped in (if supplied).** If Brian regenerates `docs/reference/Brian-Rohde-Resume-2026.pdf` without the phone number (or decides to drop the PDF), swap the new file in before the cut. If he has not, the prune ruling on that PDF must be resolved first (it is a must-remove item).

## B. The fresh-history cut

The lead runs this, from a clean working tree on `main`, only when Brian gives the word. It replaces all remote history with a single initial commit.

> This is destructive to remote history. It cannot be undone on the remote once forced. The old history survives only in existing local clones (including Brian’s), and only until those are deleted or garbage-collected. Anyone who already cloned or forked keeps the old history. That is acceptable here because the git-history secret scan (S1) passed: no secret values were ever committed. The cut is for a clean public first impression, not for secret removal.

```sh
# 0. Stand on a clean main with everything intended for the public snapshot merged.
git switch main
git status            # must be clean; nothing uncommitted, nothing untracked that should ship
git pull              # make sure local main matches origin before you replace it

# 1. Create an orphan branch: same working tree, zero history.
git checkout --orphan public-main

# 2. Stage the entire current tree and make ONE curated initial commit.
git add -A
git status            # eyeball the staged list: no chat/.env, no dist/, no stray secrets
git commit -m "brohde.com: initial public commit"

# 3. Replace main with the orphan locally.
git branch -D main
git branch -m public-main main

# 4. Force-push, replacing origin's main history with the single commit.
git push --force origin main
```

After the push, `git log --oneline` on main shows exactly one commit. If anything looks wrong before step 4, you can still abandon: `git switch main` does not exist yet at that point, so recover with `git switch -` back to the prior branch and delete `public-main`.

## C. GitHub settings at flip time

Brian, in the GitHub UI, at the moment of going public:

- [ ] **Make the repo public.** Settings, General, Danger Zone, Change visibility.
- [ ] **Enable secret scanning + push protection.** Settings, Code security. Push protection blocks a future accidental secret at push time, the backstop the pre-commit hook provides locally.
- [ ] **Branch protection on `main`.** Add a rule that forbids force pushes and (optionally) requires a PR to merge. This is set AFTER the step B force-push, so it does not block the cut itself.
- [ ] **Disable wiki and issues if unwanted.** Settings, General, Features. Turn off anything not being used, so the public repo has no empty or unmonitored surfaces.

## D. After the flip

- [ ] **Cloudflare Pages still deploys.** Confirm the Pages project is still wired to the repo and a build succeeds from the new history (the force-push changes commit SHAs, so verify the connection did not break and a fresh deploy is green). Check the live site loads and the chat responds.
- [ ] **Enable the gitleaks hook.** In the working clone, one command:
  ```sh
  git config core.hooksPath tools/git-hooks
  ```
  Optionally install gitleaks itself (`brew install gitleaks`) so the hook actually scans rather than warning-and-skipping.
- [ ] **License decision (still open, flagged).** No `LICENSE` file exists and none was added. Brian has not chosen a license, so the README says all rights reserved. This is Brian’s call. Three options, with tradeoffs:
  - **Option 1: leave it as all-rights-reserved.** No license file. The code is source-visible for reading only, no reuse permitted. Simplest, most protective, but discourages the "learn from it" story the public repo is partly for.
  - **Option 2: a single permissive license for everything (e.g. MIT).** Maximizes reuse and goodwill, but it would also license the article prose and the studio docs for reuse, which may not be intended for the written content.
  - **Option 3 (recommended to consider): a split posture.** A permissive code license (MIT or Apache-2.0) for the source, and all-rights-reserved (or a Creative Commons `BY-NC-ND`) for the articles and written content, stated in the README and/or a `LICENSE` plus a `CONTENT-LICENSE` note. This matches the reality that the code is meant to be learned from while the writing is Brian’s editorial work. More to explain, but it is the honest fit. Present this as the recommendation, not the default; Brian picks.
- [ ] **CLAUDE.md reading-path edit (D9, Brian-gated).** The working agreement should acknowledge that the docs are now public by construction. Do not edit `CLAUDE.md` as part of this checklist. Draft line for Brian to approve and add himself, under "Non-negotiable process rules":
  > **Public by construction**: `docs/` is part of the public repo. Write `COMMS-LOG.md`, `DECISIONS.md`, and `STATUS.md` public-first: accurate and candid, but with no secret values, no unconsented client identities, and no personal contact details that the site itself withholds.

## E. Known public-by-design

These are not leaks; they are accepted consequences of publishing the studio process. Listed so no one is surprised after the flip:

- **Unpublished article draft texts are readable.** `src/content/articles/` holds drafts gated by a `published` flag that keeps them off the live site, but their Markdown is plain text in the public repo. Brian accepted this. A reader can read a not-yet-published article by browsing the repo.
- **The chat system prompt and facts pack become public.** `chat/system-prompt.md` and `chat/facts.md` ship. Anyone can read exactly what the assistant knows and how it is told to behave, including which attributes it deliberately deflects. That transparency is intentional.
- **The studio process files ship.** `CLAUDE.md`, `docs/DECISIONS.md`, `docs/COMMS-LOG.md`, `docs/STATUS.md`, `docs/TEAM.md`, `docs/GATE.md`, the `docs/reference/` handoffs, and the `.claude/agents/` definitions are all public. Showing how the site was made is a feature of this repo, not an accident.
