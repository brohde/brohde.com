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

1. How I led the redesign and WordPress VIP replatform of Facebook's global newsroom, from legacy migration to launch in seven-plus languages.
2. A 2014 case study: rebuilding newsroom.fb.com as Facebook's first WordPress site and WordPress VIP's first responsive consumer site.

---

## Draft

In 2014, I led the technical rebuild of Facebook's press site, newsroom.fb.com. I was a front end developer and team lead at Beyond, an SF user experience agency, and Facebook was one of our two biggest clients at the time, alongside Google.

**The problem.** Facebook's newsroom ran on a legacy publishing setup that wasn't responsive and didn't fit how a global communications team actually worked: product news, executive statements, and press materials going out around the clock, in more than one language, to reporters checking from a phone as often as a desktop. A relaunch had to preserve years of press history, migrate it cleanly, and clear WordPress VIP's engineering bar, the enterprise WordPress platform Automattic runs for large publishers and media companies, all while still looking and behaving like Facebook rather than a generic WordPress blog.

**The approach.** I was in the room from the sales conversation onward, giving technical input during the design and user research phases before any code got written, so the design team wasn't handed constraints after the fact. Once we started building, I led all technical aspects of the redesign and replatform: a fully custom, responsive WordPress theme built from scratch, plus the custom plugins the newsroom needed on top of it, developed alongside another front end engineer and a QA engineer, all of it held to WordPress VIP's code standards. VIP runs its own code review before anything goes live on its infrastructure, so the bar wasn't just "does it work," it was "does it pass someone else's audit." One of the harder pieces of the build was an interactive timeline component with touch support that had to behave the same swiping on a phone as clicking on a desktop, a genuinely new interaction pattern for a corporate press site in 2014.

I also wrote the migration scripts that moved years of posts and media off Facebook's legacy platform into WordPress without losing anything: old press releases, executive statements, images, all of it had to land in the new system intact and still findable. After launch, I led the internationalization work, taking the newsroom into multiple additional language editions for a communications team that needed to publish well beyond Menlo Park.

**The result.** Newsroom.fb.com relaunched in mid-2014 as Facebook's first WordPress site, and the first responsive consumer site built on WordPress VIP. It held up well enough that it turned into a longer relationship rather than a one-off engagement: Beyond went on to build Year in Review and the Internet.org site for Facebook off the back of it, work that came directly from how this project went.

**What still holds up.** The interesting part of this project, a decade on, isn't the tech. WordPress VIP's review process and a jQuery-era timeline widget aren't how I'd build this today. What holds up is the constraint underneath it: shipping inside a platform you don't control, to a bar someone else sets, without the result feeling like it was assembled by committee, and without the migration losing a single post along the way. That's the same discipline I use now working inside a client's existing CMS or design system instead of my own stack: read the platform's rules first, then build inside them, rather than fighting them or working around them.

---

## Image candidates

None of the original case study's screenshots, in-page images, or embedded demo video survived in the Wayback Machine's archive of brohde.com. The CDX index for brohde.com in 2018 to 2019 shows only favicons, font files, and Gravity Forms plugin assets, no project screenshots. The old case study page itself still renders with the video element present but broken (`Your browser does not support the video tag`, no working source).

Working options, pending Brian's input:

1. **https://web.archive.org/web/20141001003032/https://newsroom.fb.com/**: the relaunched, fully styled, responsive WordPress homepage (card layout, nav: Home / News / Products / Company Info / Directory / Investor Relations). Best available "after" screenshot of the actual shipped site.
2. **https://web.archive.org/web/20140601031511/http://newsroom.fb.com/**: the last capture before the relaunch (plain, unstyled headline list). Possible "before" comparison, but I can't confirm from Wayback alone whether this fairly represents the pre-Beyond design or is a partial capture, so I'm flagging it for Brian rather than asserting it.
3. **https://web.archive.org/web/20190329103538/https://brohde.com/work/facebook-newsroom/**: the original brohde.com case study page (text recovered and used as source for this draft; visually it's mostly blank where the video and feature graphics used to be).
4. Facebook's follow-on projects mentioned in the original copy, Year in Review (yearinreview.fb.com) and Internet.org (info.internet.org), both have their own Wayback histories if a "led to more work" visual is wanted later.

## Open questions for Brian

1. **Language count discrepancy.** The old case study's body text says internationalization "included launching 7 localized versions," but the feature caption elsewhere on the same page says "Localization into 8 languages." I used non-specific phrasing ("multiple additional language editions") in this draft to avoid asserting either number. Which is correct, or does 7 additional plus English make 8 total?
2. **Team and timeline.** The old copy names only "another front end engineer and QA engineer" beyond you. Any names, team size, or project duration (weeks or months) you're comfortable citing?
3. **Budget figure.** Your resume cites Beyond projects "budgeted up to $½ million," tied to the Google and Facebook relationship generally, not Newsroom specifically. Want a project-specific figure in this piece, or leave it unstated as I did?
4. **"First responsive consumer site on WordPress VIP" framing.** This is a platform-wide claim (not just "Facebook's first"), sourced from your resume. Comfortable keeping that exact framing in published copy, or prefer something softer like "one of the first"?
5. **Exact pre-date.** Wayback snapshots show the old, unstyled newsroom still live on June 1, 2014, and the new, styled site fully live by October 1, 2014, with a transitional capture on July 1, 2014. That puts the relaunch in a June to July 2014 window. Want me to lock the article's dateline to a specific month, or keep it loose as "2014"?
6. **Assets.** Do you have local copies of any original screenshots, the demo video referenced on the old case study page, or design files from this project? None of that survived in Wayback's archive of brohde.com itself.
