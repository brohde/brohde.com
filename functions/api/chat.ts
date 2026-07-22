/// <reference types="@cloudflare/workers-types" />
//
// POST /api/chat: production chat backend for brohde.com (Cloudflare Pages Function).
//
// This is a FAITHFUL port of the validated POC at chat/server.mjs, whose behavior is
// FROZEN (38/38 eval, decision #61). Do not change model behavior here. The system prompt
// and facts pack are NOT duplicated: scripts/build-chat-prompt.mjs reads the canonical
// files in chat/ at build time (a prebuild step in `npm run build`) and emits
// ./_chat-prompt.generated.ts, imported below. Edit the prompt/facts in chat/, never
// here.
//
// Same-origin in production (the site and this endpoint share an origin), so no CORS
// headers are needed and the existing CSP `connect-src 'self'` already covers the browser
// fetch. The POC's dev-only CORS lived in its standalone http server and has no analogue
// here.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM } from "./_chat-prompt.generated";

interface Env {
  // Anthropic key. Prod: a Pages secret named ANTHROPIC_API_KEY (Dashboard →
  // Settings → Environment variables, encrypted). Local: .dev.vars (gitignored).
  ANTHROPIC_API_KEY?: string;
  // Optional SDK base-URL override, so Cloudflare AI Gateway can be wired later as pure
  // config (spend cap, logging, response cache, provider swap) with NO code change. Set
  // ANTHROPIC_BASE_URL to the gateway's Anthropic endpoint. See llm-terminal-plan.md §1/§5.
  ANTHROPIC_BASE_URL?: string;
  // Optional Cloudflare AI Gateway auth token (audit H1). Only needed if the gateway has
  // "Authenticated Gateway" enabled; when set, sent as the `cf-aig-authorization` header.
  // Unset for an unauthenticated gateway (the default) or direct api.anthropic.com, so the
  // AI Gateway remains a pure-config wire-up. See docs/reference/handoffs/chat-hardening.md.
  ANTHROPIC_GATEWAY_TOKEN?: string;
  // Turnstile secret. When set, requests must carry a valid `turnstileToken`; when unset,
  // Turnstile is skipped (Phase B). Prod: a Pages secret named TURNSTILE_SECRET.
  TURNSTILE_SECRET?: string;
  // Optional KV namespace for durable per-IP rate limiting. Bind it as CHAT_RL in the Pages
  // dashboard (or wrangler.toml) once the namespace exists; until then the Function falls
  // back to a best-effort in-isolate counter.
  CHAT_RL?: KVNamespace;
  // Debug flag (audit L2). When set to any non-empty value, success responses include the
  // `usage`/`cost` fields for local diagnostics. UNSET in production, so visitors never
  // receive token counts or internal cost figures. Set via .dev.vars locally if needed.
  CHAT_DEBUG?: string;
}

// Request-hardening limits (audit H2). Bound the total body, the message, and each history
// entry so a single request cannot carry hundreds of KB of billable input tokens.
const MAX_BODY_BYTES = 16_384; // reject the raw body over ~16 KB before parsing
const MAX_MESSAGE_CHARS = 500; // unchanged from the frozen POC (message length cap)
const MAX_HISTORY_ENTRIES = 8; // the model only ever uses the last 8 turns anyway
const MAX_HISTORY_ENTRY_CHARS = 2_000; // per-entry content cap

