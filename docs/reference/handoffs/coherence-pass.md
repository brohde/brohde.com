# Coherence pass handoff (2026-07-21)

Goal: make every visitor-facing surface read as one coherent whole after a day of
retitles and rewrites, grounded only in repo sources + Brian's attested facts.
Applied the mechanical/grounded reconciliations; flagged everything that changes a
factual claim or needs a taste call. Build green (`npm run build`, 11 pages). Diff is
em/en-dash clean. `dist` grep for old-title fragments: none remain. Chat prompt bundle
(`functions/api/_chat-prompt.generated.ts`) regenerated from the edited `facts.md`.

Source-of-truth rule followed (Brian via the lead): today's four retitles
(gold-coast, eight-angle-ml, twilio-hackpack-v4, google-android-for-work) are
authoritative; descriptions and bodies reconcile TO them, never the reverse. No
retitle was reverted or softened. Title claims were checked against grounded sources;
unground-able wording is flagged below, not changed.

## Applied fixes

1. **eight-angle-ml body: SwiftUI now grounded.** Added to the "The live app" section:
   "The app is native SwiftUI, built for iPhone and iPad." The title leads with "native
   iOS SwiftUI app" but the body never named SwiftUI; this closes seam #1. Grounded in
   `facts.md` ("SwiftUI iOS app") + Brian's attested title. The article is a
   `published: false` stub today, so this line renders only when Brian publishes; it is
   correct in the source for that moment.

2. **gold-coast description reconciled to the "banker" + "PNG" title.** Was: "A wealth
   management client designed his own site in ChatGPT, pixel by pixel; I built it in
   Astro and used Pastel to turn his 435 review comments into a real, accessible site."
   Now: "A banker designed his own site in ChatGPT, pixel by pixel, and handed me eight
   PNGs; I built it in Astro and used Pastel to turn his 435 review comments into a
   real, accessible site." Client stays unnamed. "banker" and "eight PNGs" are
   Brian-attested + body-grounded; keeps the SEO/LLM keywords (ChatGPT, PNGs, Astro,
   Pastel, 435, accessible).

3. **facts.md gold-coast line reconciled (chat ground truth).** Was "a wealth-management
   client"; now "a banker (a registered investment adviser) who designed the site
   himself in ChatGPT and handed over PNG comps". Aligns the chat with the public
   "banker" title + Brian's attestation while preserving the body's RIA fact. No eval
   row grades on this descriptor.

4. **facts.md contact line de-staled.** Removed the now-false "There is no separate
   contact page" (the `/contact` route is a real page that arms the in-chat contact flow,
   `src/pages/contact.astro`). Replaced with: "Contact is handled right here in the chat:
   the [contact](/contact) route drops the visitor straight into that message flow. There
   is no traditional contact page or form, and no email address to hand out." The
   no-email, flow-based behavior the eval rows check is unchanged.

