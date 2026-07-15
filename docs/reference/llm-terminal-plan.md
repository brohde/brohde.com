# LLM terminal: implementation plan

Companion to `chat-feasibility.md` (costs and provider research; read that first for the numbers). This doc is the build plan for the build.log chat, incorporating Brian's requirements from 2026-07-15: real LLM, cost-effective, accurate; terminal-style navigation where chatting leaves the homepage; LLM prompts can either load a page or answer in natural language; Brian has content constraints (e.g. nothing that enables age math) and wants a validation phase before anything goes live.

## 1. Options on the table (from the research, condensed)

| Option | Cost at portfolio traffic | Quality | Verdict |
|---|---|---|---|
| Claude Haiku 4.5 + prompt caching | ~$0.002/reply, ~500 replies per $1 | High, reliable instruction following | **Primary** |
| Cloudflare Workers AI (open-source Llama) | $0 up to ~15-20 replies/day (10k neurons/day free), then ~$0.006/reply | Medium | **Comparison lane / fallback** |
| Cloudflare AI Gateway (proxy in front) | Free | n/a | **Yes: swap providers, cache repeats, logs, spend cap** |
| In-browser WebLLM | $0 | Poor mobile, 1-2GB download | Rejected |

Realistic all-in monthly cost including presence infrastructure: **under $5/month**; hard ceiling enforced by an AI Gateway spend cap.

## 2. Interaction model (three layers)

**Layer 0: clicks are commands.** Clicking any link or menu item types its command into the terminal and executes it (Brian's idea: clicking About visibly runs `tell me about brian`, then the about screen loads). Pure theater plus consistency; zero LLM cost because clicks route deterministically.

**Layer 1: deterministic commands.** `work`, `about`, `resume`, `contact`, `help`, `home`/`exit`, plus article slugs. Instant, free, hallucination-proof. This layer is also the discoverability answer: the command menu is always visible, so projects/about are one action away.

**Layer 2: free-form questions go to the LLM, which can either navigate or answer.** Implemented with tool use: the model gets two tools.
- `open_page(slug)`: for broad asks ("tell me about Brian", "show me his work") the model calls this and the terminal navigates to the page.
- Natural-language answer: for specific questions ("does he do freelance?", "what stack does he use?") it answers in grounded prose, in the terminal, per the policy below.
The model decides page vs prose; ambiguous asks get a one-line answer plus the page. Router + answer is a single Haiku call (tool use), so no extra cost per message.

## 3. Accuracy and the policy layer (the "must be perfect" work)

1. **Facts pack is the only source of truth.** A curated markdown file (resume facts, project details, links, FAQ answers), maintained by Brian, versioned in the repo. The system prompt forbids answering outside it: unknown questions get "I don't know that one. Email brian@brohde.com."
2. **Deny-list, defined by Brian.** Certain facts are never volunteered or computed, regardless of how the question is phrased. Known so far: nothing that enables age math (no total years of experience, no career-start framing, no age). Individual project dates stay (they're on the site) but the model must not sum them ("he has X years of experience" is a banned construction; the deflection is "here's what he's shipped recently"). Brian adds constraints during validation; the deny-list is data, not code, so tightening it never needs a deploy.
3. **Adversarial evals.** The eval set includes direct and oblique attempts at denied facts ("how old is he", "when did he graduate", "add up his job history") plus prompt-injection attempts ("ignore your instructions"). A reply that leaks a denied fact fails the gate.
4. **Tone**: VOICE.md applies to the model's outputs (compressed, no hype, no dashes).

## 4. Validation phase (gate before anything public)

| Gate | What happens | Owner |
|---|---|---|
| V1 | Brian reviews/edits the facts pack + deny-list | Brian |
| V2 | Eval set built (~50 Qs: expected, edge, adversarial); run offline against Haiku and Llama | Studio |
| V3 | **Brian reviews the full transcript, refines constraints; repeat until he signs off** | Brian |
| V4 | Soft launch behind a flag; every conversation logged to PostHog; weekly review folds gaps into facts pack | Both |
| V5 | Public | Brian |

Nothing user-facing ships past V3 without Brian's sign-off. Post-launch, transcript review is a standing loop, so new constraints keep flowing in.

## 5. Abuse and cost control

Turnstile (invisible) on first message · per-IP rate limit (e.g. 10 msgs/hour) via Worker · max_tokens capped (~300) · AI Gateway cache for repeated questions + monthly spend cap · no conversation memory beyond the session (short context = low cost + less injection surface).

## 6. Presence (Brian's ideas, current stance)

Backbone: one Cloudflare Durable Object (WebSockets), ~free at this scale. Aurora-integrated visualization (planes over the aurora) is being explored in the design lab. Custom statuses: fun, allowed, but constrained (24 chars, profanity filter, ephemeral, rate-limited). **Visitor-to-visitor live chat that self-destructs after the session: technically easy, but it's a moderation surface on a client-facing portfolio; recommendation is to hold it out of v1** and revisit once presence-lite is live. Presence must never overlay the content column (Brian's own constraint).

## 7. Keyboard accessibility (standing requirement, "it's a terminal after all")

Everything operable without a pointer: single tab ring per screen, visible focus, Esc backs out of chat/about, `/` or `i` focuses the prompt, typed output announced via aria-live=polite, skip-to-content link, no focus traps, reduced-motion parity. Add to the seo-a11y-auditor checklist for every build.log iteration.

## 8. Build phases

P1: Astro scaffold + static terminal homepage w/ deterministic layer (no LLM yet, fully useful site). P2: Worker + AI Gateway + Haiku behind a flag; facts pack + evals; validation gates V1-V3. P3: chat public (V4-V5) + presence-lite (counter, `who`). P4: presence visualization (aurora planes) + statuses.

## Resolved (2026-07-15, Brian)

1. Model: **Claude Haiku 4.5 confirmed** as primary.
2. Constraint clarified: the model must never reveal Brian's **AGE** (or anything enabling age math: birth/graduation year, career start, aggregate years of experience). His name is obviously public and shown.
3. Ephemeral visitor chat: **parked**.
4. X handle: **@brianxbuilds** (wired into the v3 prototype).
5. Brian asked for a **POC first** to validate behavior before the full build: it lives at `poc/chat/` (real Haiku calls, facts pack, deny-list, page-vs-prose router, eval harness writing `transcript.md` for the V2-V3 gates). See `poc/chat/README.md`.
