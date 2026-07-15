# Facts pack (the model's ONLY source of truth)

Curated by Brian. Edit freely; the server reloads this at boot. If a fact is not in this file, the model must say it doesn't know.

## Identity
- Brian Rohde. Full-stack engineer in San Francisco.
- Ships AI products end to end: model, app, and the infrastructure underneath.
- Founder of Eight Angle. Available for freelance work.
- Contact: brian@brohde.com · linkedin.com/in/brian-rohde-4ba3558 · x.com/brianxbuilds
- Site sections: work (case studies), about, resume, contact.

## Eight Angle (his product, flagship)
- iOS yoga practice tracker. Detects and logs poses automatically during practice using on-device computer vision. Live on the App Store with paying subscribers.
- He built it solo: SwiftUI iOS app, Python ML pipeline (data scraping, curation, training), Astro/Cloudflare marketing site.
- Trained a 47-class pose classifier to 92.2% cross-validated accuracy from 39 hand-engineered, view-invariant geometric features. Calibrated Extra-Trees model exported to Core ML, running about 20fps on-device.
- Evaluated detection backends offline (Apple Vision vs Google MediaPipe) and migrated: detection rate 71% to 97%, accuracy 89.6% to 93.4%.
- Secured Apple's restricted multitasking-camera-access entitlement so live pose tracking works during Picture-in-Picture.
- Built the analytics and growth layer: a 60-event PostHog schema driving activation-funnel dashboards, plus Apple Search Ads attribution that survives reinstalls.
- All pose processing stays on-device; nothing is sent to servers.

## Work history (individual roles; see policy: never aggregate into totals)
- Gong (San Francisco, revenue AI platform): Staff Web Engineer. Built an LLM-powered translation workflow for the company website, later showcased in a public Gong and Sanity webinar. Led the website replatform end to end (Next.js, Sanity, Vercel, Cloudflare). Improved legacy site speed 4x.
- Twilio (San Francisco): Technical Web Lead. Owned twilio.com's technical roadmap. Shipped Twilio's first localized website, twilio.com/ja, and released over 100 pages in 6 locales. Earlier as Senior Web Engineer: deployed twilio.com's first CMS with substantial coverage, built a design system, redesigned the sign-up page. Co-authored Twilio's blog post "Re-Introducing the Hackpack v4: Twilio's Open Source Hardware Badge" (2018), about Twilio's open-source conference hardware badge: twilio.com/en-us/blog/archive/2018/open-source-hardware-badge-hackpack-v4
- Beyond (San Francisco user-experience agency): Senior Front End Developer and team lead. Delivered projects FOR Facebook and Google as an agency engineer (he never worked AT Facebook or Google): Facebook Newsroom (2014, Facebook's first WordPress site and first responsive consumer site on WordPress VIP) and Google's Android for Work marketing site (2015).
- Freelance: built goldcoastcapm.com end to end for a wealth-management client (design system, Astro, Keystatic CMS, client review loop via Pastel).

## How he works
- AI-native workflow: parallel Claude Code agents in git worktrees, layered instruction files, shared architecture docs, MCP integrations (Linear, PostHog).
- Stack: TypeScript, Swift, Python, PHP, React, Next.js, Astro, SwiftUI, Tailwind. AI/ML: Claude Code, Anthropic API, MCP, Core ML, MediaPipe. Platforms: Vercel, Cloudflare, AWS, Sanity, PostHog, Figma, Linear.
- His line: "AI multiplies my output; taste and engineering judgment decide what ships."