5. **Case-study figures wired into four stub bodies (scope addition).** Copied the
   staged captures into each article's own content folder and added one `<figure>` block
   (markdown image with full descriptive alt + provenance `<figcaption>`, matching the
   facebook-newsroom convention) at the natural narrative point, so every stub now
   publishes its figure ahead of the text (the stub template renders figure blocks from
   the body). All four verified in `dist` (Coming soon + one rendered figure each;
   facebook-newsroom keeps its two):
   - **eight-angle-ml** ← `eightangle.com` marketing homepage, in "The brand and the
     store" (replaced the owed-asset figure slot). The two other eight-angle slots (live
     pose detection, audit gallery) are still owed.
   - **gold-coast** ← finished `goldcoastcapm.com`, in "The result" (the navy/gold "after").
   - **atg-llm-migration** ← `anthonythomasgalante.com`, in "Same look, new site" (shows the
     monochrome full-bleed system the migration kept). Caption states what is visible
     without asserting the DNS-cutover state, which the body still lists as pending.
   - **google-android-for-work** ← `afw-still-15.jpg`, in "The approach" (the hero: Google
     header + phone mockup + "Make every worker a mobile worker", the exact "phone mockup
     walking through the product story" the paragraph describes). **Judgment call:** used
     only the strongest of the three AFW Wayback stills. `afw-still-45` (category icons +
     "Businesses using Android" logo wall) and `afw-still-75` (device catalog grid) are
     more generic and redundant for a short retrospective; both remain in
     `assets/images/case-studies/google-android-for-work/` in reserve if Brian wants a
     second figure. facebook-newsroom's reserve stills were left unused: its two committed
     figures already cover the piece.

   Provenance/date honesty: the three live captures are labeled "Captured 2026"; the AFW
   still is labeled "the shipped 2015 build, captured from the Internet Archive" (no
   precise Wayback date invented). Documentary screenshots are cleared per decision #98.

### Owed follow-up on the applied facts.md edits

A **keyed eval re-run is owed** (facts.md content changed, prompt bundle regenerated). I
cannot run it (no key in the sandbox). By construction no fixture's grading changes: no
eval row tests the gold-coast client descriptor, and the contact rows still grade on
"point to the flow, no email," which the rewrite preserves. Recommend the one-command
keyed confirmation for hygiene before the next public deploy.

## Flags (NOT applied; need Brian's call)

### A. ATG title "4 hours" vs body "about five hours" (seam #3, do-not-silently-change)
Title: "Full replatform in 4 hours..." Body opens "The build ran one morning: about five
hours at the keyboard" and later "Roughly four of those hours were the build proper,
after an hour of planning." Both numbers are Brian's, from different days; the body's own
math already reconciles them (4h build + 1h planning = 5h morning), but the surface reads
as a contradiction. Three options, pick one:
- **Option 1 (recommended, keeps both numbers, kills the surface tension):** reorder the
  body's opening so the 4-hour build is the headline figure and the 5-hour morning is its
  context, e.g. "The build proper ran about four hours, inside a single five-hour morning
  at the keyboard (7:40am to 12:45pm) that also held an hour of planning and a parallel
  site-audit." Title and body then agree at first read.
- **Option 2 (change the title to the total):** "Full replatform in one morning" or
  "Full replatform in about five hours." Loses the sharper "4 hours" hook. Not
  recommended.
- **Option 3 (leave as is):** accept the tension; the careful reader reconciles it.

### B. eight-angle-ml title trailing period (seam #1, render check)
Renders everywhere without breaking: h1 "...on-device." (a headline ending in a period,
unusual but it is a full sentence), `<title>` and OG "...on-device. · brohde.com" (period
immediately before the middot separator reads as a slight stutter), and in the ledger it
is the only entry ending in a period. Nothing is broken. Options: keep it (defensible, it
is a complete sentence) or drop the period (one-character frontmatter edit) for headline
convention and to clean the "device. · brohde.com" join. Left as Brian wrote it.

### C. google-android-for-work title capitalization (house-style)
"Google's Android for Work Website" is Title Case ("Website" capitalized); every sibling
title is sentence case, and VOICE.md #76 says "Sentence case for headings. No title case
except proper nouns." Proposed one-character fix: "Google's Android for Work website."
Left unapplied because it is one of today's four retitles; surfacing for Brian's approval.

### D. twilio-hackpack-v4 ledger presentation (seam #5)
Ledger renders "Twilio.com Blog: Introducing Hackpack v4 ↗ twilio.com", where "Twilio.com"
appears in the title AND in the auto-derived domain chip (the chip is systematic across
external entries and derives from the URL, so it is not wrong, just a stutter). Option if
it bothers you: drop ".com" from the title ("Twilio Blog: Introducing Hackpack v4"); the
↗ twilio.com chip already carries the domain. Separately, the actual published post is
titled "Re-Introducing the Hackpack v4: Twilio's Open Source Hardware Badge" (facts.md
quotes it verbatim, correctly); the site label says "Introducing" (drops "Re-"). It is a
curator label, not a quotation, so this is fine, but noting the mismatch. Both left as
Brian wrote them.

### E. About page "a platform Meta continues to invest in today" (FYI, kept verbatim)
This is Brian-attested and kept exactly. It reads most naturally as "WordPress is a
platform Meta continues to invest in," which is true and consistent. A reader
cross-referencing the facebook-newsroom postscript ("Facebook folded it into about.fb.com
in November 2019") could misread it as the Newsroom site itself still being invested in.
No action needed; noting only in case Brian wants to disambiguate the antecedent.

## Postscript convention (item 10): already satisfied, nothing to extend
The convention is present on every retrospective piece that has a body:
facebook-newsroom, google-android-for-work, AND twilio-signal-pong all carry a
"## Postscript, 2026" block in the matching style. The item's premise (only two pieces
have it) was stale; signal-pong got one when it was drafted. twilio-hackpack-v4 is an
external stub with no body, and brohde-com-build is a draft stub, so neither takes a
postscript. No edit made.

## Surfaces read clean (no change needed)
- **About page** (`src/pages/about.astro`): every claim checked against facts.md / article
  bodies / Brian's attested facts and grounded (end-to-end shipping, Eight Angle founder +
  the SwiftUI link line, 47-class/92.2%/~20fps, Gong Staff Web Engineer + LLM translation
  + replatform, Twilio Technical Web Lead + first global site/unified CMS, Beyond →
  Facebook Newsroom "its first WordPress site and a platform Meta continues to invest in
  today" verbatim per attestation, Google Android for Work). Links resolve to real slugs.
- **Homepage ledger**, **404**, **/chat** and **/contact** intro copy, **styleguide**
  specimens (eight-angle title with period + hackpack entry both synced), **RSS**
  (published-only, empty today by design): all coherent with the retitles and the current
  stub state.

## Publish-readiness (item 9): one list for Brian to approve from
All internal articles are `published: false` today (they list as "coming soon" and their
pages are stubs). No flag was flipped (your call). For each, is the TEXT ready to approve
as-is, and what blocks it:

| Article | Text ready? | Blocker / note |
| --- | --- | --- |
| eight-angle-ml | Yes | **Blocked on the unconfirmed-numbers list (debt-backlog C1):** 47-class, 92.2%, ~20fps, 71.2%/97.4% detection, 89.6%/93.4% accuracy, -12.2% headstand, 39 features, 60-event schema, $5.99/mo, $39.99/yr, 7-day trial. Confirm before publish. SwiftUI now grounded in body. Brand/marketing-site figure now wired; the two remaining figure slots (live pose detection, audit gallery) are still owed (priority-1 asset list). |
| gold-coast | Yes | Consent obtained (#203). Title/description/body/facts now coherent; finished-site figure now wired. No hard blocker beyond your read-approval. The two-up ChatGPT-comps opener (priority-2) is still an optional add. |
| atg-llm-migration | Yes | Consent obtained (#203). Migrated-site figure now wired. Resolve Flag A (4h vs 5h) before publish for cleanliness. Optional "before" figure (asset request 5) still owed. |
| facebook-newsroom | Yes | Two figures already live. Postscript present. Claims grounded. No blocker beyond approval. |
| google-android-for-work | Yes | Hero figure now wired (strongest of three Wayback stills; other two in reserve). Optional one-character title fix (Flag C). Postscript present. No hard blocker. |
| twilio-hackpack-v4 | N/A (external) | Ledger presentation works; optional Flag D tidy. Not blocking. |
| twilio-signal-pong | No | `draft: true`, no route. Still awaiting your read + its 6 open questions + B-roll asset (per STATUS). |
| brohde-com-build | No | `draft: true` placeholder body ("Draft under review"). Piece not written yet. |
