# Draft: Gold Coast Capital Management case study

**Status:** draft v1
**Suggested pre-date:** 2026-06-30 [CONFIRM: exact wrap/launch date, see open questions]
**Source project:** the Gold Coast client repo (local, read-only research; live site: https://goldcoastcapm.com)

## Title options

1. My client designed his site in ChatGPT. Here's what it took to ship it.
2. Alternatives to Squarespace: a client's ChatGPT designs, built right
3. 435 comments, one navy and gold site: what AI-designed pages still need from an engineer

## Suggested description (pick one, or mix)

- A wealth management client designed his own site in ChatGPT, pixel by pixel; I built it in Astro and used Pastel to turn his 435 review comments into a real, accessible site.
- How a non-technical client's ChatGPT mockups became goldcoastcapm.com: a design system built once, a Pastel feedback loop, and the calls only a person can make.

---

## Draft

A client showed up with eight finished page designs. He'd made every one of them himself, in ChatGPT, without touching a design tool or a line of code. He knew exactly what he wanted: navy and gold, a specific line break in a specific sentence, the "VS" in a fee comparison rendered in white, not navy. My job was to turn eight PNGs into a real website: fast, accessible, and built on a system he could keep editing after I was gone.

This is that build.

**The designs.** My client runs Gold Coast Capital Management, a registered investment adviser. He's not a designer and he'd never written CSS, but he had a clear picture of the site he wanted, and ChatGPT gave him a way to render that picture without needing either skill. He came back with a full set: home page plus seven interior pages, each a detailed comp with headlines, stats, fee comparisons, an advisor bio.

What struck me wasn't that the designs existed. It's how specific the feedback got once he could see them built. Once we had a live build in front of him, his notes read like an art director's: "put 'life' in the first row." "Reduce the empty space at the top of this section." "The '20+' should be dark blue." He wasn't describing a vibe. He was pointing at pixels. ChatGPT gave a non-technical founder the vocabulary to be exact, and my job was to meet that exactness without letting the site fall apart the moment he asked for a ninth page.

**Building the system, not the pages.** Seven interior pages built independently, each chasing pixel-perfect fidelity to its own PNG, is how you end up with seven slightly different definitions of "navy" and a codebase nobody can maintain. So before I touched a single interior page, I ran a read-only pass over all seven designs in parallel, mapping every block in every comp to a shared set of tokens and components: one navy-and-gold palette, one type scale, one button component, one icon-badge shape. Only where a design genuinely needed something new (a fee-comparison band, a "how custody works" flow diagram) did it get flagged for a real decision, made once, signed off visually, then reused everywhere it recurred instead of rebuilt page by page.

Everything else got assembled from what already existed. That discipline is the difference between a site that looks consistent because someone kept it that way and a site that looks consistent by accident, for now.

The build itself is Astro 5 and Tailwind v4, with the client's editable copy, stats, and images wired into a Keystatic CMS so he can update his own bio or fee numbers without opening a pull request.

**The Pastel loop.** Once pages were live on a preview build, I put them in front of my client through Pastel, a tool that lets him comment directly on the rendered page instead of a static mockup. He used it heavily: 435 comments across eight pages, almost all from him, pointing at real elements in the real build. I worked them in navigation order, page by page. Each comment got triaged against the actual design system: clear ones got built outright, genuinely ambiguous ones went back to him before I touched any code. Nothing got marked resolved until he'd seen a before-and-after of the exact change.

That loop is the whole story in miniature. He designed with an LLM. I built and iterated with one, reading his comments, proposing changes grounded in the real codebase, not just pixel matching. Pastel closed the distance between what he pointed at and what shipped.

**Where judgment beat the machine.** Two examples show why a person still has to sit in that loop.

The fee comparison section has a "VS" badge in white text on a gold background, a contrast ratio of roughly 2.7 to 1, which fails WCAG AA. The textbook fix is to darken it to navy, and that's what I built first. My client didn't like it: he wanted the white "VS" from his original design. Because the badge is decorative and marked `aria-hidden` (it doesn't carry information a screen reader needs to convey), I reverted it to white at his request. Neither the "always fix contrast failures" rule nor "always defer to the client's exact pixels" rule is right on its own. Knowing which one applies to a decorative badge, and which wouldn't apply to actual body text, is the part an automated check or a rule-following contractor won't get right by default.

The second is line wrapping. His designs dictated exact breaks: "move 'not' to the second row." The literal move, a hard `<br>` at that word, holds on the exact screen size in the mockup and breaks the moment someone opens the site on a different phone; it also fights screen readers by inserting breaks mid-sentence. What actually shipped: I counted the line count in his design and set container widths so the real, responsive text wraps to match at the sizes people actually use, reserving literal breaks only for the handful of cases where he was dictating an exact mobile layout, using a break that disappears above phone width so desktop wraps naturally. Same visual result he asked for. It also survives a resize.

**The result.** Eight pages, one system, live at goldcoastcapm.com. My client can log into Keystatic and edit his own copy and images without calling me. When he wants a ninth page, it'll be built from the same tokens as the first eight, not a new stylesheet.

The pitch for "alternatives to Squarespace" isn't that a page builder can't get you something that looks like your mockup. It's that a page builder stops at looks-like. It won't tell you a badge should stay inaccessible because it's decorative, or catch that your exact line break will break your own mobile visitors, or give you a system that still holds together the next time you want to change something. My client had the taste and the tools to design his own site down to the pixel. What he needed from me was judgment about which pixels to keep exactly as drawn and which ones to build so the site actually works.

---

## Image candidates

All paths are in the Gold Coast client repo (local, read-only source repo, not brohde.com).

**Client's original ChatGPT designs** (`docs/from_client/`):

- `Home Page.png`
- `1. Tab - Who We Serve.png`
- `2. Tab - Services.png`
- `3. Tab - Investment Approach.png`
- `4. Tab - Why Fees Matter.png`
- `5. Tab - Schwab Custody.png`
- `6. Tab - About.png`
- `7. Tab - Contact.png`

**Cropped design reference details** (`.design-crops/`, likely used for a recon/handoff pass):

- `01-header-hero.png`, `02-stats.png`, `03-schwab.png`, `04-compare.png`, `05-threecol.png`, `06-advisor.png`, `07-footer-cta.png`, `logo.png`, `logo-mark.png`

**Live design system reference:** `src/pages/styleguide.astro` (renders at `/styleguide` on a running dev server; internal-only, `noindex`). A fresh screenshot would need to be captured, none exists in the repo yet.

**Pastel before/after screenshots:** `docs/feedback/screens/<slug>/#<n>-{before,after}.png` is the documented convention, but the directory is currently empty. Nothing captured yet. Worth generating a couple of good before/after pairs (the VS badge color reversal and one line-wrap fix) specifically to illustrate this article.

**Live site:** https://goldcoastcapm.com. Fresh screenshots of the shipped home page and one or two interior pages would likely be the strongest visual for the article itself, since none of the above are publish-ready as-is.

## Open questions for Brian

1. **Client consent.** Does the client know this project will be featured publicly, including that he designed the site himself in ChatGPT? That detail is complimentary but personal, worth confirming he's comfortable with it appearing (and whether to use his first name, full name, or just "my client").
2. **Naming ChatGPT specifically.** Comfortable naming the tool, or should the article stay generic ("an AI tool" / "an LLM")? The repo itself never documents which tool he used; that detail came from your framing, not from anything in the client repo, so I've taken it as given but can't independently verify specifics (version, whether it was image generation vs. a coding mode, etc.).
3. **Pre-date.** Repo activity runs June 11 (designs delivered) through June 30 (last docs updated) 2026, with Pastel review dated June 21 to June 29. I don't have an explicit launch date, "2026-06-30" is a placeholder. What's the actual (or intended) publish date?
4. **Engagement framing.** Is this freelance work you want framed as solo ("I built"), and is there anything about scope, timeline in weeks, or how you were engaged (referral, existing relationship, etc.) worth adding for credibility? I didn't find that in the repo and didn't want to invent it.
5. **Client business claims.** The live site states figures like "0.50% advisory fee," "20 Years Experience," "100% Client Retention." I deliberately left these out of the draft since they're claims about the client's business, not about the build, but let me know if you'd like one or two included as scene-setting color, they'd need his sign-off same as everything else client-specific.
6. **Unresolved review items.** As of the repo's last snapshot, a handful of Pastel comments were still open (a deferred icon swap, a few of your own call-notes on the Schwab Custody page). The draft doesn't claim the review is 100% closed, just that the workflow shipped a real site. Confirm that's still accurate, or let me know if it's since fully wrapped.
7. **Screenshots.** None of the visual evidence (styleguide specimen, Pastel before/afters) exists yet as captured images; I've flagged what would need to be shot fresh. Want me to coordinate that as a follow-up task once the copy direction is picked?
