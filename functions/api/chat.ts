/// <reference types="@cloudflare/workers-types" />
//
// POST /api/chat  —  production chat backend for brohde.com (Cloudflare Pages Function).
//
// This is a FAITHFUL port of the validated POC at poc/chat/server.mjs, whose behavior is
// FROZEN (38/38 eval, decision #61). Do not change model behavior here. The system prompt
// and facts pack are NOT duplicated: scripts/build-chat-prompt.mjs reads the canonical
// files in poc/chat/ at build time (a prebuild step in `npm run build`) and emits
// ./_chat-prompt.generated.ts, imported below. Edit the prompt/facts in poc/chat/, never
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
  // Turnstile secret. When set, requests must carry a valid `turnstileToken`; when unset,
  // Turnstile is skipped (Phase B). Prod: a Pages secret named TURNSTILE_SECRET.
  TURNSTILE_SECRET?: string;
  // Optional KV namespace for durable per-IP rate limiting. Bind it as CHAT_RL in the Pages
  // dashboard (or wrangler.toml) once the namespace exists; until then the Function falls
  // back to a best-effort in-isolate counter.
  CHAT_RL?: KVNamespace;
}

const MODEL = "claude-haiku-4-5";
// $ per MTok: input / output / cache read / cache write (5m ttl). Verbatim from the POC.
const PRICE = { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 };

// Friendly, VOICE-clean operational fallback (no dashes; "chat", never "terminal"). The
// client renders `error` verbatim, so it has to read like the rest of the chat. Model-side
// deny/unknown wording lives in the prompt files, not here.
const OFFLINE = "chat is offline right now, email brian@brohde.com";

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
  usage: { input: number; output: number; cache_read: number; cache_write: number };
  cost: number;
}

// The single Haiku call (router + answer via tool use), ported from the POC's chat().
async function runChat(
  env: Env,
  message: string,
  history: Anthropic.MessageParam[]
): Promise<ChatResult> {
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    // Only pass baseURL when set; otherwise the SDK default (api.anthropic.com) holds.
    ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}),
  });

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8),
    { role: "user", content: message },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
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
    headers: { "content-type": "application/json", ...headers },
  });
}

// --- Phase B: abuse controls (#49 gate) --------------------------------------------------

// Friendly, VOICE-clean operational errors (no dashes; "chat"/"prompt", never "terminal").
const BLOCKED =
  "couldn't verify that request. refresh the page and try again, or email brian@brohde.com";
const THROTTLED =
  "too many messages right now. give it a minute, or email brian@brohde.com";

// Per-IP sliding-window rate limit. Two windows: a burst window and a daily cap. Tuned for
// a low-traffic portfolio chat, generous for a real visitor, tight on a flood.
const RL_MINUTE = { windowMs: 60_000, max: 10 };
const RL_DAY = { windowMs: 86_400_000, max: 60 };

// In-isolate fallback store, used ONLY when the CHAT_RL KV namespace is not bound (i.e.
// before it is created in the dashboard). Best-effort: it lives in one Worker isolate's
// memory, is not shared across isolates/PoPs, and resets when the isolate recycles. KV is
// the real backing store; this just blunts a burst locally and pre-KV.
const memBuckets = new Map<string, number[]>();

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

async function rateLimit(
  env: Env,
  ip: string
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();
  const key = `rl:${ip}`;

  let times: number[];
  if (env.CHAT_RL) {
    const raw = await env.CHAT_RL.get(key);
    times = raw ? (JSON.parse(raw) as number[]) : [];
  } else {
    times = memBuckets.get(key) ?? [];
  }

  // Drop anything outside the longest (daily) window, then measure both windows.
  times = times.filter((t) => now - t < RL_DAY.windowMs);
  const inMinute = times.filter((t) => now - t < RL_MINUTE.windowMs);

  if (inMinute.length >= RL_MINUTE.max) {
    const oldest = Math.min(...inMinute);
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((RL_MINUTE.windowMs - (now - oldest)) / 1000)),
    };
  }
  if (times.length >= RL_DAY.max) {
    const oldest = Math.min(...times);
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((RL_DAY.windowMs - (now - oldest)) / 1000)),
    };
  }

  times.push(now);
  if (env.CHAT_RL) {
    // KV min TTL is 60s; a day keeps the key alive across the daily window then self-expires.
    await env.CHAT_RL.put(key, JSON.stringify(times), { expirationTtl: 86_400 });
  } else {
    memBuckets.set(key, times);
  }
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

// -----------------------------------------------------------------------------------------

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let parsed: { message?: unknown; history?: unknown; turnstileToken?: unknown } = {};
  try {
    parsed = (await request.json()) as typeof parsed;
  } catch {
    // Malformed JSON: fall through to validation with an empty object.
  }
  const message = parsed.message;
  const history = Array.isArray(parsed.history)
    ? (parsed.history as Anthropic.MessageParam[])
    : [];

  // Input validation, verbatim from the POC (message required / string / <= 500 chars).
  if (!message || typeof message !== "string" || message.length > 500) {
    return json({ error: "message required (max 500 chars)" }, 400);
  }

  const ip = clientIp(request);

  // Rate limit first: the cheapest way to shed a flood before siteverify or the model call.
  const rl = await rateLimit(env, ip);
  if (!rl.ok) {
    return json({ error: THROTTLED }, 429, { "Retry-After": String(rl.retryAfter) });
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
    return json(out);
  } catch {
    // Upstream/SDK failure (timeout, 5xx, rate limit, bad key): friendly fallback, no
    // internals in the response body.
    return json({ error: OFFLINE }, 502);
  }
};
