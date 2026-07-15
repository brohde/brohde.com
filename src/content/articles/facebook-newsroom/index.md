---
title: "Facebook's first WordPress site: rebuilding newsroom.fb.com"
description: "How I led the redesign and WordPress VIP replatform of Facebook's global newsroom, from legacy migration to launch in seven languages."
date: 2014-07-01
draft: false
---

In 2014, I led the technical rebuild of Facebook's press site, newsroom.fb.com. I was a front end developer and team lead at Beyond, an SF user experience agency, and Facebook was one of our two biggest clients at the time, alongside Google.

## The problem

This wasn't a greenfield build. Facebook already had a newsroom at that address, live since at least 2012, on a legacy ASP.NET publishing system with its own admin backend and page templates. It wasn't responsive, and it didn't fit how a global communications team actually worked: product news, executive statements, and press materials going out around the clock, in more than one language, to reporters checking from a phone as often as a desktop. A relaunch had to preserve years of press history, migrate it cleanly off that old platform, and clear WordPress VIP's engineering bar, the enterprise WordPress platform Automattic runs for large publishers and media companies, all while still looking and behaving like Facebook rather than a generic WordPress blog.

## The approach

I was in the room from the sales conversation onward, giving technical input during the design and user research phases before any code got written, so the design team wasn't handed constraints after the fact. Once we started building, I led all technical aspects of the redesign and replatform: a fully custom, responsive WordPress theme built from scratch, plus the custom plugins the newsroom needed on top of it, developed alongside another front end engineer and a QA engineer, all of it held to WordPress VIP's code standards. VIP runs its own code review before anything goes live on its infrastructure, so the bar wasn't just "does it work," it was "does it pass someone else's audit." One of the harder pieces of the build was an interactive timeline component with touch support that had to behave the same swiping on a phone as clicking on a desktop, a genuinely new interaction pattern for a corporate press site in 2014.

I also wrote the migration scripts that moved years of posts and media off Facebook's legacy platform into WordPress without losing anything: old press releases, executive statements, images, all of it had to land in the new system intact and still findable. After launch, I led the internationalization work, taking the newsroom into seven additional language editions (Portuguese, German, Spanish, French, Italian, Japanese, and Korean, each on its own subdomain) alongside the original English, eight languages total, for a communications team that needed to publish well beyond Menlo Park.

## The result

Newsroom.fb.com relaunched in mid-2014 as Facebook's first WordPress site, and the first responsive consumer site built on WordPress VIP. It held up well enough that it turned into a longer relationship rather than a one-off engagement: Beyond went on to build Year in Review and the Internet.org site for Facebook off the back of it, work that came directly from how this project went.

The site itself had a long run. It kept publishing under its own newsroom.fb.com address, with the same basic identity and template, for roughly five years, evolving its section list along the way, before Facebook folded it into a broader corporate site, about.fb.com, in November 2019.

## What still holds up

The interesting part of this project, a decade on, isn't the tech. WordPress VIP's review process and a jQuery-era timeline widget aren't how I'd build this today. What holds up is the constraint underneath it: shipping inside a platform you don't control, to a bar someone else sets, without the result feeling like it was assembled by committee, and without the migration losing a single post along the way. That's the same discipline I use now working inside a client's existing CMS or design system instead of my own stack: read the platform's rules first, then build inside them, rather than fighting them or working around them.
