// brohde.com chat POC: real Claude Haiku 4.5 behind the terminal.
// Run: ANTHROPIC_API_KEY=sk-... node server.mjs  →  http://localhost:8787
import Anthropic from "@anthropic-ai/sdk";
import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM =
  readFileSync(path.join(here, "system-prompt.md"), "utf8") +
  "\n\n# FACTS PACK\n\n" +
  readFileSync(path.join(here, "facts.md"), "utf8");

// load poc/chat/.env if present (ANTHROPIC_API_KEY=sk-ant-...), so the key
// lives in a gitignored file instead of shell history or a chat transcript
try {
  for (const line of readFileSync(path.join(here, ".env"), "utf8").split(
    "\n"
  )) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}
if (
  !process.env.ANTHROPIC_API_KEY ||
  /your-key/.test(process.env.ANTHROPIC_API_KEY)
) {
  console.error(
    "No real ANTHROPIC_API_KEY found. Paste it into poc/chat/.env as: ANTHROPIC_API_KEY=sk-ant-..."
  );
  process.exit(1);
}

const client = new Anthropic();
const MODEL = "claude-haiku-4-5";
// $ per MTok: input / output / cache read / cache write (5m ttl)
const PRICE = { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 };

const tools = [
  {
    name: "open_page",
    description:
      "Navigate the visitor to a page on brohde.com. Use for broad asks about Brian or his work when a page answers better than prose.",
    strict: true,
    input_schema: {
      type: "object",
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
];

export async function chat(message, history = []) {
  const messages = [...history.slice(-8), { role: "user", content: message }];
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
  let open_page = null;
  // (CORS for the dev site bridge is handled in the http server below)
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
    if (block.type === "tool_use" && block.name === "open_page")
      open_page = block.input.slug;
  }

  const u = response.usage;
  const cost =
    (u.input_tokens * PRICE.input +
      u.output_tokens * PRICE.output +
      (u.cache_read_input_tokens || 0) * PRICE.cacheRead +
      (u.cache_creation_input_tokens || 0) * PRICE.cacheWrite) /
    1_000_000;

  // deterministic style guard: the dash ban (decision #18) is absolute, and the
  // model occasionally slips one through despite the prompt; production keeps this
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

// Serve the POC UI + endpoint only when run directly (eval.mjs imports chat()).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const INDEX = readFileSync(path.join(here, "index.html"));
  // dev-only CORS: trust any localhost origin — the Astro dev site (4321) and
  // lead review previews on whatever port astro preview lands on. This server
  // is never deployed; production chat is same-origin via the Pages Function.
  const corsFor = (req) => {
    const o = req.headers.origin || "";
    return {
      "access-control-allow-origin": /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)
        ? o
        : "http://localhost:4321",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "origin",
    };
  };
  http
    .createServer(async (req, res) => {
      const CORS = corsFor(req);
      if (req.method === "OPTIONS") {
        res.writeHead(204, CORS);
        return res.end();
      }
      if (req.method === "GET") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return res.end(INDEX);
      }
      if (req.method === "POST" && req.url === "/chat") {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", async () => {
          try {
            const { message, history } = JSON.parse(body || "{}");
            if (
              !message ||
              typeof message !== "string" ||
              message.length > 500
            ) {
              res.writeHead(400, { "content-type": "application/json", ...CORS });
              return res.end(
                JSON.stringify({ error: "message required (max 500 chars)" })
              );
            }
            const out = await chat(
              message,
              Array.isArray(history) ? history : []
            );
            res.writeHead(200, { "content-type": "application/json", ...CORS });
            res.end(JSON.stringify(out));
          } catch (err) {
            res.writeHead(500, { "content-type": "application/json", ...CORS });
            res.end(JSON.stringify({ error: String(err.message || err) }));
          }
        });
        return;
      }
      res.writeHead(404).end();
    })
    .listen(8787, () => console.log("chat POC → http://localhost:8787"));
}
