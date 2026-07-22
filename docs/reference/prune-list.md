# Sensitivity prune list (Phase C, #202)

_Compiled 2026-07-21 by the publish-program researcher. READ-ONLY sweep. **Nothing in this list has been changed.** The repo goes public WITH docs (Brian's call: the AI-studio process is part of the story), but the material below should be ruled on first. Brian decides per row: remove line / redact detail / rewrite / keep._

Scope swept: `docs/**` (COMMS-LOG, DECISIONS, STATUS, CONTENT, drafts, reference incl. every handoff, design/lab, archive), `chat/**` (prompt, facts, evals, server), `.claude/agents/**` + `.claude/settings.json`. Method: ripgrep pattern battery (email, phone, IP, DNS/registrar/mail, API-key value patterns, budget/credit, client names, personal-life keywords) plus full reads of the dense files. Git-history secret scan (S1) run separately, results at the bottom.

---

## Summary

- **MUST-remove / MUST-hold: 6 items.** A real personal phone number in the resume PDF; two infrastructure identifiers (IPs + a mail-verification token) in the DNS runbook; and two consent-pending client identities (Gold Coast / Dragan and ATG / Anthony) that Brian's own notes gate behind sign-off, plus the local-machine client paths that carry a private repo codename.
- **Judgment-call: 12 clusters.** `brian@brohde.com` (the declared judgment call); the DNS/mail runbook as a whole; the resume timeline vs the chat deny-list (a coherence conflict); Fable budget percentages and misc spend figures; the chat security-audit abuse roadmap; a legacy personal photo; client characterizations even with names redacted; the deny-list making the age-guard explicit; Resend/SES infra records; and the untracked live API key on disk (not public, flagged for hygiene).
- **Verified clean (S1):** No secret VALUES are committed anywhere. `git log --all -S 'sk-ant-api03'` is empty; `RESEND_API_KEY=` value scan is empty; the only real key on the machine is `chat/.env`, which is gitignored and has never appeared in history. Account / KV / gateway IDs are non-secret resource handles and are shown truncated in docs anyway.

Counts: personal-contact 2, account-infra 5, client-private 5, budget 3, security 1, other 2.

---

## MUST-REMOVE / MUST-HOLD

### docs/reference/Brian-Rohde-Resume-2026.pdf (binary, tracked)

| Location | Fragment | Category | Proposed disposition |
| --- | --- | --- | --- |
| Header contact line | `847-630-6829` (real personal mobile) | personal-contact | **Remove** the phone number from the PDF (regenerate the PDF without it), or drop the PDF from the public repo entirely. The site already carries NO resume download (#177/#198), so this file has no public-facing role; a public repo reader would still find it at this path. |
| Experience dates | Beyond `Nov. 2013`, Stack Elevate `Jan. 2016`, Twilio `Nov. 2017`, etc. (full career timeline) | personal-contact / other | **Judgment (coherence):** see J3. The chat deny-list actively hides "when his career started"; this PDF hands a public reader the exact start date. Resolve together with the phone decision. |

### docs/reference/brohde-com-dns-cutover.md

| Line | Fragment | Category | Proposed disposition |
| --- | --- | --- | --- |
| 18 | `local 76.21.34.198`; `mysql 208.113.245.188` (vestigial DreamHost A-record IPs) | account-infra | **Redact** the IP values (the sentence can keep "two vestigial DreamHost A rows" without the addresses). |
| 12 | `"hosted-email-verify=zzw7fdhu"` (Migadu domain-verification token) | account-infra | **Redact** the token value. |
| whole file | full mail-record inventory, registrar, nameservers, SOA serial, cutover runbook | account-infra | See J2: recommend removing the runbook or reducing it to a one-line "DNS moved to Cloudflare" note. Ruled here as judgment, but the two rows above are must-redact regardless of that call. |

### Consent-pending client: Gold Coast / Dragan

Brian's own notes (`gold-coast.md` open questions, `editorial-review-r1.md`, `matrix-identities.md` #4) state this piece is **unpublished pending Dragan's consent**, including consent to reveal that he designed the site in ChatGPT. Publishing the docs exposes the full name and the characterization before that gate clears.

| File:line | Fragment | Category | Proposed disposition |
| --- | --- | --- | --- |
| docs/CONTENT.md:11 | `Gold Coast Capital Management (Dragan Mark Filipovic, CFA)` | client-private | **Redact** the personal name (keep "a wealth-management client" / firm-neutral) until consent lands. |
| docs/drafts/gold-coast.md:79 | `Does Dragan Mark Filipovic know this project will be featured publicly` | client-private | **Redact** name; the consent question itself can stay. |
| docs/reference/editorial-review-r1.md:47,132 | `Gold Coast Capital / Dragan`, "HOLD until client consent" | client-private | **Redact** name. |
| docs/reference/handoffs/matrix-identities.md:60; coherence-pass.md:25 | "pending Dragan" | client-private | **Redact** name. |
| docs/STATUS.md:85 | "Gold Coast pending Dragan's consent" | client-private | **Redact** name. |

### Consent-pending client: ATG / Anthony

`#167` and STATUS:85 record ATG sign-off as still open; the draft's own open-question #6 flags the client's hosting spend as unresolved for publication.

| File:line | Fragment | Category | Proposed disposition |
| --- | --- | --- | --- |
| docs/drafts/atg-llm-migration.md:30,54 | `Anthony Thomas Galante is a New York fashion designer`; `anthonythomasgalante.com` | client-private | **Judgment / hold:** the published article had the client domain removed pending consent (#167); the draft still names him fully. Redact to "a fashion-designer client" until consent, or confirm consent covers the docs too. |
| docs/drafts/atg-llm-migration.md:113 | `~$20/month, SiteGround`; quotes the client's private `MY_PLAN.md` ("I believe we pay $20 a month") | client-private | **Redact** the specific host + the quote from the client's private doc; generalize to "a paid host" per the draft's own flag. |
| docs/drafts/atg-llm-migration.md:89 | `/Users/brian/Projects/anthony-thomas-galante/SESSION_LOG.txt` | client-private / other | **Rewrite** to a relative or generic reference (also see J7). |

### Local-machine client paths + private repo codename

| File:line | Fragment | Category | Proposed disposition |
| --- | --- | --- | --- |
| docs/drafts/gold-coast.md:5,54,56 | `/Users/brian/Projects/dragan`; `docs/from_client/` | client-private / other | **Rewrite** paths; "dragan" is the internal repo codename for the Gold Coast client (a second exposure of the person). |
| docs/TEAM.md:33 | "pattern proven in the dragan project" | client-private | **Rewrite** to "a client project" (drops the codename). |

---

## JUDGMENT-CALL

**J1. `brian@brohde.com` throughout (the declared judgment call).** Appears in DECISIONS #57/#175/#183, COMMS 491/549/563, VOICE.md:48, chat-feasibility.md:41, llm-terminal-plan.md:29, contact-phase-b.md, and as live text inside the design/lab prototype HTML (aurora-terminal.html, build-log-v3.html). Category: personal-contact. Note: the site deliberately removed this address from every visitor surface (#183), yet it stays quotable across the docs and the lab prototypes. Disposition: **keep** (Brian's stated call that this is public-facing) OR sweep it from the docs to match the site posture. If keeping, no action; if matching the site, redact to "the contact flow".

**J2. The DNS/mail runbook as a whole (`brohde-com-dns-cutover.md`, plus its echoes in DECISIONS #175/#176 and COMMS 549).** Category: account-infra. It maps Brian's personal registrar (DreamHost), mail provider (Migadu), full record set, nameservers (`alec`/`robin.ns.cloudflare.com`), and cutover procedure. All technically discoverable via `dig`, but compiled here as one operational map with no bearing on the AI-studio story. Disposition: **recommend removing the runbook file** (or cutting it to a one-line "DNS on Cloudflare, mail on Migadu"); at minimum apply the must-redactions above.

**J3. Resume timeline vs the chat deny-list (coherence).** Category: other/personal. The chat's system prompt and eval fixtures guard age / birth year / graduation year / career-start. The resume PDF (public in the repo) states employment dates back to Nov 2013, from which career-start and approximate age are trivially inferred, defeating the guard for anyone who reads the repo. Disposition: **flag for Brian.** Either accept the inconsistency (the deny-list only governs the chat surface) or drop/redate the PDF.

**J4. Fable budget percentages.** Category: budget. `64% used through 2026-07-23` in STATUS.md:9, DECISIONS #187, COMMS 131 (batch 129-131). Named explicitly in the brief as a category. Disposition: **judgment**, low stakes; redact the percentage or keep as color on the studio process.

**J5. Misc spend figures.** Category: budget. `$20 credits added` (DECISIONS #47), `hard $5/month cap` (#159/ENGINEERING §8), per-reply `~$0.002` and eval `totalCost $0.1249` (chat/eval-review.html). Disposition: **keep** likely (all trivial, and the $5 cap is a reasonable-defense detail, not a weakness); listed for completeness.

**J6. Chat security-audit abuse roadmap.** Category: security. `docs/reference/chat-security-audit.md` states plainly that at launch "there is currently no bot check at all: the endpoint is reachable by any non-browser client up to the KV rate limit" (H3), and that the KV limiter "is racy... a concurrent burst bypasses both windows" (M1). Together these are a recipe for burning the $5/month cap or degrading the live chat. The brief allows exact rate-limit tunables (already in public code); this doc goes further and narrates the exploit path. Disposition: **flag.** Keep for the transparency story, or soften the two sentences that read as an attack guide. (Note: the audit reflects the launch posture; confirm whether M1/H3 were since hardened before deciding.)

**J7. Local `/Users/brian/...` paths.** Category: other. 26 hits across `atg-llm-migration.md`, `eight-angle-ml.md`, `gold-coast.md`, `facebook-newsroom.md`, `twilio-signal-pong-draft.md`, `b2-phase1.md`, `legacy-site/README.md`. Exposes the OS username and local project layout. Disposition: **rewrite** to relative paths (cheap tidy-up); the client-repo-name instances are covered under MUST above.

**J8. Legacy personal photo.** `docs/archive/source-assets/images/legacy-site/me.jpg`. Category: other. A portrait of Brian, from his old public homepage. Low sensitivity (was already public), but it is a personal photo shipping in the archive. Disposition: **keep or drop**, Brian's taste call.

**J9. Client characterizations (even with names redacted).** Category: client-private. The Gold Coast draft repeatedly frames the client as "not a designer", "never written CSS", "a non-technical founder" who "designed his site in ChatGPT" (gold-coast.md:22-28, editorial-review-r1.md). Complimentary in intent but personal; the draft itself flags this as consent-sensitive. Also in the Eight Angle draft: `resume-material.md` "deliberately excludes... revenue... no usage/revenue data included by choice" (eight-angle-ml.md:97) reveals a deliberate omission, and the hidden/decoy pose-class list `cobra, side_crow, non_yoga, kurmasana` (line 99) exposes the classifier's anti-gaming decoys. Disposition: **judgment**; soften tone / drop the decoy specifics if desired.

**J10. Deny-list makes the age-guard explicit.** Category: other. `chat/system-prompt.md:9-13` and `chat/facts.md:8` spell out that age / birth year / graduation year are deliberately withheld; the eval fixtures (transcript.md, eval.mjs, eval-http.mjs, eval-review.html, verdicts-2026-07-15.md) include the probe questions ("how old is brian?", "is he married?", "what year was he born?"). Per the brief, "the deflection strategy itself is fine." Disposition: **keep** (it demonstrates the guard working); flagged only so Brian knows a public reader learns exactly which attribute is guarded, which mildly signals sensitivity about age. Pairs with J3.

**J11. Resend / SES mail infra.** Category: account-infra. `send.brohde.com`, DKIM `resend._domainkey.send`, MX `feedback-smtp.us-east-1.amazonses.com`, SPF (COMMS 565; contact-phase-b.md:170; DECISIONS #192/#197). Mostly public DNS, low sensitivity. Disposition: **keep** likely; listed for completeness alongside J2.

**J12. Untracked live API key on disk (hygiene, NOT public).** `chat/.env` line 2 holds a real `sk-ant-api03-...` key. The file is gitignored and has never been committed (verified, S1). It will NOT go public with the repo. Disposition: **no repo action needed**; flagged as a heads-up to rotate/guard the key and to make sure the reorg never force-adds `chat/.env`.

---

## Verified clean (no action)

- **Secret values:** none committed. `git log --all -S 'sk-ant-api03'` returns nothing; every `sk-ant` history hit is a placeholder reference (`ANTHROPIC_API_KEY=sk-ant-...`) in docs/code. `RESEND_API_KEY=` value scan returns nothing. No `re_`-prefixed Resend key value anywhere in tracked content.
- **`chat/.env`:** gitignored, `git ls-files` does not track it, `git log --all -- chat/ poc/chat/.env` shows it never existed in history. Safe.
- **Resource handles:** the KV namespace id is shown truncated (`c3579b8f…`) in DECISIONS #83 / COMMS 263; account id, KV id, and gateway name live only in `wrangler.toml`, are non-secret identifiers (the file's own comment and audit-server.md:57 / chat-security-audit.md:125 confirm), and `ANTHROPIC_GATEWAY_TOKEN` / `TURNSTILE_SECRET` appear only as secret NAMES, never values.
- **`.claude/agents/*` and `.claude/settings.json`:** no personal data, no secrets. (`.claude/settings.local.json` and `.claude/worktrees/` are untracked/gitignored and do not publish.)
- **S1 git-history verification: PASS.** Keys were never committed; only current file contents needed review, and the public repo gets fresh history per #202 regardless.

---

## Git-history spot-check log (S1)

```
git log --all --oneline -S 'sk-ant-api03'   -> (empty)
git log --all --oneline -S 'RESEND_API_KEY=' -> (empty)
git log --all --oneline -- chat/.env poc/chat/.env -> (empty)
git check-ignore chat/.env -> chat/.env   (ignored, not tracked)
```
`-S 'sk-ant'` and `-S 're_'` return commits, but inspection shows only placeholder/text references (no real key material).

---

_Nothing was changed by this pass. The repo remains as-is. This list awaits Brian's ruling; edits happen only after he rules row by row._
