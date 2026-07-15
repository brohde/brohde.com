# Google Android for Work (2016): draft v1

**Status:** Draft v1, ready for review
**Type:** Project case study, agency work via Beyond (not Google employment)
**Suggested pre-date:** 2016-01-01 (placeholder; Wayback now shows the redesigned site live by September 2015, see open questions)
**Source material:** 2018 to 2019 brohde.com case study page (recovered via Wayback Machine), 2026 resume, `docs/VOICE.md`

## Title options

1. No jQuery allowed: building Android for Work on Google Closure
2. Shipping a marketing site straight onto google.com
3. Building Android for Work inside Google's own CMS and code standards

## Description options

1. How I built Google's Android for Work marketing site front end entirely inside Google's internal CMS, JavaScript libraries, and code standards.
2. A 2016 case study: shipping a marketing site onto google.com itself, with AngularJS, Google Closure, and no jQuery allowed.

---

## Draft

In 2016, I built the marketing site for Android for Work, Google's mobile management product for separating work and personal data on Android devices, aimed at enterprise IT. I was a front end developer and team lead at Beyond, an SF user experience agency, and Google was one of our two biggest clients at the time, alongside Facebook.

**The problem.** The site had to launch on google.com itself, not on outside hosting Beyond controlled. That single fact ruled out my usual front end toolkit before the project even started. It had to run on Google's own internal content publishing platform and clear Google's own front end standards before anything shipped to one of the most trafficked domains on the internet. The constraints were set by Google going in, not negotiated once the build started.

**The approach.** I built 100% of the front end, working closely with a designer and a QA engineer. Because the site would deploy onto google.com, I worked exclusively inside Google's own stack: AngularJS and Google's Closure JavaScript library, DOM manipulation without jQuery, and every line of HTML, SASS, and JS held to Google's internal coding and documentation standards. No outside libraries, no shortcuts I'd normally reach for. A fair amount of the work was relearning fairly basic front end habits inside somebody else's rulebook instead of my own, and getting comfortable with Closure's more verbose, Java-flavored approach to what would otherwise be a few lines of jQuery.

The homepage centered on a guided, scroll-triggered animation sequence next to a phone mockup walking through the product story, a pattern Google used across its marketing sites at the time rather than a static hero image. Getting that sequence smooth and responsive across devices, inside Closure and Angular instead of the jQuery-plus-CSS approach I'd have reached for on a project of my own, was most of the build. It had to hold up on a phone as well as a desktop, and it had to do it without the animation libraries I'd normally pull in.

**The result.** The site shipped in 2016, live on google.com, meeting Google's front end bar end to end, working closely with a designer and QA engineer to get there. It's a different kind of project than most agency work: I wasn't choosing the stack. I was building inside someone else's, on their infrastructure, to their review standards, for a product built around enterprise trust, which made the standards more than a formality.

**What still holds up.** AngularJS and Closure aren't how anyone builds a marketing site today, mine included. What holds up is the discipline behind it: read the constraints first, pick the smallest solution that satisfies them, and don't smuggle in your own preferences where they don't fit the platform you're building on. That's still how I approach any project built on a client's existing platform instead of my own stack, whether that platform is a Fortune 500 company's internal CMS or a smaller client's existing WordPress install.

---

## Image candidates

As with the Facebook Newsroom case study, no original screenshots or image assets from this project survived in the Wayback Machine's archive of brohde.com. Only favicons, font files, and plugin assets were captured under that domain in 2018 to 2019.

Working options, pending Brian's input:

1. **https://web.archive.org/web/20160120070456/https://www.google.com/work/android/**: a full, rendered snapshot of the actual site, with hero headline "Work the way you live," a Nexus 6 phone mockup, and the scroll-guided section structure. Best available screenshot of what shipped, though I can't confirm from Wayback alone whether this exact capture matches the version you built versus a later iteration by Google's own team.
2. **https://web.archive.org/web/20190329082817/https://brohde.com/work/google-android-for-work/**: the original brohde.com case study page (text recovered and used as source for this draft).
3. Notably, the old case study's own "View site" link already pointed to a Wayback capture (`web.archive.org/web/20160111001609/www.google.com/work/android`) rather than a live URL, meaning by 2019 the site was already gone from google.com. Any screenshot we use will be a reconstruction from archive.org, not a live capture. The exact decommission window is now pinned down; see Site lifespan below.

## Site lifespan (Wayback research)

Traced via the Wayback Machine's CDX index for google.com/work/android, covering all protocol and www variants of the URL.

1. **2015-02-25.** The URL first goes live with a simple one-page launch site (hero: "Security, Management, Choice"), matching the Android for Work product launch. Evidence: https://web.archive.org/web/20150225212555/https://www.google.com/work/android/
2. **Between 2015-05-31 and 2015-09-05.** The full marketing site with the "Work the way you live" section structure replaces that launch page. The 2015-05-31 capture still shows the old page; the 2015-09-05 capture shows the redesign. Evidence: https://web.archive.org/web/20150531081117/https://www.google.com/work/android/ then https://web.archive.org/web/20150905194930/https://www.google.com/work/android/
3. **Through 2016-09-25.** The site keeps serving 200s with the same structure, hero content refreshed over time (Marshmallow banner in late 2015, Nougat banner by September 2016). Last archived 200: https://web.archive.org/web/20160925162948/https://www.google.com/work/android/
4. **2016-11-08.** First archived permanent redirect of the canonical URL: a 301 to https://enterprise.google.com/android/. A 302 capture on 2016-10-27 suggests the switchover began in late October. Evidence: https://web.archive.org/web/20161108051113/https://www.google.com/work/android/
5. **By 2017-10-04.** The redirect target moves to https://www.android.com/enterprise/, and every capture since (through 2025) still points there. Evidence: https://web.archive.org/web/20171004144726/https://www.google.com/work/android/

So the site was taken down between 2016-09-25 and 2016-11-08, roughly 14 months after the redesigned version shipped and about 20 months after the URL first carried content. The timing matches Google retiring the "Android for Work" name in late 2016 in favor of Android Enterprise; the redirect chain (first to enterprise.google.com/android, later to android.com/enterprise) tracks that rebrand directly. Useful context for the article: the site's whole public life fits inside about 20 months, which is normal for product marketing pages on google.com and worth a wry line in the draft if Brian wants one.

## Open questions for Brian

1. **Team and timeline.** The old copy names only a designer and a QA engineer beyond you. Any names or project duration (weeks or months) you're comfortable citing?
2. **Exact pre-date, now with a wrinkle.** The old case study says only "Released 2016," but Wayback shows the "Work the way you live" design already live by 2015-09-05, and the 2015-05-31 capture still shows Google's earlier launch page. So the redesign shipped sometime between June and early September 2015, not in 2016. Two readings: the build actually launched in mid 2015 and "Released 2016" was approximate, or your work was a 2016 iteration on a structure that already existed. Which is it, and what date should the article carry? (See Site lifespan above for the capture trail.)
3. **Assets.** Same gap as Newsroom: do you have local screenshots or files from this project? None survived in Wayback's brohde.com archive, so the current plan is to screenshot the reconstructed google.com/work/android page from archive.org instead.
4. **Product context.** I added one factual sentence describing what Android for Work was (Google's enterprise mobile management product) for reader context, since the old case study assumed the reader already knew. Confirm that's accurate and welcome, or prefer the piece stay narrowly about the build with no product description?
