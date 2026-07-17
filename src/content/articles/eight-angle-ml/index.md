---
title: "Eight Angle: a 47-class yoga pose classifier that runs on-device"
description: "How I built and trained the on-device pose classifier behind Eight Angle: 47 classes, 92.2% cross-validated accuracy, zero cloud calls."
date: 2026-02-12
draft: false
stats:
  - n: "47"
    label: "pose classes, on-device"
  - n: "92.2%"
    label: "cross-validated accuracy"
  - n: "~20fps"
    label: "live inference on the phone"
---

Eight Angle is an iOS app that watches your yoga practice through the front camera, on-device, and tells you what pose you're in. It records the session, builds a timeline of what you practiced, and turns that into insights and achievements afterward. Free tier, subscription for insights, achievements, and sync ($5.99/month or $39.99/year, with a 7-day trial that starts on your first practice, not on install). It's built to pair with the yoga content people already use, YouTube classes, in-person instruction, not to replace it.

None of that works if pose detection happens on a server. Yoga is practiced at home, badly lit, six feet from a phone propped against something. Streaming that footage anywhere is a nonstarter, on privacy grounds and on latency grounds. So detection, feature extraction, and classification all have to run on the phone, in real time. And there's no shortcut: nobody publishes a pretrained Core ML classifier for 47 yoga poses. I had to build the training data, the features, and the model myself, then keep the whole pipeline current as the app kept changing around it.

## The ML pipeline

It starts with data collection. I built a scraper that pulls candidate images from Bing and DuckDuckGo per pose, no API keys. It runs them through quality gates (minimum 600x600, aspect ratio under 3:1, file size 10KB to 20MB, must be readable) and perceptual-hash deduplication against everything already in the training set. A typical scrape yields around 150 raw downloads and 60 to 90 unique images after dedup.

Every candidate then goes through an audit gallery before it's allowed into training: a self-contained HTML page that runs MediaPipe on each image, scores it by joint count and mean confidence, sorts best-first, and lets me accept or reject in a browser with decisions auto-saving. Nothing enters the training set without going through that gate.

Feature extraction is 39 hand-engineered, view-invariant geometric features: three-point joint angles, limb-to-horizontal angles, root-normalized distances, symmetry scores, a signed twist feature. No raw coordinates anywhere. Everything is normalized by torso length, so the model doesn't care how close you are to the camera, and left and right sides are kept separate, because yoga poses are often asymmetric. The feature extractor lives in a shared Swift package, YogaPoseKit, imported by both the iOS app and the training CLI, so the model trains on exactly the same math the phone runs at inference. Feature drift between training and runtime isn't just tested against, it's architecturally impossible.

The model itself is an Extra-Trees classifier with temperature-scaled probability calibration, trained on 2,332 samples across 47 classes, cross-validated to 92.2% accuracy (plus or minus 1.3%). It exports to Core ML and runs at roughly 20fps on-device.

One design decision worth calling out: a classifier with a fixed set of classes has to put every input somewhere. Show it a transition, a stretch, someone just standing there, and it will force that into whatever real pose it resembles most, at high confidence. So I train roughly a dozen extra "decoy" classes purely to absorb that: cobra, side_crow, non_yoga, kurmasana, and others, each added because it was measurably stealing confidence from a real pose. The app filters all of them to "Transition" in the UI. Users never see the decoy classes; they just get fewer false positives on the poses that matter.

Every change that touches the model, a new feature, a training-data cleanup, a config tweak, goes through the same discipline: baseline, change, result, keep or reject, logged. One sprint tested six candidate features for arm-balance confusion. Three were kept: `shoulder_angle` (recall on one arm balance went from 79.4% to 87.1%), `hip_slope_signed` (one confusion pair dropped from 9 misclassifications to 4), and `top_leg_direction`. Three were rejected, including a twist-detection feature that looked theoretically sound but actually regressed cross-validated accuracy from 92.6% to 92.3%, because in a 2D camera projection it turned out noisier than the simpler proxy I already had. That result is logged too, with the reasoning, so I don't retry it in six months and rediscover the same regression.

## The migration decision

Eight Angle originally ran on Apple's own Vision framework for pose detection. It worked, until I checked how often it actually found a body in the training images: 71.2% of the time. Close to a third of my training data was unusable because Vision couldn't detect the pose at all, worst on inversions and occluded joints, which happen to be exactly the poses yoga cares most about.

