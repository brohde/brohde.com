# Facts pack (the model's ONLY source of truth)

Curated by Brian. Edit freely; the server reloads this at boot. If a fact is not in this file, the model must say it doesn't know.

## Identity

- Brian Rohde. AI Product Engineer in San Francisco. Full-stack: he ships end to end, from training the model to shipping the app.
- Studied at DePaul University. (The school is public; graduation year and any dates around his education stay behind the deny-list.)
- Ships AI products end to end: model, app, and the infrastructure underneath.
- Founder of Eight Angle. Open to full time roles, and available for freelance work.
- Contact: right here in the chat. A visitor picks contact from the nav (or you point them to [contact](/contact)) to open a short flow that collects their message, name, and email and delivers it to Brian. There is NO public email address to hand out. He is also on linkedin.com/in/brian-rohde-4ba3558 and x.com/brianxbuilds.
- Site sections: home, about, the log (case studies), and chat. The resume is a downloadable PDF (resume.pdf). There is no separate contact page; contact is handled right here in the chat.

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
- Twilio (San Francisco): Technical Web Lead. Owned twilio.com's technical roadmap. Shipped the company's first global website and unified CMS; the global rollout included the first localized site, twilio.com/ja, and over 100 pages released in 6 locales. Earlier as Senior Web Engineer: deployed twilio.com's first CMS with substantial coverage, built a design system, redesigned the sign-up page. Co-authored Twilio's blog post "Re-Introducing the Hackpack v4: Twilio's Open Source Hardware Badge" (2018), about Twilio's open-source conference hardware badge: twilio.com/en-us/blog/archive/2018/open-source-hardware-badge-hackpack-v4
- Beyond (San Francisco user-experience agency): Senior Front End Developer and team lead. Delivered projects FOR Facebook and Google as an agency engineer (he never worked AT Facebook or Google): Facebook Newsroom (2014, Facebook's first WordPress site and first responsive consumer site on WordPress VIP) and Google's Android for Work marketing site (2015). The Newsroom build proved the agency's WordPress capability, and Facebook returned with new business: Beyond went on to build Year in Review and the Internet.org site for Facebook off the back of it.
- Freelance: built goldcoastcapm.com end to end for a wealth-management client (design system, Astro, Keystatic CMS, client review loop via Pastel).

## How he works

- AI-native workflow: parallel Claude Code agents in git worktrees, layered instruction files, shared architecture docs, MCP integrations (Linear, PostHog).
- Stack: TypeScript, Swift, Python, PHP, React, Next.js, Astro, SwiftUI, Tailwind. AI/ML: Claude Code, Anthropic API, MCP, Core ML, MediaPipe. Platforms: Vercel, Cloudflare, AWS, Sanity, PostHog, Figma, Linear.
- Favorite frameworks: React and Astro.
- His line: "AI multiplies my output; taste and engineering judgment decide what ships."
- On tools not listed in his stack: he can learn any language or framework a project needs, and has done it repeatedly (Closure at Google's insistence, Sanity and Next.js at Gong, Swift for Eight Angle); an unfamiliar tool is an opportunity to learn something new.
