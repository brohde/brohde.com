---
title: "Google’s Android for Work Website"
description: "Building Google’s Android for Work site at Beyond: a scroll-driven product animation beside a phone mockup, smooth on every device, inside Google’s own stack."
date: 2015-09-01
draft: false
theme: android
---

<figure>

<video src="/media/afw.mp4" poster="/media/afw-poster.jpg" controls autoplay muted loop preload="metadata" playsinline aria-label="Screen capture video of the shipped Android for Work site"></video>

<figcaption>The shipped Android for Work site in motion: a screen capture recorded in 2017.</figcaption>

</figure>

In 2015, I built the marketing site for Android for Work, Google’s mobile management product for separating work and personal data on Android devices, aimed at enterprise IT. I was a front end developer and team lead at Beyond, an SF user experience agency, and Google was one of our two biggest clients at the time, alongside Facebook.

## The problem

The site had to launch on google.com itself, not on outside hosting Beyond controlled. That single fact ruled out my usual front end toolkit before the project even started. It had to run on Google’s own internal content publishing platform and clear Google’s own front end standards before anything shipped to one of the most trafficked domains on the internet. The constraints were set by Google going in, not negotiated once the build started.

## The approach

I built 100% of the front end, working closely with a designer and a QA engineer. Because the site would deploy onto google.com, I worked exclusively inside Google’s own stack: AngularJS and Google’s Closure JavaScript library, DOM manipulation without jQuery, and every line of HTML, SASS, and JS held to Google’s internal coding and documentation standards. No outside libraries, no shortcuts I’d normally reach for. Much of the work was relearning basic front end habits inside somebody else’s rulebook instead of my own, and getting comfortable with Closure’s more verbose, Java-flavored approach to what would otherwise be a few lines of jQuery.

The homepage centered on a guided, scroll-triggered animation sequence next to a phone mockup walking through the product story, a pattern Google used across its marketing sites at the time rather than a static hero image. Getting that sequence smooth and responsive across devices, inside Closure and Angular instead of the jQuery-plus-CSS approach I’d have reached for on a project of my own, was most of the build. It had to hold up on a phone as well as a desktop, animated entirely without an outside library.

## The result

The site shipped in mid 2015, live on google.com, meeting Google’s front end bar end to end. It’s a different kind of project than most agency work: I wasn’t choosing the stack. I was building inside someone else’s, on their infrastructure, to their review standards, for a product built around enterprise trust, which made the standards more than a formality.

## Postscript, 2026

More than a decade on, AngularJS and Closure aren’t how anyone builds a marketing site, mine included. What holds up is the discipline behind it: read the constraints first, pick the smallest solution that satisfies them, and don’t smuggle in your own preferences where they don’t fit the platform you’re building on. That’s still how I approach any project built on a client’s existing platform instead of my own stack, whether that platform is a Fortune 500 company’s internal CMS or a smaller client’s existing WordPress install.
