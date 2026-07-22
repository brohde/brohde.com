/// <reference types="@cloudflare/workers-types" />
//
// POST /api/contact: the in-chat contact flow's backend (Cloudflare Pages Function).
//
// Phase B (#181/#182/#183). Two operations, one endpoint, chosen by `op`:
//
//   op "extract"  {text}                  -> {name, email, message}   (a small Haiku call
//                                            pulls the three fields out of one free-form
//                                            blob so the client can skip asks it already has)
//   op "send"     {name, email, message}  -> {ok:true}                (validates, writes a KV
//                                            backup, then delivers to brian@brohde.com via
//                                            the Resend REST API from a send.brohde.com from)
//
// This is its OWN file and never touches functions/api/chat.ts: the #61 chat contract (its
// request/response shape and the frozen model behavior) is untouched. What this shares with
// chat.ts is only the PATTERN (same Anthropic provider wiring incl. the AI Gateway env, the
// same per-IP rate-limit shape, the same KV binding FAMILY) and the same friendly-degrade
// posture: when a key is missing the endpoint answers so the client can tell the visitor
// delivery is unavailable, never a crash.
//
// Local dev: `wrangler pages dev dist` serves this at /api/contact. With no ANTHROPIC_API_KEY
// extraction returns 503 (client falls back to its deterministic asks); with no
// RESEND_API_KEY a send returns 503 (client tells the visitor delivery is unavailable right
// now). The Resend key exists ONLY as a Pages production secret; nothing here reads a .env.

import Anthropic from "@anthropic-ai/sdk";
// Shared helpers, deduplicated from chat.ts + contact.ts (audit-server proposal 1). The body
// cap, base-URL normalize, client construction, json(), clientIp(), the content-type / body
// preamble, and the rate-limit trio all live in _shared.ts now. contact keeps its own
// rate-limit tunables + `crl:` key prefix (passed as RateLimitConfig) and its own frozen
// error strings; the shared code never emits a contact response-body string. See _shared.ts.
import {
  makeAnthropic,
  json,
  clientIp,
  readValidatedBody,
  rateLimit,
  type RateLimitConfig,
} from "./_shared";

interface Env {
  // Anthropic key for the extraction call. Prod: the same ANTHROPIC_API_KEY Pages secret the
  // chat Function uses. Absent locally, so extraction degrades to 503 (the client copes).
  ANTHROPIC_API_KEY?: string;
  // AI Gateway wiring, identical to chat.ts so extraction rides the same spend cap + logging
  // with no code change (see docs/reference/handoffs/chat-hardening.md, audit H1).
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_GATEWAY_TOKEN?: string;
  // Resend API key for delivery. Prod: a Pages secret named RESEND_API_KEY (Brian pastes it
  // after creating the account + verifying send.brohde.com). UNSET locally, so a send
  // degrades gracefully to 503 rather than crashing.
  RESEND_API_KEY?: string;
  // The SAME KV binding the chat Function uses (audit family): per-IP rate-limit windows go
  // under a `crl:` prefix (kept separate from chat's `rl:` so the two never share a budget),
  // and every submission is backed up under a `contact:` prefix. No new namespace is
  // provisioned; a future split can move backups to their own binding (repo reorg #158).
  CHAT_RL?: KVNamespace;
  // When set to any non-empty value, error responses carry a short `detail` for local
  // diagnostics. UNSET in production, so visitors never see internals.
  CHAT_DEBUG?: string;
}

// Caps. Contact messages are longer than a chat turn (500), so the message cap here is 2000
// characters (documented per the brief); name and email are bounded tight. The whole request
// body is bounded before parse (the shared MAX_BODY_BYTES cap in _shared.ts) so a single
// call cannot carry hundreds of KB of billable input tokens through the extraction model.
const MAX_TEXT_CHARS = 2_000; // the extraction blob
const MAX_MESSAGE_CHARS = 2_000; // the contact message on send
const MAX_NAME_CHARS = 100;
const MAX_EMAIL_CHARS = 200;

const MODEL = "claude-haiku-4-5";

// A strict single-value email validator. The client runs the same shape; the server
// revalidates so a crafted body cannot deliver a malformed reply-to header.
const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- rate limit (shared machinery in _shared.ts, contact's own budget + key prefix) ------

// Generous enough for a real multi-turn flow (a couple of extraction calls plus one send),
// tight on a flood. The authoritative cost ceiling is the shared AI Gateway spend cap. The
// gate machinery (in-isolate + KV + the unified retryAfterFor) lives in _shared.ts; this is
// contact's own budget, keyed under `crl:` so it never shares a count with chat's `rl:`.
const RL: RateLimitConfig = {
  keyPrefix: "crl:",
  minute: { windowMs: 60_000, max: 15 },
  day: { windowMs: 86_400_000, max: 40 },
};

// --- extraction (the small Haiku call) ---------------------------------------------------

interface Extracted {
  name: string | null;
  email: string | null;
  message: string | null;
}

const EXTRACT_SYSTEM =
  "You extract contact details from one free-form message a website visitor typed to reach " +
  "the site owner. Return only what is present. Do not invent, guess, or complete missing " +
  "values: if a field is absent, return null for it. The `message` is what the visitor wants " +
  "to say to the owner, with any name and email lines removed; if the whole text is just a " +
  "name and an email with nothing to say, message is null. Names are personal names, not job " +
  "titles or company names.";

const extractTool = [
  {
    name: "extract_contact",
    description: "Return the visitor's name, email, and message.",
    strict: true,
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        message: { type: ["string", "null"] },
      },
      required: ["name", "email", "message"],
      additionalProperties: false,
    },
  },
] as unknown as Anthropic.Messages.ToolUnion[];

