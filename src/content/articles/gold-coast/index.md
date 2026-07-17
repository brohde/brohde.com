---
title: "He designed his site in ChatGPT. I took it from Squarespace to Astro, LLM in the loop."
description: "A wealth management client designed his own site in ChatGPT, pixel by pixel; I built it in Astro and used Pastel to turn his 435 review comments into a real, accessible site."
date: 2026-06-30
draft: false
theme: goldcoast
---

A client showed up with eight finished page designs. He'd made every one of them himself, in ChatGPT, without touching a design tool or a line of code. He knew exactly what he wanted: navy and gold, a specific line break in a specific sentence, the "VS" in a fee comparison rendered in white, not navy. My job was to turn eight PNGs into a real website: fast, accessible, and built on a system he could keep editing after I was gone.

This is that build.

## The designs

My client runs Gold Coast Capital Management, a registered investment adviser. The site he wanted to replace was running on Squarespace. He's not a designer and he'd never written CSS, but he had a clear picture of the site he wanted, and ChatGPT gave him a way to render that picture without needing either skill. He came back with a full set: home page plus seven interior pages, each a detailed comp with headlines, stats, fee comparisons, an advisor bio.

What struck me wasn't that the designs existed. It's how specific the feedback got once he could see them live. His notes read like an art director's: "put 'life' in the first row." "Reduce the empty space at the top of this section." "The '20+' should be dark blue." He wasn't describing a vibe. He was pointing at pixels. ChatGPT gave a non-technical founder the vocabulary to be exact, and my job was to meet that precision without the site falling apart when he asked for a ninth page.

## Building the system, not the pages

Seven interior pages built independently, each chasing pixel-perfect fidelity to its own PNG, is how you end up with seven slightly different definitions of "navy" and a codebase nobody can maintain. So before I touched a single interior page, I ran a read-only pass over all seven designs in parallel. I mapped every block in every comp to a shared set of tokens and components: one navy-and-gold palette, one type scale, one button component, one icon-badge shape. Only where a design genuinely needed something new (a fee-comparison band, a "how custody works" flow diagram) did it get flagged for a real decision, made once, signed off visually, then reused everywhere it recurred instead of rebuilt page by page.

Everything else got assembled from what already existed. That discipline is the difference between a site that looks consistent because someone kept it that way and a site that looks consistent by accident, for now.

The build itself is Astro 5 and Tailwind v4, with the client's editable copy, stats, and images wired into a Keystatic CMS so he can update his own bio or fee numbers without opening a pull request.

## The Pastel loop

Once pages were live on a preview build, I put them in front of my client through Pastel, a tool that lets him comment directly on the rendered page instead of a static mockup. He used it heavily: 435 comments across eight pages, almost all from him, pointing at real elements in the real build. I worked them in navigation order, page by page. Each comment got triaged against the actual design system: clear ones got built outright, genuinely ambiguous ones went back to him before I touched any code. Nothing got marked resolved until he'd seen a before-and-after of the exact change.

That loop is the whole story in miniature. He designed with an LLM. I built and iterated with one, reading his comments, proposing changes grounded in the real codebase, not just pixel matching. Pastel closed the distance between what he pointed at and what shipped.

## Where judgment beat the machine

Two examples show why a person still has to sit in that loop.

The fee comparison section has a "VS" badge in white text on a gold background, a contrast ratio of roughly 2.7 to 1, which fails WCAG AA. The textbook fix is to darken it to navy, and that's what I built first. My client didn't like it: he wanted the white "VS" from his original design. Because the badge is decorative and marked `aria-hidden` (it doesn't carry information a screen reader needs to convey), I reverted it to white at his request. Neither the "always fix contrast failures" rule nor "always defer to the client's exact pixels" rule is right on its own. Knowing which one applies to a decorative badge, and which wouldn't apply to actual body text, is the part an automated check or a rule-following contractor won't get right by default.

The second is line wrapping. His designs dictated exact breaks: "move 'not' to the second row." The literal move, a hard `<br>` at that word, holds on the exact screen size in the mockup and breaks the moment someone opens the site on a different phone; it also fights screen readers by inserting breaks mid-sentence. What actually shipped: I matched the line count in his design and set container widths so the real, responsive text wraps to match at the sizes people actually use. For the handful of cases where he was dictating an exact mobile layout, I kept a literal break, one that disappears above phone width so desktop wraps naturally. Same visual result he asked for. It also survives a resize.

## The result

Eight pages, one system, live at goldcoastcapm.com. My client can log into Keystatic and edit his own copy and images without calling me. When he wants a ninth page, it'll be built from the same tokens as the first eight, not a new stylesheet.

The pitch for "alternatives to Squarespace" isn't that a page builder can't get you something that looks like your mockup. It's that a page builder stops at looks-like. It won't tell you a badge should stay inaccessible because it's decorative, or catch that your exact line break will break your own mobile visitors, or give you a system that still holds together the next time you want to change something. My client had the taste and the tools to design his own site down to the pixel. What he needed from me was judgment about which pixels to keep exactly as drawn and which ones to build so the site actually works.
