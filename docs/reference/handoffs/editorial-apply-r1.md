# Handoff: editorial round 1, apply pass

_Content editor (Opus), 2026-07-17. Worktree: `.claude/worktrees/agent-a4e4e77501e374458`, branch `worktree-agent-a4e4e77501e374458`. Authority: `docs/reference/editorial-review-r1.md` (Brian: "I am good with the writing updates! Lets go.") + the apply brief + two mid-flight change orders (below). The lead merges._

Everything in this pass is applied and building. All unconfirmed numbers were left exactly as-is (still flagged). Frontmatter dates unchanged. Zero em/en dashes and zero "terminal" in every changed file (grep-verified). Nothing under `src/pages/`, `src/styles/`, `src/scripts/`, `src/layouts/`, or `docs/` (other than this handoff) was touched.

---

## Mid-flight change orders (from Brian, via the coordinator)

1. **gold-coast title** — do NOT use the report's ★ ("He designed his site in ChatGPT. I shipped it in Astro."). Brian wants the title to carry BOTH the ChatGPT design AND the migration "from Squarespace to Astro + LLM." Client-neutral (consent still pending). Applied a new title (options below). **Accuracy flag raised** (see Flags for Brian #1): the article body and repo sources support Squarespace only as a *positioning* ("alternatives to Squarespace"), not as an *origin platform* the site was migrated off.
2. **facebook-newsroom title** — Brian: "Keep A." The report's option A for this piece IS "keep the current title," so it stays unchanged. No edit.

---

## Scope A — titles applied

| Article | Before | After |
|---|---|---|
| twilio-hackpack-v4 | Re-Introducing the Hackpack v4: Twilio's Open Source Hardware Badge | Twilio Hackpack v4: co-authoring the open source hardware badge post |
| gold-coast | My client designed his site in ChatGPT. Here's what it took to ship it. | He designed his site in ChatGPT. I took it from Squarespace to Astro, LLM in the loop. |
| facebook-newsroom | Facebook's first WordPress site: rebuilding newsroom.fb.com | **(unchanged — report option A = keep)** |
| atg-llm-migration | 13 pages, one morning, zero mismatched captions: migrating anthonythomasgalante.com off WordPress | Migrating anthonythomasgalante.com off WordPress with Claude Code, in a morning |
| google-android-for-work | No jQuery allowed: building Android for Work on Google Closure | Android for Work: building Google's marketing site in Closure, no jQuery |
| brohde-com-build (draft) | How this site got made | One human, a studio of AI agents: how brohde.com got built |
| eight-angle-ml | Eight Angle: I built a 47-class yoga pose classifier that runs entirely on the phone | Eight Angle: a 47-class yoga pose classifier that runs on-device |

All six changed titles verified live in the built homepage log AND the RSS feed; Facebook's unchanged title also present in both. brohde-com-build stays `draft: true`, so it is correctly absent from the homepage/RSS.

### gold-coast title options considered (change order #1)
The strongest was applied; the others are here so the call stays Brian's:
- **APPLIED:** "He designed his site in ChatGPT. I took it from Squarespace to Astro, LLM in the loop." — keeps the approved first-person hook; carries all four beats (ChatGPT design, Squarespace origin, Astro build, LLM workflow); client-neutral.
- Alt B: "A ChatGPT-designed site, moved from Squarespace to a hand-built Astro build, with an LLM in the loop." — single sentence, snippet-friendly, slightly clunkier.
- Alt C: "He designed it in ChatGPT. I rebuilt it from Squarespace in Astro, LLM in the loop." — tightest.
- **Grounded alternative if the Squarespace-origin claim can't be confirmed** (see Flags #1): "He designed his site in ChatGPT. I built it in Astro instead of Squarespace, LLM in the loop." — matches the body's actual "alternatives to Squarespace" framing without asserting a migration.

## Scope B — house-rule (#116 "terminal") fix
- brohde-com-build description: "...and the terminal you are reading this on." → "...and the site you're reading this on." (banned word removed; also corrects the factual error that the article renders in the editorial column, not the chat surface).

