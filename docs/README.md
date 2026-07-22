# docs/: the studio record for brohde.com

This directory is the working record of how brohde.com was designed, built, and
run as an AI studio: a lead session that delegates to expert sub-agents, logs
every decision and conversation, and hands off phased work. For a public reader,
the process is part of the product. This index is the map.

## Start here (task-keyed reading order)

- **Any session, first:** [`STATUS.md`](STATUS.md) then [`DECISIONS.md`](DECISIONS.md).
  STATUS is the resume point (current state, in-flight work, next steps).
  DECISIONS is the append-only log of what is settled; do not re-litigate it.
- **Conversation history:** [`COMMS-LOG.md`](COMMS-LOG.md) (summaries of what Brian
  asked and what came back, plus what was delegated to sub-agents).
- **Writing or editing copy:** [`VOICE.md`](VOICE.md) (Brian's voice, the total
  dash ban, positioning) and [`CONTENT.md`](CONTENT.md) (the article set).
- **Engineering:** [`ENGINEERING.md`](ENGINEERING.md) (build, stack, architecture).
- **The team:** [`TEAM.md`](TEAM.md) (the sub-agent roster and working rules).
- **Completion gate:** [`GATE.md`](GATE.md) (the agreed publish-readiness state).

## Directory map

| Path | What it holds |
| --- | --- |
| `STATUS.md` | Session resume point: current state, in-flight, next, open questions |
| `DECISIONS.md` | Append-only decision log (date, decision, rationale) |
| `COMMS-LOG.md` | Summarized conversation and delegation history |
| `VOICE.md` | Voice guide binding for all published copy |
| `CONTENT.md` | The article set and content model |
| `ENGINEERING.md` | Build pipeline, stack, and architecture reference |
| `TEAM.md` | Sub-agent roster and working rules |
| `GATE.md` | Agreed completion state for publish readiness |
| `drafts/` | Unpublished article drafts (provenance for the content story) |
| `design/` | Design concepts and lab prototypes (dated artifacts) |
| `reference/` | Research, audits, specs, and handoffs |
| `reference/handoffs/` | Per-agent handoff docs; see its own README |
| `archive/` | Rolled-off history and archived source material |

## Conventions

- **Decisions** are logged in `DECISIONS.md` with a number, date, and rationale.
- **Handoffs** follow the shape in
  [`reference/handoffs/HANDOFF-TEMPLATE.md`](reference/handoffs/HANDOFF-TEMPLATE.md);
  see [`reference/handoffs/README.md`](reference/handoffs/README.md) for when to
  write one.
- **History stays history.** Dated records (COMMS-LOG rows, DECISIONS rows, older
  handoffs) are not rewritten when structure changes. They describe the repo as
  it was at the time.
