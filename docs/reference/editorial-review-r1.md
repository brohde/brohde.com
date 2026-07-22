# Editorial review, round 1 (brohde.com)

_Head of Writing & Editorial · 2026-07-17 · READ-ONLY review. No site source files were edited. This report is the complete handoff; a fresh agent can apply approved changes from it without re-deriving anything._

## Scope + method

Reviewed: all 7 articles (`src/content/articles/*/index.md`), page copy (`src/pages/index.astro`, `about.astro`, `404.astro`), and chat grounding copy (`poc/chat/facts.md`, `poc/chat/system-prompt.md`). Fact-checked against `docs/reference/Brian-Rohde-Resume-2026.pdf`, `docs/reference/prior-project-conventions.md`, `docs/CONTENT.md`, `PLAN.md`, and git history. Nothing outside those + git counts as a fact.

Delegated (per the studio rule) and folded in below:
- **Fact-checker (sonnet)**: claim extraction + verification against the sources. Findings in "Per-piece fact-check" and cross-referenced in the tables.
- **Line editor (sonnet)**: concision pass + house-rule sweep. Findings in "Per-piece concision" and "House-rule sweep."

Everything here is **proposed only**. Round 2 applies what Brian approves.

---

## Top findings (read this first)

1. **Titles: the set is inconsistent against Brian's own formula** (client/logo + technology + work, concise). Two are already close (Facebook, Android), two are too long or too coded (ATG's triple-stack, Eight Angle's tail), one buries Brian's role (Twilio reads as Twilio's own marketing headline), one is generic (brohde-com-build). Full options table below.
2. **Pre-dating vs retrospective voice is the biggest integrity issue.** The Facebook piece is dated **2014-07-01** but talks about November 2019 and "a decade on"; the Android piece is dated **2015-09-01** but calls AngularJS/Closure the outdated way "anyone builds a marketing site today." A dateline cannot know its own future. Needs a convention decision from Brian (retrospective dateline, or a dated-postscript block).
3. **One hard house-rule violation in shipping copy**: the `brohde-com-build` description contains the word **"terminal"** ("the terminal you are reading this on"), which #116 bans in visitor-facing copy. (Article bodies are otherwise clean: zero em/en dashes across all content.)
4. **A live contradiction in the chat's grounding file.** `poc/chat/facts.md` claims "Site sections: work (case studies), about, resume, contact" — the real site has no `/work` route and no `/contact` page. Since this file is the chat's *only* source of truth, a visitor asking about site structure gets a wrong answer. Also in that file: two unsupported claims stated as fact (Spanish/Portuguese proficiency, "Django and Python at Twilio") and one overreach ("additional WordPress sites for Facebook" — sources only support Year in Review + Internet.org). Detail in section 5.
5. **ATG's client-consent gap is real and still open on a published article.** This isn't new (it's tracked in `docs/STATUS.md` and `docs/COMMS-LOG.md` already), but it bears repeating because the article ships `draft: false` today, naming Anthony Thomas Galante, his domain, his old host, and his old hosting cost, with the sign-off question from the original draft never answered. Same risk class as Gold Coast's pending consent, arguably higher exposure since Gold Coast is at least universally flagged as "pending."
6. **A pile of numbers have no verification receipt anywhere** and can only come from Brian: Gold Coast's "435 comments / eight pages / 2.7:1"; ATG's "34 caption pairs / 25 press mentions / 98 of 320 originals / 247.7MB→26.0MB" (ATG's timing figures, by contrast, WERE independently forensics-verified, see section 5); Facebook's exact figures are actually well-verified via Wayback research (also section 5). Most Eight Angle ML internals (2,332 samples, decoy classes, latency figures, v1.1.0) trace to Brian's own project repo per the drafting agent, not invention, but aren't checkable against this review's sources. Some Eight Angle numbers ARE grounded by the resume (47-class, 92.2%, ~20fps, 60-event PostHog, 70+ docs, the restricted entitlement, 89.6%→93.4%). Full tier-by-tier detail in section 5.
7. **Matrix identity: the homepage default borrows Eight Angle's "8", muddying site identity vs flagship.** Recommend the site get its own letterform mark and free the 8/logo/pose for Eight Angle. The "f"/"G" letterform approach for client pages is correct and stays on the safe side of the #45/#59 trademark line; extending it to Twilio/ATG/Gold Coast needs new letterform drawers, not client logos.
8. **Cross-piece redundancy**: the Facebook and Android closers land nearly the same moral ("read the platform's rules first, build inside them"). They're genuinely similar projects, but the two takeaways shouldn't be near-identical.

---

## 1. Title proposals (headline deliverable)

Formula (Brian): **client/logo + technology + work, concise.** Sentence case. No em/en dashes. My pick is marked ★; alternatives follow so subjective calls stay Brian's.

### twilio-hackpack-v4  (external link; `external:` entry)
**Current:** "Re-Introducing the Hackpack v4: Twilio's Open Source Hardware Badge"
_Problem: this is Twilio's own post title (launch voice, Title Case), and it hides Brian's actual role, which is co-author. As a portfolio log entry it should surface his contribution._

- ★ **A. "Twilio Hackpack v4: co-authoring the open source hardware badge post"** — client (Twilio) + tech (open-source hardware badge) + work (co-authored the post); signals it's a byline, honest about scope.
- B. "Co-authored on the Twilio blog: the Hackpack v4 open source badge" — leads with the work + venue, useful for an outbound link.
- C. "The Hackpack v4: I co-wrote Twilio's open source hardware badge post" — first person, most explicit about role.
- D. "Twilio's open source conference badge, the Hackpack v4 (co-authored post)"

_Note: claims only support co-authoring the blog post, not building the badge. Keep the title on "the post," not "the badge I built." Since it's external, "on the Twilio blog"/"post" reads as a pointer, which is correct._

### gold-coast
**Current:** "My client designed his site in ChatGPT. Here's what it took to ship it."
_The hook is strong and honest (curiosity-led, first person). Weakness vs formula: no build tech named, no client. **Consent caveat:** this piece pends the client's consent, so the title should NOT name Gold Coast Capital until that clears. Client-neutral options below; a named variant only if consent lands._

- ★ **A. "He designed his site in ChatGPT. I shipped it in Astro."** — keeps the hook, adds the two technologies, states the work, first person, tight. Consent-safe.
- B. "From ChatGPT comps to a shipped site, built in Astro" — descriptive, snippet-friendly.
- C. "A client designed his site in ChatGPT: what shipping it in Astro took" — closest to the current, tightened.
- D (only if consent lands): "Gold Coast Capital: shipping a ChatGPT-designed site in Astro" — names the client/logo per the formula.

_Note: "435 review comments" and "Pastel" are strong but unconfirmed/detail-level; keep them out of the title until the numbers are Brian-confirmed. Avoid the "$20 → $0" style hook here (that's the ATG piece)._

### facebook-newsroom
**Current:** "Facebook's first WordPress site: rebuilding newsroom.fb.com"
_Already close to the formula: client (Facebook) + tech (WordPress) + work (rebuilding newsroom.fb.com), with a true, resume-grounded hook ("first WordPress / first responsive consumer site on WordPress VIP"). Validated; options mostly pull in VIP or the migration/i18n scope._

- ★ **A. (keep) "Facebook's first WordPress site: rebuilding newsroom.fb.com"** — it works; don't fix what isn't broken.
- B. "Rebuilding newsroom.fb.com: Facebook's first site on WordPress VIP" — adds the enterprise-bar detail (VIP), which is a differentiator.
- C. "newsroom.fb.com: Facebook's first WordPress site, migrated without losing a post" — surfaces the migration discipline (the piece's real spine).
- D. "Facebook's newsroom on WordPress VIP: a from-scratch responsive rebuild"

_Note: do NOT put "eight languages" in the title, that count is not in the sources (see fact-check). "Migrated without losing a post" is safer than a specific number and is the honest claim the body makes. Framing: title says "rebuilding," not "I worked at Facebook," so #21/#79 (agency work via Beyond) holds; the body carries the agency detail._

### atg-llm-migration
**Current:** "13 pages, one morning, zero mismatched captions: migrating anthonythomasgalante.com off WordPress"
_Longest title in the set (Brian wants concise, especially here). "Zero mismatched captions" is cryptic cold, it only pays off after reading. And the actual differentiator, the migration run through Claude Code with Brian as the only human, is missing from the title entirely._

- ★ **A. "Migrating anthonythomasgalante.com off WordPress with Claude Code, in a morning"** — client + tech (Claude Code, WordPress) + work (migration) + the true "one morning" hook.
- B. "13 pages off WordPress in a morning: an agent-run migration for anthonythomasgalante.com" — keeps the page count, surfaces the agent workflow.
- C. "anthonythomasgalante.com: a WordPress-to-Astro migration, run by agents, checked by hand" — states the human-in-the-loop thesis, which is the piece's argument.
- D. "One morning, nothing lost: a Claude Code migration off WordPress for a fashion designer" — client-type + tech + integrity hook.

_Note: keep the "$20 → $0" and "13 pages" specifics out of the title (SiteGround $20 is unconfirmed; 13 is a detail). "Nothing lost" beats "zero mismatched captions" as a cold hook. Slug is `atg-llm-migration`, so the LLM/Claude Code angle belongs in the title._

### google-android-for-work
**Current:** "No jQuery allowed: building Android for Work on Google Closure"
_Good: client (Google/Android for Work) + tech (Closure, no jQuery) + work (building). "No jQuery allowed" is an honest, curiosity-led hook (the piece is literally about the constraint). Minor: it front-loads a negative and buries the client/product. The formula prioritizes client/logo, so a variant leads with the product._

- ★ **A. "Android for Work: building Google's marketing site in Closure, no jQuery"** — leads with the product (better scan + formula), keeps the jQuery hook.
- B. (keep) "No jQuery allowed: building Android for Work on Google Closure" — the current; the hook is genuinely good.
- C. "On google.com, in Closure: building the Android for Work marketing site" — leads with the hardest constraint (shipping on google.com itself).
- D. "Building Google's Android for Work site inside Closure and AngularJS" — plainest, most literal.

### brohde-com-build  (`draft: true`)
**Current:** "How this site got made"
_Generic; no tech, no specific hook, doesn't follow the formula. It's a draft, so full latitude. Client/logo = the site itself; tech = Astro + Cloudflare + a studio of Claude Code agents + the site chat._

- ★ **A. "One human, a studio of AI agents: how brohde.com got built"** — states the thesis (the interesting part), self-referential client, concrete.
- B. "Building brohde.com: Astro, Cloudflare, and a studio of Claude Code agents" — names the stack, formula-clean.
- C. "The site as the case study: building brohde.com with Claude Code agents"
- D. "How brohde.com got built, by a studio of agents and one human"

_**Must fix regardless of title:** the description "A studio of AI agents, one human, and the terminal you are reading this on." violates #116 ("terminal"). And it's inaccurate: this article is read in the editorial column, not on the chat surface. Proposed description: "A studio of AI agents, one human, and the site you're reading this on." (or drop the trailing clause)._

### eight-angle-ml  (flagship)
**Current:** "Eight Angle: I built a 47-class yoga pose classifier that runs entirely on the phone"
_Decent and metric-first: product (Eight Angle) + tech (on-device classifier) + work (built + trained). Long tail ("that runs entirely on the phone"). **Caveat:** "47-class" is on the unconfirmed list (47 classes vs 49 poses); 92.2% is too. The article already leads with these in its stat band (#86), so the title isn't adding new exposure, but if Brian revises the numbers the title moves with them._

- ★ **A. "Eight Angle: a 47-class yoga pose classifier that runs on-device"** — tightens the current tail; keeps the metric (pending confirmation).
- B. "Eight Angle: I trained an on-device classifier to name your yoga pose" — drops the unconfirmed number, benefit-led, concrete ("name your pose").
- C. "Eight Angle: on-device yoga pose detection, no server, no cloud" — leads with the privacy/architecture thesis (the piece's spine).
- D. "Building Eight Angle: a 47-pose, 92.2%-accurate classifier that runs on the phone" — most metric-dense (both numbers; both pending confirmation).

_Recommendation: A if Brian confirms 47; B if he wants a number-free headline while the count is unsettled._

---

## 2. Matrix identity recommendations

**How the system works (from the code):** `src/scripts/scene/index.ts` defines themes → accent (`PEAKS`) and themes → mark (`THEME_SOURCE`); `sources.ts` holds the mark drawers. Today the homepage renders the `default` theme (mark `eight` = the "8", mint accent). **Article pages do NOT yet carry the themed scene** — they render a slug-seeded `TideBand` facade (`TideBand.astro`); wiring per-article marks + per-page grounds is B3 (#111/#74), still ahead. So the table below is the **spec B3 will consume**, plus a review of the four themes already defined in the module.

**The trademark line (per item), from #45/#59 vs #98:** #98 cleared documentary **screenshots** only. Using a real brand **mark** as a decorative tide source is still open (#45/#59). My rule for every item:
- **Brian's own iconography** (Eight Angle's 8, logo, pose figure) = he owns it, **safe** to use as a real mark.
- **Third-party clients** (Facebook, Google, Twilio, ATG, Gold Coast) = use a **plain mono letterform** ("f", "G", "t", "a", "g"), never the client's logo. A letterform is a character, not a mark, so it sidesteps #45/#59. This is exactly what the existing "f"/"G" do.
- **Accent color** is lower-risk than a mark and already has precedent (#74 set newsroom = Facebook blue). Brand-evocative color + a neutral letterform reads as "the client" without reproducing anything. Keep color choices brand-adjacent, but never pair a client's exact logo geometry with its exact brand color (that combination imitates the mark).

### Recommendations table

| Page / article | Glyph (mark) | Accent | New drawer? | Trademark verdict |
|---|---|---|---|---|
| **Homepage (default)** | ⚠️ **Change**: a site letterform ("b" / the wordmark / the `>` prompt caret), NOT the "8" | Mint green (keep; the phosphor signature) | Yes (site mark) | Safe (Brian's own). See finding below. |
| **about** | Site default mark (same as homepage) | Mint green | No (inherits default) | Safe (Brian's own). |
| **404** | Site default mark (or a playful "?" for "not found") | Mint green | Optional ("?") | Safe. |
| **brohde-com-build** | Site default mark (this piece IS the site talking about itself) | Mint green | No (inherits default) | Safe. |
| **eight-angle-ml** | `logo` (keep) — or `pose` (astavakrasana) as the hero variant | Teal (keep) | No | **Safe** — Brian owns Eight Angle's marks. |
| **facebook-newsroom** | `f` letterform (keep) — mono char, not the FB logo | Newsroom blue (keep) | No | **Safe** — letterform + brand-adjacent color, on the right side of #45/#59. |
| **google-android-for-work** | `G` letterform (keep) — mono char, not the 4-color Google G | Android green (keep) | No | **Safe** — but do NOT render the literal four-color Google "G"; that specific combination imitates the mark. Single-ink mono G stays safe. |
| **atg-llm-migration** | `a` letterform (or "atg" monogram) — new drawer | Warm neutral / bone-on-ink (ATG's brand is monochrome) | Yes | **Safe** — letterform; honors the client's monochrome identity. Flag: a near-neutral accent reads close to default, design-director to differentiate. |
| **gold-coast** | `g` (or "gc" monogram to disambiguate from Android's `G`) — new drawer | Gold (navy ground if per-page grounds ship) | Yes | **Safe** — letterform. **HOLD until client consent** (piece is unpublished pending the client's consent). Flag: gold may collide with the site's chat-state amber; differentiate. |
| **twilio-hackpack-v4** | `t` letterform — new drawer | Twilio red | Yes | **Safe** — letterform. **But:** this is an `external:` entry with no interior page, so it likely needs no scene identity at all. Assign only if it ever gets an on-site landing/excerpt. |

### Review of the existing four (in the module today)

- **default → "8" + mint:** the accent (mint) is right (it's the phosphor/site signature). The **mark is the problem**: the "8" is Eight Angle's number, so the homepage currently wears the flagship's identity instead of the site's. Two extra reasons to change it: (a) decision #4 bans a personal logo, and the brief's "site default = the brohde logo" has no referent, so a lowercase letterform ("b"/wordmark/prompt caret) is the on-brand resolution (matches the "brian rohde" lowercase wordmark, #115); (b) "8" is literally the second-densest glyph in the tide ramp (`RAMP = [" ",".","·",":","~","+","x","8","#"]`), so an "8" mark can visually melt into the field. **Recommend:** give the site its own letterform default; hand the 8 back to Eight Angle's world.
- **eight → `logo` + teal:** correct and safe (Brian's own mark; teal matches the live app). Keep. Consider the `pose` figure (already drawn, currently unmapped to any theme) as the hero-band variant — a yoga pose for a yoga app is the most evocative mark available and costs nothing (it exists in `sources.ts`).
- **news → `f` + newsroom blue:** correct. The "f" is a mono letterform, not Facebook's logo; the blue is brand-evocative color (precedent #74). Squarely on the safe side of #45/#59. Keep.
- **android → `G` + Android green:** correct with one guardrail. The mono "G" is safe; keep the green. Do not let a "Google quartet" treatment become a literal four-color Google "G" — quartet **sky color** is fine (it's atmosphere, not a mark), a four-color letter is not.

_Implementation note for B3: new themes (twilio/atg/goldcoast + a site-default distinct from `eight`) each need a `PEAKS` entry, a `THEME_SOURCE` entry, a new source drawer in `sources.ts`, and a per-page ground palette (#74). That's engineering scope, flagged here so the spec is complete._

---

## 3. Pre-dating convention + voice + redundancy

### 3a. Pre-date vs retrospective voice (needs a Brian decision)

Decision #3 pre-dates posts about old projects. But two pieces are written in **retrospective voice inside a historical dateline**, which is internally contradictory:

- **facebook-newsroom (dated 2014-07-01):**
  - "...before Facebook folded it into a broader corporate site, about.fb.com, in **November 2019**." A July-2014 article can't cite Nov 2019.
  - "The interesting part of this project, **a decade on**, isn't the tech." Not possible from 2014.
  - "WordPress VIP's review process and a jQuery-era timeline widget **aren't how I'd build this today**." Present-tense retrospection from a 2014 dateline.
- **google-android-for-work (dated 2015-09-01):**
  - "AngularJS and Closure **aren't how anyone builds a marketing site today**, mine included." In 2015 AngularJS was current; calling it dated is anachronistic for the dateline.

**Options for Brian (recommend one, then round 2 applies it consistently):**
1. **Retrospective dateline** — date these to when they were actually written (recent), keep the strong "what still holds up" voice. Cleanest fix; the homepage log then shows a recent date for a historical subject (the subject year lives in the first line: "In 2014, I led...").
2. **Dated-postscript block** — keep the historical dateline, move all forward-looking passages ("a decade on", the Nov 2019 fate, the "today" comparisons) into a clearly labeled "Postscript, 2026" block. Preserves both the pre-date and the retrospective payoff.
3. **Write in-period** — strip every forward reference so a 2014/2015 article only knows 2014/2015. Loses the best material ("what still holds up"), not recommended.

_My recommendation: option 2 (dated postscript) for the two historical pieces, so the pre-date convention survives and the retrospective insight is honestly timestamped. Eight Angle (2026-02-12), Gold Coast (2026-06-30), ATG (2026-07-11), Twilio (2018-10-25, within his Senior Web Engineer tenure) have no such tension._

### 3b. Voice consistency

Strong and consistent across the set: first person, concrete, metric-first, no wind-ups, plain tech nouns. It reads like one sharp practitioner. Minor notes:
- The Android description is the most generic ("...entirely inside Google's internal CMS, JavaScript libraries, and code standards"). Could name Closure/AngularJS the way the other descriptions name their stack.
- Descriptions are otherwise tight and one-sentence (good for humans + snippets). Gold Coast's runs long (two clauses on a semicolon) but stays inside one sentence; acceptable.

### 3c. Cross-piece redundancy

- **The Facebook and Android closers are near-duplicates.** Facebook: "read the platform's rules first, then build inside them, rather than fighting them." Android: "read the constraints first, pick the smallest solution that satisfies them... don't smuggle in your own preferences." Same thesis, same shape, two pieces that already resemble each other (both Beyond agency, both platform-constrained). Differentiate: let Facebook own **migration integrity + i18n discipline** (don't lose a post; ship in many languages) and Android own **relearning basic habits in someone else's rulebook** (the Closure/no-jQuery constraint as a craft story). Keep one clean statement of the shared "build inside the platform" thesis, not two.
- **"Judgment is what doesn't delegate"** recurs in ATG, Gold Coast, and Eight Angle. This is Brian's core thesis (it's literally his resume line: "AI multiplies my output; taste and engineering judgment decide what ships"), so keep it as a throughline, but vary the phrasing/angle per piece so three closers don't land the identical beat in identical words.
- Strongest opener in the set: **Gold Coast** ("A client showed up with eight finished page designs. He'd made every one of them himself, in ChatGPT..."). Weakest: **brohde-com-build** (stub, "Draft under review.") and the Twilio external stub. Facebook and Android open well with "In 2014/2015, I led/built...".

---

## 4. House-rule sweep

Independent grep + line-editor pass. Bodies are clean; the issues cluster in metadata and the chat grounding doc.

- **Em/en dashes:** **zero** across all article bodies, page copy, and chat facts. Clean. (Note: `BaseLayout.astro` carries em dashes in code comments per STATUS.md known-debt; out of this review's content scope but worth the separate sweep already logged.)
- **"terminal" (#116 ban):**
  - `src/content/articles/brohde-com-build/index.md:3` (description) — "the terminal you are reading this on." **Visitor-facing violation.** Fix proposed in the title section.
  - `poc/chat/system-prompt.md:38` — "the site has a terminal aesthetic." Internal grounding doc (never shown to visitors), and it correctly instructs the model "never call yourself a terminal to visitors." Still stale per #116's studio vocabulary. **Soft fix:** "the site has a chat/prompt aesthetic (it deliberately mimics Claude and ChatGPT)". Low priority, but this review covers the chat grounding copy.
- **Banned hype words** ("passionate", "innovative", "seamless", "cutting-edge", "leverage" as verb): **none** in the copy. The only grep hits are inside `system-prompt.md`'s own list of banned words (the rule itself, not a violation).
- **Sentence case:** article/page copy is compliant. The one Title Case title is the Twilio external entry, which mirrors Twilio's own post title; the reframe (section 1) moves it to sentence case.
- **404 voice note (not a rule violation):** the H1 "Command not found" and "That page is not on the log" are shell/terminal metaphors. The word "terminal" doesn't appear, so no #116 breach, but the shell framing sits slightly against #116's "this is not a terminal, it mimics Claude/ChatGPT." Optional: a Claude/ChatGPT-flavored 404. Low priority.

---

## 5. Per-piece fact-check (delegated fact-checker, sonnet, with lead corrections)

**Methodology note:** the fact-checker's first pass cited `docs/drafts/*.md` as grounding for several numbers. I checked this against git history myself: commit `5d233d5` ("All five case studies live as full articles, drafts lifted, meta stays in docs/drafts") shows the published articles were copied *from* those drafts. A draft is the same claim one step earlier in the pipeline, not an independent source, so I do not accept "it's also in the draft" as GROUNDED. I re-graded every such claim below into a tier that reflects what's actually checkable. Four verdict tiers:
- **GROUNDED** — directly supported by the resume, `CONTENT.md`, `PLAN.md`, or `prior-project-conventions.md`. Cited.
- **STUDIO-VERIFIED** — no source doc supports it, but git history shows a real, methodology-documented verification pass (a dedicated commit, not just a draft repeating a number). Cited. Treat as reliable but not re-checked by this review.
- **NOT IN SOURCES** — asserted in copy with no verification receipt anywhere in the sources or git history, even if it traces to a studio drafting process. Needs Brian.
- **UNCONFIRMED** — already on the pre-flagged known-unconfirmed list per the brief. Not relitigated.
- **CONTRADICTION** — conflicts with a source. Highest priority.

### Top actionable items (beyond the pre-flagged list)

1. **CONTRADICTION, live in the chat's only grounding file.** `poc/chat/facts.md`: "Site sections: work (case studies), about, resume, contact." The actual site has no `/work` route and no `/contact` page (`src/pages/`: `index`, `about`, `404`, `chat`, `log/[...slug]`, `styleguide`; contact is a `mailto:` line on About). Since this file is the chat's *only* source of truth, a visitor asking "is there a contact page?" gets an answer that doesn't match the real site. **Fix needed before this is trustworthy**: rewrite to `home, about, resume, the log (case studies); contact is by email, linked from About`.
2. **ATG consent gap is real and still open on a published (`draft: false`) article**, not a new finding, already logged in `docs/STATUS.md` ("ATG client sign-off... SiteGround figure") and `docs/COMMS-LOG.md` ("ATG says cutover pending + names client details, sign-off unresolved") and unresolved in `docs/drafts/atg-llm-migration.md` open question #3. It just wasn't on this task's pre-flagged unconfirmed list. Flagging it here because the article is live in the content collection with `draft: false`, naming Anthony Thomas Galante, his real domain, his old host, and his old hosting cost. Same category of risk as Gold Coast's pending consent, arguably higher since Gold Coast is at least tracked as "pending" everywhere including this task's brief.
3. **`poc/chat/facts.md` overstates the Facebook follow-on work.** It says: "Facebook returned with new business: Brian built additional WordPress sites for Facebook after it." Every source (`CONTENT.md` row 4, the published article, git research) says the follow-on was **Year in Review and Internet.org**, not "additional WordPress sites." That's a more specific, unsupported claim living in the file an LLM reads on every chat request. Recommend correcting to match the article's actual language.
4. **Two facts.md claims have no support anywhere:** "Speaks Spanish and Portuguese (Brazil) with working proficiency" and "Django and Python at Twilio" (the resume's skills line lists Python generally, never ties Django to Twilio, and lists no language ability). Both would be repeated to visitors as confirmed fact. Needs Brian's confirmation or removal.

### Per-file tables

**twilio-hackpack-v4**
| Claim | Verdict | Source |
|---|---|---|
| Co-authored, published 2018-10-25, that URL | STUDIO-VERIFIED | commit `6160e63`: verified via live fetch of the Twilio blog post, co-authors named |
| Falls inside Senior Web Engineer tenure | GROUNDED | Resume: Twilio Senior Web Engineer Nov. 2017–Nov. 2019 |

**facebook-newsroom** — cleanest file in the set
| Claim | Verdict | Source |
|---|---|---|
| 2014, Beyond, front end developer + team lead, FB/Google "two biggest clients" | GROUNDED | Resume (Beyond title + "Primary clients: Google, Facebook") |
| Legacy site live since at least 2012, on ASP.NET | STUDIO-VERIFIED | commit `935f1a4`: Wayback-confirmed live by Apr 2012, `.aspx` URLs |
| Seven language editions + English = eight total; the specific language list | STUDIO-VERIFIED | commit `935f1a4`: "verified 7+1 languages" via CDX |
| ~5-year run, folded into about.fb.com in November 2019 | STUDIO-VERIFIED | commit `935f1a4` |
| "First WordPress site" / "first responsive consumer site on WordPress VIP" | GROUNDED | Resume, near-verbatim |
| Beyond built Year in Review + Internet.org next | GROUNDED | `docs/CONTENT.md` row 4 |
| Touch-capable timeline component, 3-person team | STUDIO-VERIFIED (soft) | Recovered asset `Timeline-Mobile.png` (#53 legacy rescue) + draft's cited source material; team composition not independently receipted beyond the draft, low risk |
| Dateline 2014-07-01 vs. Beyond tenure | No conflict | Inside Nov 2013–Jan 2016 window |

**atg-llm-migration**
| Claim | Verdict | Source |
|---|---|---|
| 13 pages, SiteGround host | STUDIO-VERIFIED (page count) / **UNCONFIRMED** (the $20/mo figure, per the pre-flagged list) | Draft traces $20 to Brian's own `MY_PLAN.md`; publish-clearance question #6, never resolved |
| Timing: ~5h at the keyboard, ~4h build, ~2h hands-on, 7:40am–12:45pm HST, 3 deploys | **STUDIO-VERIFIED**, high confidence | `docs/COMMS-LOG.md` batch 17/123 + commit `449e100`: dedicated forensics pass, methodology documented (parsed 3 Claude Code session transcripts + cross-checked git author timestamps), corrected an earlier wrong "11 hours" figure |
| 34 caption-to-image pairings, zero mismatched, the specific defects found (wp-content link, tracking token, malformed URLs) | NOT IN SOURCES | Appears only in `docs/drafts/atg-llm-migration.md`; no dedicated verification commit found (searched git log for "caption," none) |
| 25 press mentions | NOT IN SOURCES | Same, draft-only |
| 98 of 320 media originals recovered, 247.7MB → 26.0MB | NOT IN SOURCES, but not fabricated from nothing | `docs/COMMS-LOG.md` (batch, pre-forensics) calls these "metrics verified from logs" in general terms, but no dedicated commit shows the methodology the way timing got one. Treat as studio-sourced, unverified in this review. |
| Client sign-off to publish | **STILL OPEN — see top finding #2** | `docs/drafts/atg-llm-migration.md` open Q#3, `docs/STATUS.md`, `docs/COMMS-LOG.md` |
| Dateline 2026-07-11 vs. Eight Angle concurrent freelance window | No conflict | Resume: Eight Angle Feb. 2026–Present |

**google-android-for-work**
| Claim | Verdict | Source |
|---|---|---|
| Shipped mid-2015 (not 2016) | STUDIO-VERIFIED | Decision #51 (`DECISIONS.md`): Brian confirmed over Wayback evidence, corrected from an old case study's wrong "2016" |
| Beyond, front end developer + team lead, Google/Facebook "two biggest clients" | GROUNDED | Resume |
| 100% of front end, AngularJS + Closure, no jQuery, worked with a designer + QA | STUDIO-VERIFIED (soft) | Cited to old case-study text in the draft; not independently re-verified here, but consistent with the resume's Beyond framing |
| Agency work, not Google employment | GROUNDED | Explicit in the article; matches decision #21's agency-not-employer rule |
| Dateline 2015-09-01 vs. tenure | No conflict | Inside Beyond window |

**eight-angle-ml**
| Claim | Verdict | Source |
|---|---|---|
| 47-class classifier, 92.2% cross-validated accuracy, 39 hand-engineered features, ~20fps, Extra-Trees → Core ML | GROUNDED | Resume, verbatim |
| 60-event PostHog schema, 70+ architecture docs, restricted PiP entitlement, Search Ads attribution survives reinstalls | GROUNDED | Resume, verbatim |
| Detection 71.2%→97.4%, accuracy 89.6%→93.4%, headstand -12.2% | UNCONFIRMED (pre-flagged) | Resume states the rounded 71%→97% and the exact 89.6%→93.4%; the added decimal precision (71.2/97.4) and the headstand figure are not in the resume |
| Pricing ($5.99/mo, $39.99/yr, 7-day trial) | UNCONFIRMED (pre-flagged) | `CONTENT.md` row 1 supports "$5.99/mo" loosely ("free tier + $5.99/mo"); the annual price and trial terms are not there |
| Decoy classes (cobra, side_crow, non_yoga, kurmasana, etc.) | UNCONFIRMED (pre-flagged) | — |
| 47-class vs. 49-pose | UNCONFIRMED (pre-flagged) | Article is internally consistent at "47" throughout; no "49" appears anywhere in the reviewed files |
| 2,332 training samples; 1,603 test images; 33→19 landmark mapping; confidence-threshold test (0.1/0.05/0.001); feature deltas (79.4%→87.1% etc.); 68MB→2MB timeline memory; 460ms/63ms latency figures; v1.1.0 | NOT IN SOURCES | Present in `docs/drafts/eight-angle-ml.md`, sourced from Brian's own Eight Angle repo per the drafting agent ("deep repo research," per `COMMS-LOG.md`), but that repo isn't one of this review's 4 sources, and nothing in git history here re-verifies the specific figures. Worth noting: the original drafting pass caught and fixed one internal inconsistency (a decoy-class mismatch against `config.yaml`), which suggests real repo access, not invention, but that's a different thing from "verified against a source of truth." |
| Dateline 2026-02-12 | GROUNDED, soft flag | Inside Eight Angle's Feb 2026–Present resume window, but `CONTENT.md` row 1 still marks the pre-date "TBD," and the article describes App Store maturity (v1.1.0, TestFlight bugs) essentially at the venture's start. Worth a deliberate date pick rather than leaving the placeholder live. |

**gold-coast**
| Claim | Verdict | Source |
|---|---|---|
| Client = a wealth-management RIA, Astro + Keystatic + Pastel review loop | GROUNDED | `CONTENT.md` row 3; Resume ("Astro, Keystatic CMS... Pastel") |
| Publish consent, whether to name the client, whether "ChatGPT" can be named specifically | UNCONFIRMED (pre-flagged) | `docs/drafts/gold-coast.md` open Q#1/#2, unresolved |
| 435 review comments | NOT IN SOURCES | No verification commit found; appears in the draft and the COMMS-LOG summary of the draft, not independently checked |
| Eight pages (home + 7 interior) | NOT IN SOURCES | Same |
| 2.7:1 contrast ratio on the "VS" badge | NOT IN SOURCES | No corroboration anywhere; this is also a WCAG-adjacent factual claim (specific ratio), worth double-checking against the live site before publish |
| "He designed it in ChatGPT" | Flagged, not independently verifiable | The draft's own author notes: "the repo itself never documents which tool he used; that detail came from your framing" — i.e., this rests on Brian's direct knowledge, not repo evidence |
| Dateline 2026-06-30 | GROUNDED window, placeholder date | Draft: "I don't have an explicit launch date, '2026-06-30' is a placeholder" |

**about.astro / index.astro / 404.astro**
All claims GROUNDED against the resume: Eight Angle founding + the 47-class/92.2%/~20fps stats, Gong (Staff Web Engineer, LLM translation, replatform), Twilio (Technical Web Lead, twilio.com/ja), Beyond (Facebook Newsroom + Android for Work, correctly framed as agency work "for," never employment). Role order matches the resume's reverse-chronological order. "Open to full time roles and freelance projects" is GROUNDED per decision #55. `jobTitle: "AI Product Engineer"` is GROUNDED per decision #77 (a deliberate, logged title choice). 404 carries no factual claims.

**poc/chat/facts.md** (beyond the two contradictions above)
| Claim | Verdict | Source |
|---|---|---|
| Studied at DePaul University | GROUNDED | Resume |
| Speaks Spanish and Portuguese (Brazil) | **NOT IN SOURCES** | Absent from the resume and every other source; see top finding #4 |
| Improved legacy site speed 4x (Gong) | GROUNDED | Resume, verbatim |
| Twilio: 40 bespoke pages | GROUNDED | Resume, verbatim |
| "Django and Python at Twilio" | **NOT IN SOURCES** | Resume lists Python generally, never ties Django to any employer; see top finding #4 |
| Agency-not-employer framing for Facebook/Google | GROUNDED | Correct throughout, matches decision #21 |
| "Favorite frameworks: React and Astro" | NOT IN SOURCES | Subjective preference, unsupported by any source; low risk (opinion, not a fact claim), but flagged since the file's own header says "if a fact is not in this file, the model must say it doesn't know" i.e. it should hold itself to the same bar |
| Work-history core facts, "how he works," stack list, entitlement/PostHog/Search Ads claims | GROUNDED | Resume, near-verbatim throughout |
| His line ("AI multiplies my output; taste and engineering judgment decide what ships") | GROUNDED | Resume, verbatim |

## 6. Per-piece concision (delegated line editor, sonnet)

Every item below is a **proposed** before/after; nothing applied. The line editor confirmed my house-rule grep independently: zero em/en dashes anywhere; the two "terminal" hits are the only #116 issues; no hype words; the `→` in Eight Angle is the allowed metric-arrow exception.

### gold-coast
1. **Line 20** (split a ~44w run-on): "So before I touched a single interior page, I ran a read-only pass over all seven designs in parallel, mapping every block in every comp to a shared set of tokens and components: one navy-and-gold palette..." → break after "in parallel." then "I mapped every block in every comp to a shared set of tokens and components: one navy-and-gold palette..."
2. **Line 38** (worst run-on in the set, ~62w, and fixes the tautological "counted the line count"): "What actually shipped: I counted the line count in his design and set container widths so the real, responsive text wraps to match... reserving literal breaks only for the handful of cases..." → "What actually shipped: I matched the line count in his design and set container widths so the real, responsive text wraps to match at the sizes people actually use. For the handful of cases where he was dictating an exact mobile layout, I kept a literal break, one that disappears above phone width so desktop wraps naturally."
3. **Line 16** (redundant "once he could see it" staged twice): "It's how specific the feedback got once he could see them built. Once we had a live build in front of him, his notes read like an art director's:" → "It's how specific the feedback got once he could see them live. His notes read like an art director's:"
4. **Line 16** (double "exact/exactness"): "...the vocabulary to be exact, and my job was to meet that exactness without letting the site fall apart the moment he asked for a ninth page." → "...to meet that precision without the site falling apart when he asked for a ninth page."
5. **Line 18** (optional split, ~41w) around the "something new" colon list.

### facebook-newsroom
1. **Line 12** (longest sentence in the set, ~48w): parenthesize the VIP appositive and split off the trailing clause: "...clear WordPress VIP's engineering bar (the enterprise WordPress platform Automattic runs for large publishers and media companies). And it had to do all that while still looking and behaving like Facebook, not a generic WordPress blog."
2. **Line 16** (~52w): split after "...plus the custom plugins the newsroom needed on top of it." then "I built it alongside another front end engineer and a QA engineer, all of it held to WordPress VIP's code standards."
3. **Line 18** (~48w): keep "eight languages total" (real number), split after it into a second sentence about the communications team.
4. **Line 22** (cut a clause that restates itself): drop ", work that came directly from how this project went."
5. **Line 28** (near-synonym): "...rather than fighting them or working around them." → "...rather than fighting them." (also part of the cross-piece repeat below).

### atg-llm-migration (already the tightest article)
1. **Line 36** (a real parse problem from stacked "and"s): "Subtract the LLM's own generation and agent-run time and my hands-on share, directing, reviewing, deciding, testing between turns, was about two hours." → "Subtract the LLM's own generation and agent-run time, and my hands-on share (directing, reviewing, deciding, testing between turns) was about two hours."
2. **Lines 16 + 40** (same "judgment" beat twice in one piece): cut the line-16 "That's the kind of judgment that doesn't delegate."; let line 40 ("They were where the actual judgment happened.") close the piece.
3. **Line 16** (optional): the three-item colon list runs ~52w but is cleanly parallel; low priority.

### google-android-for-work
1. **Lines 16 + 22** (same "worked closely with a designer and QA engineer" fact stated twice): cut it from line 22's result sentence.
2. **Line 16** (doubled hedge "fair amount"/"fairly basic"): "A fair amount of the work was relearning fairly basic front end habits..." → "Much of the work was relearning basic front end habits..."
3. **Line 18** ("I'd have reached for" + "I'd normally pull in" say the same thing): tighten to one.
4. **Line 12** (adjective where a number would be, but nothing fabricatable): "one of the most trafficked domains on the internet" — leave unless Brian has a stat.

### eight-angle-ml (dense, several 40w+ sentences)
1. **Line 21** (~47w): split the scraper sentence after "no API keys."
2. **Line 37** (~55w, densest in the piece): split after "...to reconcile the two coordinate systems." then "Both detectors now sit behind one shared protocol, so the rest of the pipeline never has to know which one ran."
3. **Line 55** (~52w): split the PostHog sentence after "...persisted to Keychain."
4. **Line 45** (~45w): split the 20fps/2fps sentence after "...writes the pose timeline at 2fps."
5. **Line 31** (redundant "theoretically correct on paper"): → "looked theoretically sound but actually regressed cross-validated accuracy from 92.6% to 92.3%".

### twilio-hackpack-v4 / brohde-com-build / about / 404 / facts.md / system-prompt.md
- **twilio**: two sentences, tight; no concision edits (title-case handled in section 1).
- **brohde-com-build**: draft stub; needs a real writing pass; the "terminal" description must be fixed (section 4). Hand the writer the #116 framing explicitly, since this is literally the article about building the site incl. the chat surface.
- **about / 404**: already tight, no edits.
- **facts.md** (line editor's catch, worth doing for signal density in a doc the model reads every request): the Identity section states "ships end to end, from training the model to shipping the app" and then restates it four lines later ("Ships AI products end to end: model, app, and the infrastructure underneath."). Merge into one bullet.
- **system-prompt.md:38** "terminal aesthetic": line editor's preferred fix keeps the true CLI-styled look while policing only the model's self-name: "the site has a phosphor, command-line look, but you are the chat, not a terminal." (Either that or the plainer "chat aesthetic" per #58.)

### Cross-piece (line editor, corroborates my section 3c)
- **Facebook + Android closers are the same moral** (`facebook-newsroom:28` vs `google-android-for-work:26`). Differentiate: Facebook keeps "read the rules first" (VIP's external audit is the distinctive detail); Android closes instead on its already-present "I wasn't choosing the stack" idea.
- **"Judgment doesn't delegate" recurs 4x across 3 pieces** (gold-coast:44, atg:16 + atg:40, eight-angle:59). Keep eight-angle's version as the canonical callback (it's closest to Brian's signature line in facts.md:37); cut atg's duplicate; let gold-coast's pixel-concrete closer stand.
- **Weakest opener + a template collision:** Android (`:8`) and Facebook (`:8`) both use the identical "In [year], I [led/built] the [thing] for [client]..." pattern and sit next to each other by era. Android's is a 30-word product-description first sentence. Recommend opening Android on its real hook (shipping on google.com itself ruled out his usual toolkit before the project began), currently buried in paragraph 2.
- **Strongest opener:** Gold Coast (`:8`, "A client showed up with eight finished page designs.").

---

## Open questions for Brian

1. **`poc/chat/facts.md` fixes (section 5, top actionable items):** correct "Site sections: work, about, resume, contact" to match the real site (no /work, no /contact page); confirm or remove the Spanish/Portuguese claim; confirm or remove "Django and Python at Twilio"; correct "additional WordPress sites for Facebook" to Year in Review + Internet.org (or confirm the WordPress-sites claim is real and add it as a source somewhere).
2. **ATG client sign-off**: still unresolved per the original draft's open question #3, and the article is live (`draft: false`) today. Confirm with Anthony before this stays up, or pull it back to draft pending that check.
3. **Pre-date convention** (section 3a): retrospective dateline, dated-postscript block (my rec), or write-in-period? Applies to Facebook + Android.
4. **Gold Coast consent** to publish (and to name the client in the title). Title stays client-neutral until then.
5. **Eight Angle unconfirmed numbers** (already flagged, now in the title + stat band): 47 classes vs 49 poses, 92.2%, the precise 71.2/97.4 (resume rounds to 71/97), the -12.2% headstand figure, pricing ($5.99/$39.99/7-day trial), decoy-class examples. Confirm before the title and figures ship.
6. **Numbers with no verification receipt anywhere** (section 5 has the full tiered breakdown): Gold Coast's 435 comments / 8 pages / 2.7:1 contrast; ATG's 34 caption pairs / 25 press mentions / 98-of-320 originals / 247.7MB→26.0MB (note: ATG's *timing* figures, unlike these, are independently forensics-verified, no action needed there); most Eight Angle ML internals (2,332 samples, decoy-class list, latency/memory figures, v1.1.0).
7. **Homepage default mark:** OK to give the site its own letterform and hand the "8" back to Eight Angle? (Or keep the 8 as the flagship-forward face, accepting the identity blur.)
8. **Title picks:** confirm one option per piece from section 1.
9. **ATG SiteGround $20/month** figure (unconfirmed) and the "Workers vs Pages" naming — keep the $20 out of any title until confirmed.

---

## Handoff / what was delegated

- **Fact-checker (sonnet):** claim extraction + first-pass verdicts across all 7 articles, about/index/404, and both chat grounding files. Came back with the site-sections contradiction, the ATG-consent resurfacing, and the Spanish/Portuguese and Django overreach in `facts.md` as its strongest catches. Its first pass over-graded several numbers as "grounded via git history" by citing `docs/drafts/*.md`, which are the same claims one draft-step earlier (confirmed via commit `5d233d5`, "drafts lifted" into the articles), not independent verification. I re-checked every such claim against actual commit messages myself and re-tiered them in section 5 (GROUNDED / STUDIO-VERIFIED / NOT IN SOURCES / UNCONFIRMED), so section 5 reflects my corrected verdicts, not the subagent's raw output.
- **Line editor (sonnet):** concision pass (3-6 proposals per article, all before/after, nothing applied) + an independent house-rule sweep that corroborated my own grep (zero dashes, two "terminal" hits, no hype words). Its cross-piece redundancy read matched my own independently, which is why section 3c and section 6's cross-piece notes agree.
- **My own judgment deliverables** (titles, matrix identity, pre-date/voice/redundancy analysis, house-rule grep, and the fact-check re-tiering above): done directly, not delegated.

_Round 2 (apply pass) should: pick titles, resolve the pre-date convention, fix the `brohde-com-build` "terminal" description, fix the three `facts.md` issues (site sections, Spanish/Portuguese, Django, WordPress-sites overreach), get ATG and Gold Coast consent resolved, differentiate the Facebook/Android closers, and feed the identity table into B3. Nothing in this report has been applied to site source._
