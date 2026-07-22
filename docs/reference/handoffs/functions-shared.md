# Handoff: functions/api/_shared.ts dedup (#213)

Date: 2026-07-21. Engineer: Opus (isolated worktree `agent-aac0e1706604812f9`).
Scope fence: `functions/**` only. Executes proposal 1 of
`docs/reference/handoffs/audit-server.md`. Both endpoints are byte-frozen (chat #61; contact
curl-tested), so this was run as its own careful phase with a full byte-compare gate.

## What shipped

- **New `functions/api/_shared.ts`** holding the pieces that were duplicated near-verbatim in
  chat.ts and contact.ts, parameterized only where the audit said they legitimately differ:
  - `MAX_BODY_BYTES` (the 16 KB body cap, now single-source, internal to the preamble).
  - `normalizeBaseUrl(u?)` (audit H1 base-URL trim + trailing-slash strip).
  - `makeAnthropic(env)` (the Anthropic client construction: baseURL when set +
    `cf-aig-authorization` header when the gateway token is set; both a pure config wire-up).
  - `json(body, status, headers)` (content-type + `cache-control: no-store` on every
    response, extra headers spread last).
  - `readValidatedBody(request)` (the content-type 415 / body-size 413 preamble; returns a
    discriminated `BodyResult` so the caller parses the body itself).
  - `clientIp(request)`.
  - `rateLimit(env, cfg, ip)` plus the internal `rateLimitLocal` / `rateLimitKv` /
    `retryAfterFor` and the in-isolate `memBuckets` Map, all behind a `RateLimitConfig`.
- **chat.ts and contact.ts consume it.** Each keeps: its own `Env`, its own domain constants
  (chat: message/history caps, MODEL, PRICE, tools, ChatResult, runChat, validateHistory,
  verifyTurnstile, OFFLINE/BLOCKED/THROTTLED; contact: text/name/email caps, EMAIL_VALID,
  EXTRACT_SYSTEM, extractTool, extract, deliver, backup), its own `RL: RateLimitConfig`, its
  own frozen error strings, and its own `onRequestPost` control flow. Net: chat.ts and
  contact.ts shed ~294 lines between them; _shared.ts adds one single-sourced copy.

## The two deliberate differences, preserved (not reconciled)

1. **Rate-limit tunables + KV key prefix.** Passed per call as `RateLimitConfig`:
   - chat: `{ keyPrefix: "rl:", minute: 10/60s, day: 60/24h }`
   - contact: `{ keyPrefix: "crl:", minute: 15/60s, day: 40/24h }`

   The two prefixes keep the flows on separate budgets even though they now share one
   `memBuckets` Map and the one `CHAT_RL` KV binding. This matches the pre-change behavior
   exactly (Pages compiles both Functions into one Worker regardless, and the former per-file
   Maps were already keyed by these distinct prefixes).
2. **`retryAfterFor`'s signature.** chat originally passed a `{ windowMs }` object, contact
   passed a raw `number`; both computed the identical integer. Unified to one internal helper
   taking a `number`. This is not observable behavior: it only feeds the `Retry-After` integer
   and the math is unchanged. Confirmed byte-identical by the 429 matrix (Retry-After stays
   `60` on both endpoints, both runs).

**The frozen throttle STRINGS are NOT unified.** Each endpoint still passes its own body to
`json()`: chat `"too many messages right now. give it a minute"`, contact
`"too many requests, give it a minute"`. _shared.ts never emits a response-body string except
the two 415/413 preamble errors, which were already byte-identical in both files. The
malformed-JSON divergence is also preserved: chat falls a bad body through to its
`message required (max 500 chars)` 400; contact returns its own `invalid json` 400. Both are
exercised in the matrix (`chat_400_badjson` vs `contact_400_badjson`).

## Underscore routing (verified, not assumed)

Cloudflare Pages Functions do not build a route for a file whose name starts with `_`
(the documented `_middleware.ts` rule; the same is why `./_chat-prompt.generated.ts` is
imported by chat.ts without being routable). Verified against this change's `wrangler pages
dev dist` build:

- `POST /api/_shared` returns **405**, byte-for-byte the same as `POST /api/nonexistent`
  (both fall through to the static-asset handler, which rejects POST) - i.e. no function
  route exists for it.
- `GET /api/_shared` returns 404.
- `POST /api/chat` and `POST /api/contact` still route to their handlers (400 on empty body).

So `_shared.ts` is import-only; it is never reachable as an endpoint.

## Verification (exhaustive)

- `npx tsc --noEmit -p functions/tsconfig.json`: **clean** (after `node
  scripts/build-chat-prompt.mjs`, since the generated prompt module is gitignored and only
  exists post-codegen).
- `npm run build`: **green**, 12 pages, sitemap emitted.
- **Full curl matrix, byte-compared.** The matrix was run FIRST against a build of unmodified
  main (`baseline`), then against the refactored build (`modified`), on the same wrangler
  version, no keys (graceful-degrade paths only). Runner + comparator are in the session
  scratchpad (`matrix.sh`, `compare.sh`). Each case records status, content-type,
  cache-control, Retry-After, and the exact body; volatile headers (Date, CF-*) are excluded
  so the compare is on behavior, not wrangler noise. Distinct `CF-Connecting-IP` per case
  isolates rate-limit state; the burst cases reuse one IP.

  **Result: 45 of 45 responses byte-identical between baseline and modified; 0 of 45 missing
  `cache-control: no-store`.**

  Matrix coverage, both endpoints:

  | case | chat | contact |
  | --- | --- | --- |
  | 415 bad content-type | `{"error":"content-type must be application/json"}` | same |
  | 413 oversize body (>16 KB) | `{"error":"request body too large"}` | same |
  | 400 malformed JSON (divergence) | `{"error":"message required (max 500 chars)"}` | `{"error":"invalid json"}` |
  | 400 missing/invalid input | missing message; long message; `invalid history` | unknown op; invalid email; empty message; over-long extract text |
  | 503 offline (no key) | `{"error":"chat is offline right now. please try again in a moment"}` | extract `{"error":"extraction unavailable","offline":true}`; send `{"error":"delivery unavailable right now","offline":true}` |
  | 429 after burst | `{"error":"too many messages right now. give it a minute"}` at req 11 (10/min), `Retry-After: 60` | `{"error":"too many requests, give it a minute"}` at req 16 (15/min), `Retry-After: 60` |
  | no-store on every response | yes | yes |

## Brian's one-command keyed confirm (you have no key here)

This dedup does not touch the model request shape, so the keyed eval is closed by construction
(same as the hardening pass). The optional live confirmation, unchanged from
`chat-hardening.md`, is:

```
# 1. build so dist/ exists
npm run build

# 2. put the real key (+ CHAT_DEBUG for the cost line) in .dev.vars:
#    ANTHROPIC_API_KEY=sk-ant-...
#    CHAT_DEBUG=1

# 3. run the Function locally
npx wrangler pages dev dist --port 8790 --ip 127.0.0.1 --compatibility-date=2025-05-01 &

# 4. run the parity harness against it
CHAT_URL=http://127.0.0.1:8790/api/chat node poc/chat/eval-http.mjs
# expect: 35/38, same three stale "unknown"-label fails as #81
```

## Notes for the lead

- Untracked `functions/api/_chat-prompt.generated.ts` in the worktree is the gitignored
  codegen output (regenerated so tsc/build could run); it is not part of this change.
- No config touched: wrangler.toml, tsconfig, package.json, _headers all unchanged. The one
  KV binding and both key prefixes are preserved.
- Suggested commit scope: the two modified endpoints + new `_shared.ts` only.
