# Decision log

Append-only. Newest at the bottom. Format: date — decision — rationale/source.

| # | Date | Decision | Rationale / source |
|---|---|---|---|
| 1 | 2026-07-15 | Stack: Astro + Tailwind CSS | Brian's current toolset; fits static content site (PLAN.md) |
| 2 | 2026-07-15 | Content model: blog-style archive; homepage lists titles + dates; optional description field | PLAN.md |
| 3 | 2026-07-15 | Articles will be pre-dated, including posts about older projects | PLAN.md — site is new but work isn't |
| 4 | 2026-07-15 | No personal logo/branding; distinctiveness via type, color, layout, motion | PLAN.md |
| 5 | 2026-07-15 | Hosting: Cloudflare (Pages) | Brian, 2026-07-15 |
| 6 | 2026-07-15 | Repo: private on Brian's personal GitHub | Brian, 2026-07-15 |
| 7 | 2026-07-15 | Studio model: Claude leads, delegates to reusable expert sub-agents; all comms + delegations logged; STATUS.md is the session-resume anchor | PLAN.md |
| 8 | 2026-07-15 | Design exploration widened from 3 to **10 wildly different concepts**, spanning subtle → showpiece motion | Brian |
| 9 | 2026-07-15 | Design must work image-light: no hero photography assumed; stock optional later; project articles carry screenshots | Brian |
| 10 | 2026-07-15 | Eight Angle (eightangle.com) is the flagship project and gets a dedicated deep-dive article | Brian |
| 11 | 2026-07-15 | Analytics: PostHog | Brian — already uses it (Eight Angle has a 60-event PostHog schema) |
| 12 | 2026-07-15 | Resume 2026 PDF stored at `docs/reference/` as source of truth for copy; site will link to a public resume (format TBD) | Brian shared the PDF |
| 13 | 2026-07-15 | Commits/PRs attributed to Brian only — no Claude co-author trailer, set Claude Code-wide + in-repo via `attribution` settings | Brian. Existing 2 commits keep old trailer (history rewrite blocked by permissions; harmless in private repo) |
| 14 | 2026-07-15 | Model policy: **Fable for all design work and all frontend work** (design-director + frontend-engineer agents set to fable) | Brian |
| 15 | 2026-07-15 | Team roster is **dynamic**: studio lead freely creates/refines/retires expert agents in service of the best work; roster changes update TEAM.md + agent defs together | Brian |
| 16 | 2026-07-15 | Brian's voice documented and maintained in `docs/VOICE.md`; binding for all published copy. Hard rule: **never use en dashes** | Brian; guide seeded from resume, LinkedIn, old site, PLAN.md |
| 17 | 2026-07-15 | Adopt prior-project conventions per `docs/reference/prior-project-conventions.md` (SEO component port, PostHog wiring incl. no-double-pageview gotcha, VT-safety rule, font discipline, Tailwind v4 via vite plugin, `astro check` in build, `_headers` security, prettier+astro, styleguide-page pattern). **Skip Keystatic entirely.** | Brian asked what to copy; studio-curated list, Brian may veto items |
| 18 | 2026-07-15 | **Dash ban is total**: no en dashes AND no em dashes, anywhere a reader sees (copy, UI, designs). VOICE.md v1.1 | Brian, twice; settled by his concept-04 feedback |
| 19 | 2026-07-15 | No single design direction picked yet. **Keep exploring 5 shortlisted directions independently** (build.log, Blackletter Modern, Quarterly, Eight Angle animations, Exposed Grid) before unifying. **Color palette iteration deferred** until the full direction is decided | Brian's round-1 review |
| 20 | 2026-07-15 | Production typeface for the Blackletter direction: **LL Circular Pro** (matches his resume). Files staged at `assets/fonts/circular/` (Book/Medium/Bold + italics, desktop TTFs). ⚠️ Web license (woff2) still needed from Lineto before production use | Brian supplied the files |
| 21 | 2026-07-15 | Facebook/Google framing everywhere: **projects for them via agency Beyond**, never implied employment | Brian's correction |
| 22 | 2026-07-15 | **Direction to develop: build.log.** Other directions parked, not dead | Brian |
| 23 | 2026-07-15 | **Chat greenlit: a real LLM**, cost-effective and accurate. Architecture per `docs/reference/chat-feasibility.md`: Claude Haiku 4.5 w/ prompt caching behind Cloudflare AI Gateway (provider-swappable), deterministic command layer for nav/known questions, facts-file grounding + eval set, Turnstile + rate limits + spend cap | Brian |
| 24 | 2026-07-15 | Chat UX: chatting "navigates away" from the homepage terminal-style (alternate screen), with an always-obvious way back; must be flawless on mobile | Brian |
| 25 | 2026-07-15 | Header links: **LinkedIn, resume, X** (X now confirmed in; handle TBD from Brian). Styled-up `$ whoami` header. **Concise about page** added to IA | Brian |
| 26 | 2026-07-15 | Art direction to explore for build.log: **aurora on white** with **two distinct state palettes** (home/terminal vs chat) morphing on state switch; glyph tide rebuilt **from Brian's images** (luminance-to-glyph, video possible); presence visualized as planes over the aurora, never over content | Brian's ideas; lab in progress |
| 27 | 2026-07-15 | LLM terminal build plan at `docs/reference/llm-terminal-plan.md`: clicks-are-commands + deterministic layer + Haiku tool-use router (open_page vs prose answer), curated facts pack with **Brian-owned deny-list** (no age/aggregate-YOE leakage), **mandatory validation gates V1-V5** before public | Brian's requirements incl. ageism constraint + validation phase |
| 28 | 2026-07-15 | **Full keyboard accessibility is a standing requirement** for the terminal concept; added to every build.log iteration + auditor checklist | Brian ("it's a terminal after all") |
| 29 | 2026-07-15 | Content production started: 5 case-study drafts in `docs/drafts/` (Eight Angle flagship, ATG LLM-migration, Gold Coast, Facebook Newsroom, Google Android for Work) via parallel copywriter agents; **no aggregate years-of-experience/age-revealing phrasing in any copy** | Brian's ask + constraint |
| 30 | 2026-07-15 | Chat model: **Claude Haiku 4.5** confirmed | Brian |
| 31 | 2026-07-15 | Deny-list clarified: never reveal Brian's **AGE** or anything enabling age math (birth/graduation year, career start, aggregate YOE). Name is public | Brian ("MY AGE. of course show my name") |
| 32 | 2026-07-15 | Ephemeral visitor-to-visitor chat: **parked** for v1 | Brian |
| 33 | 2026-07-15 | X handle: **@brianxbuilds**; wired into prototype + facts pack | Brian |
| 34 | 2026-07-15 | **Chat ships POC-first**: `poc/chat/` (real Haiku 4.5, facts pack, deny-list, page-vs-prose router, 26-question eval harness) validates behavior before any production build | Brian |
| 35 | 2026-07-15 | Glyph-pipeline test images: pulled 4 from stock (Picsum/Unsplash license) into `assets/images/glyph-source/`; Brian's own photos swap in later | Brian ("just pull a few from a stock photography site") |
| 36 | 2026-07-15 | build.log homepage **boot sequence**: first load starts blank with just the chatbox, "hello" auto-types, then the full homepage reveals as the terminal's answer. Once per session, skippable by any input, disabled under reduced motion, content stays crawlable | Brian |
| 37 | 2026-07-15 | Round 2 artifact split: parked directions (Quarterly/Blackletter/Exposed Grid) now a separate artifact; build.log review surface is the v3 prototype | Brian's ask |
| 38 | 2026-07-15 | **Header: treatment 1, the phosphor wordmark** (large mint mono wordmark w/ glow + CRT scanline texture, whoami bio lines beneath). Visible switcher removed; `header N` stays as a hidden dev command | Brian |
| 39 | 2026-07-15 | Header bio companies become links: eight angle, gong, twilio, beyond. Targets: eightangle.com, gong.io, twilio.com, bynd.com (studio pick, official sites; Brian may retarget any to internal case-study pages). External/new-tab, visually quiet in the bio lines, keyboard accessible | Brian's ask; targets recommended by studio |
| 40 | 2026-07-15 | **Site ships light AND dark modes, matching the user's system preference** (prefers-color-scheme). The aurora lab's "rejected" light ground is un-rejected: it becomes the light theme | Brian ("I love the white and dark modes. We should match the users system preference") |
| 41 | 2026-07-15 | Boot sequence plays on **every visit** to the homepage (was once per session). Documented for revisit if it grows tiresome | Brian ("each visit to the page, I think? Document that so we can revisit") |
| 42 | 2026-07-15 | Boot greeting is **"hello"**, and it replaces `$ whoami` as the header prompt line too | Brian |
| 43 | 2026-07-15 | Presence planes: the current visitor's own plane is visibly distinguished from others. Steering idea (arrow keys redirect your plane, possibly piggybacking on terminal navigation keys) to be explored, constrained by keyboard a11y (#28): arrows must never be hijacked from scrolling/inputs; likely an opt-in `fly` command | Brian's idea; a11y constraint from studio |
| 44 | 2026-07-15 | build.log ships **real prompt-style arrow-key behavior**: up/down recalls command history at the prompt; arrow keys move through log entries terminal-style. Must coexist with native scrolling and a11y (#28) | Brian ("user can navigate with their arrows like a prompt") |
| 45 | 2026-07-15 | Glyph tide folds into build.log; placement TBD from presented options (article heroes + right gutter recommended over full-page background). Per-page custom sources with transitions confirmed as the goal | Brian loves the matrix concept incl. the pose figure; ideas presented for discussion |
| 46 | 2026-07-15 | **Model policy amended (#14): Fable was for the direction/planning/POC phase only. Official build = Opus (design + frontend implementation) and Sonnet (content, audits, routine tasks), delegated per task.** design-director + frontend-engineer agents switched to opus | Brian ("Opus or Sonnet. Delegate the work appropriately") |
