---
title: "Building a multi-player game, hardware badge, and React-based operating system for Twilio’s user conference"
description: "How I designed and built Signal pong, a multiplayer game and device to showcase Twilio’s products on the conference floor."
date: 2018-10-25
draft: false
theme: twilio
---

Most of what I did at Twilio was the website: the company’s first CMS, a design system, the marketing pages behind it. This project was the exception. For Twilio’s customer conference, I designed and built a multiplayer game and a device to show off what Twilio’s products could do. It’s called Signal pong.

## The problem

A conference booth can only demonstrate so much. You can put an API on a screen, walk people through it, and hand out stickers, but developers remember the thing they got to touch. The goal was to build something for the show floor that showed off Twilio’s products by letting attendees actually use them, and to make it hold up live, on its own, for the run of the event.

## The approach

I owned both halves: the game and the device it ran on. Designing and building both meant Signal pong had to be a real, working object on the floor, something a person could walk up to and play against someone else, not a demo video of an idea. Because it was built around Twilio’s products, the gameplay was the pitch. Playing it was the demonstration.

## The result

Signal pong ran at Twilio’s customer conference, on the show floor, for attendees to play.

<figure>

<video src="/media/signal-pong.mp4" poster="/media/signal-pong-poster.jpg" controls preload="metadata" playsinline aria-label="Video of Signal pong and the Hackpack in action at Twilio SIGNAL"></video>

<figcaption>Multi-player pong built with React.js and <a href="https://www.twilio.com/docs/sync" target="_blank" rel="noopener">Twilio Sync</a>, and the <a href="https://www.twilio.com/en-us/blog/archive/2018/open-source-hardware-badge-hackpack-v4" target="_blank" rel="noopener">Hackpack</a> in action.</figcaption>

</figure>

It was a different kind of build from the marketing pages I shipped the rest of that year. The same conference is where Twilio hands out the Hackpack, its open-source hardware badge; I co-authored the [launch post for the v4](https://www.twilio.com/en-us/blog/archive/2018/open-source-hardware-badge-hackpack-v4).

## Postscript, 2026

Most of my Twilio work was web platform work: the CMS, the localization, the marketing site. This one was the outlier, and it is the one people ask about. Building a physical game for a conference floor is a different discipline from shipping web pages, but the job underneath was the same one I still do: make a product legible to the person standing in front of it, and let them use it rather than just read about it.
