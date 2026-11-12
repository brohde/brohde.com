# Design Engineer copy, phase 2 (proposal for Brian)

Decision #241. Status: PROPOSAL, nothing applied. Audience order is now hiring managers for Design Engineer roles, then clients. AI shows up as method, not brand.

Every proposed line was checked against the article bodies and `chat/facts.md`. No dashes, no age math, Facebook and Google stay "at Beyond."

---

## 1. About page (`src/pages/about.astro`)

### 1a. `description` const

**Current**
> Brian Rohde is a Design Engineer in San Francisco shipping products end to end: founder of Eight Angle, and an independent builder delivering client sites through agentic coding workflows.

**Proposed** (159 chars)
> Brian Rohde is a Design Engineer in San Francisco. He led web platforms at Gong and Twilio alongside design teams, and now builds Eight Angle and client sites.

**Why:** This puts the in-house history first, which is what a hiring manager screens for. "Agentic coding workflows" now appears once on the page, in the body.

### 1b. Paragraph 1

**Current** (link targets in parentheses)
> I’m a Design Engineer in San Francisco, shipping products end to end. Today I’m founder of Eight Angle (/eight-angle), an iOS app with a custom-trained on-device ML classifier, and a freelance builder delivering client sites through agentic coding workflows. AI multiplies my output; taste and engineering judgment decide what ships.

Phase 1 missed something here. The body still says **"freelance builder."** Only the `description` const was switched to "independent." The proposal below fixes it either way.

**Proposed** (this is the old paragraph 2, rewritten and moved up)
> I’m a Design Engineer in San Francisco. I’ve led web platforms in-house, working day to day with marketing, product, and design. At [Gong](COMPANIES.gong, new tab) I was Staff Web Engineer: I led the site replatform end to end and built an LLM translation workflow for it. At [Twilio](COMPANIES.twilio, new tab) I was Technical Web Lead and shipped the company’s first global website and unified CMS, after building its design system. Earlier, at the agency Beyond, I built front ends for Facebook, including their [Newsroom site](/facebook-newsroom), its first WordPress site and a platform Meta continues to invest in today, and [Google’s Android for Work website](/google-android-for-work).

**Why:** It opens on staff-level, in-house work with designers, and the Twilio design system is the strongest Design Engineer fact we have. It comes from facts.md, but it's new to the visible site, so Brian should confirm it (Q1). The replatform now comes before the translation workflow, so AI reads as one tool among several.

### 1c. Paragraph 2

**Current** (paragraph 2 as it stands)
> Before this I led web platforms, working day to day with marketing, product, and design. I was Staff Web Engineer at Gong, where I built an LLM translation workflow and replatformed the site. At Twilio I was Technical Web Lead and shipped the company’s first global website and unified CMS. Earlier, at the agency Beyond, I built projects for Facebook, including their Newsroom site, its first WordPress site and a platform Meta continues to invest in today. I also built Google’s Android for Work website.

**Proposed**
> Now I work independently. I founded [Eight Angle](/eight-angle) and shipped the whole product myself: the brand, the iOS app, the on-device pose classifier I trained, and the App Store listing that sells it. I also build sites for clients, taking their own designs or existing brand to fast pages they can edit themselves. Taste and engineering judgment decide what ships; AI multiplies how much I can ship.

**Why:** "Independent" comes second, as planned, and the founder credit now says he did all of it, design included. "Their own designs or existing brand" is true of both client pieces: Gold Coast came as PNGs, and ATG kept its brand.

**Signature line options** (whichever wins should also go into facts.md line 37):
- A (keep): "AI multiplies my output; taste and engineering judgment decide what ships."
- **B (recommended):** "Taste and engineering judgment decide what ships; AI multiplies how much I can ship."
- C: "Taste decides what ships. AI just means more of it gets built."

B keeps Brian's own words and only swaps the order, so the sentence lands on taste. C is punchier but drops "engineering judgment," and a Design Engineer pitch needs both halves.

### 1d. Closing CTA button

**Current:** `Contact me using my AI →`

**Recommended:** `Start a conversation →`. Alternative: keep the current text.

