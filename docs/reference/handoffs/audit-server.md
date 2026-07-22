# Audit handoff: SERVER + CONFIG + LIB (publish-readiness Phase A)

Date: 2026-07-21. Auditor: Opus code auditor (isolated worktree `agent-a6a8b7b27f39695ac`).
Domain: `functions/**`, `src/lib/*.ts`, `wrangler.toml`, `astro.config.mjs`, `tsconfig*`,
`package.json` scripts, `public/_redirects`, `scripts/build-chat-prompt.mjs`.
Bar: public-repo quality. Behavior frozen: chat #61, contact curl-tested; both endpoints'
request/response bytes must not move.

## Verdict

Ship-ready from this domain's side. The server security story holds after today's churn,
the config is self-explanatory, and the lib modules are clean. Changes applied are
comments only. Build green, `tsc --noEmit -p functions/tsconfig.json` clean.

## Fixes applied (all comments, zero behavior change)

1. **Em-dash sweep (#18 covers comments).** Two comment em dashes were the only ones in the
   domain:
   - `functions/api/chat.ts:3` file-banner: swapped the em-dash separator for a colon
     (matches contact.ts's colon style).
   - `scripts/build-chat-prompt.mjs:35` generated-file banner: swapped the em-dash separator
     for a period (this string is emitted into the gitignored generated module, so the sweep
     also cleans the codegen output a public reader could regenerate).
   - The dash characters inside the `chat.ts:166` `replace(...)` style guard are load-bearing
     (that regex strips model-emitted dashes per the dash ban) and were deliberately left.
2. **contact.ts hardening annotations (audit L5 / H2 / L3), for parity with chat.ts.**
   contact.ts carried the same content-type check, body-size cap, and `no-store` response
   header as chat.ts but with no rationale comments, so a public reader could read the
   sibling as un-hardened. Added three short annotations tagging them to the same audit
   findings and pointing at chat.ts. No logic, strings, or status codes touched.

## Security-read: the hardening still holds (re-verified after today's churn)

- **Body caps.** chat + contact both bound the raw body at `MAX_BODY_BYTES = 16_384`,
  checking the declared `content-length` first then the actual read. chat caps message 500;
  contact caps text/message 2000, name 100, email 200. Held.
- **Content-type checks.** Both 415 on non-`application/json` before touching the body. Held.
- **Rate-limit keys.** chat uses `rl:` prefix, contact uses `crl:` prefix on the same
  `CHAT_RL` KV binding, so the two flows never share a budget. Synchronous in-isolate gate
  in front of the KV gate on both (M1 same-isolate half closed; cross-PoP residual race
  documented and backstopped by the AI Gateway hard cap). Held.
- **no-store.** Both `json()` helpers set `cache-control: no-store` on every response. Held.
- **No secret echoes.** Neither Function logs or returns key material. Diagnostic `detail`
  in contact.ts is gated behind `CHAT_DEBUG` (unset in prod); chat.ts ships `usage`/`cost`
  only behind `CHAT_DEBUG`. Error bodies are fixed friendly strings. Held.
- **H1 spend cap wired.** `wrangler.toml [vars] ANTHROPIC_BASE_URL` points at the
  authenticated `brohde-chat` AI Gateway; both Functions send `cf-aig-authorization` when
  `ANTHROPIC_GATEWAY_TOKEN` is set, and `normalizeBaseUrl` prevents the double-slash 404.
- **L-series accepted items are annotated in code** so a public reader sees the trade-offs:
  L2 (usage/cost behind `CHAT_DEBUG`), L3 (`no-store`), L5 (415 content-type), H2/M2
  (validateHistory), M1 (residual cross-PoP race writeup) are all commented in-file. After
  this pass, contact.ts carries the matching L5/H2/L3 tags too. L1 (guardrail meta-leak) is
  a prompt-side item in `poc/chat/`, out of this domain. L4 (POC bind/error echo) is
  `poc/chat/server.mjs`, out of this domain (deferred).

Nothing in the config widens the surface: `nodejs_compat` is the minimal flag for the SDK
bundle; the KV id, account id, and gateway name in `wrangler.toml` are resource handles, not
secrets (comments say so correctly); `public/_redirects` is a single 301; `astro.config.mjs`
is static-only, no adapter.

## LIB review (src/lib)

- `site.ts` and `articles.ts` doc comments are accurate and consumer-aware. All exports have
  live consumers (SEO, header/HomeIntro, ProfileLinks, ArticleLog, ArticleNav, [slug],
  rss.xml, about, index). `COMPANIES.beyond` is used (HomeIntro Beyond link). No dead code.
- Minor, NOT changed (note only): `articles.ts` exports `orderKey` and `byLedgerDesc`, which
  today are used only internally by `articles.ts` (no external consumer). Their doc comments
  frame them as intentional reusable helpers ("Sort ANY article array through this"), so this
  reads as deliberate module API rather than dead export. Leave as-is unless the lead wants a
  tighter surface, in which case drop both `export` keywords (one-line change, no consumer
  impact).

## Proposals (STRUCTURAL, not applied)

1. **Shared function-helpers module for `functions/`.** chat.ts and contact.ts duplicate,
   near-verbatim: `normalizeBaseUrl`, `clientIp`, `json`, `retryAfterFor`, the
   `rateLimitLocal` / `rateLimitKv` / `rateLimit` trio, the `RL_MINUTE`/`RL_DAY` shape, the
   `MAX_BODY_BYTES` constant, the Anthropic client construction (baseURL + gateway-token
   header), and the content-type / body-size preamble. A `functions/api/_shared.ts` (or
   `functions/lib/`) would remove roughly 120 duplicated lines and guarantee the two
   endpoints cannot drift on a security control. This is the biggest single quality win in
   the domain but it MOVES CODE, and both endpoints are byte-frozen, so it needs its own
   scoped change with a full curl re-test of both endpoints (not a mechanical pass). The two
   deliberate differences to preserve: the `retryAfterFor` signature differs (chat passes a
   `{windowMs}` object, contact passes a `number`) and the rate-limit tunables + key
   prefixes differ. Recommend doing this as its own small phase, after the byte-freeze lifts
   or with an explicit re-test gate.
2. **Frozen error-string divergence between the two endpoints (note, do not "fix").** chat's
   throttle line is "too many messages right now. give it a minute"; contact's is "too many
   requests, give it a minute". Both are frozen (chat #61, contact curl-tested), so leaving
   them is correct; a shared module (proposal 1) would surface the divergence for a
   deliberate reconciliation at that point, not before.
3. **scripts/ build tooling shape.** `scripts/build-chat-prompt.mjs` is a single, well-
   documented codegen with no external input. It is fine as-is. If `scripts/` grows a second
   tool, give it a one-line README or a `scripts/` index comment; not needed for one file.

## Verification

- `node scripts/build-chat-prompt.mjs` regenerates the prompt module (9652 chars).
- `npx tsc --noEmit -p functions/tsconfig.json` clean (matches the repo's functions strict
  check).
- `npm run build` green: 12 pages, sitemap emitted, images optimized.
- `git diff` touches comment lines only across chat.ts, contact.ts, build-chat-prompt.mjs.
  All frozen literals verified present by grep: chat's `open_page`/`usage`/`cost`/`text`
  fields, `message required (max 500 chars)`, `invalid history`, OFFLINE/THROTTLED/BLOCKED,
  `max_tokens: 400`, `claude-haiku-4-5`, the dash-guard regex; contact's `op === "extract"`
  / `op === "send"`, `extract_contact`, `{ ok: true }`, `unknown op`, the Resend `from`,
  the email-validity 400. No status code, schema, or response byte moved.

## Out of scope (untouched)

`poc/` (deferred), `src/pages|components|styles|scripts`, content collections. The README
build-command drift the docs auditor flagged is a docs-domain item, not this pass; the
`package.json` scripts themselves are accurate and self-explanatory.
