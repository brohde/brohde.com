# Communications log

Running log of Brian ↔ Claude exchanges and delegated sub-agent work. Newest entries at the bottom. Summaries, not transcripts.

---

## 2026-07-15

**Brian (PLAN.md):** Kicked off the project. New portfolio site at brohde.com for potential clients: showcase work, link resume (+ maybe Twitter). Core is a blog-style archive — thought leadership (AI usage, tips) + project deep dives (goldcoastcapm.com, WP→Astro 4-hour migration, older big-name client work findable on archive.org). Homepage = article titles + dates, pre-dated posts. No personal branding but a unique look (type/color/layout/motion). Astro + Tailwind. Wants: studio model with documented reusable expert sub-agents, all decisions documented, comms log, session-resumable state at all times, concurrency via sub-agents, partnership-style pushback. First deliverable: **3 design concepts as an artifact.**

**Brian (mid-session):** Hosting on Cloudflare; repo goes on his personal GitHub, private for now.

**Claude:** Acknowledged. Set up repo scaffolding (README, CLAUDE.md, docs/, .claude/agents/ studio roster), logged decisions #1–7.

**Delegated → research (general-purpose, sonnet, background):** Investigate old brohde.com via archive.org (client names, old bio/title, portfolio content) + summarize goldcoastcapm.com. → **Returned:** 2018–2019 site had 5 case studies: **Facebook Newsroom (2014), Google Android for Work (2016)** — both via agency Beyond — Foundation for Peripheral Neuropathy (2016), NowNow React Native app for Treehouse Laboratories (2017), Platform Surfaces (2016). Older (~2009) portfolio names Kmart, Sears, Kenmore, Eureka. Old identity: "Full Stack Web Engineer," SF-based, very minimal black/white design (bold wordmark, three-link nav). goldcoastcapm.com: live wealth-management site for Gold Coast Capital Management (Dragan Mark Filipovic, CFA), navy/gold corporate design, built on Astro — a full-ownership solo freelance build. Full brief preserved in this log's context; key facts folded into decisions/content planning.

**Claude asked Brian (discovery Qs):** audience, professional identity, design tastes, motion appetite.

**Brian answered:** (1) Audience: **freelance client leads**. (2) Identity: LinkedIn headline is "**Founder, Eight Angle · Full-Stack Engineer · Building with AI**"; shared LinkedIn (linkedin.com/in/brian-rohde-4ba3558) and will provide resume. (3) Design taste: **all four** directions resonate (editorial, brutalist, warm minimal, playful). (4) Motion: open, from subtle to showpiece — and **raised the ask from 3 to 10 wildly different concepts**. Site will be light on images; Brian can source stock (e.g., homepage) if helpful; project articles will include screen grabs.

**Brian (mid-session, rapid-fire):** (a) Eight Angle (eightangle.com) is the **flagship project** — needs an article. (b) Shared his article-ideas list: Hawaii "luxe & affordable getaway" travel piece (Substack idea), WP→free-host migration + design refresh in under 4 hours, "alternatives to Squarespace" via Dragan's goldcoastcapm site, Eight Angle ML-model build. Noted he may publish unrelated content like travel. (c) Shared resume PDF (copied to `docs/reference/`). (d) **PostHog for site analytics.**

**Claude:** Fetched eightangle.com — iOS yoga practice tracker, on-device CV pose detection, subscription model. Read resume: "Full-stack engineer shipping AI products end to end"; Eight Angle founder (47-class classifier, 92.2% acc., Core ML ~20fps); Gong Staff Web Engineer (LLM translation workflow, replatform); Twilio Technical Web Lead (first localized site); Beyond agency (Facebook Newsroom, Google Android for Work — already public on resume). Created `docs/CONTENT.md` backlog; logged decisions #8–12. Raised open questions: Substack-vs-site canonical home, travel-content placement, article pre-dates.

**Delegated → 3 parallel design-director briefs (opus):** each producing 3–4 concept specs in an assigned family (A: editorial/warm-minimal, B: bold/brutalist/high-contrast, C: playful/kinetic/experimental) for the studio lead to curate into a 10-concept artifact. → *(see below)*