I ran a controlled evaluation against Google's MediaPipe on the same 1,603 images. MediaPipe found 420 more usable poses, pushing detection rate to 97.4% and classification accuracy from 89.6% to 93.4%, with lower variance too (plus or minus 1.2% versus plus or minus 1.8%). I mapped its 33 landmarks down to the 19-joint schema Vision already used, computed the neck and root midpoints it doesn't provide natively, and flipped the Y axis to reconcile the two coordinate systems. Both detectors now sit behind one shared protocol, so the rest of the pipeline never has to know which one ran.

I documented the one place the migration made things worse, honestly, rather than burying it: headstand accuracy dropped 12.2%. I traced it to five specific misclassified images: three were straight-arm variants that read as handstand, two were prep poses with tucked knees that read as crow. Not a detector bug: MediaPipe was surfacing real edge cases in a 41-sample class that Vision had simply never detected in the first place, so the noise had been invisible, not absent.

The counterintuitive part: I tested confidence thresholds of 0.1, 0.05, and 0.001 for the new detector, and the lowest threshold won, 93.4% accuracy versus 92.6% at 0.1. MediaPipe's joint positions stay accurate even at low confidence, so filtering aggressively on confidence just threw away good data. That's the opposite of how Vision behaves, so it wasn't a rule I could assume going in. I had to test it.

## The iOS engineering

The live pipeline runs detection at about 20fps for the on-screen overlay but writes the pose timeline at 2fps. That deliberate split cut timeline memory 97%, from around 68MB to around 2MB for a 10-minute session, without losing anything the UI actually needs.

A pose only locks on screen once 90% of frames in a rolling 0.6-second window agree at 99% confidence. I replaced an earlier smoothing approach after measuring it added about 460ms of latency; the sliding-window consensus reads as instant by comparison. The classifier itself sees raw, unsmoothed joints, because it was trained on static images, while the 3D skeleton renderers read a separate, smoothed channel, so visual polish and classification accuracy never have to compromise on the same data.

The feature worth dwelling on: Picture-in-Picture live camera recording, so you can follow a YouTube video full-screen while Eight Angle keeps tracking your practice in a small tile. `AVPictureInPictureController` is built for video playback, not a live camera feed, so this is off-label use of the API, and it requires camera access while backgrounded, which Apple grants case by case and normally reserves for video-conferencing apps. I applied for the restricted multitasking-camera-access entitlement, got it approved, and shipped it in version 1.1.0.

That feature also produced the hardest bug I've chased in this app. Practices were silently disappearing on TestFlight whenever someone dismissed the PiP tile, but only outside the Xcode debugger, because the debugger suspends the watchdog process that was actually killing them. I instrumented the finalize path with PostHog telemetry and found the write was failing in about 63 milliseconds, correlated with the app sitting in an `inactive` rather than `background` state. The fix was starting a background task synchronously the moment PiP begins to close, not after. The same telemetry caught a second, rarer race underneath it: two different observers both trying to finalize the same recording at once.

## The growth layer

None of the above matters if I can't tell whether it's working. Eight Angle ships a 60-event PostHog schema with a written governance policy: event names don't get renamed, variants become properties instead of new events, so old dashboards don't silently break when the app changes. It drives activation funnels for first-time and returning users, tracks the Picture-in-Picture finalize path event by event, and captures Apple Search Ads attribution through a token fetched on first launch and persisted to Keychain. That way I can tell which ad group actually drove a subscriber even after a reinstall wipes everything else. No PII in the analytics, no session replay, since it's a camera app, and audio is never recorded, full stop.

## What made it possible

I built this alone: the iOS app, the ML pipeline and scraper, the marketing site, the analytics, the entitlement application to Apple. The honest answer for how: I run Claude Code in parallel across git worktrees, so one agent can be working the ML pipeline while another touches the iOS app, each scoped by its own instruction file. The project carries more than 70 architecture docs and implementation plans, because when AI is doing more of the typing, the design decisions and the reasoning behind them are what actually need to survive, not just the code. MCP integrations pull live data from Linear and PostHog straight into that workflow. AI multiplies what I can build. Judgment, and catching the one place in twelve where it's subtly wrong, is still entirely on me.
