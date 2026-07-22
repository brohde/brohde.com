# chat/: the production chat, its prompt, and how it was evaluated

This directory is the source of truth for the site's chat: the system prompt, the
facts pack, and the eval harness that signed the behavior off (38/38, decision
#61). It is production infrastructure, not a throwaway. The production Cloudflare
Pages Function (`functions/api/chat.ts`) does not duplicate this text: the build
step `tools/build/build-chat-prompt.mjs` (wired into `npm run build`) reads
`chat/system-prompt.md` + `chat/facts.md`, concatenates them, and emits the
generated module the Function imports. Edit the prompt or the facts here, nowhere
else.

> **Formerly `poc/chat/`.** This directory was promoted out of `poc/` in the
> pre-public repo reorg (#213); chat is no longer a proof of concept (#158).
> Older docs and handoffs still reference the old `poc/chat/` path. Those are
> dated historical records and are left as written.

## What is here

| File | Role |
| --- | --- |
| `system-prompt.md` | FROZEN source of truth (#61). The build reads this. |
| `facts.md` | FROZEN facts pack (#61), the model's entire world. The build reads this. |
| `server.mjs` | Local dev bridge: real Haiku 4.5 over HTTP on `localhost:8787` for `astro dev`. Never deployed; production chat is same-origin via the Function. |
| `index.html` | The dev bridge's standalone UI. |
| `eval.mjs` | Keyed eval harness: runs the question set against the live model, writes `transcript.md`. |
| `eval-http.mjs` | HTTP parity harness: proves the production Function matches the frozen POC. |
| `make-review.mjs` | Regenerates `eval-review.html` (interactive grading surface) from `transcript.md`. |
| `eval-review.html` | The published grading artifact. |
| `transcript.md` | A preserved eval run. |
| `verdicts-2026-07-15.md` | Signed-off verdicts. |
| `package.json` / `package-lock.json` | The harness dependencies (`@anthropic-ai/sdk`); this is its own small Node project. |

## Run the dev bridge

```sh
cd chat
npm install
npm start   # http://localhost:8787
```

The key comes from `chat/.env` (gitignored, covered by the global `.env` rule):
paste it there once as `ANTHROPIC_API_KEY=sk-ant-...`. Passing it inline
(`ANTHROPIC_API_KEY=... npm start`) also works and takes precedence. Every reply
prints its real token usage and dollar cost.

## Run the eval

```sh
cd chat
ANTHROPIC_API_KEY=sk-ant-... npm run eval
```

Runs the question set (expected / navigate / unknown / deny / injection) and
writes `transcript.md` with a pass/fail row each. Failures loop back into
`facts.md` / `system-prompt.md`. A whole run costs about a cent.

## Notes

- Prompt caching is wired (`cache_control` on the system block), but Haiku's
  minimum cacheable prefix exceeds the current facts pack, so cache fields may
  read 0 until the pack grows. The dollar figures shown are real either way.
- Production adds what the local bridge does not: AI Gateway (spend cap, logging,
  provider swap), Turnstile, per-IP rate limits. See
  `docs/reference/llm-terminal-plan.md`.
- Behavior is FROZEN (#61). Changing the prompt or facts is a change to what the
  live chat says; re-run the eval before shipping it.
