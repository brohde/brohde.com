# tools/og

Generates the production Open Graph image at `public/og.png` (1200x630).

## Regenerate

```
node tools/og/render.mjs
```

Requires Node 18+ (global `fetch`/`WebSocket`) and Google Chrome. Override the
Chrome path with `CHROME_BIN=/path/to/chrome` if it isn't at the macOS default.

## How it works

- `og.html` composites the whole card in `<canvas>` (deterministic: fixed tide
  phases, no randomness), so a re-render is byte-stable.
- `render.mjs` inlines the site's Circular woff2 subsets
  (`src/assets/fonts/circular-{bold,book}.woff2`) as base64 `data:` URIs, then
  drives headless Chrome over the DevTools Protocol to screenshot the 1200x630
  canvas. No npm install, no Puppeteer. Temp artifacts go to the OS temp dir.

## Design

Reads as the site: night ground `#0E1512`, the lowercase `brian rohde` wordmark
in Circular Bold with the phosphor glow + mint block caret, a sentence-case
descriptor in Circular Book, and the default `BR` mark rendered as the site's
ASCII density tide (the `RAMP` + `BR` source from `src/scripts/scene/`). Tuned
to survive small social cards: strong contrast, coarse cells (no fine
hairlines), nothing meaningful within 60px of the edges.

To change copy or layout, edit the constants at the top of the `draw()`/tide
functions in `og.html` and re-run. If you change the descriptor, keep it
sentence case, no buzzwords, no em/en dashes (decision #18).
