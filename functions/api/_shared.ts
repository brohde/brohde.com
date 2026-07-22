/// <reference types="@cloudflare/workers-types" />
//
// functions/api/_shared.ts: helpers shared by the two API Functions (chat.ts, contact.ts).
//
// WHY THE LEADING UNDERSCORE. Cloudflare Pages Functions build a route for every file under
// functions/ that exports a handler, but files (and directories) whose name starts with an
// underscore are treated specially: they are NON-ROUTED modules. `_middleware.ts` is the
// documented example; the same rule makes `_shared.ts` importable by its siblings without
// ever getting its own /api/_shared route. That matches how ./_chat-prompt.generated.ts is
// already imported by chat.ts without being routable. Verified against the wrangler pages
// dev build for this change: only POST /api/chat and POST /api/contact compile as routes,
// and GET/POST /api/_shared 404s.
//
// BEHAVIOR FREEZE. Both endpoints are byte-frozen (chat #61; contact curl-tested), so every
// helper here is a verbatim lift of code that was duplicated near-identically in both files.
// Nothing is "reconciled." The only parameterization is for the two deliberate per-endpoint
// differences the server audit named (docs/reference/handoffs/audit-server.md, proposal 1):
//
//   1. Rate-limit tunables + KV key prefix differ. chat uses `rl:` at 10/min + 60/day;
//      contact uses `crl:` at 15/min + 40/day. Passed in per call as RateLimitConfig, so
//      the two flows keep their own budgets under distinct keys and never share a count.
//   2. retryAfterFor's original call signatures differed (chat passed a `{ windowMs }`
//      object, contact passed a raw number) but computed the IDENTICAL integer. Unified
//      here to one internal helper taking a number; its output is bit-identical to both
//      originals (confirmed by the 429 matrix: Retry-After stays 60 on both endpoints).
//
// The frozen throttle STRINGS are NOT unified: each endpoint still passes its own body to
// json() ("too many messages right now. give it a minute" for chat vs "too many requests,
// give it a minute" for contact). This module never emits a response-body string of its own
// except the two shared 415/413 preamble errors, which were already byte-identical in both
// files.

import Anthropic from "@anthropic-ai/sdk";

// Request body ceiling (audit H2). Bound the raw body before parsing so a single request
// cannot carry hundreds of KB of billable input tokens. Both endpoints used this exact
// value; it now lives only here, used by readValidatedBody below.
const MAX_BODY_BYTES = 16_384;

// Normalize an optional SDK base URL (audit H1). Trims whitespace and strips trailing
// slashes so the SDK's appended `/v1/messages` path lands cleanly. Works with the Cloudflare
// AI Gateway Anthropic endpoint shape:
//   https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic
// (a trailing slash there would produce a double-slash `//v1/messages` and 404).
export function normalizeBaseUrl(u?: string): string | undefined {
  if (!u) return undefined;
  const trimmed = u.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

// Anthropic client construction, identical in both endpoints. Only passes baseURL when set
// (otherwise the SDK default api.anthropic.com holds), and only sends the
// `cf-aig-authorization` header for an Authenticated AI Gateway; both stay a pure config
// wire-up (audit H1). Callers pass the fields off their own Env.
export function makeAnthropic(env: {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_GATEWAY_TOKEN?: string;
}): Anthropic {
  const baseURL = normalizeBaseUrl(env.ANTHROPIC_BASE_URL);
  const gatewayToken = env.ANTHROPIC_GATEWAY_TOKEN?.trim();
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(baseURL ? { baseURL } : {}),
    ...(gatewayToken
      ? { defaultHeaders: { "cf-aig-authorization": `Bearer ${gatewayToken}` } }
      : {}),
  });
}

// JSON response helper. Sets `content-type: application/json` and `cache-control: no-store`
// on every API response (audit L3): these are dynamic, per-request endpoints; nothing here
// should ever be cached by an intermediary or a future GET. `public/_headers` scopes its
// cache rules to static paths only. Extra headers (e.g. Retry-After) spread last, exactly as
// both endpoints did.
export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

// Result of the shared request preamble: either a short-circuit Response (415/413) or the
// validated raw body text. The caller parses the body itself, because the two endpoints
// diverge deliberately AFTER this point (chat falls through malformed JSON to its
// message-required 400; contact returns its own "invalid json" 400).
export type BodyResult =
  | { ok: true; rawBody: string }
  | { ok: false; response: Response };

// Content-type + body-size preamble (audit L5 / H2), byte-identical across both endpoints.
// 415s non-JSON before touching the body; 413s an oversized body, checking the declared
// content-length first (cheap) then the actual read (the header can be absent or lie).
export async function readValidatedBody(request: Request): Promise<BodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: json({ error: "content-type must be application/json" }, 415),
    };
  }

  const declaredLen = request.headers.get("content-length");
  if (declaredLen !== null && Number(declaredLen) > MAX_BODY_BYTES) {
    return { ok: false, response: json({ error: "request body too large" }, 413) };
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    rawBody = "";
  }
  if (rawBody.length > MAX_BODY_BYTES) {
    return { ok: false, response: json({ error: "request body too large" }, 413) };
  }

  return { ok: true, rawBody };
}

