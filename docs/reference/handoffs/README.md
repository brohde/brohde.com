# Handoffs

A handoff is the closing artifact a sub-agent writes when it finishes a scoped
unit of work. It lets the lead session merge the work and lets a later session
(or a public reader) understand what was done without re-reading the whole
transcript. The phase-per-agent workflow depends on them: each agent is freed on
completion, and its handoff is what survives.

## When to write one

Write a handoff whenever you finish a delegated build, audit, design pass, or
content pass that another session will merge, review, or build on. If the work
touched code, changed a decision, or left loose ends, it needs a handoff.

## What goes in one

Follow [`HANDOFF-TEMPLATE.md`](HANDOFF-TEMPLATE.md). The essentials:

- **Scope:** what was asked, and what you actually did.
- **Files:** what changed, added, or moved (with paths).
- **Verification:** how you proved it works (build, tests, rendered surface).
- **Judgment calls:** decisions you made that the lead or Brian may want to veto.
- **Loose ends / flags:** anything deferred, blocked, or owed follow-up.

## Note

The handoffs already in this directory predate this template and vary in shape.
They are kept as-is: they are dated evidence of the phased workflow, and history
is not rewritten. New handoffs should follow the template.