async function extract(env: Env, text: string): Promise<Extracted> {
  // Client construction is shared with chat.ts (audit H1): baseURL + gateway header wired
  // identically, so extraction rides the same AI Gateway spend cap with no code change.
  const client = makeAnthropic(env);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: EXTRACT_SYSTEM,
    tools: extractTool,
    tool_choice: { type: "tool", name: "extract_contact" },
    messages: [{ role: "user", content: text }],
  });

  let out: Extracted = { name: null, email: null, message: null };
  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "extract_contact") {
      const v = block.input as Partial<Extracted>;
      out = {
        name: typeof v.name === "string" && v.name.trim() ? v.name.trim() : null,
        email: typeof v.email === "string" && v.email.trim() ? v.email.trim() : null,
        message:
          typeof v.message === "string" && v.message.trim() ? v.message.trim() : null,
      };
    }
  }
  // Never let the model manufacture a malformed email past this point.
  if (out.email && !EMAIL_VALID.test(out.email)) out.email = null;
  return out;
}

// --- delivery (Resend REST) --------------------------------------------------------------

async function deliver(
  env: Env,
  name: string,
  email: string,
  message: string
): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "brohde.com contact <contact@send.brohde.com>",
      to: ["brian@brohde.com"],
      reply_to: email,
      subject: `New message from ${name} via brohde.com`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`,
    }),
  });
  return res.ok;
}

// Best-effort durable backup of every submission (the safety net if a Resend delivery is
// ever lost). Never throws into the request path: a KV hiccup must not fail a real send.
async function backup(
  env: Env,
  ip: string,
  name: string,
  email: string,
  message: string
): Promise<void> {
  if (!env.CHAT_RL) return;
  try {
    const key = `contact:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
    await env.CHAT_RL.put(
      key,
      JSON.stringify({ name, email, message, ip, ts: Date.now() }),
      { expirationTtl: 60 * 60 * 24 * 90 } // 90 days; the email is the primary record
    );
  } catch {
    /* backup is a nicety, never a hard dependency */
  }
}

// -----------------------------------------------------------------------------------------

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Content-type + body-size preamble (audit L5 / H2), shared with chat.ts: shed non-JSON and
  // oversized bodies before parsing. The byte-identical 415/413 responses live in _shared.ts.
  // What happens AFTER this differs deliberately: contact returns its own "invalid json" 400
  // on a malformed body (chat instead falls through to its message-required 400).
  const bodyCheck = await readValidatedBody(request);
  if (!bodyCheck.ok) return bodyCheck.response;
  const rawBody = bodyCheck.rawBody;

  let parsed: {
    op?: unknown;
    text?: unknown;
    name?: unknown;
    email?: unknown;
    message?: unknown;
  } = {};
  try {
    parsed = JSON.parse(rawBody) as typeof parsed;
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const ip = clientIp(request);
  const rl = await rateLimit(env, RL, ip);
  if (!rl.ok) {
    return json({ error: "too many requests, give it a minute" }, 429, {
      "Retry-After": String(rl.retryAfter),
    });
  }

  // ---- op: extract --------------------------------------------------------------------
  if (parsed.op === "extract") {
    const text = parsed.text;
    if (!text || typeof text !== "string" || text.length > MAX_TEXT_CHARS) {
      return json({ error: "text required (max 2000 chars)" }, 400);
    }
    // No key locally: degrade so the client falls back to its deterministic asks.
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "extraction unavailable", offline: true }, 503);
    }
    try {
      const out = await extract(env, text);
      return json(out);
    } catch (err) {
      return json(
        {
          error: "extraction failed",
          offline: true,
          ...(env.CHAT_DEBUG ? { detail: String((err as Error)?.message ?? err) } : {}),
        },
        502
      );
    }
  }

  // ---- op: send -----------------------------------------------------------------------
  if (parsed.op === "send") {
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
    const message = typeof parsed.message === "string" ? parsed.message.trim() : "";

    if (!name || name.length > MAX_NAME_CHARS) {
      return json({ error: "name required (max 100 chars)" }, 400);
    }
    if (!email || email.length > MAX_EMAIL_CHARS || !EMAIL_VALID.test(email)) {
      return json({ error: "a valid email is required" }, 400);
    }
    if (!message || message.length > MAX_MESSAGE_CHARS) {
      return json({ error: "message required (max 2000 chars)" }, 400);
    }

    // No delivery key (local dev, or a not-yet-configured prod): tell the client delivery is
    // unavailable right now. Never a crash; the visitor gets a friendly line.
    if (!env.RESEND_API_KEY) {
      return json({ error: "delivery unavailable right now", offline: true }, 503);
    }

    // Back the submission up FIRST, so even a failed delivery leaves a durable record.
    await backup(env, ip, name, email, message);

    try {
      const ok = await deliver(env, name, email, message);
      if (!ok) return json({ error: "delivery failed", offline: true }, 502);
      return json({ ok: true });
    } catch (err) {
      return json(
        {
          error: "delivery failed",
          offline: true,
          ...(env.CHAT_DEBUG ? { detail: String((err as Error)?.message ?? err) } : {}),
        },
        502
      );
    }
  }

  return json({ error: "unknown op" }, 400);
};