## Scope C — poc/chat/facts.md corrections
1. **Site sections** — "work (case studies), about, resume, contact." → "home, about, the log (case studies), and chat. The resume is a downloadable PDF (resume.pdf). There is no separate contact page; contact is by email, linked from About." (removes the non-existent `/work` and `/contact`; matches the real routes `index`, `about`, `chat`, `log/[slug]`, `resume.pdf`).
2. **Removed** the unsupported "Speaks Spanish and Portuguese (Brazil) with working proficiency, alongside native English." line (no replacement invented).
3. **Removed** "Django and Python at Twilio" from the "learn any tool" examples list → now "(Closure at Google's insistence, Sanity and Next.js at Gong, Swift for Eight Angle)".
4. **Corrected** the Facebook follow-on overreach — "Brian built additional WordPress sites for Facebook after it." → "Beyond went on to build Year in Review and the Internet.org site for Facebook off the back of it." (matches `docs/CONTENT.md` row 4 + the article; keeps the agency-not-employer attribution to Beyond, not Brian personally).

Note: the Twilio blog-post title still quoted verbatim in facts.md ("Re-Introducing the Hackpack v4: Twilio's Open Source Hardware Badge") was left unchanged on purpose — that is the real title of Twilio's published post, a legitimate quotation, not our log entry's title. See Flags #4.

## Scope D — pre-date convention (dated postscripts)
Both historical pieces keep their historical dateline and body voice; all future-knowledge moved into a matching `## Postscript, 2026` block so this reads as a site convention.
- **facebook-newsroom (dated 2014-07-01):** the "roughly five years / folded into about.fb.com in November 2019" longevity sentence and the "what still holds up / a decade on / aren't how I'd build this today" reflection both moved out of the body into `## Postscript, 2026`. The 2014 "The result" section now ends period-correct (launch + first-WordPress/VIP + the Year in Review/Internet.org follow-on). "a decade on" → "More than a decade on" (2014→2026 ≈ 12 years, so "more than a decade" is the honest phrasing from the 2026 vantage).
- **google-android-for-work (dated 2015-09-01):** "## What still holds up" → "## Postscript, 2026"; "AngularJS and Closure aren't how anyone builds a marketing site today" → "More than a decade on, AngularJS and Closure aren't how anyone builds a marketing site" (present-tense-from-2015 anachronism removed; hindsight now timestamped to 2026).