// Read the caller's IP for rate limiting. Identical in both endpoints.
export function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

// --- rate limit --------------------------------------------------------------------------

// Per-endpoint rate-limit knobs. This is deliberate difference (1): the two endpoints pass
// their own windows, caps, and KV key prefix so their budgets never mix.
export interface RateLimitConfig {
  keyPrefix: string; // "rl:" for chat, "crl:" for contact
  minute: { windowMs: number; max: number };
  day: { windowMs: number; max: number };
}

// Retry-After seconds from the oldest hit in the exhausted window. This is the unified form
// of the two originals (chat passed the window object, contact passed the number); the math
// and the returned integer are identical to both. Never returns less than 1.
function retryAfterFor(windowMs: number, times: number[], now: number): number {
  const oldest = Math.min(...times);
  return Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
}

// In-isolate counters, keyed by the caller's prefix + IP. One Map per Worker isolate; keys
// are prefix-namespaced (`rl:` vs `crl:`), so chat and contact never collide even though
// they share this module. This is exactly the behavior of the two former per-file Maps,
// since Pages compiles both Functions into one Worker anyway.
const memBuckets = new Map<string, number[]>();

// Synchronous in-isolate gate. No await between read and write, so it is atomic within a
// single isolate: a concurrent burst from one IP routed to the same isolate is counted
// deterministically and cannot all read the same pre-state. Closes the common half of the
// M1 race; the cross-PoP half is backstopped by the KV gate and, authoritatively, by the AI
// Gateway hard spend cap (H1). See docs/reference/handoffs/chat-hardening.md.
function rateLimitLocal(
  cfg: RateLimitConfig,
  ip: string,
  now: number
): { ok: boolean; retryAfter: number } {
  const key = `${cfg.keyPrefix}${ip}`;
  const times = (memBuckets.get(key) ?? []).filter(
    (t) => now - t < cfg.day.windowMs
  );
  const inMinute = times.filter((t) => now - t < cfg.minute.windowMs);

  if (inMinute.length >= cfg.minute.max) {
    return { ok: false, retryAfter: retryAfterFor(cfg.minute.windowMs, inMinute, now) };
  }
  if (times.length >= cfg.day.max) {
    return { ok: false, retryAfter: retryAfterFor(cfg.day.windowMs, times, now) };
  }

  times.push(now);
  memBuckets.set(key, times);
  return { ok: true, retryAfter: 0 };
}

// Durable cross-PoP gate, KV-backed. Read-modify-write, so best-effort under concurrency (KV
// has no atomic compare-and-set and reads are edge-cached ~60s). Authoritative across
// isolates/PoPs; the synchronous local gate catches the same-isolate burst KV would miss.
// Residual cross-PoP race is bounded hard by the AI Gateway spend cap (H1).
async function rateLimitKv(
  kv: KVNamespace,
  cfg: RateLimitConfig,
  ip: string,
  now: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const key = `${cfg.keyPrefix}${ip}`;
  const raw = await kv.get(key);
  const times = (raw ? (JSON.parse(raw) as number[]) : []).filter(
    (t) => now - t < cfg.day.windowMs
  );
  const inMinute = times.filter((t) => now - t < cfg.minute.windowMs);

  if (inMinute.length >= cfg.minute.max) {
    return { ok: false, retryAfter: retryAfterFor(cfg.minute.windowMs, inMinute, now) };
  }
  if (times.length >= cfg.day.max) {
    return { ok: false, retryAfter: retryAfterFor(cfg.day.windowMs, times, now) };
  }

  times.push(now);
  // KV min TTL is 60s; a day keeps the key alive across the daily window then self-expires.
  await kv.put(key, JSON.stringify(times), { expirationTtl: 86_400 });
  return { ok: true, retryAfter: 0 };
}

// Per-IP rate limit. Two gates, both must pass: a synchronous in-isolate gate (atomic per
// isolate, always on) and, when CHAT_RL is bound, the durable KV gate (authoritative
// cross-PoP). The effective limit is the tighter of the two. Neither gate alone is a hard
// cost ceiling; the AI Gateway spend cap (H1) is (see handoff M1).
export async function rateLimit(
  env: { CHAT_RL?: KVNamespace },
  cfg: RateLimitConfig,
  ip: string
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();

  const local = rateLimitLocal(cfg, ip, now);
  if (!local.ok) return local;

  if (env.CHAT_RL) return rateLimitKv(env.CHAT_RL, cfg, ip, now);
  return { ok: true, retryAfter: 0 };
}
