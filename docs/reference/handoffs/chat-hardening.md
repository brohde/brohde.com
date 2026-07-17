# Chat API hardening (security audit remediation)

Date: 2026-07-17. Scope: server-side and config hardening of the production chat backend
(`functions/api/chat.ts`) plus the dev-only POC server (`poc/chat/server.mjs`), per
`docs/reference/chat-security-audit.md` (the #49 pre-launch gate). Work done on branch
`worktree-agent-aa431d6efcaa75158`, not merged.

Non-negotiable constraint honored: the #61 behavior freeze. Nothing touched the system
prompt, facts pack, codegen, model (`claude-haiku-4-5`), sampling, tools, `max_tokens`, or
the response text transform. `runChat`'s model call is byte-identical to before. See "Eval
parity" below for the proof argument.

## Per-finding status

| Finding | Severity | Status | Where |
| --- | --- | --- | --- |
| H2 body size + `history` validation | High | Landed (server) | `chat.ts` request handler + `validateHistory` |
| M2 assistant-prefill / malformed history | Medium | Landed (structural, via H2) | `validateHistory` |
| M1 racy KV rate limiter | Medium | Landed (strongest feasible: synchronous in-isolate gate + KV); residual risk documented | `chat.ts` `rateLimit*` |
| L2 leaks `usage`/`cost` to visitors | Low | Landed (stripped in prod; behind `CHAT_DEBUG`) | `chat.ts` response body |
| L3 no `Cache-Control` | Low | Landed (`no-store` on every response) | `chat.ts` `json()` |
| L5 no content-type check | Low | Landed (`415` on non-JSON) | `chat.ts` request handler |
| L4 POC binds all interfaces + leaks error text | Low | Landed | `poc/chat/server.mjs` |
| H1 AI Gateway spend cap seam | High | Config-side robust (trailing slash, gateway URL shape, optional auth header). Brian must create the gateway; click-path below | `chat.ts` `runChat` + this doc |
| H3 Turnstile client + secret | High | Server keeps graceful-skip (unchanged). Client wiring plan + launch posture below (Phase 2 / interior line owns it) | this doc |
| L1 deny-list self-disclosure | Low | Out of scope here (prompt tweak + eval row, behavior-frozen). Not touched | n/a |

## What landed, per finding

### H2 (and M2): bounded body and validated history

Request handler now, in order, before any model call:

1. Content-type must contain `application/json`, else `415` (L5).
2. Body bounded to `MAX_BODY_BYTES` (16 KB): `Content-Length` pre-check, then the actual
   read length, else `413`. Rejected before `JSON.parse`.
3. `message`: unchanged rule (required string, <= 500 chars), else `400`.
4. `history`: `validateHistory` enforces an array of at most 8 entries, each
   `{role: "user"|"assistant", content: non-empty string <= 2000 chars}`, with alternating
   roles. Any violation is a clean `400` ("invalid history"). An absent history yields `[]`.

`validateHistory` **rejects** rather than silently sanitizes, so a tampered shape is
observable as a 400 (and easy to curl-test) instead of being quietly reshaped. This is the
structural half of M2: roles are whitelisted (no `system` injection), content must be a
bounded string (no unbounded assistant-prefill, no non-string content blocks). The frozen
prompt remains the behavioral defense against the prefill jailbreak; this is defense in
depth behind it. Note a lone `assistant` history entry is still legitimate shape (that is
how conversation history works), so it is accepted but bounded; the audit's live probes
confirmed the prompt refuses such prefills.

`runChat` still does its own `history.slice(-8)`; that is now redundant with the count cap
but was left verbatim to keep the frozen function untouched.

### M1: rate limiter backstop

Evaluation of the three options for a Cloudflare **Pages** project (not a standalone
Worker):

- **Rate Limiting binding**: a Workers feature. It is not available to Pages Functions via
  config-as-code today (the binding is not declarable in a Pages `wrangler.toml`, and its
  own accuracy is documented as best-effort per-colo). Not feasible here.
- **Durable Object**: the correct primitive (single-threaded, atomic counters). But a Pages
  project cannot define or export a DO class (no DO migration mechanism in Pages). It can
  only *bind* to a DO hosted in a separately deployed companion Worker. That is a new
  deployable unit and ops surface, out of scope for a server-only change to the existing
  Pages Function. Recommended as the future upgrade if abuse materializes.
- **Tightened KV (implemented)**: added an always-on **synchronous in-isolate gate**
  (`rateLimitLocal`) in front of the durable KV gate (`rateLimitKv`). Both must pass; the
  effective limit is the tighter of the two.

Why the local gate helps: its check-and-increment has no `await` between read and write, so
it is atomic within a single isolate. A concurrent burst from one IP that Cloudflare routes
to the same isolate (the common single-origin burst) is now counted deterministically and
cannot all read the same pre-state, which was the core of the M1 race. The previous code
used the in-isolate counter only as a fallback when KV was unbound; it is now always on.

**Residual risk (honest):** the KV gate keeps its read-modify-write and is still best-effort
across PoPs (KV has no atomic compare-and-set and reads are edge-cached for up to ~60s). A
burst deliberately spread across many PoPs from one IP can still slip some extra requests
past the windows within that staleness window. The per-minute (10) and per-day (60) caps
still apply approximately. The authoritative cost ceiling is the AI Gateway hard spend cap
(H1), which bounds spend regardless of any limiter bypass. This pairing (approximate limiter
plus hard cap) is exactly what the audit recommends.

### L2: stop shipping `usage`/`cost` to visitors

The success response body is now `{ text, open_page }` only. `usage` and `cost` ship only
when `CHAT_DEBUG` is set (any non-empty value), for local diagnostics. Production leaves it
unset, so visitors never receive token counts or internal cost figures. The client already
gated its display on `IS_LOCAL`, so nothing user-facing changes.

### L3: `Cache-Control: no-store`

Added in the `json()` helper, so every response (2xx and 4xx) carries it. Overridable via
the per-call headers argument if ever needed. `public/_headers` scopes its cache rules to
static paths only and does not cover `/api/*`.

### L5: content-type enforcement

Non-`application/json` requests get a clean `415` before the body is read.

### L4: POC server (dev-only, never deployed)

`poc/chat/server.mjs`: now `.listen(8787, "127.0.0.1", ...)` so it binds loopback only (was
`0.0.0.0`), and the 500 handler returns a fixed `{"error":"internal error"}` instead of
`String(err.message || err)`. The prompt and facts files were not touched. The currently
running :8787 instance was left alone; these fixes apply on its next restart. Optional and
not code: revoke the POC key (`poc/chat/.env`, marked expires 2026-08-14) once eval sign-off
is done rather than leaving it live.

### H1 (config-side): robust AI Gateway seam

`runChat` now normalizes `ANTHROPIC_BASE_URL` (`normalizeBaseUrl`: trims whitespace, strips
trailing slashes) so the SDK's appended `/v1/messages` lands cleanly on the AI Gateway URL
shape `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`. Verified
locally: a base URL with a trailing slash still hit exactly `POST /v1/messages` (a
normalization bug would have produced `//v1/messages`).

Also added an optional `ANTHROPIC_GATEWAY_TOKEN`. It is inert when unset (no header), so the
default unauthenticated gateway and direct `api.anthropic.com` both stay pure config. Set it
only if the gateway has "Authenticated Gateway" enabled; it is then sent as
`cf-aig-authorization: Bearer <token>`.

## Brian's AI Gateway click-path (H1) - the one thing only Brian can do

This is the single most important launch-gate item (a hard spend cap is the only true
backstop against a runaway bill). Steps:

1. Cloudflare dashboard, **AI** section, **AI Gateway**, **Create Gateway**. Name it (for
   example `brohde-chat`). Note the **Account ID** and the **Gateway ID**.
2. The Anthropic endpoint for that gateway is:
   `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
   (trailing slash is fine; the code strips it.)
3. In the gateway settings, set a **budget / spend limit**. Set a monthly hard cap, and a
   per-minute or per-day cap if the option is available. This is the authoritative ceiling.
4. Cloudflare dashboard, **Workers and Pages**, project **brohde-com**, **Settings**,
   **Environment variables** (Production). Add a plain variable (not a secret):
   `ANTHROPIC_BASE_URL = https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
   Then redeploy (or trigger a new deployment) so the Function picks it up.
5. Leave `ANTHROPIC_API_KEY` as the existing Pages secret. The gateway passes Anthropic auth
   through; do not move the key into the gateway.
6. Verify: after redeploy, requests appear in the AI Gateway dashboard analytics, and the
   spend cap enforces. A capped gateway returns an error upstream, which the Function already
   degrades to the friendly `OFFLINE` line (502), so a hit cap does not leak internals.

Optional: if you turn on **Authenticated Gateway**, also add a Pages secret
`ANTHROPIC_GATEWAY_TOKEN = <the gateway token>`. Leave it unset otherwise. Recommendation:
an unauthenticated gateway is fine here (it still requires the Anthropic key and is spend-
capped), so you can skip this unless you specifically want the extra gate.

## Turnstile client wiring plan (H3) - for the interior / Phase 2 line

The server is unchanged and correct: `verifyTurnstile` returns `true` (skip) while
`TURNSTILE_SECRET` is unset, and fails closed (403) once it is set. The ordering constraint
from #81/#83 still holds: **setting `TURNSTILE_SECRET` before the client sends tokens would
403 all chat.** So the client widget and the secret must land in the same change.

Client work (owned by the terminal/interior branch; `src/scripts/terminal.ts` seam is at the
`askLive` fetch, currently a comment at roughly lines 491-493):

1. Load the Turnstile script `https://challenges.cloudflare.com/turnstile/v0/api.js`. The
   CSP in `public/_headers` already allows `challenges.cloudflare.com` in `script-src` and
   `frame-src`, so no CSP change is needed.
2. Render the widget (invisible or managed) with the **public site key** for the
   brohde.com Turnstile widget. Keep it cheap and lazy per the facade contract (#70): render
   on first chat interaction, not at page load, so it does not move FCP/LCP.
3. On submit, obtain the token (`turnstile.getResponse(...)` or the widget callback) and
   include it as `turnstileToken` in the POST body alongside `message`/`history`. Nothing
   else in the request changes.
4. Handle a `403` from `/api/chat` (body `{ error: "couldn't verify..." }`) by resetting the
   widget and letting the visitor retry. The client already renders `error` bodies verbatim
   as inert text nodes, so the 403 body renders as a normal chat line.
5. Ship `TURNSTILE_SECRET` as a Pages secret **in the same deploy** as the client change.

Alternative launch posture (as the audit frames it): launch **rate-limit-only** without
Turnstile, with H1 (hard spend cap) and M1 (the tightened limiter) as the compensating
controls. This is a conscious tradeoff, not a default: it leaves the endpoint reachable by
non-browser bots up to the per-IP caps, but the hard cap bounds the worst-case bill. If you
take this path, land Turnstile as a fast follow. Do not set `TURNSTILE_SECRET` under this
posture (it would 403 everyone until the client sends tokens).

## Eval parity (the #61 proof)

**Score/outcome invariance is guaranteed by construction**, and the request/response
plumbing was verified empirically end to end.

Why the diff cannot change eval outcomes: the eval-http harness POSTs `{message}` with
`content-type: application/json` and a unique `CF-Connecting-IP` per case, with no `history`
and no `turnstileToken`. Every new gate is a no-op for that exact shape:

- content-type is `application/json` (passes L5),
- body is tiny (passes H2 size),
- no history (`validateHistory` returns `[]`, same as the old `Array.isArray(...) ? ... : []`
  which also produced `[]`),
- `message` is a valid string <= 500 (unchanged check),
- unique IP per case (the rate limiter never trips),
- `TURNSTILE_SECRET` unset (skip, unchanged), key present.

So `runChat` receives `(message, [])` exactly as before, and the messages array, system,
tools, model, `max_tokens`, and the dash-replacement text transform are byte-identical. The
only response-shape change (L2) drops `usage`/`cost` from the 200 body, and the harness
grades solely on `r.text` and `r.open_page`, so per-case PASS/FAIL is invariant. The
transcript's cost line reads `$0` in production mode, which is not a graded outcome.

**Empirical confirmation done here (no real key needed, zero cost):** the full 200 path was
exercised against a local Anthropic-API stub. Valid traffic (including a valid alternating
`history`) returns 200 with `{ text, open_page }`; the base-URL normalization, the
`CHAT_DEBUG` flag, and every rejection path were confirmed (see "Validation" below).

**What was NOT run here:** the keyed 35/38 before/after eval against a live model. The
`ANTHROPIC_API_KEY` is not readable in this isolated environment (the POC `.env` is sandbox-
blocked and no other key was available), so the model-behavior grading itself could not be
executed. Given the by-construction argument above, running it against the hardened code and
confirming it still scores **35/38 with the same three stale "unknown"-label rows as #81** is
sufficient to close the loop.

Exact command for Brian (from repo root, with the real key):

```
# 1. build so dist/ exists
npm run build

# 2. put the real key (and CHAT_DEBUG so the transcript shows cost) in .dev.vars:
#    ANTHROPIC_API_KEY=sk-ant-...
#    CHAT_DEBUG=1

# 3. run the Function locally (ports 8790-8799 are free; :8787 is the POC)
npx wrangler pages dev dist --port 8790 --ip 127.0.0.1 --compatibility-date=2025-05-01 &

# 4. run the parity harness against it
CHAT_URL=http://127.0.0.1:8790/api/chat node poc/chat/eval-http.mjs
# expect: 35/38, same three stale "unknown"-label fails as #81
```

## Validation performed here

- `npm run build`: clean (prompt codegen, `astro check`, static build all pass).
- `tsc --strict` over `functions/**` with `@cloudflare/workers-types`: 0 errors. (Note the
  project `tsconfig.json` excludes `functions/` and `poc/`, so `astro check` alone does not
  typecheck the Function; Cloudflare bundles it with esbuild at deploy. This tsc pass covers
  the gap.)
- `wrangler pages dev` on :8790 with the KV binding + a local Anthropic-API stub. curl
  results:
  - happy path (production-like): `200`, body `{"text":"stub reply","open_page":null}`, no
    `usage`/`cost`, `Cache-Control: no-store`.
  - valid alternating `history`: `200` (parity-critical: legitimate client traffic is not
    rejected).
  - bad content-type: `415`.
  - oversized body (>16 KB): `413`.
  - bad history (`system` role / non-array / entry >2000 chars): `400 invalid history`.
  - missing message: `400 message required`.
  - burst of 12 from one IP: ten `200`, then `429` with `Retry-After: 60`.
  - `CHAT_DEBUG=1`: 200 body includes `usage`/`cost`.
  - trailing-slash `ANTHROPIC_BASE_URL`: still hit exactly `POST /v1/messages` (H1
    normalization), `200`.
- POC :8787 left untouched throughout (confirmed still responding).

## Residual risks / follow-ups

1. M1 cross-PoP KV race remains (bounded by the AI Gateway hard cap). Upgrade path if abuse
   appears: a companion Worker hosting a Durable Object limiter, bound into the Pages project.
2. H1 hard cap requires Brian to create the gateway (click-path above). Until then, calls go
   direct to `api.anthropic.com` with no ceiling.
3. H3 Turnstile is server-ready but client-pending; launch posture is a conscious decision
   (Turnstile now, or rate-limit-only plus hard cap).
4. L1 (deny-list self-disclosure) is a behavior-frozen prompt tweak plus an eval row, not
   touched here; route it through the prompt/eval flow, not code.
5. L4 optional: revoke the POC key once eval sign-off is complete.
