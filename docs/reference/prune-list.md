# Sensitivity prune - audit record (Phase C, #202)

_Compiled 2026-07-21 as a read-only sweep; **executed 2026-07-22** per decision #218 (Brian's "Make this repo ready to share") and his row-by-row overrides. This file is now the **audit record**: every row below carries its executed disposition (done / kept / flagged + where), so the public repo shows the prune was principled. The sensitive VALUES this list originally quoted have themselves been scrubbed from it - the audit describes what was removed without re-printing the very strings it pruned._

_Scope executed: `docs/**` only (this agent's fence). `chat/**`, `functions/**`, `src/**`, `public/**`, `tools/**`, and root files were out of scope for this pass; items that live there are flagged, not edited, and called out as such. The compile-time sweep also covered `chat/**` and `.claude/**`; those findings stand as recorded._

Method for the execution pass: for each pruned string, grep the whole `docs/` tree (including `docs/archive/**`) to catch every occurrence; edit the large append-only logs (COMMS-LOG, DECISIONS) surgically, line by line, never reflowing unrelated content; then verify each removed string returns zero hits across `docs/`.

---

## Summary of what was executed

- **DNS runbook gutted.** `brohde-com-dns-cutover.md` reduced to a short factual what/when summary; the full record inventory, the step runbook, the vestigial legacy A-record IPs, the mail-verification token, the assigned nameserver identifiers, the SOA serial, and the DKIM host values were all removed.
- **Gold Coast client personal name redacted repo-wide.** The client's full personal name (and the "CFA" personal styling) were removed everywhere in `docs/`; the consented business identity (the firm name and `goldcoastcapm.com`) was kept, matching the live public article, which never names him personally. The internal repo codename for that engagement (the client's first name, reused as a project/repo slug) was replaced with the neutral business-based slug `gold-coast` (or "a prior client project" in `TEAM.md`).
- **Client local filesystem paths rewritten.** Absolute local paths pointing at the two client project directories (Gold Coast and the ATG migration repo) were rewritten to relative/generic references, dropping the OS username and local layout.
- **Personal email redacted per instance.** Brian's personal email address was redacted to a neutral reference wherever it appeared as a contact fallback, a mail account, or a send/receive endpoint. It was deliberately KEPT in the handful of entries whose subject is the address being taken off every visitor surface (the #183 removal narrative), where naming it is the point. In `VOICE.md` the formatting example was swapped to a generic `name@example.com`.
- **Fable budget usage percentage redacted** wherever it appeared in `docs/` (STATUS, DECISIONS #187, COMMS batch 131). The budget-mode narrative itself (lead thin, docs batched) was kept; only the numeric percentage was removed.
- **Resume PDF: unchanged, phone flagged.** Per Brian, the resume stays as-is (dates and all); the personal mobile number stays in place, flagged for a phoneless export Brian will supply. No edit to the PDF.
- **Security-audit language kept** (abuse roadmap etc.) - transparency is the point (Brian's call).
- **Legacy personal photo kept** (`me.jpg`) - Brian's call.

---

## MUST-REMOVE / MUST-HOLD (executed)

### docs/reference/Brian-Rohde-Resume-2026.pdf (binary, tracked)

| Item | Category | Disposition executed |
| --- | --- | --- |
| A real personal mobile number in the header contact line | personal-contact | **FLAGGED, not changed.** Brian's override: the resume stays as-is; he will supply a phoneless export to swap in. The number was NOT copied into this audit record. |
| Full career timeline / experience dates | personal-contact / other | **KEPT** per Brian ("the resume is fine"; early companies already trimmed). The coherence tension with the chat deny-list (J3) is resolved by #218, which relaxed the chat to answer project-completion dates while keeping the age/career-length guard. |

### docs/reference/brohde-com-dns-cutover.md

| Item | Category | Disposition executed |
| --- | --- | --- |
| Vestigial legacy A-record IP values | account-infra | **DONE** - removed; the file no longer carries the addresses. |
| Mail-provider domain-verification token value | account-infra | **DONE** - removed. |
| Full mail-record inventory, registrar, nameserver identifiers, SOA serial, DKIM host values, step runbook | account-infra | **DONE** - the file was gutted to a factual what/when summary of the cutover; all account-specific values and the operational map were removed. |

### Consent-pending client: Gold Coast (personal name + codename)

The live gold-coast article (published, #218) uses only the firm's business identity and never names the client personally; `docs/` was brought into line with that.

| File | Category | Disposition executed |
| --- | --- | --- |
| docs/CONTENT.md | client-private | **DONE** - personal-name parenthetical dropped; firm name kept. |
| docs/drafts/gold-coast.md | client-private | **DONE** - personal name removed from the consent open-question (the question itself kept); client repo paths genericized. |
| docs/reference/editorial-review-r1.md | client-private | **DONE** - personal name removed from both consent notes; firm reference kept where it read naturally. |
| docs/reference/handoffs/matrix-identities.md; interior-pages.md | client-private | **DONE** - "pending <name>" changed to "pending the client's consent". |
| docs/reference/debt-backlog.md | client-private | **DONE** - personal-name parenthetical dropped from the consent row. |
| docs/STATUS.md | client-private | **DONE** - "pending <name>'s consent" changed to "pending the client's consent". |
| docs/COMMS-LOG.md (multiple entries) | client-private | **DONE** - personal name and possessive forms redacted across the log, surgically. |
| Codename (client first name reused as repo slug) in TEAM.md, prior-project-conventions.md, COMMS-LOG.md | client-private | **DONE** - replaced with `gold-coast` (business-based slug) or "a prior client project". |

### Consent-pending client: ATG (name / domain / host / cost)

| Item | Category | Disposition executed |
| --- | --- | --- |
| Client full name + domain in docs/drafts/atg-llm-migration.md and other docs | client-private | **FLAGGED, not redacted (see note below).** Brian's overrides were explicit about the Gold Coast client only and silent on ATG. Decisively, the **live published article** (`src/content/articles/atg-llm-migration/index.md`, `draft:false`) already names the client, domain, old host, and cost in full - a `src/` surface outside this pass's docs-only fence. Redacting the docs while the deployed article names him would be theater, not protection, and would diverge docs from the live surface. This is a live-surface decision for Brian, not something a docs-only prune can resolve; it is the same exposure `editorial-review-r1.md` already flags. |
| Quote from the client's private planning doc (its filename + a line from it) | client-private | **DONE** - the private-doc quote and filename were generalized to "your own planning notes"; the public host/cost facts (which are on the live article) were left. |
| Client local filesystem paths (source repo, screenshots, session log, Claude projects dir) | client-private / other | **DONE** - all absolute client-project paths rewritten to relative/generic references. |

### Local-machine client paths + codename

| Item | Disposition executed |
| --- | --- |
| Absolute paths at the two client project directories | **DONE** - rewritten (see the two client sections above). |
| "the <codename> project" in TEAM.md | **DONE** - rewritten to "a prior client project". |

---

## JUDGMENT-CALL rows (dispositions)

**J1. Personal email throughout.** **DONE, per-instance.** Redacted to a neutral reference where it functioned as a contact fallback / mail account / send-receive endpoint (DECISIONS #57 and #175, COMMS 491/549/581, chat-feasibility, llm-terminal-plan, contact-phase-b send + verify lines, the two design-lab prototype HTMLs). **KEPT** where the entry's subject is the address being removed from every visitor surface, where naming it is the point (DECISIONS #183 and #192, COMMS 563, contact-phase-b's "drop"/"removed" lines). `VOICE.md` example swapped to a generic address.

**J2. DNS/mail runbook as a whole.** **DONE** - gutted (see MUST section). The DECISIONS/COMMS echoes of the cutover were kept as process narrative per the fence (Brian's override scoped the gut to the runbook file); the personal email within #175 was still redacted under J1.

**J3. Resume timeline vs chat deny-list (coherence).** **RESOLVED by #218** - the chat may now answer project-completion dates; the age/career-length guard stays. Resume kept as-is per Brian.

**J4. Fable budget percentage.** **DONE** - the usage percentage was redacted in STATUS, DECISIONS #187, and COMMS 131; budget-mode narrative kept.

**J5. Misc spend figures (monthly cap, per-reply and eval costs, credits added).** **KEPT** - not in Brian's redaction override (which named the Fable usage percentage specifically); trivial and, for the cap, a reasonable-defense detail. Note: the cap and eval-cost figures live in `chat/**`, outside this pass's fence anyway.

**J6. Chat security-audit abuse roadmap.** **KEPT** per Brian - transparency is the point.

**J7. Local `/Users/brian/...` paths.** **PARTIALLY DONE.** The client-project-directory paths (squarely covered by Brian's override) were rewritten. The remaining absolute paths point at Brian's OWN projects (his flagship, his legacy WordPress site) and at this repo's own worktrees; they expose only the OS username, which is already implied by the repo owner. Those were **FLAGGED, not rewritten** (not client dirs, not covered by an override); Brian can request the cheap tidy-up. Files: eight-angle-ml.md, facebook-newsroom.md, b2-phase1.md, twilio-signal-pong-draft.md, archive/.../legacy-site/README.md.

**J8. Legacy personal photo (`me.jpg`).** **KEPT** per Brian.

**J9. Client characterizations + Eight Angle decoy specifics.** The Gold Coast characterizations ("non-technical founder", "never written CSS") are also in the live public article, so they were **KEPT** in the docs to match. The Eight Angle classifier decoy pose-class list and the deliberate revenue-omission note (Brian's own flagship, not a client) are **FLAGGED, not removed** - not covered by any override; Brian's taste call whether to soften.

**J10. Deny-list makes the age-guard explicit.** **KEPT** (the guard demonstrating itself); these fixtures live in `chat/**` outside this fence regardless. Pairs with J3, now relaxed for project dates by #218.

**J11. Resend / SES mail infra (send subdomain, DKIM, MX, SPF).** **KEPT** - mostly public DNS, low sensitivity; the sending subdomain is part of the shipped contact-flow story.

**J12. Untracked live API key on disk (`chat/.env`).** **NO REPO ACTION** - gitignored, never committed (verified S1), will not publish. Heads-up to Brian to guard/rotate the key and ensure the reorg never force-adds it. Outside this docs-only fence.

---

## Flagged during execution (beyond the original list)

- **A workers.dev staging URL** in `atg-llm-migration.md` embeds Brian's Cloudflare/workers handle alongside the client project name. Not a local path and not covered by an override; **flagged, not removed**. (The handle is the same public string as Brian's Cloudflare account slug.)
- **The live ATG article** (`src/`, out of fence) names the consent-pending client in full; see the ATG row above. Flagged for Brian as a live-surface decision.

---

## Verified clean (no action) - carried from the compile pass

- **Secret values:** none committed. History scans for the API-key prefixes and the Resend key pattern returned no real key material (only placeholder/text references). `chat/.env` is gitignored and never appeared in history.
- **Resource handles:** KV namespace id, account id, gateway name are non-secret identifiers, shown truncated in docs; secret NAMES appear without values.
- **`.claude/agents/*` and `.claude/settings.json`:** no personal data, no secrets. `.claude/settings.local.json` and `.claude/worktrees/` are untracked/gitignored and do not publish.
- **S1 git-history verification: PASS.** Keys were never committed; the public repo also gets fresh history per #202.

---

## Verification (execution pass)

After the edits, each removed string was grepped across `docs/`. Zero hits for: the personal mobile number, both legacy A-record IPs, the mail-verification token, the client's full personal name, the client-first-name codename, and both client-project absolute paths. The personal email address remains only in the #183 "off every surface" narrative entries described under J1. The Fable usage percentage returns only an unrelated CSS bar width. Grep evidence is in the execution report accompanying this commit.
