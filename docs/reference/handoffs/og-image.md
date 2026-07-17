# Handoff: production OG image (og.png)

Date: 2026-07-17. Worktree branch: `worktree-agent-a6610933835957ccd`.
Scope: replace the SVG OG placeholder with a production 1200x630 raster that
reads as the site, generated reproducibly. New files only; BaseLayout/SEO/site
were NOT edited (patch below for the lead to apply at merge).

## What shipped

- `public/og.png` — 1200x630, PNG, **229,646 bytes** (~224 KB, under the ~300 KB
  budget). Night ground `#0E1512`, the lowercase `brian rohde` wordmark in
  Circular Bold (`--bright #F2F7F3`) with the site's phosphor glow + the mint
  block caret (`--accent #7EE787`, #63), a sentence-case descriptor in Circular
  Book (`--ink #D6E5DC`), and the default `BR` mark rendered as the site's ASCII
  density tide in the right gutter (like the live scene, #120).
- `tools/og/og.html` — the template; composites the entire card in `<canvas>`
  for pixel-exact control. Ports the site's own material verbatim: the `RAMP`
  density ladder and the `BR`/`drawWord` source from `src/scripts/scene/`
  (`index.ts`, `sources.ts`). Deterministic (fixed tide phases, no randomness).
- `tools/og/render.mjs` — inlines the site's Circular woff2 subsets as base64,
  drives the system Google Chrome over the DevTools Protocol to screenshot the
  canvas. No npm install, no Puppeteer; temp files go to the OS temp dir.
- `tools/og/README.md` — the regenerate line.

## How to regenerate

```
node tools/og/render.mjs
```

Node 18+ (global `fetch`/`WebSocket`) and Google Chrome. `CHROME_BIN=...`
overrides the Chrome path. Verified byte-stable across runs (same 229,646 bytes).

## BaseLayout patch (apply at merge)

The og:image is not wired in BaseLayout.astro directly. BaseLayout renders
`<SEO {...props} />`; `SEO.astro` emits the tag from `SITE.ogImage`:

- `src/components/SEO.astro:24` `image = SITE.ogImage`
- `src/components/SEO.astro:38` `const imageURL = new URL(image, SITE.url).href;`
- `src/components/SEO.astro:60` `<meta property="og:image" content={imageURL} />`
  (and `:67` `twitter:image`).

So the meta tags themselves need **no change** — they already resolve to an
absolute PNG URL once the source constant points at the new file. The one edit
is the single source of truth, `src/lib/site.ts:22`:

```diff
- ogImage: "/og-default.svg",
+ ogImage: "/og.png",
```

That yields `og:image` and `twitter:image` = `https://brohde.com/og.png` on
every page. This is a real launch fix, not just cosmetic: Slack, iMessage, X,
and Facebook do not render SVG OG images, so the current `/og-default.svg`
produces no card at all on those surfaces.

### Optional (recommended) meta additions

Some scrapers render faster / more correctly with explicit image metadata.
Optional, not required. In `src/components/SEO.astro`, after line 60:

```html
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="brian rohde, AI product engineer, San Francisco" />
```

(Only correct while the default image is this 1200x630 PNG; per-page `image`
overrides would need their own dimensions, so if per-page OG images arrive
later, gate these on the default.)

### Cleanup (optional)

`public/og-default.svg` becomes unused after the patch. Harmless to leave;
remove it once the patch lands if you want the tree tidy. Left in place here to
avoid colliding with other in-flight branches.

## Verification

- Dimensions: `sips` reports 1200x630, format png.
- Size: 229,646 bytes (< ~300 KB).
- Rendered surface read directly (full size): wordmark, caret, descriptor, and
  the BR tide all correct; lowercase wordmark (#115); no "terminal" (#116); no
  em/en dashes (#18, comma-separated descriptor).
- Thumbnail test at 360px wide (Slack/iMessage/X card scale): wordmark and
  descriptor stay crisp and legible, caret visible, BR reads as a clean green
  mass with no fine hairlines. Nothing meaningful within 60px of the edges (text
  starts at x=90; BR right edge at x=1120, an 80px margin).
- `npm run build` passes (og.png is copied through to `dist/`).

## Judgment calls (flag for the lead / Brian)

1. **Descriptor wording + case.** Used `AI product engineer, San Francisco`
   (sentence case, comma) per this task's explicit brief ("sentence case, no
   buzzwords"). This differs from the live header, which is title-case
   `AI Product Engineer · San Francisco` (#77/#80), and #80 says "OG image
   mirrors it". The brief's sentence-case instruction was taken as the newer,
   more specific directive for this artifact. **Easy swap** if Brian wants the
   card to match the header exactly: edit the `fillText` descriptor string in
   `og.html` and re-run. (The wordmark is unambiguous: lowercase per #115.)
2. **BR mark, not the Eight Angle 8.** Used the `BR` default mark per #135
   (the 8 is no longer the site default). Rendered in the site's real tide
   idiom (ASCII density ramp) rather than a solid monogram, so it reads as
   "this site" and not a generic logo. Tuned quiet so the wordmark stays the
   hero; `imgW`/`tideW` in `og.html` control mark-vs-drift balance if you want
   the BR louder or softer.
3. **Single descriptor line.** Dropped the header's second identity line
   ("Founder, Eight Angle") to keep the card legible at thumbnail size (one
   wordmark + one quiet descriptor). Add it back in `og.html` if desired, but
   it costs thumbnail clarity.
