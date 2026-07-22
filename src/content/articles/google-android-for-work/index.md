---
title: "Google's Android for Work Website"
description: "How I built Google's Android for Work marketing site front end entirely inside Google's internal CMS, JavaScript libraries, and code standards."
date: 2015-09-01
draft: false
theme: android
---

In 2015, I built the marketing site for Android for Work, Google's mobile management product for separating work and personal data on Android devices, aimed at enterprise IT. I was a front end developer and team lead at Beyond, an SF user experience agency, and Google was one of our two biggest clients at the time, alongside Facebook.

## The problem

The site had to launch on google.com itself, not on outside hosting Beyond controlled. That single fact ruled out my usual front end toolkit before the project even started. It had to run on Google's own internal content publishing platform and clear Google's own front end standards before anything shipped to one of the most trafficked domains on the internet. The constraints were set by Google going in, not negotiated once the build started.

## The approach

I built 100% of the front end, working closely with a designer and a QA engineer. Because the site would deploy onto google.com, I worked exclusively inside Google's own stack: AngularJS and Google's Closure JavaScript library, DOM manipulation without jQuery, and every line of HTML, SASS, and JS held to Google's internal coding and documentation standards. No outside libraries, no shortcuts I'd normally reach for. Much of the work was relearning basic front end habits inside somebody else's rulebook instead of my own, and getting comfortable with Closure's more verbose, Java-flavored approach to what would otherwise be a few lines of jQuery.

The homepage centered on a guided, scroll-triggered animation sequence next to a phone mockup walking through the product story, a pattern Google used across its marketing sites at the time rather than a static hero image. Getting that sequence smooth and responsive across devices, inside Closure and Angular instead of the jQuery-plus-CSS approach I'd have reached for on a project of my own, was most of the build. It had to hold up on a phone as well as a desktop, animated entirely without an outside library.

<figure>

![The Android for Work marketing site on google.com: a "Google for Work | Android" header with Overview, Features, Developers, Partners, and Support navigation, a black Android phone mockup showing an SAP business dashboard of leave requests, timesheets, and purchase approvals, set against a photo of a worker at a desk, under the headline "Make every worker a mobile worker."](./afw-still-15.jpg)

<figcaption>The site I built the front end for, live on google.com: the phone mockup and scroll-driven product story next to it. The shipped 2015 build, captured from the Internet Archive.</figcaption>

</figure>

## The result

The site shipped in mid 2015, live on google.com, meeting Google's front end bar end to end. It's a different kind of project than most agency work: I wasn't choosing the stack. I was building inside someone else's, on their infrastructure, to their review standards, for a product built around enterprise trust, which made the standards more than a formality.

## Postscript, 2026

More than a decade on, AngularJS and Closure aren't how anyone builds a marketing site, mine included. What holds up is the discipline behind it: read the constraints first, pick the smallest solution that satisfies them, and don't smuggle in your own preferences where they don't fit the platform you're building on. That's still how I approach any project built on a client's existing platform instead of my own stack, whether that platform is a Fortune 500 company's internal CMS or a smaller client's existing WordPress install.
