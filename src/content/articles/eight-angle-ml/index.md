---
title: "Eight Angle: Yoga practice and pose tracker"
description: "How I built Eight Angle solo: an iOS yoga practice tracker that logs your poses on-device as you flow, plus the brand, App Store growth, and analytics behind it."
date: 2026-02-12
draft: false
theme: eight
---

Eight Angle is a yoga practice tracker for iPhone and iPad. Strava tracks your runs, Strong tracks your lifts; Eight Angle tracks your yoga. Set your phone down, press record, and flow: it logs the practice pose by pose while you move, and when you step off the mat it’s all there, which poses you hit, how long you held each, a video to scrub back through, and the trends, personal records, and achievements that build up over time.

What makes that hard: a running tracker has GPS, a lifting tracker has you tapping in each set, and yoga has neither. Nothing a phone can passively read says you held crow for eight seconds and then moved to side plank. So before Eight Angle could track a practice, it had to become the sensor: watch you through the camera and recognize the poses itself, in real time and on-device. On-device isn’t a detail, it’s the design. It’s a camera pointed at you in your living room, so sending that footage anywhere fails on both privacy and latency. And nobody ships a pretrained model for yoga poses, so I built the training data, the features, and the model myself.

<!--
FIGURE SLOT (asset owed by Brian, per decision #132): Eight Angle detecting a pose live.
An app screen showing the on-screen skeleton overlay naming the current pose mid-practice.
Replace with a <figure> block (pattern: src/content/articles/facebook-newsroom/index.md).
-->

## Recognizing the poses

The model is only as good as its training images, so nothing enters the set without review: a scraper pulls candidates per pose, and an audit gallery runs pose detection over each one and lets me keep or reject it in the browser. It learns not from pixels but from geometric features, joint angles, symmetry, normalized so distance and orientation don’t matter, and the identical feature code runs in training and in the app, so the two can’t drift apart. The classifier runs entirely on the phone, in real time, with no cloud call anywhere.

<!--
FIGURE SLOT (asset owed by Brian): the audit gallery.
The self-contained HTML page with a pose-detection skeleton over a candidate image,
sorted best-first, with accept/reject controls. Same <figure> pattern as above.
-->

The biggest gain came from changing what detects the body. Apple’s Vision framework, which the app used first, found a body in only 71.2% of my training images, worst on the inversions and occluded joints yoga cares most about. Google’s MediaPipe found a body 97.4% of the time. I logged the one regression instead of burying it: headstand accuracy fell 12.2%, because MediaPipe was finally catching hard cases Vision had missed entirely, so the errors had been invisible, not absent.

## The live app

The app is native SwiftUI, built for iPhone and iPad. The feature I’m proudest of is Picture-in-Picture recording: follow a YouTube class full-screen while Eight Angle keeps tracking in a small tile. `AVPictureInPictureController` is built for video playback, not a live camera, so this is off-label use, and it needs backgrounded camera access that Apple grants case by case and usually reserves for video calls. I applied for the entitlement, got it, and shipped it. It also produced the worst bug in the app: practices vanished when someone dismissed the tile, but only outside the debugger, which suspends the process that was killing them. Analytics on the save path caught it in the field.

## The brand and the store

A model nobody installs is a research project. Everything a stranger sees first, I made: the logo, the [marketing site](https://eightangle.com) (a static Astro build on Cloudflare), and the App Store listing, which is its own product surface. App Store Optimization is the store’s SEO; its title, subtitle, keywords, and screenshots decide who finds a yoga app in search. To turn those searches into installs I run Apple Search Ads: figuring out what people actually type, grouping terms by intent, setting bids, and pushing spend toward what converts. Left alone, the account drifts into paying for the wrong taps, so I tune it on a schedule.

<figure>

![The eightangle.com marketing homepage: the Eight Angle wordmark above the line "Yoga practice and pose tracker" and the headline "Make the most of your yoga practice," with a "Download for iOS" button and three iPhone mockups showing a practice review screen, a list of logged practices with their detected poses, and a personal-stats profile.](./hero-live-2026-07.png)

<figcaption>I built a native iOS SwiftUI app with a custom yoga pose detection model that runs on-device. <a href="https://eightangle.com" target="_blank" rel="noopener">eightangle.com</a></figcaption>

</figure>

<figure class="portrait">

![The Eight Angle Practices screen on an iPhone: a list of logged practices under a Practices heading, each with a video thumbnail, time, duration, and the poses detected (Low Lunge, Plank, Warrior 2, Chaturanga), above a Practice daily for 10 minutes goal, Try something new pose suggestions, and a teal Start practice button.](./practices-phone-2026-07.png)

<figcaption>Every practice logged pose by pose, with a video to scrub back through.</figcaption>

</figure>

<figure class="portrait">

![The Eight Angle App Store listing on an iPhone: the mint app icon beside "Eight Angle: Yoga Pose Tracker, Practice Smarter on Your Mat" with a Get button, a 5.0 star rating, a 4+ age rating, and the Health & Fitness category, above screenshot cards showing the Eight Angle wordmark over a yogi practicing in a plant-filled room and a bronze Crow Explorer achievement.](./appstore-phone-2026-07.png)

<figcaption><a href="https://apps.apple.com/us/app/eight-angle-yoga-pose-tracker/id6760512056" target="_blank" rel="noopener">Eight Angle on the App Store</a></figcaption>

</figure>

## Free, then paid

The app is free to download and use; you pay only for the thing at its center, the pose detection and the tracking it powers, at $5.99 a month or $39.99 a year. The 7-day trial is the part I’d point to: it starts not when you install but when you finish your first practice. Charging for value before someone has felt it is how trials get cancelled, so the clock waits until they have.

I obsessed over that first run. Onboarding is as frictionless as I could make it, and I kept revising it as real users arrived, reading the drop-off in PostHog funnels and cutting whatever was losing people. That’s what the analytics are for: not a wall of vanity charts but a 60-event schema aimed at one question, where do new users fall out, and did my last change move it. It also ties each install back to the ad that earned it, so I know which keyword actually paid for itself.

## What made it possible

I built all of it alone: the app, the ML pipeline, the brand and marketing site, the ads, the analytics. The honest how: I run Claude Code in parallel across git worktrees, one agent on the ML pipeline while another works the iOS app, each scoped by its own instructions, with the design decisions written down because that reasoning is what has to survive when AI does more of the typing. It multiplies what I can build. Catching the places where it’s subtly wrong is still on me.

Eight Angle is free on the [App Store](https://apps.apple.com/us/app/eight-angle-yoga-pose-tracker/id6760512056).
