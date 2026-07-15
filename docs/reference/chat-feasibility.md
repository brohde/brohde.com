# Chat-interface feasibility: costs, options, presence ideas

Brian's idea (2026-07-15, sparked by the build.log concept): what if the portfolio site IS a chat interface? "Tell me about your work" / "How can I contact you?" Plus: show how many users are online, and light visitor-to-visitor interaction. This brief covers cost, architecture options, risks, and the studio recommendation.

## The short answer

Totally feasible, and cheap at portfolio traffic levels: roughly **$0.002 per chat reply** on Claude Haiku with prompt caching, or **effectively $0/month** on Cloudflare Workers AI's free tier. The real risks are not cost. They are (1) hallucination ("chat must be perfect"), (2) abuse of a public LLM endpoint, and (3) SEO, since a chat-only site is invisible to search engines and LLM crawlers, which contradicts our settled requirements. All three are solvable with the hybrid architecture below.

## Cost math

### Option A: Claude Haiku 4.5 (best quality per dollar)

Pricing: $1 per 1M input tokens, $5 per 1M output tokens. With prompt caching, cache reads are ~0.1x input price.

Setup: a cached system prompt (~5k tokens: bio, resume facts, project summaries, voice rules). Note: Haiku's minimum cacheable prefix is 4,096 tokens, so the facts pack must exceed that (ours will).

Per reply: ~5k cached read ($0.0005) + ~100 fresh input tokens (~$0.0001) + ~250 output tokens ($0.00125) = **~$0.002 per reply, or ~500 replies per dollar.**

| Monthly chat volume | Est. cost |
|---|---|
| 200 replies (realistic portfolio traffic) | < $0.50 |
| 1,000 replies | ~$2 |
| 10,000 replies (something went viral or wrong) | ~$20 |

### Option B: Cloudflare Workers AI (free tier, open source, native to our stack)

Llama and Mistral models run on Cloudflare's edge. Free allocation: **10,000 neurons per day**; a ~500-token reply costs ~400-600 neurons, so **~15-20 free replies per day, every day**, then $0.011 per 1,000 neurons (~$0.005-0.007 per reply). At portfolio traffic this rounds to $0/month. Quality is below Haiku, especially for nuanced questions about Brian's work.
Sources: [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [free plan limits](https://costbench.com/software/llm-api-providers/cloudflare-workers-ai/free-plan/).

### Option C: Cloudflare AI Gateway in front of everything (the "learn different LLMs" play)

AI Gateway is a free proxy layer: point the chat endpoint at it and swap providers (Claude, Workers AI Llama, others) with a config change. Gives caching of repeated questions, logs, rate limiting, and spend caps. **Recommended regardless of model choice**, and it directly serves Brian's goal of comparing LLMs; an A/B of Haiku vs Llama on real visitor questions would itself make a great article.

### Rejected: WebLLM (in-browser, $0)

Runs the model client-side. Zero API cost but a 1-2GB model download and poor mobile performance. Wrong tradeoff for a first-impression site.

## Making it "perfect" (the real work)

1. **Deterministic layer first.** Commands like `work`, `about`, `resume`, `contact` are answered instantly from structured data with zero LLM involvement: zero cost, zero latency, zero hallucination. The LLM only handles free-form questions. This also answers Brian's usability note: the terminal shows a visible menu of clickable commands, so projects/about are one click away and the interface stays discoverable, not a guessing game.
2. **Grounding.** System prompt = facts file (resume, project data, VOICE.md rules) + hard instruction to say "I don't know, email brian@brohde.com" rather than guess. No question outside the facts file gets a creative answer.
3. **Eval set.** ~30 expected questions with acceptable answers, run against any prompt/model change before deploy.
4. **Abuse control.** Cloudflare Turnstile (invisible CAPTCHA) + per-IP rate limits (e.g. 10 messages/hour) + short max_tokens + AI Gateway spend cap. A public LLM endpoint without this becomes someone's free API.
5. **Review loop.** Log every conversation to PostHog; review weekly, fold gaps into the facts file.
6. **SEO hybrid.** Static pages (articles, about, project pages) remain the canonical, crawlable site. The chat/terminal is the hero interaction layer on top, likely as the homepage centerpiece in the build.log direction. Search engines and LLM crawlers get clean HTML; humans get the show.

## Presence & multiplayer ideas (Brian's ask: "come up with more")

Tech backbone for all of these: **Cloudflare Durable Objects** with WebSocket hibernation (or PartyKit on top of it). At portfolio scale this is effectively free and stays on our stack. All anonymous, no accounts, no PII.

1. **Online counter, terminal-flavored.** Status line reads `3 guests online · 1 reading eight-angle`. Cheapest possible presence; ships in a day.
2. **`who` command.** Typing `who` in the terminal lists anonymous sessions: `guest_42 · reading: building-the-ml-model · 2m`. Presence as a native terminal feature rather than a widget.
3. **Visitors as constellation nodes.** Crossover with design concept 09: each live visitor is a node in the mesh background; nodes drift toward the article that visitor is reading. The homepage literally shows the site being read. Strongest single idea, and it makes the ambient animation *mean* something.
4. **Visitors as detections.** Crossover with concept 10: visitors appear as bounding-boxed detections with confidence chips (`visitor 07 · 0.99 · /work/eight-angle`). On-message with the CV flagship.
5. **Ephemeral reactions.** Press a key, a small ripple/emote radiates across every connected screen and fades. No chat between visitors, no moderation burden, just a spark of "someone else is here."
6. **Live cursors, Figma-style.** Anonymous cursor dots drifting on the page. Well-known trick, charming, moderate effort; can feel gimmicky if the rest of the page is busy.
7. **Site map with live dots.** A small diagram of the site's pages with a dot per visitor, moving as they navigate. The "map" version of #1.
8. **Tiny walking character.** An 8-bit figure per visitor wandering a strip at the footer. Cute and memorable, but the heaviest build and the most likely to read as a toy to a corporate client. Park it.
9. **Leave a mark.** After a chat, a visitor can drop one pixel into a slowly-filling mosaic or a one-line note in a `guestbook.log`. Persistence without moderation risk (needs a profanity filter if notes).

**Studio recommendation:** v1 = #1 + #2 + (#3 or #4 depending on which design direction wins). All three share one Durable Object; incremental cost ~zero. #5 as a fast follow. This also compounds into content: "How I added real-time presence to a static Astro site with Durable Objects" is a strong article.

## Recommended architecture (if Brian greenlights)

Astro static site (SEO canonical) → terminal/chat island on the homepage → Cloudflare Worker endpoint → AI Gateway → Claude Haiku 4.5 (primary) with Workers AI Llama as the comparison/fallback lane → Turnstile + rate limits + spend cap. Presence via one Durable Object. PostHog logs both chat transcripts and presence events.

**Status: exploration, not yet a decision.** Brian to confirm scope (v1 chat + which presence features) before build.