// Normalize an optional SDK base URL (audit H1). Trims whitespace and strips trailing
// slashes so the SDK's appended `/v1/messages` path lands cleanly. Works with the
// Cloudflare AI Gateway Anthropic endpoint shape:
//   https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic
// (a trailing slash there would produce a double-slash `//v1/messages` and 404).
function normalizeBaseUrl(u?: string): string | undefined {
  if (!u) return undefined;
  const trimmed = u.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

const MODEL = "claude-haiku-4-5";
// $ per MTok: input / output / cache read / cache write (5m ttl). Verbatim from the POC.
const PRICE = { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 };

// Friendly, VOICE-clean operational fallback (no dashes; "chat", never "terminal"). The
// client renders `error` verbatim, so it has to read like the rest of the chat. Model-side
// deny/unknown wording lives in the prompt files, not here.
// #183: brian@brohde.com comes off every visitor surface with Phase B. These
// operational-error bodies are content, not the frozen request/response SHAPE
// (#61), and are not exercised by the eval harness (it only grades the 200
// path), so dropping the address here keeps the removal complete without
// touching model behavior. Flagged in the Phase B handoff as a lead/Brian veto.
const OFFLINE = "chat is offline right now. please try again in a moment";

// The strict open_page navigation tool, ported byte-for-byte from the POC. `strict` is not
// part of the SDK's Tool type, so the array is cast; the wire request stays identical.
const tools = [
  {
    name: "open_page",
    description:
      "Navigate the visitor to a page on brohde.com. Use for broad asks about Brian or his work when a page answers better than prose.",
    strict: true,
    input_schema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          enum: ["about", "work", "eight-angle", "contact", "resume"],
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
] as unknown as Anthropic.Messages.ToolUnion[];

interface ChatResult {
  text: string;
  open_page: string | null;
  usage: {
    input: number;
    output: number;
    cache_read: number;
    cache_write: number;
  };
  cost: number;
}

// The single Haiku call (router + answer via tool use), ported from the POC's chat().
async function runChat(
  env: Env,
  message: string,
  history: Anthropic.MessageParam[]
): Promise<ChatResult> {
  const baseURL = normalizeBaseUrl(env.ANTHROPIC_BASE_URL);
  const gatewayToken = env.ANTHROPIC_GATEWAY_TOKEN?.trim();
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    // Only pass baseURL when set; otherwise the SDK default (api.anthropic.com) holds.
    // Normalized above so an AI Gateway URL with or without a trailing slash both work.
    ...(baseURL ? { baseURL } : {}),
    // Only for an Authenticated AI Gateway; inert (no header) otherwise, so the default
    // unauthenticated-gateway / direct wiring stays a pure config change (audit H1).
    ...(gatewayToken
      ? { defaultHeaders: { "cf-aig-authorization": `Bearer ${gatewayToken}` } }
      : {}),
  });

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8),
    { role: "user", content: message },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [
      { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    tools,
    messages,
  });

  let text = "";
  let open_page: string | null = null;
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
    if (block.type === "tool_use" && block.name === "open_page")
      open_page = (block.input as { slug?: string }).slug ?? null;
  }

  const u = response.usage;
  const cost =
    (u.input_tokens * PRICE.input +
      u.output_tokens * PRICE.output +
      (u.cache_read_input_tokens || 0) * PRICE.cacheRead +
      (u.cache_creation_input_tokens || 0) * PRICE.cacheWrite) /
    1_000_000;

  // Deterministic style guard: the dash ban (decision #18) is absolute, and the model
  // occasionally slips one through despite the prompt. Ported verbatim from the POC.
  return {
    text: text.trim().replace(/\s*[—–]\s*/g, ", "),
    open_page,
    usage: {
      input: u.input_tokens,
      output: u.output_tokens,
      cache_read: u.cache_read_input_tokens || 0,
      cache_write: u.cache_creation_input_tokens || 0,
    },
    cost,
  };
}

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    // Cache-Control: no-store on every API response (audit L3). This is a dynamic,
    // per-request endpoint; nothing here should ever be cached by an intermediary or a
    // future GET. `public/_headers` scopes its cache rules to static paths only.
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

// --- Phase B: abuse controls (#49 gate) --------------------------------------------------

// Friendly, VOICE-clean operational errors (no dashes; "chat"/"prompt", never "terminal").
const BLOCKED =
  "couldn’t verify that request. refresh the page and try again";
const THROTTLED = "too many messages right now. give it a minute";

// Per-IP sliding-window rate limit. Two windows: a burst window and a daily cap. Tuned for
// a low-traffic portfolio chat, generous for a real visitor, tight on a flood.
const RL_MINUTE = { windowMs: 60_000, max: 10 };
const RL_DAY = { windowMs: 86_400_000, max: 60 };

// In-isolate counter. Now used ALWAYS as a synchronous first gate (see rateLimit), not
// only as a KV fallback. It lives in one Worker isolate's memory, is not shared across
// isolates/PoPs, and resets when the isolate recycles, so it is not authoritative on its
// own. Its value is that the check-and-increment is fully synchronous (no await between
// read and write), which makes it atomic within a single isolate: a concurrent burst from
// one IP routed to the same isolate is counted deterministically and cannot all read the
// same pre-state. That closes the most common half of the M1 race; the cross-PoP half is
// backstopped by the KV gate below and, authoritatively, by the AI Gateway hard spend cap
// (H1). See docs/reference/handoffs/chat-hardening.md for the residual-risk writeup.
const memBuckets = new Map<string, number[]>();

