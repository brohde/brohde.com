# Handoff: Eight Angle article full rewrite (product-first)

_Head of Copy (Opus), 2026-07-17. Worktree `.claude/worktrees/agent-a2e08dd35b55f1137`, branch `worktree-agent-a2e08dd35b55f1137`, commit `fe0ae27`. Authority: decision #157 (full rewrite) + a mid-flight change order from Brian (monetization/onboarding beat + concision mandate). The lead merges after Brian reads._

Build green (`npm run build`, `astro check`, 10 pages). House sweep on the changed source AND the built `dist/log/eight-angle-ml/index.html`: **zero em/en dashes, zero "terminal"** (both verified). Only `src/content/articles/eight-angle-ml/index.md` and this handoff were touched.

---

## The fix, in one line

The old article (and the unmerged expansion draft) sold Eight Angle as "a 47-class yoga pose classifier that runs on-device." That is the enabling technology, not the product. The product is a **yoga practice tracker** (the site's own words, and the App Store name is literally "Eight Angle: Yoga Pose Tracker"). Root cause: the marketing site had never been read. I read it, and the App Store listing, and rebuilt the piece so it opens with what the app does for a yogi, then treats the on-device ML as the hard core inside that product truth.

## Framing rationale

- **Opens with the product, using Brian's own Strava/Strong analogy** because it does real work here, not decoration: it sets up the reframe's central argument. A running tracker has GPS, a lifting tracker has manual set entry, **yoga has no native signal**. So the app has to *become the sensor*. That single bridge is what demotes the ML from "the story" to "the reason the product can exist," which is exactly the correction #157 asks for.
- **The on-device constraint is now motivated by the product** (a camera in your living room), not stated as a technical preference. Same facts, product-first order.
- **The ML chapter survives but is tightened hard** (per the change order). I kept the strongest single beat, the Vision to MediaPipe detector switch with the honest headstand regression, because it proves rigor and intellectual honesty better than a spec sheet. I cut most of the model-internals detail (see "Dropped").
- **The monetization + onboarding + analytics material is one beat now** ("Free, then paid"), per the change order: analytics in service of activation and friction reduction, not vanity dashboards. This gives the expansion draft's PostHog material its real home.
- **Reader is a potential client / hiring manager.** The through-line is end-to-end solo ownership: product, hard ML, native iOS, brand, ASO, paid acquisition, analytics-driven activation. That argument lands hardest as one integrated funnel, which is why this stayed one article and did not split into a companion piece.

Reader-facing length: ~790 words of prose (the raw body count of ~955 includes the three invisible figure-slot comments). The prior live article was ~1,000 words and the expansion ~1,300, so this is materially shorter *while adding* the monetization beat, which is the concision mandate.

## Title: options + pick

Current (wrong-framed) title was "Eight Angle: a 47-class yoga pose classifier that runs on-device."

- **PICK (shipped): "Eight Angle: a yoga practice tracker I built solo, from the on-device pose model to the App Store"** — product first ("yoga practice tracker"), founder signal ("solo"), the hard tech correctly subordinated ("on-device pose model"), the full arc ("to the App Store" = shipped + branded + marketed). First person, sentence case, no dashes.
- Alt B (curiosity/benefit-led, shorter): "Eight Angle: how I turned a phone camera into a yoga practice tracker" — captures the core mechanism in one line; omits the brand/growth arc.
- Alt C (compact, neutral): "Eight Angle: a solo-built yoga tracker with an on-device pose model at its core" — correctly orders product over tech; least evocative.

I shipped the pick because the piece now spans the whole funnel and the client reader is buying end-to-end ownership. Brian may swap in B or C.

**Description (shipped):** "How I built Eight Angle solo: an iOS yoga practice tracker that logs your poses on-device as you flow, plus the brand, App Store growth, and analytics behind it." One sentence, product-first, snippet-friendly, **no unconfirmed numbers** (deliberately, since a meta description is a fresh claim surface).

## Frontmatter

- Kept: `theme: eight`, `date: 2026-02-12`, `draft: false`.
- **Dropped the `stats` block.** #157 said keep stats "only where each stat survives your fact-check." All three (47 / 92.2% / ~20fps) sit on Brian's unconfirmed-numbers list, and decision #86 already flagged that the band made them *more* prominent. None survive a fact-check, so the band is gone rather than featuring unverified figures at the top of the page. Two ways to restore it if Brian wants (see Open questions #4).

## Every fact and its source

| Claim in the piece | Source | Notes |
|---|---|---|
| "yoga practice tracker," Strava/Strong analogy | Brian (analogy is his own, per #157) + site tagline "Yoga practice and pose tracker" | positioning spine |
| iPhone and iPad | eightangle.com ("iPhone and iPad compatible"), site + brief | App Store also lists Mac (macOS 14, M1) and Vision Pro; omitted, see Open Q #5 |
| logs poses as you flow, review, hold times, video playback, trends, personal records, category splits (standing/core/backbends/inversions), achievements ("first Crow to Eight Angle") | eightangle.com feature copy, verbatim-adjacent | product surfaces, folded into the opener rather than a separate section |
| free to download; you pay only for the pose detection and the tracking it powers | **Brian's change order (overrides the site where they differ)** | Brian: "free version allows ALL features EXCEPT anything related to pose detection." Reconciles with the site's "subscription unlocks insights/achievements/progress" because those are all *derived from* pose detection. I stated the principle, not a feature-by-feature split, so both sources hold. |
| $5.99/mo, $39.99/yr | eightangle.com + App Store, both confirmed | statable plainly (confirmed product fact) |
| 7-day trial starts after your first practice, framed as a deliberate activation choice | eightangle.com ("7-day trial after first practice") + Brian's change order (treat as activation design) | |
| onboarding built frictionless, continuously revised from analytics as users arrived | **Brian's change order** | the piece's activation spine |
| logo, marketing site (static Astro on Cloudflare), App Store listing / ASO | `docs/reference/eight-angle-facts.md` ("did ALL the branding: logo, marketing website, App Store ASO") + resume (Astro/Cloudflare) | "static" is my characterization of the Astro build, per the expansion draft's prior flag; confirm if it matters |
| Apple Search Ads: keyword research, intent grouping, bids, spend optimization on a schedule | `eight-angle-facts.md` ("ran Apple App Store ads, optimized the campaigns, did the keyword research") | describes the *work*, no spend/CPI/conversion numbers invented |
| custom PostHog funnels, 60-event schema, install-to-ad attribution | prior article + resume ("60-event PostHog schema") + `eight-angle-facts.md` (PostHog corroborated by the live project) | 60-event is an owner-stated architecture count from the resume, not a per-pose/growth metric |
| Vision found a body 71.2% of the time; MediaPipe 97.4%; headstand accuracy fell 12.2% | prior article (Brian's own measurements), kept with existing framing | on the unconfirmed list; #157 explicitly blessed keeping this migration beat with its existing hedging. NOT laundered into the stats band or description. |
| geometric features, shared train/runtime code so they can't drift; classifier on-device in real time | prior article | model-internals numbers softened to plain language (see Dropped) |
| the audit gallery (scraper + browser accept/reject) | prior article | kept as the training-data-discipline beat |
| Picture-in-Picture off-label use of `AVPictureInPictureController`, backgrounded-camera entitlement, the disappearing-practices watchdog bug caught by telemetry | prior article | kept, compressed |
| built solo; Claude Code across git worktrees; judgment is his | prior article closer | kept, compressed |

**Nothing invented.** No install/subscriber/revenue counts, no review quotes, no campaign results, no keyword ranks, no dashboard specifics.

## What I dropped, and why (so Brian can resurrect any of it)

Concision mandate + unverified-numbers rule both point the same way. Cut:

1. **The whole `stats` band** (47 / 92.2% / ~20fps) — unconfirmed; see Frontmatter.
2. **Model-spec numbers**: "39 features" (now "geometric features"), "2,332 samples," "92.2% cross-validated," "~20fps" (now "in real time"), "47 classes" (now "yoga poses"). All on the unverified list; also the "unnecessarily detailed" kind for a client reader.
3. **The classification-accuracy pair in the migration** (89.6% -> 93.4%) — kept only the detection-rate jump (71.2 -> 97.4) and the honest headstand regression (12.2%), which is the strongest, tightest version of that beat.
4. **The decoy-classes / "Transition" filtering paragraph** — a genuinely nice UX-aware-ML insight, but inside-baseball for a client and needs setup. Easy to restore as one sentence if Brian wants the "he thinks about false positives, not just accuracy" signal.
5. **The disciplined-experimentation sprint** (shoulder_angle 79.4->87.1, hip_slope_signed 9->4 misclassifications, the rejected twist feature 92.6->92.3) — all unverified per-pose numbers and the densest "superfluous detail" in the old piece.
6. **The counterintuitive confidence-threshold result** (0.001 winning) — a second migration nuance; cut for length.
7. **The 2fps timeline split / memory numbers** (68MB->2MB, 97%), **the sliding-window consensus lock** (0.6s / 99% / 460ms), **the 63ms watchdog timing** — cut; kept only the *shape* of the PiP bug (silent data loss, only outside the debugger, caught by telemetry).
8. **iCloud sync, iOS 17 version floor** — real but minor product facts; cut for length.

Anything here is resurrectable in a sentence or two on Brian's word.

## Figure slots

The prior **live** article had **no** figure slots, so nothing was preserved from it. I **consciously added three** invisible HTML-comment slots (build-safe, no broken `src`, drop-in ready against the `facebook-newsroom` `<figure>` pattern), matching Brian's owed captures (#132):

1. **Live pose overlay** (after the intro) — the skeleton overlay naming a pose mid-practice.
2. **The audit gallery** (in "Recognizing the poses").
3. **The brand** (in "The brand and the store") — logo and/or marketing-site home page.

Not slotted but available if wanted: the practice-review/timeline screen and the PiP tile in use (the other two of Brian's owed app captures). The expansion draft's fourth idea (practice timeline) folds naturally into the opener if a capture lands.

## Open questions for Brian

1. **Title:** shipped the pick; alts B and C above are ready if you want shorter or more curiosity-led.
2. **Free/paid framing:** I followed your change order (pay for the pose detection and what it powers) over the marketing site's "insights are the subscription" split, and stated it as a principle so both are true. Confirm that's the line you want on the public site.
3. **Any real growth/analytics number you'll publish?** The brand/growth/activation arc is deliberately metric-free (I refuse to invent). One real figure, a funnel conversion, a trial-to-paid rate, installs, a CPA, would sharpen it a lot per your own metric-first voice rule, and would be the only quantified proof outside the (unverified) ML migration.
4. **Stats band:** dropped because all three were unverified. To restore it, either (a) confirm 47 / 92.2% / ~20fps and I put them back, or (b) I build a confirmed-facts band (e.g. "$39.99/yr," "iOS 17+," "free to record"), though those read like an app-info box, not proof of skill. My recommendation: leave it off until you confirm the ML numbers.
5. **Platform:** I said "iPhone and iPad." The App Store listing also shows macOS 14 (M1+) and visionOS 1. Add "and Mac and Vision Pro," or keep it to iPhone/iPad?
6. **"static Astro build on Cloudflare"** — inherited the expansion draft's inference from your resume's "Astro/Cloudflare web platform." Fine to keep; flag if the marketing site is actually SSR or something else.
7. **The unverified ML numbers still standing in the body** (71.2 / 97.4 / 12.2) are the migration beat #157 told me to keep with its existing hedging. Say the word if you'd rather I soften them to plain language too (e.g. "found a body in only about seven in ten images ... to nearly all of them"); it costs the crispness but removes the last precise unverified figures from reader-facing copy.

## Validation
- `npm run build`: PASS (astro check, 0 errors, 10 pages).
- Dash + "terminal" sweep on source and built HTML: clean.
- Built page: new title renders; five H2s render; no stale `47-class` / `92.2` / `~20fps` / `cross-validated` / `2,332` / `decoy` anywhere; the three figure-slot comments stay invisible; no stats-band content renders.
- Rendered-in-browser check NOT run (copy-only, no interactive surface); fold a visual pass into the lead review if wanted.

## Files changed
- `src/content/articles/eight-angle-ml/index.md`
- `docs/reference/handoffs/eight-angle-rewrite.md` (this file)