**Why:** "Using my AI" makes a hiring manager wonder whether a human will read the message. That's friction at the exact moment they've decided to reach out. "Start a conversation" is Brian's own old-site CTA (VOICE.md trait 4). The chat still shows itself off as soon as the flow opens, so the button doesn't need to advertise it. It also matters that STATUS reports /api/chat returning 502 on live. Until that's fixed, a button that promises an AI is a promise the site may not keep.

---

## 2. Site meta description (`src/lib/site.ts` `SITE.description`)

**Current** (157 chars)
> Brian Rohde is a Design Engineer in San Francisco who designs and ships full-stack products end to end. Project deep dives and notes on AI-assisted engineering.

**Options**
- **A (recommended, 147):** "Brian Rohde is a Design Engineer in San Francisco: front-end craft, design systems, and full-stack builds, from Twilio and Gong to his own iOS app."
- B (159): "Brian Rohde, Design Engineer in San Francisco. Led web platforms at Twilio and Gong; now designs and ships full-stack products end to end. Case studies inside."
- C (157): "Brian Rohde is a Design Engineer in San Francisco who designs and ships full-stack products end to end. Case studies on the design and build behind each one."

**Why A:** It names the craft words a Design Engineer search matches on and puts recognizable names in the snippet. It keeps "full-stack" as the supporting keyword (#241). "AI-assisted engineering" goes, because the site is no longer branded on AI.

---

## 3. Chat facts (`chat/facts.md`)

### Line 7

**Current**
> - Brian Rohde. Design Engineer in San Francisco: front-end craft plus full-stack engineering, shipping products end to end, from training the model to shipping the app.

**Proposed**
> - Brian Rohde. Design Engineer in San Francisco: front-end craft, interaction, and design systems, backed by full-stack engineering. Ships products end to end, from the brand and the interface to the model underneath.

**Why:** It now says what a Design Engineer actually does. The design system is a Twilio fact. Interaction is backed by the Newsroom touch timeline and the AFW scroll animation. The ending puts brand and interface ahead of the model.

### Line 37

**Current**
> - His line: "AI multiplies my output; taste and engineering judgment decide what ships."

**Proposed:** use whichever signature wins in 1c. If B wins:
> - His line: "Taste and engineering judgment decide what ships; AI multiplies how much I can ship."

### Riders the brief did not ask for (recommend, Brian's call)

The chat will still say "freelance" and lead with AI unless these change.
- Line 9, "Ships AI products end to end: model, app, and the infrastructure underneath." Change to: "Ships products end to end, AI included: model, app, and the infrastructure underneath."
- Line 10, "...and available for freelance work." Change to: "...and available for independent client work."
- Lines 29 and 30, the "Freelance:" prefix. Change to "Independent:".

---

## 4. Article descriptions (`src/content/articles/*/index.md`)

### atg-llm-migration

**Current:** "A 13-page WordPress-to-Astro migration run through Claude Code: nothing lost, a UI refresh that kept the look, and hosting plus a Keystatic CMS for $0 a month."

**Proposed:** "A fashion designer’s 13-page site moved off WordPress with his brand intact: three clickable concepts per redesign, a rebuilt press page, and $0 hosting."

**Why:** The design story here is the three-concept rule and the "Catalogue" press page hybrid. The body tells the Claude Code part well, so the description no longer has to.

### eight-angle

**Current:** "How I built Eight Angle solo: an iOS yoga practice tracker that logs your poses on-device as you flow, plus the brand, App Store growth, and analytics behind it."

**Proposed:** "How I designed and built Eight Angle solo: a yoga tracker that recognizes poses on-device, a trial that starts after your first practice, and the brand around it."

**Why:** "Designed and built" is the title claim in miniature. The trial timing is the most product-design decision in the piece.

### facebook-newsroom

**Current:** "How I led the redesign and WordPress VIP replatform of Facebook’s global Newsroom, from legacy migration to launch in seven languages."

**Proposed:** "How I led the front end of Facebook’s Newsroom redesign at Beyond: a custom WordPress VIP theme, a timeline built for touch, and eight language editions."

**Why:** This fixes two factual problems. The body says he led the *technical* side, while a design team did the design. The seven extra languages came *after* launch, eight in total. "At Beyond" heads off any reading that he worked at Facebook.

### gold-coast

**Current:** "A banker designed his own site in ChatGPT, pixel by pixel, and handed me eight PNGs; I built it in Astro and used Pastel to turn his 435 review comments into a real, accessible site."

**Options**
- **A (recommended):** "A banker designed his site in ChatGPT and sent eight PNGs. I built one token system, worked 435 review comments, and decided which pixels to keep."
- B: "Eight PNG comps a client made in ChatGPT, built as one design system in Astro: shared tokens, 435 Pastel comments, and responsive wraps instead of hard line breaks."

**Why:** Both lead with the system-over-pages decision and the judgment calls (the "VS" badge, line wraps). That's the Design Engineer core of this piece. The current version runs about 185 characters and gets cut off in snippets.

### google-android-for-work

**Current:** "How I built Google’s Android for Work marketing site front end entirely inside Google’s internal CMS, JavaScript libraries, and code standards."

**Proposed:** "Building Google’s Android for Work site at Beyond: a scroll-driven product animation beside a phone mockup, smooth on every device, inside Google’s own stack."

**Why:** It leads with what the visitor saw, the motion sequence, which the body calls "most of the build." The constraint story is kept as a tail.

### twilio-signal-pong

**Current:** "How I designed and built SIGNAL Pong, a multiplayer game and device to showcase Twilio’s products on the conference floor."

**Proposed:** "Designing SIGNAL Pong for Twilio’s conference floor: a 3v3 React game attendees joined by walking up, with their hardware badge as the controller."

**Why:** These are concrete interaction design details from the figure caption: BLE auto-join, the Hackpack as controller, and up to six players.

### Title flag (one, strong case)

**twilio-signal-pong:** "Building a multi-player game, hardware badge, and React-based operating system for Twilio’s user conference." The body never mentions an operating system. It also never says he built the badge: he co-authored its launch post, and the body says he owned "the game and the device it ran on." A hiring manager who reads the title and then the body will notice the gap. Either the body gets the OS and badge story or the title loses those claims (Q2). If the title has to change, options:
1. "SIGNAL Pong: a multiplayer game played with a hardware badge on Twilio’s conference floor"
2. "Designing a 3v3 game for Twilio’s conference floor, played with a hardware badge"
3. "SIGNAL Pong: building a game attendees joined just by walking up"

---

## 5. Home intro (`src/components/HomeIntro.astro`)

**Current:** "Design Engineer · San Francisco" / "Founder, Eight Angle" / "Prev: Gong · Twilio · Facebook + Google via Beyond"

**Recommendation: no change.** The role line is done, the founder credit is right, and "via Beyond" already handles the agency honesty quietly. Every company already links to its proof.

---

## Questions for Brian

1. **Twilio design system:** can the About page say you built Twilio's design system? facts.md says so (Senior Web Engineer era), but it's new to the visible site. The sign-up page redesign is also available if you want a second design credit.
2. **SIGNAL Pong title:** was there a React-based operating system, and did you build the Hackpack hardware itself or only co-author its post? This decides whether the title stays.
3. **Newsroom "a platform Meta continues to invest in today":** the article's postscript says the Newsroom was folded into about.fb.com in 2019. Is the claim about WordPress at Meta generally? If so, a skeptical reader might ask. It's existing copy, flagged only.
4. **About link targets:** the code comment says Twilio links to the SIGNAL piece, but the code links to twilio.com. HomeIntro links Gong to your LinkedIn, and About links Gong to gong.io. Kept as is per the brief. Do you want them consistent?

---

## If Brian approves only one thing

1. Approve the About page rewrite (1a to 1c). It's the page a hiring manager reads, and it still says "freelance builder" today.
2. It opens on Gong and Twilio, staff level and in-house, working with design. Independent work comes second.
3. Eight Angle is credited as the whole product: brand, app, classifier, App Store.
4. The signature line flips to lead with taste: "Taste and engineering judgment decide what ships; AI multiplies how much I can ship."
5. Everything else (meta, facts, articles, CTA) follows from that page and can land after.