function retryAfterFor(
  times: number[],
  window: { windowMs: number },
  now: number
): number {
  const oldest = Math.min(...times);
  return Math.max(1, Math.ceil((window.windowMs - (now - oldest)) / 1000));
}

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

// Synchronous in-isolate gate. No awaits between read and write, so it is atomic within a
// single isolate: concurrent requests from one IP interleave only at await points, and
// there are none here, so each request sees the increments of the ones before it.
function rateLimitLocal(
  ip: string,
  now: number
): { ok: boolean; retryAfter: number } {
  const key = `rl:${ip}`;
  const times = (memBuckets.get(key) ?? []).filter(
    (t) => now - t < RL_DAY.windowMs
  );
  const inMinute = times.filter((t) => now - t < RL_MINUTE.windowMs);

  if (inMinute.length >= RL_MINUTE.max) {
    return { ok: false, retryAfter: retryAfterFor(inMinute, RL_MINUTE, now) };
  }
  if (times.length >= RL_DAY.max) {
    return { ok: false, retryAfter: retryAfterFor(times, RL_DAY, now) };
  }

  times.push(now);
  memBuckets.set(key, times);
  return { ok: true, retryAfter: 0 };
}

// Durable cross-PoP gate, KV-backed. Read-modify-write, so it is best-effort under
// concurrency (KV has no atomic compare-and-set and reads are edge-cached ~60s). It is the
// authoritative store across isolates/PoPs; the synchronous local gate above catches the
// same-isolate burst that KV would miss. Residual cross-PoP race is documented in the
// handoff and bounded hard by the AI Gateway spend cap (H1).
async function rateLimitKv(
  kv: KVNamespace,
  ip: string,
  now: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const key = `rl:${ip}`;
  const raw = await kv.get(key);
  const times = (raw ? (JSON.parse(raw) as number[]) : []).filter(
    (t) => now - t < RL_DAY.windowMs
  );
  const inMinute = times.filter((t) => now - t < RL_MINUTE.windowMs);

  if (inMinute.length >= RL_MINUTE.max) {
    return { ok: false, retryAfter: retryAfterFor(inMinute, RL_MINUTE, now) };
  }
  if (times.length >= RL_DAY.max) {
    return { ok: false, retryAfter: retryAfterFor(times, RL_DAY, now) };
  }

  times.push(now);
  // KV min TTL is 60s; a day keeps the key alive across the daily window then self-expires.
  await kv.put(key, JSON.stringify(times), { expirationTtl: 86_400 });
  return { ok: true, retryAfter: 0 };
}

// Per-IP rate limit. Two gates, both must pass: a synchronous in-isolate gate (atomic per
// isolate, always on) and, when bound, the durable KV gate (authoritative cross-PoP). The
// effective limit is the tighter of the two. Neither gate alone is a hard cost ceiling; the
// AI Gateway spend cap (H1) is (see handoff M1).
async function rateLimit(
  env: Env,
  ip: string
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();

  const local = rateLimitLocal(ip, now);
  if (!local.ok) return local;

  if (env.CHAT_RL) return rateLimitKv(env.CHAT_RL, ip, now);
  return { ok: true, retryAfter: 0 };
}

// Cloudflare Turnstile (invisible bot check). The client posts a `turnstileToken` obtained
// from the Turnstile widget; we verify it server-side via siteverify.
//
// POLICY: if TURNSTILE_SECRET is unset, verification is SKIPPED (so dev and the current
// client keep working before keys exist). Once the secret is set, a missing or invalid
// token is rejected (403).
//
// PRODUCTION SETUP (dashboard): create a Turnstile widget for brohde.com, then store its
// secret as a Pages secret named TURNSTILE_SECRET (Settings -> Environment variables,
// encrypted). CLIENT (owned by the chat/terminal agent, added later): load the widget
// script https://challenges.cloudflare.com/turnstile/v0/api.js, render the widget with the
// public site key, and include the resulting token as `turnstileToken` in the POST body.
// The CSP in public/_headers already allows challenges.cloudflare.com in script-src and
// frame-src for exactly this.
async function verifyTurnstile(
  env: Env,
  token: unknown,
  ip: string
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true; // not configured yet: skip
  if (!token || typeof token !== "string") return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip && ip !== "unknown") form.append("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form }
  );
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

type HistoryResult =
  | { ok: true; history: Anthropic.MessageParam[] }
  | { ok: false };

