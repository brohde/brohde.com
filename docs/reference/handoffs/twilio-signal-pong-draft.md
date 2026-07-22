# Handoff: Twilio Signal pong build-story draft

**Agent:** copywriter (Opus), fresh spawn per #137.
**Worktree:** `~/Projects/brohde.com/.claude/worktrees/agent-a108da2d6257a1225`
**Branch:** `worktree-agent-a108da2d6257a1225` (branched from `main`)
**Status:** draft complete, `draft: true`, build + `astro check` green. Ready for Brian's review; lead merges.

## Files created (fences honored: new folder + this handoff ONLY)

- `src/content/articles/twilio-signal-pong/index.md` — the new BUILD-story article.
- `docs/reference/handoffs/twilio-signal-pong-draft.md` — this file.

No existing article, page, style, script, or config was touched. `twilio-hackpack-v4/index.md` was read for context only, not edited.

## What the piece covers

The story of designing and building **Signal pong**, a multiplayer game and a physical device Brian made to showcase Twilio's products on the floor of Twilio's customer conference. Structure follows the house problem -> approach -> result, then a **"Postscript, 2026"** hindsight block per the dated-postscript convention (#132). Body prose is period-correct to fall 2018; all 2026 reflection is quarantined in the postscript. It is a deliberately SHORT piece (~380 words) because the sourced material is thin (see facts below); padding it would have meant inventing.

This is distinct from the existing `twilio-hackpack-v4` external entry (Brian's co-authored launch post). This piece is the build story; it references the co-authored Hackpack post once, as period context, and links out to it.

## Every fact, with source citation

The resume is a **single page**; all resume citations are page 1, the Twilio / Senior Web Engineer bullet block.

| Claim in the article | Source | Status |
|---|---|---|
| Brian designed and built a multiplayer game and a device to showcase Twilio's products for Twilio's customer conference | Resume p.1, Senior Web Engineer bullet: "Designed and built a multiplayer game and device to showcase Twilio products for Twilio's customer conference." | GROUNDED (verbatim) |
| A video of it exists | Resume p.1: the same bullet carries a "Watch the video!" link. Corroborated by Brian's owner-stated B-roll (today, #137). | GROUNDED |
| The game is called "Signal pong" | Owner-stated: Brian's article order + #137 name it. | OWNER-STATED (name only) |
| Context: most of Brian's Twilio work was the website (first CMS, design system, marketing pages) | Resume p.1: "Deployed twilio.com's first CMS...; developed a design system and migrated 40 bespoke pages. Released high-visibility product marketing sites, including a redesign of Twilio's sign-up page." | GROUNDED |
| Era / pre-date fall 2018 | Resume p.1: Senior Web Engineer, Nov 2017 to Nov 2019. Editorial review (`editorial-review-r1.md` line 164) pegs the Twilio piece at 2018-10-25. | GROUNDED (tenure) + STUDIO date |
| Twilio hands out the Hackpack, its open-source hardware badge; Brian co-authored the launch post for the v4 | Existing `twilio-hackpack-v4/index.md` frontmatter + `editorial-review-r1.md` lines 214-216 (STUDIO-VERIFIED via live fetch of the Twilio blog, co-authors named), published 2018-10-25. | GROUNDED / STUDIO-VERIFIED |

**Written AROUND (not asserted, because unsourced):** the game's mechanics beyond "multiplayer"; which specific Twilio products it showcased; the hardware/software stack; how players joined or controlled it; any player/attendance numbers; whether Signal pong ran ON the Hackpack badges or on a separate device. The article states only what the resume credits ("a multiplayer game and a device") and lets the reserved B-roll figure carry the specifics.

## Deliberate honesty calls (please sanity-check)

- **I did NOT claim Brian built the Hackpack badge.** The verified record supports co-authoring the launch POST, not building the badge (editorial review, line 43). The resume separately credits building "a device." Whether that device IS the Hackpack, or a separate arcade-style unit, is genuinely ambiguous in the sources, so the article presents Signal pong (the built game + device) and the Hackpack (the badge he co-wrote about) as two related SIGNAL-era things, without welding them together. See open question 1.
- **No `stats` frontmatter.** There are zero confirmed numbers for this project; I omitted the optional stat band rather than invent one.
- **"SIGNAL" as the conference name** is used in the title/prose. It is Brian's own framing (the game name is "Signal pong") and is Twilio's actual customer conference, but the resume itself only says "Twilio's customer conference." See open question 4.

## Open questions for Brian (blocking nothing, but they shape a fuller v2)

1. **Signal pong and the Hackpack: how do they relate?** Did the game run on attendees' Hackpack badges (badge-as-controller), on the separate "device" you built, or both? Is the "device" in the resume bullet the Hackpack itself, or a distinct unit? This is the single biggest gap and would unlock the most interesting part of the story.
2. **Which Twilio products did it showcase?** (SMS/Programmable Messaging, Voice, Sync, something else?) Naming them makes "the gameplay was the pitch" concrete instead of abstract.
3. **What did you build it with?** Hardware platform, firmware/language, any backend. The house voice wants named tools ("SwiftUI, Extra-Trees, Core ML"); right now I have none for this piece, which is why the approach section stays high-level.
4. **Conference and year:** confirm it was SIGNAL 2018 (the v4 Hackpack era). If it debuted at a different year's conference, the pre-date and the Hackpack tie-in both change.
5. **Date:** I used **2018-10-25** to match the studio's stated Twilio date and the v4 launch-post era. It collides exactly with the existing external entry's date. If the game debuted at the conference itself (mid-October 2018), you may prefer the actual conference date so the two entries don't share a day on the homepage log.
6. **The video:** is the "Watch the video!" link on your resume the same footage as the B-roll the lead is encoding? If they differ, which is the canonical figure for this piece?
7. **Any player/engagement numbers** you're comfortable standing behind? (Games played, people who lined up, etc.) Only if real; happy to leave numberless.

## Title: proposed + alternates

**In frontmatter (my pick):**
> **"Twilio SIGNAL: building Signal pong, a multiplayer game for the conference floor"**
Fits Brian's formula (client Twilio + the SIGNAL/Signal-pong work + concrete context). Uses only the owner-given game name and resume-grounded work; leads with a specific noun like the rest of the set.

**Alternates:**
- **A. "Twilio: building Signal pong, a multiplayer game and device for the conference floor"** — safest. Drops the "SIGNAL" conference-name inference from the lead and restores "and device" (the resume's exact pairing). Choose this if you want zero inference in the title.
- **B. "Signal pong: the multiplayer game and device I built for Twilio's conference"** — leads with the curious owner-given name (curiosity-first), first person, closest to the resume's own phrasing.
- **C. "Twilio Hackpack: building Signal pong for the conference floor"** — uses the Hackpack framing from your order. Recommend ONLY after open question 1 confirms the game and the Hackpack are actually the same build; otherwise it over-claims.

## Reserved asset slots

- **One figure slot, reserved** in the result section as an HTML comment (no merged article embeds images yet, so the comment idiom is used rather than a fake `<img>`/`<video>`). It marks where the **B-roll video** lands once the lead crops/encodes it (local ffmpeg, #137; must honor Cloudflare Pages' 25 MiB per-file limit or go to external hosting). The comment tells the next agent exactly what to drop in and to add a provenance caption. No asset is referenced that doesn't exist yet.

## Validation performed

- `npm run build` (chains `build-chat-prompt.mjs && astro check && astro build`): PASS.
- `astro check`: 0 errors, 0 warnings (the one `z`-import hint is pre-existing in `content.config.ts`, not this article).
- Draft correctly emits NO public route while `draft: true`; frontmatter validates against the content-collection schema.
- Grep for em/en dashes (`—` `–`) across the new folder: none.
- Grep for "terminal" (case-insensitive): none.
