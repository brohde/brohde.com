# Draft: anthonythomasgalante.com migration case study

**Status:** draft v1
**Suggested pre-date:** 2026-07-11 (the day the bulk of the build happened; see open questions on which date actually belongs on this)
**Suggested one-line description (for the article template's optional description field):** How I ran a WordPress-to-Astro migration and design refresh through Claude Code, with the checkpoints that kept a client's site honest.

## Title options

1. **13 pages, one morning, zero mismatched captions: migrating anthonythomasgalante.com off WordPress**
2. **What I delegate to Claude Code on a client migration, and what stays mine**
3. **Running a WordPress migration through AI agents: the checkpoints that keep it honest**

My pick: #1. It's the most concrete and leads with numbers per VOICE.md; #3 is the safer/more generic fallback if Brian wants less client-specific framing in the headline.

---

## Draft

Anthony Thomas Galante is a New York fashion designer. His site was running WordPress on SiteGround, about $20 a month, 13 pages built up over years of WPBakery shortcodes and Gutenberg blocks. He wanted it off WordPress, onto something free, and editable by him without calling a developer every time he adds a lookbook. I ran the whole migration through Claude Code, myself as the only human in the loop. Here's what that actually looked like, not the highlight reel.

### Read before you touch anything

The first move wasn't code. I pointed two exploration agents at the problem in parallel: one auditing the live site's rendered pages, one inventorying the WordPress backup, the theme, the plugins, the 13MB database dump. Both reported back inside about ten minutes, and the inventory changed the plan before I wrote a line of it: the homepage hero lived in Revolution Slider tables, not in page content. The fonts loaded from an Adobe Typekit kit nobody on our side had access to. WooCommerce was installed with zero products, quietly dormant. None of that was in the brief. All of it mattered before extraction could start.

### The call I overruled on day one

The extraction plan Claude proposed first was to parse the database dump directly, since that's the technical system of record. I pushed back before it got built: the site is only 13 pages, and the rendered front end, already resolved through WPBakery and Gutenberg, was clean HTML with the shortcode soup gone. Pulling from the live mirror instead of the raw dump meant skipping an entire shortcode-conversion problem. The database stayed useful for exactly three things the front end couldn't give: the newsletter subscriber list (which then stayed out of the repo entirely, gitignored, never deployed), the mapping from resized image derivatives back to true originals, and a cross-check that nothing the front end showed was missing from the source. One call, made in a few minutes, that saved a redundant conversion layer for the rest of the project. That's the kind of judgment that doesn't delegate.

### Design concepts, not design decisions

Every time a page's design gets revisited, my rule is three genuinely different concepts, built as clickable HTML previews, before any of it touches real code. The press page concepts didn't get built until extraction had delivered the real 25 press mentions, real publication names, real photos, so the review was against real content, not filler. Anthony liked pieces of two of the three: one concept's photography, another's typographic record of each mention. I sent that combination back as a new option. A couple of rounds later, the hybrid ("The Catalogue": a masonry of press plates, each with its entry printed underneath, readable without a hover) was the one that landed.

Same pattern on the collection pages: three structurally different hero treatments to solve one specific problem (tall 2:3 portrait photography meeting a wide desktop viewport), full crop versus full push versus something in between. Anthony picked the version that added a text column beside the photo instead of cropping it. I can generate concepts fast. Which one is right for someone else's brand isn't my call to make alone.

### Auditing what nobody asked me to audit

Before any extracted page went into the CMS, a review pass checked all 34 caption-to-image pairings on the site against the original screenshots, not just against the database records. Zero pairings turned out to be mismatched. But the same pass caught things worth catching: a link that still pointed at a `wp-content` URL, a press link carrying a leftover tracking token in its query string, two malformed URLs, and a couple of source typos that had been live on the site for years. None of that was requested. It's the kind of check that mostly finds nothing, and that's fine. It's cheap insurance against the one time it doesn't.

### Where the time actually went

The build ran one morning: about five hours at the keyboard, 7:40am to 12:45pm, one sitting with no break longer than fifteen minutes. Roughly four of those hours were the build proper, after an hour of planning and a parallel site-audit up front. That four-hour figure already includes every second spent waiting on the model. Subtract the LLM's own generation and agent-run time and my hands-on share, directing, reviewing, deciding, testing between turns, was about two hours. Three production deploys landed along the way as fixes got verified live. Two shorter sittings followed later, under an hour combined: an evening pass on the session-logging tooling, then a separate day on DNS, mail records, and registrar access ahead of cutover, which turned up the real registrar, DreamHost, not the one everyone assumed. Thirteen pages migrated. I recovered 98 unique media originals out of 320 total attachments in the old library (97 found, 1 confirmed gone for good) and optimized the set 247.7MB → 26.0MB. All of it staged, reviewed, and CMS-ready before the client saw a single deploy.

### What actually got delegated

Reading and inventorying: agents, running concurrently. Mechanical extraction and format conversion: agents. First-draft design concepts: agents, on a model sized to the task rather than the biggest model available for everything. What didn't get delegated: which design direction fits the brand, whether a caption actually matches its photo, what counts as a launch blocker versus a nice-to-have, and any call that touches someone else's business. The checkpoints weren't a formality layered on top of the work. They were where the actual judgment happened.

The site is built, reviewed, and staged on Cloudflare. Cutover, the DNS switch that makes it the live site, is waiting on registrar access from the client, which is a normal, boring blocker and has nothing to do with whether the build itself is done.

---

## Image candidates

**Before (WordPress site), full-page screenshots already captured:**
- `/Users/brian/Projects/anthony-thomas-galante/migration/reference/screenshots/home-desktop.png` (+ `home-mobile.png`)
- `/Users/brian/Projects/anthony-thomas-galante/migration/reference/screenshots/press-desktop.png` (+ `press-mobile.png`)
- `/Users/brian/Projects/anthony-thomas-galante/migration/reference/screenshots/custom-desktop.png` (+ `custom-mobile.png`)
- `/Users/brian/Projects/anthony-thomas-galante/migration/reference/screenshots/collections-desktop.png` (+ `collections-mobile.png`)
- Full set (13 pages × desktop/mobile) lives in the same directory; `capture-report.txt` alongside it documents the capture.

**After (new Astro build):** no static screenshots exist yet. Two options: run the dev server (`npm run dev -- --port 4400` in the atg repo, admin at `/keystatic`) and capture fresh, or check whether the workers.dev staging URL referenced in `docs/decisions.md` (`https://anthonythomasgalante.rohdeb.workers.dev`) is still live. Either way, matching before/after pairs (same page, same viewport) would be the strongest visual for this article: home, press, and a collection/lookbook detail page are the best candidates given the design work that went into them.

**Design comps:** not stored as local files. The design concept studies were built and reviewed as hosted Claude.ai artifacts, referenced by URL in `docs/decisions.md`:
- First 3-concept press study: `https://claude.ai/code/artifact/fbb53b9c-2c85-41e2-97bc-c51b108fe4f0`
- "The Catalogue" (concept 04, approved): `https://claude.ai/code/artifact/c32e26f8-77b6-46a8-8f56-e6deb72fbfd0`
- Custom-pages concept board is referenced as `design-direction-preview.html` (a scratchpad artifact) in `docs/plans/03-design-direction.md` but I didn't find a saved local copy; it may only exist as a hosted artifact link elsewhere in the log, or may need regenerating.
These are useful screenshots (they show the concept-comparison workflow directly) but they're both client work product and live links that could change or expire. Recommend capturing static screenshots of them now, before publishing, if Brian wants to use them.

**Log excerpts worth screenshotting** (from `/Users/brian/Projects/anthony-thomas-galante/SESSION_LOG.txt`, 1,850 lines):
- Lines 1 to 75: the opening exchange, session start through both exploration agents reporting back, and Brian's real-time correction about subagent model choice (line ~45-54).
- Line ~465: "I love #2 and #3. Any way to combine these?" This is the design-hybrid request, a clean example of the human-taste checkpoint in action.
- Line ~699: "LOVE CONCEPT 4 !!!!! Lets go." The approval moment for the final press design.
- Line ~1783: "Review trim looks good - lets GO and deploy." A launch-decision checkpoint.
- Lines ~1810 to 1850 (tail of file): the meta-conversation about the session logger itself, whether it costs tokens, a gap where mid-turn messages were being dropped and got fixed. Good texture if the article wants a beat on tooling transparency, though it's more "behind the scenes of the log" than migration-relevant.

## Open questions for Brian

1. **Timing, resolved (was: 11 hours vs 4 hours).** The 11-hour figure was wrong. It came from reading the first-to-last timestamp in `SESSION_LOG.txt` (which renders in Pacific time: [10:40] to [21:42]), a span that straddles a roughly six-hour afternoon break. Remove the break and the initial build was one morning: about five hours at the keyboard (four after the planning hour), no gap over fifteen minutes. That matches your memory of about four hours including LLM waiting.

   Method (two sentences): I parsed the Claude Code session transcripts (three `.jsonl` files under `~/.claude/projects/-Users-brian-Projects-anthony-thomas-galante/`) for per-record UTC timestamps and roles, never loading them whole, then classified every gap as LLM working time (a prompt to the end of the following assistant or agent activity), Brian hands-on time (assistant output to my next message when the gap is under fifteen minutes), or away time (any gap over fifteen minutes, excluded). I cross-checked every interval against the atg repo's git author timestamps, which cluster 08:40 to 12:35 Hawaii time on 2026-07-11.

   Headline numbers, initial build: wall-clock span about 5.0h (7:40am to 12:45pm Hawaii, one sitting, zero breaks over 15 min); total including LLM waiting the same 5.0h because nothing broke the sitting, roughly 4.0h of that the build proper after the planning-and-audit hour; my hands-on time with LLM generation subtracted about 2.0h. Follow-up, separate and later: about 20 minutes that same evening on the session-logging tooling (git commit at 18:54 Hawaii), then about 35 minutes of active work on 2026-07-14 across a couple of resumed sessions on DNS, mail, and registrar checks ahead of cutover (this is where DreamHost surfaced as the real registrar), under an hour of work combined. Caveat: the logs only see time inside Claude Code sessions. Browser testing, edits in another app, registrar-dashboard work, or client calls during away gaps are invisible, and any reading or testing I did while the model was mid-turn is counted here as LLM time, so 2.0h hands-on is a floor and the honest elapsed figure is the ~5h at the keyboard. If `docs/CONTENT.md` item #2 still carries an "under 4 hours" claim, reconcile it to "about four hours including LLM waiting, one morning."

2. **Is anthonythomasgalante.com actually live on the new stack yet?** As of the repo's last commit (2026-07-14), Phase 4 (DNS cutover) was still open, blocked on registrar access. I wrote the ending to reflect "built and staged, cutover pending" rather than claiming it's live. If it has since launched, I'll update the close to say so (and the before/after screenshots become much easier to get).

3. **Client sign-off to publish this at all.** This uses the designer's real name and domain, and describes his site's internal workings (CMS structure, content fixes, a design iteration process) in a public marketing piece on your site. The source repo treats client privacy carefully (PII gitignored, client-only facts routed to a private agenda doc), which tells me it matters to you too. Worth a quick check with him before this goes up, especially since the site may not be launched yet at publish time.

4. **OK to name the specific design system terms ("The Catalogue," "The Commissions") and reference the celebrity-client proof gallery on the Custom page?** I kept specifics light (no names, no pricing) but the general shape of "the page that sells custom commissions uses celebrity photos as proof" is in the draft. Flag if that's more than you want public before the client's own site reflects it.

5. **Which date actually belongs on this article?** I defaulted to 2026-07-11 (the main build day) per the site's pre-dating convention, but 2026-07-14 (last activity) or an eventual launch date are both defensible. Your call.

6. **OK to state the old hosting cost (~$20/month, SiteGround) publicly?** It's in your own planning doc as the reason for the move, not obviously sensitive, but it is the client's spend. Flag if you'd rather generalize it ("a paid host" instead of a number).