## Scope E — concision (article files only; per report section 6)
- **gold-coast:** split the ~44w read-only-pass run-on after "in parallel."; rewrote the ~62w line-wrapping run-on and fixed "counted the line count" → "matched the line count"; de-duplicated "once he could see it" (dropped the second staging); "meet that exactness" → "meet that precision" and tightened the "ninth page" tail.
- **facebook-newsroom:** parenthesized the WordPress VIP appositive and split off the trailing "looking and behaving like Facebook" clause; split the theme/plugins sentence at "...on top of it."; split the i18n sentence after "eight languages total."; dropped the self-restating ", work that came directly from how this project went."; cut "or working around them" from the closer (now in the postscript).
- **atg-llm-migration:** cut the duplicate "That's the kind of judgment that doesn't delegate." (the piece's other judgment beat, "They were where the actual judgment happened.", still closes it); fixed the stacked-"and" parse in the two-hours sentence with a comma + parentheses.
- **google-android-for-work:** removed the duplicate "working closely with a designer and QA engineer" from the result sentence; "A fair amount of the work was relearning fairly basic..." → "Much of the work was relearning basic..."; removed the doubled "my usual toolkit" self-reference (second sentence now "...animated entirely without an outside library.").
- **eight-angle-ml:** split the scraper sentence after "no API keys."; split the MediaPipe-mapping sentence before "Both detectors now sit behind one shared protocol..."; split the PostHog sentence after "...persisted to Keychain."; split the 20fps/2fps sentence after "...at 2fps."; "looked more theoretically correct on paper" → "looked theoretically sound".

## Scope F — Facebook Newsroom images (decision #98 cleared)
Copied into `src/content/articles/facebook-newsroom/` (repo convention: one folder per article). Referenced as relative markdown images inside `<figure>` blocks (blank lines around the image so Astro's markdown pipeline still optimizes it — confirmed in the build: both emitted as hashed `.webp`, 386kB→42kB and 553kB→92kB). No new components added; used the existing `.prose` article layout and Tailwind's `img{max-width:100%}` preflight.
- **Figure 1 (lead) — `Timeline-Mobile.png`:** the touch "Our History" timeline on a phone (the article's named hard feature). Alt text describes the Aquila event card + the year scrubber. Caption + provenance: "...the same interaction on a phone as on a desktop. Captured in 2017, three years after launch, still running the theme I built in 2014."
- **Figure 2 — `Homepage-Localized.png`:** the Japanese edition (ja.newsroom.fb.com), carrying the i18n beat. Alt text describes the localized nav + featured story. Caption + provenance: "...one of seven language subdomains built on the same theme. Captured in 2017; still the template I shipped in 2014."
- Provenance framing is deliberate per the report/STATUS dating argument: these are 2017 captures of a site launched in 2014, and "same template three years on" reinforces the ~five-year-longevity point (which now lives in the 2026 postscript).
- **`Homepage-Mobile.png` (the optional third figure): NOT added.** It is another mobile homepage shot and would sit adjacent to the Japanese homepage figure, making two near-identical homepage captures. Given the concision mandate and a fairly short article, two strong, distinct figures read better than three. Easy to add later if the flow wants responsive evidence.

---

## Deferred / not applied (with reasons)

### Page-copy edits deferred (out of scope: `src/pages/` frozen until B2 structural work merges)
- **`src/pages/index.astro`, `about.astro`, `404.astro`:** the report's concision notes for these were NOT applied (brief scope E is article files only; the brief defers page copy until another workstream's structural changes merge). Pending for that workstream.
- **`src/pages/styleguide.astro` HARDCODES two old titles** (found via grep, left untouched per the "flag, don't edit pages" instruction):
  - line ~139: "Eight Angle: I built a 47-class yoga pose classifier that runs entirely on the phone" (old Eight Angle title) — update to "Eight Angle: a 47-class yoga pose classifier that runs on-device".
  - line ~146: "Re-Introducing the Hackpack v4" (old Twilio title fragment) — update to "Twilio Hackpack v4: co-authoring the open source hardware badge post" (or a shortened form).
  These are static sample rows in the styleguide, not the live log (the homepage/RSS pull titles dynamically and are already correct). Low urgency, but they will drift from the real titles until fixed.

### Report proposals intentionally NOT applied
- **Cross-piece closer differentiation (report §3c / §6):** the recommendation to rewrite the Facebook and Android closers so they stop landing the same "build inside the platform" moral is a substantive rewrite, not a line-editor before/after, so it's out of scope-E. I applied only the concrete concision cut ("or working around them") and, via the postscript relocation, kept both closers intact. Still open as a rewrite decision.
- **Android opener reorder (report §6 cross-piece):** "open on the google.com hook currently buried in paragraph 2" is a recommendation, not a concrete before/after — not applied.
- **facts.md redundant-bullet merge (report §6):** merging the two "ships end to end" Identity bullets was a line-editor concision note, but facts.md is not an article file (scope E is articles only), so NOT applied. Trivial to do if wanted.
- **`poc/chat/system-prompt.md:38` "terminal aesthetic" soft fix (report §4/§6):** out of this task's scope (scope C is facts.md only) and internal-only (never shown to visitors; the file already instructs the model never to call itself a terminal). Left untouched; flag it for a follow-up vocabulary sweep.
- **Optional concision splits** marked "optional/low priority" in the report (gold-coast line-18 colon list; atg line-16 colon list) — skipped; no concrete before/after was given and they read cleanly.
- **eight-angle title number-free variant (report option B):** not used; Brian's approved picks kept "47-class" (option A). Number stays flagged as unconfirmed.

### Per-article image gaps (no images added anywhere except facebook-newsroom, per brief)
Assets that would need to be gathered/cleared before these get figures:
- **eight-angle-ml:** Brian's 3 Eight Angle captures (per decision #132) — app screens (pose detection overlay, timeline, PiP). None embedded yet.
- **gold-coast:** the ChatGPT comps and/or the shipped goldcoastcapm.com pages (consent pending; no assets staged).
- **atg-llm-migration:** a before/after of anthonythomasgalante.com (consent pending; no assets staged).
- **google-android-for-work:** the Android for Work still is cleared by #98 but was not in this task's figure plan; `afw.mp4` cut-still is available in the legacy codebase (per the legacy-site README) if a figure is wanted. None embedded.
- **twilio-hackpack-v4:** external entry, no interior page — no figure applies.
- **brohde-com-build:** draft stub, needs a real writing pass before figures.

---

## Flags for Brian (need confirmation / follow-up)

1. **gold-coast title vs. body (from change order #1):** the applied title says "I took it from Squarespace to Astro," but the article body never establishes that the client's site was on Squarespace — it mentions Squarespace only once, as a positioning line ("The pitch for 'alternatives to Squarespace'..."). `docs/CONTENT.md` row 3 and `docs/COMMS-LOG.md` also frame the piece as "Alternatives to Squarespace," not a Squarespace-origin migration. Brian stated the Squarespace origin directly (owner knowledge), so the title was applied per the change order, but **the body needs a reconciling line** (e.g., establishing the site was previously on Squarespace) OR the title should switch to the grounded "built it in Astro instead of Squarespace" variant above. As written, title and body are in slight tension.
2. **Every pre-flagged unconfirmed number is untouched and still needs Brian:** Eight Angle 71.2 / 97.4 / 89.6→93.4 / -12.2% / 2,332 samples / decoy list / pricing; Gold Coast 435 comments / 8 pages / 2.7:1; ATG 34 caption pairs / 25 press mentions / 98-of-320 / 247.7MB→26.0MB / SiteGround $20. None edited.
3. **Consent still open (unchanged by this pass):** ATG (`draft: false`, names the client, domain, old host, old cost) and Gold Coast (consent pending; title kept client-neutral, no client name). Brian's items.
4. **facts.md Twilio quote:** kept verbatim as the real title of Twilio's post (a quotation, correct). Only our own log entry's title changed.
5. **390px render caveat (see Validation):** the browser session enforced a 500px minimum window width, so exact-390px was validated structurally (fluid images + no fixed-width containers) plus a clean render pass at 500px, not by direct 390px observation. A real-device or true-viewport spot check is the belt-and-suspenders follow-up if 390px precision matters.

---

## Validation

- **`npm run build` (runs `astro check`): PASS.** 0 errors, 0 warnings, 12 hints; 10 pages built. Both figure images optimized to `.webp` (386kB→42kB, 553kB→92kB), confirming the markdown-in-figure pattern is picked up by Astro's image pipeline.
- **House-rule grep on all changed files: clean.** Zero em dashes (—), zero en dashes (–), zero "terminal" (case-insensitive) across the 8 changed content/chat files.
- **Title propagation:** all six changed titles present in built `dist/index.html` (homepage log) and `dist/rss.xml`; Facebook's unchanged title present in both; no old titles anywhere in homepage/RSS; draft correctly excluded.
- **Figure HTML:** built `dist/log/facebook-newsroom/index.html` has exactly 2 `<figure>` + 2 `<figcaption>`, each `<figure>` wrapping `<p><img optimized webp, alt, width/height, loading=lazy></p>` + caption. Semantic and valid.
- **CSS structural check:** inlined CSS carries Tailwind preflight `img,video{max-width:100%;height:auto}`; no fixed (non-max) width ≥400px on any article container, so figures scale fluidly at any viewport.
- **Rendered check via Sonnet subagent** (browser-driven; I did not drive the browser): served `dist` on port 4380 via `astro preview`.
  - Homepage new titles: PASS.
  - Newsroom both figures + captions at desktop: PASS (images load, correct order, captions correct).
  - Newsroom at narrow width: PASS at 500px (the session's hard floor) — `scrollWidth == innerWidth`, no horizontal overflow, clean single column, both images load; exact-390px not directly observable (see Flags #5).
  - One retitled article page (gold-coast): PASS (H1 = new title, full body renders).
  - RSS new titles: PASS.

## Files changed
- `poc/chat/facts.md`
- `src/content/articles/twilio-hackpack-v4/index.md`
- `src/content/articles/gold-coast/index.md`
- `src/content/articles/facebook-newsroom/index.md` (+ `Timeline-Mobile.png`, `Homepage-Localized.png`)
- `src/content/articles/atg-llm-migration/index.md`
- `src/content/articles/google-android-for-work/index.md`
- `src/content/articles/brohde-com-build/index.md`
- `src/content/articles/eight-angle-ml/index.md`
- `docs/reference/handoffs/editorial-apply-r1.md` (this file)
