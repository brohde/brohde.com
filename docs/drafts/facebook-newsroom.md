# Facebook Newsroom (2014): draft v1

**Status:** Draft v1, ready for review
**Type:** Project case study, agency work via Beyond (not Facebook employment)
**Suggested pre-date:** 2014-07-01 (see rationale in open questions; Wayback evidence puts the relaunch between June 1 and July 1, 2014)
**Source material:** 2018 to 2019 brohde.com case study page (recovered via Wayback Machine), 2026 resume, `docs/VOICE.md`, plus follow-up Wayback research on the predecessor site, the localized editions, and the site's eventual decommission (see below)

## Title options

1. Facebook's first WordPress site: rebuilding newsroom.fb.com
2. Shipping on WordPress VIP: the Facebook Newsroom rebuild
3. Replatforming Facebook's global newsroom, from legacy CMS to WordPress

## Description options

1. How I led the redesign and WordPress VIP replatform of Facebook's global newsroom, from legacy migration to launch in seven languages.
2. A 2014 case study: rebuilding newsroom.fb.com as Facebook's first WordPress site and WordPress VIP's first responsive consumer site.

---

## Draft

In 2014, I led the technical rebuild of Facebook's press site, newsroom.fb.com. I was a front end developer and team lead at Beyond, an SF user experience agency, and Facebook was one of our two biggest clients at the time, alongside Google.

**The problem.** This wasn't a greenfield build. Facebook already had a newsroom at that address, live since at least 2012, on a legacy ASP.NET publishing system with its own admin backend and page templates. It wasn't responsive, and it didn't fit how a global communications team actually worked: product news, executive statements, and press materials going out around the clock, in more than one language, to reporters checking from a phone as often as a desktop. A relaunch had to preserve years of press history, migrate it cleanly off that old platform, and clear WordPress VIP's engineering bar, the enterprise WordPress platform Automattic runs for large publishers and media companies, all while still looking and behaving like Facebook rather than a generic WordPress blog.

**The approach.** I was in the room from the sales conversation onward, giving technical input during the design and user research phases before any code got written, so the design team wasn't handed constraints after the fact. Once we started building, I led all technical aspects of the redesign and replatform: a fully custom, responsive WordPress theme built from scratch, plus the custom plugins the newsroom needed on top of it, developed alongside another front end engineer and a QA engineer, all of it held to WordPress VIP's code standards. VIP runs its own code review before anything goes live on its infrastructure, so the bar wasn't just "does it work," it was "does it pass someone else's audit." One of the harder pieces of the build was an interactive timeline component with touch support that had to behave the same swiping on a phone as clicking on a desktop, a genuinely new interaction pattern for a corporate press site in 2014.

I also wrote the migration scripts that moved years of posts and media off Facebook's legacy platform into WordPress without losing anything: old press releases, executive statements, images, all of it had to land in the new system intact and still findable. After launch, I led the internationalization work, taking the newsroom into seven additional language editions (Portuguese, German, Spanish, French, Italian, Japanese, and Korean, each on its own subdomain) alongside the original English, eight languages total, for a communications team that needed to publish well beyond Menlo Park.

**The result.** Newsroom.fb.com relaunched in mid-2014 as Facebook's first WordPress site, and the first responsive consumer site built on WordPress VIP. It held up well enough that it turned into a longer relationship rather than a one-off engagement: Beyond went on to build Year in Review and the Internet.org site for Facebook off the back of it, work that came directly from how this project went.

The site itself had a long run. It kept publishing under its own newsroom.fb.com address, with the same basic identity and template, for roughly five years, evolving its section list along the way, before Facebook folded it into a broader corporate site, about.fb.com, in November 2019.

**What still holds up.** The interesting part of this project, a decade on, isn't the tech. WordPress VIP's review process and a jQuery-era timeline widget aren't how I'd build this today. What holds up is the constraint underneath it: shipping inside a platform you don't control, to a bar someone else sets, without the result feeling like it was assembled by committee, and without the migration losing a single post along the way. That's the same discipline I use now working inside a client's existing CMS or design system instead of my own stack: read the platform's rules first, then build inside them, rather than fighting them or working around them.

---

## Image candidates

**RESOLVED 2026-07-15: original assets recovered from the legacy brohde.com WordPress codebase** (`~/Projects/brohde-com-wordpress`). Screenshots staged in this repo at `assets/images/legacy-site/`:

1. **Timeline-Mobile.png**: the interactive "Our History" timeline component on mobile, the exact touch-capable feature the draft calls out as the hard piece of the build. Strongest single image for this article.
2. **Homepage-Localized.png**: the Japanese Newsroom edition (ja.newsroom.fb.com), full homepage. Perfect visual for the internationalization beat. Content dates it July 2017.
3. **Homepage-Mobile.png**: the responsive mobile homepage ("Two Billion People Coming Together on Facebook," June 2017). Good responsive-design evidence.
4. **newsroom.mp4** (26MB, NOT copied into this repo; lives at `brohde-com-wordpress/public_html/wp-content/themes/brohde_com_src/assets/videos/newsroom.mp4`): the demo video the old case study page embedded, the one Wayback never captured. Can supply stills or a compressed loop for the article.