// Validate client-supplied `history` server-side (audit H2 / M2). Enforces: an array of at
// most MAX_HISTORY_ENTRIES entries; each entry is {role: "user"|"assistant", content:
// non-empty string <= MAX_HISTORY_ENTRY_CHARS}; roles alternate. Reject (not sanitize) on
// any violation so a tampered shape gets a clean 400 rather than being silently reshaped.
// This bounds input-token cost and structurally backstops the assistant-prefill vector:
// roles are whitelisted (no `system` injection), content is a bounded string (no unbounded
// prefill, no non-string content blocks). The frozen prompt stays the behavioral defense;
// this is defense in depth. An absent history is valid and yields [].
function validateHistory(raw: unknown): HistoryResult {
  if (raw === undefined || raw === null) return { ok: true, history: [] };
  if (!Array.isArray(raw)) return { ok: false };
  if (raw.length > MAX_HISTORY_ENTRIES) return { ok: false };

  const history: Anthropic.MessageParam[] = [];
  let prevRole: string | null = null;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return { ok: false };
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return { ok: false };
    if (typeof content !== "string") return { ok: false };
    if (content.length === 0 || content.length > MAX_HISTORY_ENTRY_CHARS)
      return { ok: false };
    if (role === prevRole) return { ok: false }; // sane alternation
    prevRole = role;
    history.push({ role, content });
  }
  return { ok: true, history };
}

// -----------------------------------------------------------------------------------------

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Content-Type enforcement (audit L5): shed non-JSON traffic before touching the body.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "content-type must be application/json" }, 415);
  }

  // Body size bound (audit H2): reject an oversized body before parsing so a single request
  // cannot carry hundreds of KB of billable input tokens. Check the declared length first
  // (cheap), then the actual read (the header can be absent or lie).
  const declaredLen = request.headers.get("content-length");
  if (declaredLen !== null && Number(declaredLen) > MAX_BODY_BYTES) {
    return json({ error: "request body too large" }, 413);
  }
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    rawBody = "";
  }
  if (rawBody.length > MAX_BODY_BYTES) {
    return json({ error: "request body too large" }, 413);
  }

  let parsed: {
    message?: unknown;
    history?: unknown;
    turnstileToken?: unknown;
  } = {};
  try {
    parsed = JSON.parse(rawBody) as typeof parsed;
  } catch {
    // Malformed JSON: fall through to validation with an empty object.
  }

  // Input validation, unchanged from the POC (message required / string / <= 500 chars).
  const message = parsed.message;
  if (
    !message ||
    typeof message !== "string" ||
    message.length > MAX_MESSAGE_CHARS
  ) {
    return json({ error: "message required (max 500 chars)" }, 400);
  }

  // History validation (audit H2 / M2): array, roles, per-entry length, count, alternation.
  const historyResult = validateHistory(parsed.history);
  if (!historyResult.ok) {
    return json({ error: "invalid history" }, 400);
  }
  const history = historyResult.history;

  const ip = clientIp(request);

  // Rate limit first: the cheapest way to shed a flood before siteverify or the model call.
  const rl = await rateLimit(env, ip);
  if (!rl.ok) {
    return json({ error: THROTTLED }, 429, {
      "Retry-After": String(rl.retryAfter),
    });
  }

  // Turnstile (skipped until TURNSTILE_SECRET is set; see verifyTurnstile).
  if (!(await verifyTurnstile(env, parsed.turnstileToken, ip))) {
    return json({ error: BLOCKED }, 403);
  }

  // Missing key: degrade gracefully. Never leak that the key is absent beyond the friendly
  // line; the client can render it as a normal chat reply.
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: OFFLINE }, 503);
  }

  try {
    const out = await runChat(env, message, history);
    // Production responses carry text + open_page only (audit L2). usage/cost are internal
    // (token sizing + cost figures) and ship only when CHAT_DEBUG is set for local dev,
    // never to visitors. The client already gated its display on IS_LOCAL, so nothing
    // user-facing changes.
    const body: {
      text: string;
      open_page: string | null;
      usage?: ChatResult["usage"];
      cost?: number;
    } = { text: out.text, open_page: out.open_page };
    if (env.CHAT_DEBUG) {
      body.usage = out.usage;
      body.cost = out.cost;
    }
    return json(body);
  } catch {
    // Upstream/SDK failure (timeout, 5xx, rate limit, bad key): friendly fallback, no
    // internals in the response body.
    return json({ error: OFFLINE }, 502);
  }
};
