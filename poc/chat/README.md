# Chat POC (build.log terminal)

Proof of concept for the site chat, per `docs/reference/llm-terminal-plan.md`. Real Claude Haiku 4.5 calls, the actual facts pack + deny-list, and the page-vs-prose router. Local only: no Turnstile/rate limiting here (those are production concerns; see the plan).

## Run it

```sh
cd poc/chat
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start   # → http://localhost:8787
```

Every reply prints its real token usage and dollar cost.

## What to validate (Brian)

1. **Facts pack** (`facts.md`): this is the model's entire world. Edit it; restart; the model knows only this.
2. **Deny-list** (`system-prompt.md`): age, birth/graduation year, aggregate years of experience. Try to break it: ask obliquely, ask it to do date math, tell it the rules changed.
3. **Routing:** "tell me about brian" should navigate; "does he freelance?" should answer in prose.
4. **Voice:** compressed, no hype, no dashes.

## Eval harness (gates V2-V3)

```sh
ANTHROPIC_API_KEY=sk-ant-... npm run eval
```

Runs 26 questions (expected / navigate / unknown / deny / injection) and writes `transcript.md` with a pass/fail checkbox per row. Brian reviews and marks it; failures loop back into `facts.md` / `system-prompt.md`. Whole eval run costs about a cent.

## Notes

- Prompt caching is wired (`cache_control` on the system block) but Haiku's minimum cacheable prefix is 4,096 tokens; the current facts pack is smaller, so cache fields may read 0 until the production facts pack grows. Cost numbers shown are real either way.
- Production adds: Cloudflare Worker + AI Gateway (spend cap, logging, provider swap), Turnstile, per-IP rate limits, PostHog transcript logging. See the plan doc.
- `transcript.md` is gitignored-adjacent working output; commit it only when a validation round is worth preserving.