Note the screenshots carry 2017 content, three years after the 2014 launch, but it is the same template identity, which itself supports the longevity point. Wayback fallbacks below remain useful for "before" and "after" shots:

1. **https://web.archive.org/web/20141001003032/https://newsroom.fb.com/**: the relaunched, fully styled, responsive WordPress homepage (card layout, nav: Home / News / Products / Company Info / Directory / Investor Relations). Best available "after" screenshot of the actual shipped site.
2. **https://web.archive.org/web/20120430203451/http://newsroom.fb.com/**: confirmed predecessor, the pre-Beyond newsroom as it existed on April 30, 2012, the earliest capture Wayback has of this URL. Facebook-blue header, a sponsor-logo carousel, sidebar nav. Good "before" shot; this is a real capture of the old site, not a partial/broken one like I'd flagged in the prior draft.
3. **https://web.archive.org/web/20190329103538/https://brohde.com/work/facebook-newsroom/**: the original brohde.com case study page (text recovered and used as source for this draft; visually it's mostly blank where the video and feature graphics used to be).
4. **https://web.archive.org/web/20191201031859/https://about.fb.com/news/**: the site that replaced newsroom.fb.com starting around November 2019, a different generator and IA entirely (global "Who We Are / What We Build / Resources" nav instead of the WordPress newsroom template). Useful if the piece wants an "and here's what came after" beat.
5. Facebook's follow-on projects mentioned in the original copy, Year in Review (yearinreview.fb.com) and Internet.org (info.internet.org), both have their own Wayback histories if a "led to more work" visual is wanted later.
6. Facebook Newsroom's Korean, Japanese, French, German, Italian, Spanish, and Portuguese editions each have their own Wayback history (for example `https://web.archive.org/web/2015/https://de.newsroom.fb.com/`) if a "shipped in seven languages" visual is wanted.

## Resolved by follow-up research (no longer open)

- **Language count discrepancy, resolved.** The old case study's body text said "7 localized versions," the feature caption said "Localization into 8 languages." Wayback's CDX index shows `robots.txt` captured on twelve `*.newsroom.fb.com` subdomains: `au`, `br`, `ca`, `de`, `es`, `fr`, `gb`, `in`, `it`, `ja`, `ko`, `ltam`, plus the root English site. Filtering out the English-language regional variants (`au`, `ca`, `gb`, `in`) and the Latin America regional edition (`ltam`, same language as `es`) leaves exactly seven distinct translated languages: Portuguese (`br`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Japanese (`ja`), Korean (`ko`). Seven translated editions plus the original English is eight languages total, both old numbers were right, they were just counting different things. I can't confirm from Wayback alone whether the English regional variants (`au`/`ca`/`gb`/`in`) shipped as part of your original internationalization push or were added later by the ongoing WordPress VIP team, so I left them out of the draft's language count. Flag it if you remember otherwise.
- **What existed before this build.** Confirmed via Wayback: newsroom.fb.com was already live by April 30, 2012 (the earliest capture Wayback has of it), running on a legacy ASP.NET system, not WordPress. Its URLs used `.aspx` extensions, and its admin backend lived at `/admin/login.aspx` with `/Admin/WebResource.axd` and `/Admin/ScriptResource.axd`, both standard ASP.NET runtime handlers. So this was a replatform of an existing site, not a from-scratch build. It may have existed before 2012 too, Wayback just doesn't have anything earlier for this URL.
- **How long the site you built lasted.** Newsroom.fb.com kept running under its own domain, on what looks like the same WordPress base you shipped (same template identity, evolving nav, same `press@fb.com` contact line), through at least September 1, 2019, the last snapshot confirming a normal 200 response. Facebook's new corporate hub, about.fb.com/news, starts appearing in Wayback captures around November 12, 2019, and by December 1, 2019, newsroom.fb.com is issuing a permanent redirect straight to `https://about.fb.com/news/`. So the build had roughly a five-year run, mid-2014 to around November 2019, before Facebook folded it into a full site redesign under a different generator and IA entirely.

## Open questions for Brian

1. **Team and timeline.** The old copy names only "another front end engineer and QA engineer" beyond you. Any names, team size, or project duration (weeks or months) you're comfortable citing?
2. **Budget figure.** Your resume cites Beyond projects "budgeted up to $½ million," tied to the Google and Facebook relationship generally, not Newsroom specifically. Want a project-specific figure in this piece, or leave it unstated as I did?
3. **"First responsive consumer site on WordPress VIP" framing.** This is a platform-wide claim (not just "Facebook's first"), sourced from your resume. Comfortable keeping that exact framing in published copy, or prefer something softer like "one of the first"?
4. **Exact pre-date.** Wayback snapshots show the old, unstyled newsroom still live on June 1, 2014, and the new, styled site fully live by October 1, 2014, with a transitional capture on July 1, 2014. That puts the relaunch in a June to July 2014 window. Want me to lock the article's dateline to a specific month, or keep it loose as "2014"?
5. **Assets: ANSWERED 2026-07-15.** Brian supplied the legacy brohde.com WordPress codebase; three screenshots and the original demo video recovered (see Image candidates above). Remaining choice is just which to feature.
6. **The eight-language claim.** Comfortable with the draft naming all seven languages explicitly (Portuguese, German, Spanish, French, Italian, Japanese, Korean), or would you rather it just say "seven languages" without listing them?
